import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  PlusCircle,
  X,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  Trash2,
  Check,
  Tag,
  ChevronDown,
  Search,
  Plus,
} from 'lucide-react';
import {
  issueService,
  type IssueRequestDto,
  type IssueResponseDto,
  type IssueType,
  type IssuePriority,
} from '../../services/issueService';
import { labelService, type LabelResponseDto } from '../../services/labelService';
import { useProject } from '../../context/ProjectContext';
import { TYPE_CONFIG, PRIORITY_CONFIG } from '../common/Badge';
import './CreateIssueModal.css';

/** 8 tonalità di colore predefinite per la creazione rapida delle etichette */
const PRESET_LABEL_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#64748b', // Slate
];

export interface CreateIssueModalProps {
  /** Indica se la finestra modale è visibile */
  isOpen: boolean;
  /** Callback per chiudere la modale */
  onClose: () => void;
  /** ID del progetto di destinazione (opzionale se già presente nel contesto) */
  projectId?: number;
  /** Callback opzionale invocata dopo la creazione con successo */
  onSuccess?: (createdIssue: IssueResponseDto) => void;
}

/**
 * Modale per la Creazione di una Nuova Issue (Step 17 - Requisito F2).
 *
 * Implementa i principi KISS:
 * - Layout spazioso e proporzionato (altezza confortevole per evitare scrollbar clipping).
 * - Validazione campi obbligatori (Titolo, Descrizione).
 * - Selettori grafici compatti per Tipo e Priorità riusando TYPE_CONFIG/PRIORITY_CONFIG da Badge.tsx.
 * - Caricamento e anteprima immagine con conversione in Base64 (sanitizzata per il backend).
 * - Tendina etichette con ricerca live e creazione rapida con color palette inline.
 */
export const CreateIssueModal: React.FC<CreateIssueModalProps> = ({
  isOpen,
  onClose,
  projectId,
  onSuccess,
}) => {
  const { selectedProject } = useProject();
  const effectiveProjectId = projectId ?? selectedProject?.id;

  // Stati del form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<IssueType>('BUG');
  const [priority, setPriority] = useState<IssuePriority>('MEDIUM');
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>([]);

  // Stati per la gestione della tendina e creazione etichette
  const [isLabelDropdownOpen, setIsLabelDropdownOpen] = useState(false);
  const [searchLabelQuery, setSearchLabelQuery] = useState('');
  const [selectedLabelColor, setSelectedLabelColor] = useState(PRESET_LABEL_COLORS[0]);
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [labelCreateError, setLabelCreateError] = useState<string | null>(null);

  // Dati ausiliari e stati UI
  const [availableLabels, setAvailableLabels] = useState<LabelResponseDto[]>([]);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [descError, setDescError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const labelDropdownRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    setTitle('');
    setDescription('');
    setType('BUG');
    setPriority('MEDIUM');
    setImageDataUrl(null);
    setImageName(null);
    setSelectedLabelIds([]);
    setIsLabelDropdownOpen(false);
    setSearchLabelQuery('');
    setLabelCreateError(null);
    setTitleError(null);
    setDescError(null);
    setApiError(null);
    setIsSubmitting(false);
    onClose();
  }, [onClose]);

  // Caricamento delle etichette disponibili all'apertura del modale
  useEffect(() => {
    if (!isOpen) return;

    labelService
      .getAllLabels()
      .then((labels) => setAvailableLabels(Array.isArray(labels) ? labels : []))
      .catch(() => setAvailableLabels([]));
  }, [isOpen]);

  // Chiusura tendina etichette al click esterno
  useEffect(() => {
    if (!isLabelDropdownOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (labelDropdownRef.current && !labelDropdownRef.current.contains(e.target as Node)) {
        setIsLabelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isLabelDropdownOpen]);

  // Gestione tasto ESC per chiudere
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        if (isLabelDropdownOpen) {
          setIsLabelDropdownOpen(false);
        } else {
          handleClose();
        }
      }
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, isLabelDropdownOpen, handleClose]);

  if (!isOpen) return null;

  // Gestione selezione file immagine
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setApiError("L'immagine selezionata supera il limite di 2MB.");
      return;
    }

    setApiError(null);
    setImageName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageDataUrl(null);
    setImageName(null);
  };

  // Toggle selezione etichetta
  const toggleLabel = (labelId: number) => {
    setSelectedLabelIds((prev) =>
      prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId]
    );
  };

  // Creazione rapida di una nuova etichetta inline
  const handleCreateLabel = async () => {
    const name = searchLabelQuery.trim();
    if (!name) return;

    setIsCreatingLabel(true);
    setLabelCreateError(null);

    try {
      const created = await labelService.createLabel({
        name,
        color: selectedLabelColor,
      });

      if (created?.id) {
        setAvailableLabels((prev) => [...prev, created]);
        setSelectedLabelIds((prev) => [...prev, created.id]);
        setSearchLabelQuery('');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Errore durante la creazione dell'etichetta.";
      setLabelCreateError(msg);
    } finally {
      setIsCreatingLabel(false);
    }
  };

  // Filtro live per la ricerca delle etichette
  const trimmedSearch = searchLabelQuery.trim().toLowerCase();
  const filteredLabels = availableLabels.filter((lbl) =>
    lbl.name?.toLowerCase().includes(trimmedSearch)
  );
  const exactMatchExists = availableLabels.some(
    (lbl) => lbl.name?.trim().toLowerCase() === trimmedSearch
  );

  // Testo informativo etichette selezionate
  const getSelectedLabelsText = () => {
    if (selectedLabelIds.length === 0) {
      return 'Seleziona o crea etichette...';
    }
    const count = selectedLabelIds.length;
    const suffix = count === 1 ? 'a' : 'e';
    return `${count} etichett${suffix} selezionat${suffix}`;
  };

  // Invio del form
  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();

    let hasErrors = false;
    if (!trimmedTitle) {
      setTitleError('Il titolo della issue è obbligatorio.');
      hasErrors = true;
    }
    if (!trimmedDesc) {
      setDescError('La descrizione della issue è obbligatoria.');
      hasErrors = true;
    }

    if (!effectiveProjectId) {
      setApiError('Nessun progetto selezionato per la creazione della issue.');
      hasErrors = true;
    }

    if (hasErrors || !effectiveProjectId) return;

    // Estrazione della stringa Base64 pura (senza prefisso data:image/...;base64,)
    let rawBase64Image: string | undefined = undefined;
    if (imageDataUrl) {
      rawBase64Image = imageDataUrl.includes(',')
        ? imageDataUrl.split(',')[1]
        : imageDataUrl;
    }

    const payload: IssueRequestDto = {
      title: trimmedTitle,
      description: trimmedDesc,
      type,
      priority,
      image: rawBase64Image,
      labelIds: selectedLabelIds.length > 0 ? selectedLabelIds : undefined,
    };

    setIsSubmitting(true);
    setApiError(null);

    try {
      const created = await issueService.createIssue(effectiveProjectId, payload);
      if (onSuccess) {
        onSuccess(created);
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore durante la creazione della issue.';
      setApiError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <dialog
      className="modal-overlay"
      open
      aria-labelledby="create-issue-title"
      aria-modal="true"
    >
      <div className="modal-container create-issue-modal">
        {/* Header Modale */}
        <div className="modal-header">
          <h2 id="create-issue-title" className="modal-title">
            <PlusCircle size={20} className="text-primary" />
            <span>Nuova Issue</span>
          </h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Chiudi modale"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form di Creazione */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body create-issue-body">
            {/* Banner Errore API */}
            {apiError && (
              <div className="alert alert-error" role="alert">
                <AlertCircle size={16} />
                <span>{apiError}</span>
              </div>
            )}

            {/* Titolo */}
            <div className="form-group">
              <label htmlFor="issue-title" className="form-label">
                Titolo <span className="text-danger">*</span>
              </label>
              <input
                id="issue-title"
                type="text"
                className={`form-input ${titleError ? 'form-input-error' : ''}`}
                placeholder="es. Errore 500 durante il salvataggio"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (titleError) setTitleError(null);
                }}
                disabled={isSubmitting}
                autoFocus
                maxLength={120}
              />
              {titleError && <span className="form-error">{titleError}</span>}
            </div>

            {/* Griglia Tipo & Priorità */}
            <div className="issue-selectors-grid">
              {/* Tipo */}
              <div className="form-group">
                <span className="form-label">Tipo</span>
                <div className="issue-chips-row issue-type-grid">
                  {Object.entries(TYPE_CONFIG).map(([key, config]) => {
                    const Icon = config.icon;
                    const isSelected = type === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        className={`issue-chip-btn ${isSelected ? 'active' : ''}`}
                        onClick={() => setType(key as IssueType)}
                        disabled={isSubmitting}
                      >
                        <Icon size={14} />
                        <span>{config.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Priorità */}
              <div className="form-group">
                <span className="form-label">Priorità</span>
                <div className="issue-chips-row issue-priority-grid">
                  {Object.entries(PRIORITY_CONFIG).map(([key, config]) => {
                    const Icon = config.icon;
                    const isSelected = priority === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        className={`issue-chip-btn priority-${key.toLowerCase()} ${isSelected ? 'active' : ''}`}
                        onClick={() => setPriority(key as IssuePriority)}
                        disabled={isSubmitting}
                      >
                        <Icon size={14} />
                        <span>{config.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Descrizione */}
            <div className="form-group">
              <label htmlFor="issue-desc" className="form-label">
                Descrizione <span className="text-danger">*</span>
              </label>
              <textarea
                id="issue-desc"
                rows={3}
                className={`form-input issue-description-input ${descError ? 'form-input-error' : ''}`}
                placeholder="Fornisci dettagli sul problema riscontrato o sulla funzionalità richiesta..."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (descError) setDescError(null);
                }}
                disabled={isSubmitting}
              />
              {descError && <span className="form-error">{descError}</span>}
            </div>

            {/* Etichette / Labels (Tendina con ricerca e creazione rapida) */}
            <div className="form-group">
              <span className="form-label">Etichette (opzionale)</span>
              
              <div className="issue-label-dropdown-wrap" ref={labelDropdownRef}>
                <button
                  type="button"
                  className={`issue-label-dropdown-btn ${isLabelDropdownOpen ? 'open' : ''} ${
                    selectedLabelIds.length > 0 ? 'active' : ''
                  }`}
                  onClick={() => setIsLabelDropdownOpen((prev) => !prev)}
                  disabled={isSubmitting}
                  aria-haspopup="listbox"
                  aria-expanded={isLabelDropdownOpen}
                >
                  <Tag size={14} className="issue-label-dropdown-icon" />
                  <span className="issue-label-dropdown-text">
                    {getSelectedLabelsText()}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`issue-label-dropdown-chevron ${
                      isLabelDropdownOpen ? 'rotated' : ''
                    }`}
                  />
                </button>

                {/* Menu a Tendina con Ricerca Live */}
                {isLabelDropdownOpen && (
                  <div className="issue-label-dropdown-menu" role="listbox">
                    {/* Campo Ricerca Live */}
                    <div className="issue-label-search-box">
                      <Search size={13} className="issue-label-search-icon" />
                      <input
                        type="text"
                        className="issue-label-search-input"
                        placeholder="Cerca o scrivi nuova etichetta..."
                        value={searchLabelQuery}
                        onChange={(e) => {
                          setSearchLabelQuery(e.target.value);
                          if (labelCreateError) setLabelCreateError(null);
                        }}
                        autoFocus
                      />
                      {searchLabelQuery && (
                        <button
                          type="button"
                          className="issue-label-search-clear"
                          onClick={() => setSearchLabelQuery('')}
                          title="Cancella filtro"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>

                    {/* Lista Etichette Esistenti (se presenti match) */}
                    {filteredLabels.length > 0 && (
                      <div className="issue-label-list-scroll">
                        {filteredLabels.map((lbl) => {
                          if (!lbl.id) return null;
                          const isSelected = selectedLabelIds.includes(lbl.id);
                          return (
                            <button
                              key={lbl.id}
                              type="button"
                              className={`issue-label-dropdown-item ${
                                isSelected ? 'selected' : ''
                              }`}
                              onClick={() => toggleLabel(lbl.id!)}
                              role="option"
                              aria-selected={isSelected}
                            >
                              <span
                                className="issue-label-dot"
                                style={{ backgroundColor: lbl.color || '#3b82f6' }}
                              />
                              <span className="issue-label-item-name">{lbl.name}</span>
                              {isSelected && (
                                <Check size={14} className="issue-label-item-check" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Sezione Creazione Rapida Inline (se non c'è match esatto) */}
                    {trimmedSearch.length > 0 && !exactMatchExists && (
                      <div className="issue-label-create-inline">
                        {labelCreateError && (
                          <div className="issue-label-create-error">{labelCreateError}</div>
                        )}
                        <div className="issue-label-create-row">
                          <div className="issue-label-create-info">
                            <span className="issue-label-create-hint">
                              {filteredLabels.length === 0 ? 'Nessuna etichetta trovata - ' : ''}Crea:
                            </span>
                            <strong className="issue-label-create-name">"{searchLabelQuery.trim()}"</strong>
                          </div>
                          
                          {/* Palette rapida 8 colori */}
                          <div className="issue-label-palette">
                            {PRESET_LABEL_COLORS.map((col) => (
                              <button
                                key={col}
                                type="button"
                                className={`color-dot-btn ${selectedLabelColor === col ? 'selected' : ''}`}
                                style={{ backgroundColor: col }}
                                onClick={() => setSelectedLabelColor(col)}
                                title={`Colore ${col}`}
                              />
                            ))}
                          </div>
                        </div>

                        <button
                          type="button"
                          className="issue-label-create-btn"
                          onClick={handleCreateLabel}
                          disabled={isCreatingLabel}
                        >
                          {isCreatingLabel ? (
                            <>
                              <Loader2 size={13} className="animate-spin" />
                              <span>Creazione...</span>
                            </>
                          ) : (
                            <>
                              <Plus size={13} />
                              <span>Crea e Seleziona</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Pillole Etichette Selezionate con Rimozione Rapida */}
              {selectedLabelIds.length > 0 && (
                <div className="issue-selected-labels">
                  {selectedLabelIds.map((id) => {
                    const lbl = availableLabels.find((l) => l.id === id);
                    if (!lbl) return null;
                    return (
                      <span key={lbl.id} className="issue-selected-pill">
                        <span
                          className="issue-label-dot"
                          style={{ backgroundColor: lbl.color || '#3b82f6' }}
                        />
                        <span className="issue-selected-pill-name">{lbl.name}</span>
                        <button
                          type="button"
                          className="issue-selected-pill-remove"
                          onClick={() => toggleLabel(lbl.id!)}
                          title={`Rimuovi ${lbl.name}`}
                          disabled={isSubmitting}
                          aria-label={`Rimuovi etichetta ${lbl.name}`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Allegato Immagine */}
            <div className="form-group">
              <span className="form-label">Allegato Immagine (opzionale)</span>
              {imageDataUrl ? (
                <div className="issue-img-preview">
                  <img
                    src={imageDataUrl}
                    alt="Anteprima allegato"
                    className="issue-img-thumb"
                  />
                  <div className="issue-img-info">
                    <span className="issue-img-name">{imageName || 'screenshot.png'}</span>
                    <button
                      type="button"
                      className="issue-img-remove-btn"
                      onClick={handleRemoveImage}
                      disabled={isSubmitting}
                      title="Rimuovi allegato"
                    >
                      <Trash2 size={13} />
                      <span>Rimuovi</span>
                    </button>
                  </div>
                </div>
              ) : (
                <label className="issue-file-drop">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handleFileChange}
                    disabled={isSubmitting}
                    className="sr-only"
                  />
                  <ImageIcon size={18} />
                  <span>Carica uno screenshot (PNG, JPG, max 2MB)</span>
                </label>
              )}
            </div>
          </div>

          {/* Footer Azioni */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || !title.trim() || !description.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Creazione...</span>
                </>
              ) : (
                <>
                  <PlusCircle size={16} />
                  <span>Crea Issue</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
};
