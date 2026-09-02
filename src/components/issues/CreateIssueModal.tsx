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

const PRIORITY_ACTIVE_STYLES: Record<IssuePriority, string> = {
  HIGH: 'bg-red-50 dark:bg-red-950/40 border-red-500 text-red-700 dark:text-red-400 font-semibold',
  MEDIUM: 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-700 dark:text-amber-400 font-semibold',
  LOW: 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-400 font-semibold',
};

/**
 * Modale per la Creazione di una Nuova Issue (Step 17 - Requisito F2).
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs w-full h-full border-none max-w-none max-h-none overflow-y-auto"
      open
      aria-labelledby="create-issue-title"
      aria-modal="true"
    >
      <div className="relative bg-white dark:bg-[#151c2c] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-185 flex flex-col overflow-visible my-auto">
        {/* Header Modale */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 rounded-t-2xl gap-3">
          <h2 id="create-issue-title" className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100 m-0">
            <PlusCircle size={20} className="text-blue-600 dark:text-blue-500" />
            <span>Nuova Issue</span>
          </h2>
          <button
            type="button"
            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Chiudi modale"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form di Creazione */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-3.5 px-6 py-5 overflow-visible">
            {/* Banner Errore API */}
            {apiError && (
              <div className="flex items-center gap-2.5 p-3 text-sm bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50 rounded-lg" role="alert">
                <AlertCircle size={16} className="shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            {/* Titolo */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="issue-title" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Titolo <span className="text-red-500">*</span>
              </label>
              <input
                id="issue-title"
                type="text"
                className={`w-full px-3 py-2 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-[#1e293b] border rounded-lg outline-none transition-all placeholder:text-slate-400 focus:ring-3 focus:ring-blue-600/15 ${
                  titleError
                    ? 'border-red-500 focus:border-red-500 ring-red-500/15'
                    : 'border-slate-200 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500'
                }`}
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
              {titleError && <span className="text-xs text-red-500">{titleError}</span>}
            </div>

            {/* Griglia Tipo & Priorità */}
            <div className="grid grid-cols-1 sm:grid-cols-[1.15fr_1fr] gap-4">
              {/* Tipo */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tipo</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.entries(TYPE_CONFIG).map(([key, config]) => {
                    const Icon = config.icon;
                    const isSelected = type === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-2 text-[13px] rounded-lg border transition-all cursor-pointer select-none whitespace-nowrap ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                            : 'bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
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
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Priorità</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {Object.entries(PRIORITY_CONFIG).map(([key, config]) => {
                    const Icon = config.icon;
                    const isSelected = priority === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-2 text-[13px] rounded-lg border transition-all cursor-pointer select-none whitespace-nowrap ${
                          isSelected
                            ? `${PRIORITY_ACTIVE_STYLES[key as IssuePriority]} shadow-xs`
                            : 'bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
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
            <div className="flex flex-col gap-1.5">
              <label htmlFor="issue-desc" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Descrizione <span className="text-red-500">*</span>
              </label>
              <textarea
                id="issue-desc"
                rows={3}
                className={`w-full px-3 py-2 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-[#1e293b] border rounded-lg outline-none transition-all placeholder:text-slate-400 focus:ring-3 focus:ring-blue-600/15 min-h-16 max-h-27.5 resize-y ${
                  descError
                    ? 'border-red-500 focus:border-red-500 ring-red-500/15'
                    : 'border-slate-200 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500'
                }`}
                placeholder="Fornisci dettagli sul problema riscontrato o sulla funzionalità richiesta..."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (descError) setDescError(null);
                }}
                disabled={isSubmitting}
              />
              {descError && <span className="text-xs text-red-500">{descError}</span>}
            </div>

            {/* Etichette / Labels (Selettore Multiplo Modulare) */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Etichette (opzionale)</span>
              <LabelSelector
                selectedLabelIds={selectedLabelIds}
                onChange={setSelectedLabelIds}
                disabled={isSubmitting}
              />
            </div>

            {/* Allegato Immagine */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Allegato Immagine (opzionale)</span>
              {imageDataUrl ? (
                <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <img
                    src={imageDataUrl}
                    alt="Anteprima allegato"
                    className="w-11 h-11 object-cover rounded-md border border-slate-200 dark:border-slate-700"
                  />
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <span className="text-[13px] font-medium text-slate-900 dark:text-slate-100 truncate">
                      {imageName || 'screenshot.png'}
                    </span>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 dark:hover:text-red-400 self-start cursor-pointer hover:underline"
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
                <label className="flex items-center justify-center gap-2 p-2.5 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 text-[13px] cursor-pointer hover:border-blue-600 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
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
          <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-2xl">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer shadow-xs transition-all disabled:opacity-50"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg cursor-pointer shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
