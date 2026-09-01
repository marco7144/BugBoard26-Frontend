import React, { useState, useEffect } from 'react';
import { Tag, X, Plus, Pencil, Trash2, Check, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { labelService, type LabelResponseDto } from '../../services/labelService';
import { useAuth } from '../../context/AuthContext';
import { LabelBadge } from './LabelBadge';
import { PRESET_LABEL_COLORS } from './LabelSelector';
import './Labels.css';

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
  const [isLoading, setIsLoading] = useState(false);
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

  // Caricamento al momento dell'apertura
  useEffect(() => {
    if (isOpen) {
      setNewName('');
      setNewColor(PRESET_LABEL_COLORS[0]);
      setEditingId(null);
      setApiError(null);
      loadLabels();
    }
  }, [isOpen]);

  // Chiusura con tasto Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isCreating && !isSavingEdit) {
        onClose();
      }
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isCreating, isSavingEdit, onClose]);

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
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Errore durante l'aggiornamento dell'etichetta.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // 4. Eliminazione etichetta
  const handleDelete = async (id: number, name?: string) => {
    if (!isAdmin) return;
    const confirmText = name
      ? `Sei sicuro di voler eliminare l'etichetta "${name}"?`
      : "Sei sicuro di voler eliminare questa etichetta?";

    if (!window.confirm(confirmText)) return;

    setApiError(null);
    try {
      await labelService.deleteLabel(id);
      setLabels((prev) => prev.filter((l) => l.id !== id));
      if (editingId === id) setEditingId(null);
      onLabelsChanged?.();
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Errore durante l'eliminazione dell'etichetta.");
    }
  };

  // 5. Rendering condizionale della lista etichette (Sonar Clean & KISS)
  const renderLabelList = () => {
    if (isLoading && labels.length === 0) {
      return (
        <div className="label-manager-loading">
          <Loader2 size={20} className="animate-spin text-primary" />
          <span>Caricamento etichette...</span>
        </div>
      );
    }

    if (labels.length === 0) {
      return <div className="label-manager-empty">Nessuna etichetta creata finora.</div>;
    }

    return (
      <div className="label-manager-list">
        {labels.map((lbl) => {
          if (lbl.id === undefined) return null;
          const isEditing = editingId === lbl.id;

          if (isEditing) {
            return (
              <div key={lbl.id} className="label-manager-item label-manager-item--editing">
                <input
                  type="text"
                  className="form-input form-input-sm label-edit-name-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  disabled={isSavingEdit}
                  maxLength={30}
                  autoFocus
                />
                <div className="label-manager-colors-sm">
                  {PRESET_LABEL_COLORS.slice(0, 4).map((col) => (
                    <button
                      key={col}
                      type="button"
                      className={`label-color-dot label-color-dot-sm ${editColor === col ? 'active' : ''}`}
                      style={{ backgroundColor: col }}
                      onClick={() => setEditColor(col)}
                    />
                  ))}
                  <input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="label-color-input-native label-color-input-native-sm"
                    title="Colore personalizzato"
                  />
                </div>
                <div className="label-manager-item-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm label-edit-action-btn"
                    onClick={() => handleSaveEdit(lbl.id!)}
                    disabled={isSavingEdit || !editName.trim()}
                    title="Salva modifiche"
                  >
                    {isSavingEdit ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm label-edit-action-btn"
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

          return (
            <div key={lbl.id} className="label-manager-item">
              <LabelBadge label={lbl} size="md" />

              {isAdmin && (
                <div className="label-manager-item-actions">
                  <button
                    type="button"
                    className="label-action-btn label-action-edit"
                    onClick={() => startEditing(lbl)}
                    title="Modifica etichetta"
                    aria-label={`Modifica etichetta ${lbl.name}`}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    className="label-action-btn label-action-delete"
                    onClick={() => handleDelete(lbl.id!, lbl.name)}
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
    <dialog className="modal-overlay" open aria-labelledby="label-manager-title" aria-modal="true">
      <div className="modal-container label-manager-modal">
        {/* Header Modale */}
        <div className="modal-header">
          <h2 id="label-manager-title" className="modal-title">
            <Tag size={20} className="text-primary" />
            <span>Gestione Etichette</span>
          </h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Chiudi finestra"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body label-manager-body">
          {/* Banner Errore */}
          {apiError && (
            <div className="alert alert-error" role="alert">
              <AlertCircle size={16} />
              <span>{apiError}</span>
            </div>
          )}

          {/* Form Creazione Nuova Etichetta */}
          <div className="label-manager-section">
            <span className="form-label">Crea Nuova Etichetta</span>
            <form onSubmit={handleCreate} className="label-manager-create-form">
              <input
                type="text"
                className="form-input label-manager-input"
                placeholder="es. Frontend, Bug, Urgente..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                disabled={isCreating}
                maxLength={30}
              />

              {/* Selettore Colore: Palette Preset + Native Color Picker */}
              <div className="label-manager-colors" title="Scegli colore">
                {PRESET_LABEL_COLORS.map((col) => (
                  <button
                    key={col}
                    type="button"
                    className={`label-color-dot ${newColor === col ? 'active' : ''}`}
                    style={{ backgroundColor: col }}
                    onClick={() => setNewColor(col)}
                    aria-label={`Seleziona colore ${col}`}
                  />
                ))}
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="label-color-input-native"
                  title="Scegli colore personalizzato"
                  aria-label="Colore personalizzato"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary label-manager-submit-btn"
                disabled={isCreating || !newName.trim()}
              >
                {isCreating ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                <span>Aggiungi</span>
              </button>
            </form>
          </div>

          <hr className="label-manager-divider" />

          {/* Elenco Etichette Esistenti */}
          <div className="label-manager-section">
            <div className="label-manager-list-header">
              <span className="form-label">Etichette Registrate ({labels.length})</span>
              <button
                type="button"
                className="label-manager-refresh-btn"
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
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Chiudi
          </button>
        </div>
      </div>
    </dialog>
  );
};
