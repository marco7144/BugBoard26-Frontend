import React, { useState, useEffect, useCallback } from 'react';
import {
  PlusCircle,
  X,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';
import {
  issueService,
  type IssueRequestDto,
  type IssueResponseDto,
  type IssueType,
  type IssuePriority,
} from '../../services/issueService';
import { useProject } from '../../context/ProjectContext';
import { TYPE_CONFIG, PRIORITY_CONFIG } from '../common/Badge';
import { LabelSelector } from '../labels/LabelSelector';
import './CreateIssueModal.css';

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
 * Modale per la Creazione di una Nuova Issue (Step 17 - Requisito F2).*/
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

  // Dati ausiliari e stati UI
  const [titleError, setTitleError] = useState<string | null>(null);
  const [descError, setDescError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = useCallback(() => {
    setTitle('');
    setDescription('');
    setType('BUG');
    setPriority('MEDIUM');
    setImageDataUrl(null);
    setImageName(null);
    setSelectedLabelIds([]);
    setTitleError(null);
    setDescError(null);
    setApiError(null);
    setIsSubmitting(false);
    onClose();
  }, [onClose]);

  // Gestione tasto ESC per chiudere
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        handleClose();
      }
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, handleClose]);

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

            {/* Etichette / Labels (Selettore Multiplo Modulare) */}
            <div className="form-group">
              <span className="form-label">Etichette (opzionale)</span>
              <LabelSelector
                selectedLabelIds={selectedLabelIds}
                onChange={setSelectedLabelIds}
                disabled={isSubmitting}
              />
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
