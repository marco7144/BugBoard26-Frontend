import React, { useState, useEffect, useCallback } from 'react';
import { Tag, X, Plus, Pencil, Trash2, Check, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { labelService, type LabelResponseDto } from '../../services/labelService';
import { useAuth } from '../../context/AuthContext';
import { LabelBadge } from './LabelBadge';
import { PRESET_LABEL_COLORS } from './LabelSelector';

export interface LabelManagerModalProps {
  /** Controlla la visibilità del modale */
  isOpen: boolean;
  /** Callback per chiudere il modale */
  onClose: () => void;
  /** Callback opzionale invocata dopo ogni mutazione (creazione, modifica, cancellazione) */
  onLabelsChanged?: () => void;
}

/**
 * Modale per la Gestione Globale delle Etichette / Labels
 * Permette la consultazione, la creazione con color picker e le azioni di modifica/eliminazione (Admin).
 */
export const LabelManagerModal: React.FC<LabelManagerModalProps> = ({
  isOpen,
  onClose,
  onLabelsChanged,
}) => {
  const { isAdmin } = useAuth();

  // Stato dati etichette
  const [labels, setLabels] = useState<LabelResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Stato form di creazione
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState<string>(PRESET_LABEL_COLORS[0]);
  const [isCreating, setIsCreating] = useState(false);

  // Stato modalità modifica inline
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState(PRESET_LABEL_COLORS[0]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Stato modalità eliminazione inline
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Caricamento elenco etichette
  const loadLabels = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const data = await labelService.getAllLabels();
      setLabels(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Impossibile caricare le etichette.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = useCallback(() => {
    setNewName('');
    setNewColor(PRESET_LABEL_COLORS[0]);
    setEditingId(null);
    setDeletingId(null);
    setApiError(null);
    setIsLoading(true);
    onClose();
  }, [onClose]);

  // Caricamento al momento dell'apertura
  useEffect(() => {
    if (isOpen) {
      loadLabels();
    }
  }, [isOpen]);

  // Chiusura con tasto Escape (annulla prima eventuali modifiche/eliminazioni in corso)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isCreating && !isSavingEdit && !isDeleting) {
        if (deletingId !== null) {
          setDeletingId(null);
          return;
        }
        if (editingId !== null) {
          setEditingId(null);
          return;
        }
        handleClose();
      }
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isCreating, isSavingEdit, isDeleting, deletingId, editingId, handleClose]);

  if (!isOpen) return null;

  // 1. Creazione nuova etichetta
  const handleCreate = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed || isCreating) return;

    // Controllo client-side duplicati per feedback immediato in italiano
    if (labels.some((l) => l.name?.trim().toLowerCase() === trimmed.toLowerCase())) {
      setApiError(`Un'etichetta con il nome "${trimmed}" esiste già.`);
      return;
    }

    setIsCreating(true);
    setApiError(null);

    try {
      const created = await labelService.createLabel({ name: trimmed, color: newColor });
      if (created?.id !== undefined) {
        setLabels((prev) => [...prev, created]);
        setNewName('');
        setNewColor(PRESET_LABEL_COLORS[0]);
        onLabelsChanged?.();
        window.dispatchEvent(new CustomEvent('labels:changed'));
      }
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Errore durante la creazione dell'etichetta.");
    } finally {
      setIsCreating(false);
    }
  };

  // 2. Avvio modifica inline
  const startEditing = (lbl: LabelResponseDto) => {
    if (!isAdmin || lbl.id === undefined) return;
    setDeletingId(null);
    setEditingId(lbl.id);
    setEditName(lbl.name || '');
    setEditColor(lbl.color || PRESET_LABEL_COLORS[0]);
    setApiError(null);
  };

  // 3. Salvataggio modifica inline
  const handleSaveEdit = async (id: number) => {
    const trimmed = editName.trim();
    if (!trimmed || isSavingEdit) return;

    // Controllo client-side duplicati (escludendo l'etichetta corrente)
    if (labels.some((l) => l.id !== id && l.name?.trim().toLowerCase() === trimmed.toLowerCase())) {
      setApiError(`Un'etichetta con il nome "${trimmed}" esiste già.`);
      return;
    }

    setIsSavingEdit(true);
    setApiError(null);

    try {
      const updated = await labelService.updateLabel(id, { name: trimmed, color: editColor });
      setLabels((prev) => prev.map((l) => (l.id === id ? updated : l)));
      setEditingId(null);
      onLabelsChanged?.();
      window.dispatchEvent(new CustomEvent('labels:changed'));
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Errore durante l'aggiornamento dell'etichetta.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // 4. Avvio eliminazione inline con conferma visiva (senza window.confirm)
  const startDeleting = (lbl: LabelResponseDto) => {
    if (!isAdmin || lbl.id === undefined || isDeleting) return;
    if (editingId !== null) setEditingId(null);
    setDeletingId(lbl.id);
    setApiError(null);
  };

  const handleCancelDelete = () => {
    if (isDeleting) return;
    setDeletingId(null);
  };

  const handleConfirmDelete = async (id: number) => {
    if (!isAdmin || isDeleting) return;

    setIsDeleting(true);
    setApiError(null);
    try {
      await labelService.deleteLabel(id);
      setLabels((prev) => prev.filter((l) => l.id !== id));
      setDeletingId(null);
      if (editingId === id) setEditingId(null);
      onLabelsChanged?.();
      window.dispatchEvent(new CustomEvent('labels:changed'));
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Errore durante l'eliminazione dell'etichetta.");
    } finally {
      setIsDeleting(false);
    }
  };

  // 5. Rendering condizionale della lista etichette (Sonar Clean & KISS)
  const renderLabelList = () => {
    if (isLoading && labels.length === 0) {
      return (
        <div className="flex items-center justify-center gap-2 py-10 px-6 min-h-44 text-slate-400 dark:text-slate-500 text-sm">
          <Loader2 size={20} className="animate-spin text-blue-600 dark:text-blue-500" />
          <span>Caricamento etichette...</span>
        </div>
      );
    }

    if (labels.length === 0) {
      return (
        <div className="flex items-center justify-center py-10 px-6 min-h-44 text-slate-400 dark:text-slate-500 text-sm">
          Nessuna etichetta creata finora.
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto overscroll-contain pr-1">
        {labels.map((lbl) => {
          if (lbl.id === undefined) return null;
          const isEditing = editingId === lbl.id;
          const isConfirmingDelete = deletingId === lbl.id;

          if (isEditing) {
            return (
              <div key={lbl.id} className="flex items-center gap-2 p-2 px-3 bg-slate-50 dark:bg-slate-800/60 border border-blue-500 dark:border-blue-500 rounded-lg">
                <input
                  type="text"
                  className="flex-1 min-w-25 px-2 py-1 text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-[#21262d] border border-slate-300 dark:border-slate-600 rounded outline-none focus:border-blue-600"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  disabled={isSavingEdit}
                  maxLength={30}
                  autoFocus
                />
                <div className="flex items-center gap-1">
                  {PRESET_LABEL_COLORS.slice(0, 4).map((col) => (
                    <button
                      key={col}
                      type="button"
                      className={`w-4 h-4 rounded-full border-2 cursor-pointer transition-transform hover:scale-115 ${
                        editColor === col ? 'border-slate-900 dark:border-slate-100 scale-115' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: col }}
                      onClick={() => setEditColor(col)}
                    />
                  ))}
                  <label
                    className={`w-4 h-4 rounded-full border-2 cursor-pointer transition-transform hover:scale-115 relative flex items-center justify-center shrink-0 ${
                      !PRESET_LABEL_COLORS.includes(editColor)
                        ? 'border-slate-900 dark:border-slate-100 scale-115 ring-2 ring-white dark:ring-slate-900'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                    style={{ backgroundColor: editColor }}
                    title="Colore personalizzato"
                  >
                    <input
                      type="color"
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      aria-label="Colore personalizzato"
                    />
                  </label>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center min-w-7 h-7 px-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded cursor-pointer transition-colors disabled:opacity-50"
                    onClick={() => handleSaveEdit(lbl.id!)}
                    disabled={isSavingEdit || !editName.trim()}
                    title="Salva modifiche"
                  >
                    {isSavingEdit ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center min-w-7 h-7 px-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 rounded cursor-pointer transition-colors disabled:opacity-50"
                    onClick={() => setEditingId(null)}
                    disabled={isSavingEdit}
                    title="Annulla modifica"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            );
          }

          if (isConfirmingDelete) {
            return (
              <div
                key={lbl.id}
                className="flex items-center justify-between gap-2 p-2 px-3 bg-red-50/70 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg transition-colors"
              >
                <span className="text-xs font-semibold text-red-700 dark:text-red-400 truncate">
                  Eliminare &ldquo;{lbl.name}&rdquo;?
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-md cursor-pointer transition-colors disabled:opacity-50"
                    onClick={() => handleConfirmDelete(lbl.id!)}
                    disabled={isDeleting}
                    title="Conferma eliminazione"
                    aria-label={`Conferma eliminazione etichetta ${lbl.name}`}
                  >
                    {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    <span>Elimina</span>
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md cursor-pointer transition-colors disabled:opacity-50"
                    onClick={handleCancelDelete}
                    disabled={isDeleting}
                    title="Annulla eliminazione"
                    aria-label="Annulla eliminazione"
                  >
                    <X size={13} />
                    <span>Annulla</span>
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div key={lbl.id} className="flex items-center justify-between p-2 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg">
              <LabelBadge label={lbl} size="md" />

              {isAdmin && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center w-7 h-7 rounded-md border-none bg-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700 cursor-pointer transition-colors disabled:opacity-50"
                    onClick={() => startEditing(lbl)}
                    disabled={isDeleting || isSavingEdit}
                    title="Modifica etichetta"
                    aria-label={`Modifica etichetta ${lbl.name}`}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center w-7 h-7 rounded-md border-none bg-transparent text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer transition-colors disabled:opacity-50"
                    onClick={() => startDeleting(lbl)}
                    disabled={isDeleting || isSavingEdit}
                    title="Elimina etichetta"
                    aria-label={`Elimina etichetta ${lbl.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <dialog
      className="fixed inset-0 z-1000 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs w-full h-full border-none max-w-none max-h-none overflow-y-auto"
      open
      aria-labelledby="label-manager-title"
      aria-modal="true"
    >
      <div className="relative bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-130 flex flex-col my-auto overflow-hidden">
        {/* Header Modale */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 rounded-t-2xl gap-3">
          <h2 id="label-manager-title" className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100 m-0">
            <Tag size={20} className="text-blue-600 dark:text-blue-500" />
            <span>Gestione Etichette</span>
          </h2>
          <button
            type="button"
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
            onClick={handleClose}
            disabled={isCreating || isSavingEdit || isDeleting}
            aria-label="Chiudi finestra"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-6 overflow-y-auto overscroll-contain max-h-[calc(85vh-130px)]">
          {/* Banner Errore */}
          {apiError && (
            <div className="flex items-center gap-2.5 p-3 text-sm bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50 rounded-lg" role="alert">
              <AlertCircle size={16} className="shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          {/* Form Creazione Nuova Etichetta */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Crea Nuova Etichetta</span>
            <form onSubmit={handleCreate} className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <input
                type="text"
                className="flex-1 min-w-35 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-[#21262d] border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-600 dark:focus:border-blue-500 focus:ring-3 focus:ring-blue-600/15 transition-all placeholder:text-slate-400"
                placeholder="es. Frontend, Bug, Urgente..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                disabled={isCreating}
                maxLength={30}
              />

              {/* Selettore Colore: Palette Preset + Native Color Picker */}
              <div className="flex items-center gap-1.25 shrink-0" title="Scegli colore">
                {PRESET_LABEL_COLORS.map((col) => (
                  <button
                    key={col}
                    type="button"
                    className={`w-5 h-5 rounded-full border-2 cursor-pointer transition-transform hover:scale-115 ${
                      newColor === col
                        ? 'border-slate-900 dark:border-slate-100 scale-115 ring-2 ring-white dark:ring-slate-900'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: col }}
                    onClick={() => setNewColor(col)}
                    aria-label={`Seleziona colore ${col}`}
                  />
                ))}
                <label
                  className={`w-5 h-5 rounded-full border-2 cursor-pointer transition-transform hover:scale-115 relative flex items-center justify-center shrink-0 ${
                    !PRESET_LABEL_COLORS.includes(newColor)
                      ? 'border-slate-900 dark:border-slate-100 scale-115 ring-2 ring-white dark:ring-slate-900'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                  style={{ backgroundColor: newColor }}
                  title="Colore personalizzato"
                >
                  <input
                    type="color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    aria-label="Colore personalizzato"
                  />
                </label>
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-1 px-3.5 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 active:bg-green-800 rounded-lg cursor-pointer shadow-xs transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isCreating || !newName.trim()}
              >
                {isCreating ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                <span>Crea</span>
              </button>
            </form>
          </div>

          <hr className="border-0 border-t border-slate-200 dark:border-slate-800 my-0.5" />

          {/* Elenco Etichette Esistenti */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Etichette Registrate ({labels.length})</span>
              <button
                type="button"
                className="inline-flex items-center gap-1 bg-transparent border-none text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 text-xs cursor-pointer py-0.5 px-1.5 rounded"
                onClick={loadLabels}
                disabled={isLoading}
                title="Ricarica elenco etichette"
              >
                <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                <span>Aggiorna</span>
              </button>
            </div>

            {renderLabelList()}
          </div>
        </div>

        {/* Footer Modale */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-2xl">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-[#21262d] border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleClose}
            disabled={isCreating || isSavingEdit || isDeleting}
          >
            Chiudi
          </button>
        </div>
      </div>
    </dialog>
  );
};
