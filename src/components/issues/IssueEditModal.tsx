import React, { useState, useEffect } from 'react';
import { Pencil, X, AlertCircle, ShieldAlert, Loader2, Image as ImageIcon, Trash2, Save } from 'lucide-react';
import { issueService, type IssueResponseDto, type IssueType, type IssuePriority } from '../../services/issueService';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { TYPE_CONFIG, PRIORITY_CONFIG, StatusBadge } from '../common/Badge';
import { LabelSelector } from '../labels/LabelSelector';

export interface IssueEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  issue: IssueResponseDto | null;
  projectId?: number;
  onSuccess?: (updated: IssueResponseDto) => void;
}

export interface IssueEditPermissionResult {
  canEdit: boolean;
  reason?: string;
}

/**
 * Verifica i permessi di modifica della issue secondo lo State Pattern del backend:
 * - TO-DO: Creatore o Admin
 * - IN PROGRESS: Assegnatario o Admin
 * - CLOSED: Solo Admin
 */
export function checkIssueEditPermissions(
  issue: IssueResponseDto | null,
  userId?: number,
  isAdmin = false
): IssueEditPermissionResult {
  if (!issue) return { canEdit: false, reason: 'Nessuna issue selezionata.' };
  if (isAdmin) return { canEdit: true };

  const isCreator = Boolean(userId && issue.creatorId === userId);
  const isAssignee = Boolean(userId && issue.assignedToId === userId);

  if (issue.state === 'TODO' && !isCreator) {
    return { canEdit: false, reason: 'Solo il creatore o un admin possono modificare una issue in stato TO-DO.' };
  }
  if (issue.state === 'INPROGRESS' && !isAssignee) {
    return { canEdit: false, reason: "Solo l'assegnatario o un admin possono modificare una issue in stato IN PROGRESS." };
  }
  if (issue.state === 'CLOSED') {
    return { canEdit: false, reason: 'Questa issue è CHIUSA: solo un amministratore può modificarla.' };
  }
  return { canEdit: true };
}

/**
 * Modale per la Modifica dei Dati di una Issue (Step 24 - Requisito F9).
 * Permette di modificare titolo, descrizione, tipo, priorità, etichette e immagine allegata.
 * Stilato interamente con utility Tailwind CSS v4.
 */
export const IssueEditModal: React.FC<IssueEditModalProps> = ({
  isOpen,
  onClose,
  issue,
  projectId,
  onSuccess,
}) => {
  const { user, isAdmin } = useAuth();
  const { selectedProject } = useProject();

  const effectiveProjectId = issue?.projectId ?? projectId ?? selectedProject?.id;
  const permissions = checkIssueEditPermissions(issue, user?.id, isAdmin);
  const canEdit = permissions.canEdit;

  // Stati del form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<IssueType>('BUG');
  const [priority, setPriority] = useState<IssuePriority>('MEDIUM');
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sincronizza i dati quando cambia la issue selezionata o all'apertura
  useEffect(() => {
    if (isOpen && issue) {
      setTitle(issue.title || '');
      setDescription(issue.description || '');
      setType((issue.type as IssueType) || 'BUG');
      setPriority((issue.priority as IssuePriority) || 'MEDIUM');
      setSelectedLabelIds(issue.labels?.map((l) => l.id!).filter(Boolean) ?? []);
      let initialImageDataUrl: string | null = null;
      if (issue.image) {
        initialImageDataUrl = issue.image.startsWith('data:')
          ? issue.image
          : `data:image/png;base64,${issue.image}`;
      }
      setImageDataUrl(initialImageDataUrl);
      setImageName(issue.image ? 'allegato_esistente.png' : null);
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, issue]);

  if (!isOpen || !issue) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("L'immagine supera il limite massimo di 2MB.");
      return;
    }

    setError(null);
    setImageName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => setImageDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canEdit || !effectiveProjectId || !issue.id) return;

    const rawBase64 = imageDataUrl?.includes(',') ? imageDataUrl.split(',')[1] : imageDataUrl || undefined;
    setIsSubmitting(true);
    setError(null);

    try {
      const updated = await issueService.updateIssue(effectiveProjectId, issue.id, {
        title: title.trim(),
        description: description.trim(),
        type,
        priority,
        image: rawBase64,
        labelIds: selectedLabelIds,
      });
      onSuccess?.(updated);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Errore durante il salvataggio.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
<<<<<<< HEAD
    <dialog
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs w-full h-full border-none max-w-none max-h-none overflow-y-auto"
      open
      aria-labelledby="edit-issue-title"
      aria-modal="true"
    >
      <div className="relative bg-white dark:bg-[#151c2c] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-185 flex flex-col overflow-visible my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 rounded-t-2xl gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 id="edit-issue-title" className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100 m-0">
=======
    <dialog className="modal-overlay" open aria-labelledby="edit-issue-title" aria-modal="true">
      <div className="modal-container w-full max-w-185 overflow-visible">
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 id="edit-issue-title" className="modal-title">
>>>>>>> c3cd6264e140fa73d549280f53e83244e0289eaa
              <Pencil size={18} className="text-blue-600 dark:text-blue-400" />
              <span>Modifica Issue</span>
            </h2>
            <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-200/60 dark:border-blue-900/50">
              #ISS-{issue.id}
            </span>
            <StatusBadge status={issue.state} size="sm" />
          </div>
<<<<<<< HEAD
          <button
            type="button"
            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Chiudi finestra"
          >
=======
          <button type="button" className="modal-close-btn" onClick={onClose} disabled={isSubmitting}>
>>>>>>> c3cd6264e140fa73d549280f53e83244e0289eaa
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
<<<<<<< HEAD
          <div className="flex flex-col gap-3.5 p-5 sm:p-6 overflow-visible">
=======
          <div className="modal-body flex flex-col gap-3.5 p-5 sm:p-6">
>>>>>>> c3cd6264e140fa73d549280f53e83244e0289eaa
            {/* Banner permessi State Pattern */}
            {!canEdit && (
              <div
                className="flex items-center gap-2.5 p-3 rounded-lg text-xs bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900/60 text-amber-800 dark:text-amber-300"
                role="alert"
              >
                <ShieldAlert size={16} className="shrink-0" />
                <span>{permissions.reason}</span>
              </div>
            )}

            {/* Errore API */}
            {error && (
              <div className="alert alert-error" role="alert">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Titolo */}
            <div className="form-group mb-0">
              <label htmlFor="issue-edit-title-input" className="form-label">
                Titolo <span className="text-red-500">*</span>
              </label>
              <input
                id="issue-edit-title-input"
                type="text"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={!canEdit || isSubmitting}
                maxLength={120}
                required
              />
            </div>

            {/* Griglia Tipo & Priorità */}
            <div className="grid grid-cols-1 sm:grid-cols-[1.15fr_1fr] gap-4">
              <div className="form-group mb-0">
                <span className="form-label">Tipo</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.entries(TYPE_CONFIG).map(([key, config]) => {
                    const Icon = config.icon;
                    const isSelected = type === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-medium rounded-lg border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap font-sans ${
                          isSelected
                            ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold ring-1 ring-blue-600/30'
                            : 'bg-white dark:bg-[#151c2c] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-blue-600 dark:hover:border-blue-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                        onClick={() => setType(key as IssueType)}
                        disabled={!canEdit || isSubmitting}
                      >
                        <Icon size={14} />
                        <span>{config.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group mb-0">
                <span className="form-label">Priorità</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {Object.entries(PRIORITY_CONFIG).map(([key, config]) => {
                    const Icon = config.icon;
                    const isSelected = priority === key;

                    let activeClasses = 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300';
                    if (key === 'HIGH') {
                      activeClasses = 'border-red-500 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 ring-1 ring-red-500/30';
                    } else if (key === 'MEDIUM') {
                      activeClasses = 'border-amber-500 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 ring-1 ring-amber-500/30';
                    } else if (key === 'LOW') {
                      activeClasses = 'border-slate-500 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 ring-1 ring-slate-500/30';
                    }

                    return (
                      <button
                        key={key}
                        type="button"
                        className={`inline-flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium rounded-lg border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap font-sans ${
                          isSelected
                            ? `${activeClasses} font-semibold`
                            : 'bg-white dark:bg-[#151c2c] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-blue-600 dark:hover:border-blue-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                        onClick={() => setPriority(key as IssuePriority)}
                        disabled={!canEdit || isSubmitting}
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
            <div className="form-group mb-0">
              <label htmlFor="issue-edit-desc-input" className="form-label">
                Descrizione <span className="text-red-500">*</span>
              </label>
              <textarea
                id="issue-edit-desc-input"
                rows={3}
                className="form-input min-h-20 max-h-35 resize-y font-sans"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!canEdit || isSubmitting}
                required
              />
            </div>

            {/* Etichette */}
            <div className="form-group mb-0">
              <span className="form-label">Etichette</span>
              <LabelSelector
                selectedLabelIds={selectedLabelIds}
                onChange={setSelectedLabelIds}
                disabled={!canEdit || isSubmitting}
              />
            </div>

            {/* Allegato Immagine */}
            <div className="form-group mb-0">
              <span className="form-label">Allegato Immagine</span>
              {imageDataUrl ? (
                <div className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg">
                  <img src={imageDataUrl} alt="Anteprima allegato" className="w-11 h-11 object-cover rounded-md border border-slate-200 dark:border-slate-700 shrink-0" />
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <span className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">{imageName || 'allegato.png'}</span>
                    {canEdit && (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 self-start transition-colors cursor-pointer"
                        onClick={() => { setImageDataUrl(null); setImageName(null); }}
                        disabled={isSubmitting}
                      >
                        <Trash2 size={13} />
                        <span>Rimuovi</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <label className={`flex items-center justify-center gap-2 p-2.5 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors ${!canEdit ? 'opacity-60 cursor-not-allowed' : ''}`}>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handleFileChange}
                    disabled={!canEdit || isSubmitting}
                    className="sr-only"
                  />
                  <ImageIcon size={16} />
                  <span>{canEdit ? 'Carica screenshot (PNG, JPG, max 2MB)' : 'Nessuna immagine'}</span>
                </label>
              )}
            </div>
          </div>

          {/* Footer */}
<<<<<<< HEAD
          <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-2xl">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer shadow-xs transition-all disabled:opacity-50"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {canEdit ? 'Annulla' : 'Chiudi'}
            </button>
            {canEdit && (
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg cursor-pointer shadow-xs transition-all disabled:opacity-50"
                disabled={isSubmitting}
              >
=======
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              {canEdit ? 'Annulla' : 'Chiudi'}
            </button>
            {canEdit && (
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
>>>>>>> c3cd6264e140fa73d549280f53e83244e0289eaa
                {isSubmitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Salvataggio...</span>
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    <span>Salva Modifiche</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </dialog>
  );
};
