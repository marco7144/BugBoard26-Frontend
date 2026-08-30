import React, { useState, useEffect, useRef } from 'react';
import { FolderPlus, X, AlertCircle, Loader2 } from 'lucide-react';
import { projectService, type ProjectResponseDto } from '../../services/projectService';
import { useProject } from '../../context/ProjectContext';
import { PRESET_ICONS, svgToBase64 } from './projectPresets';
import './ProjectModal.css';

export interface CreateProjectModalProps {
  /** Indica se la finestra modale è visibile */
  isOpen: boolean;
  /** Callback invocata alla richiesta di chiusura */
  onClose: () => void;
  /** Callback opzionale invocata con il progetto appena creato */
  onSuccess?: (project: ProjectResponseDto) => void;
}

/**
 * Modale per la Creazione di un Nuovo Progetto (Riservato agli Amministratori).
 * Incapsula la validazione client, la selezione dell'icona tra i preset e l'invio all'endpoint `/api/projects/createproject`.
 */
export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { fetchProjects, selectProject } = useProject();

  const [name, setName] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('folder-blue');
  const [nameError, setNameError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);

  // Focus automatico sul campo nome quando il modale viene aperto
  useEffect(() => {
    if (isOpen) {
      setName('');
      setSelectedPresetId('folder-blue');
      setNameError(null);
      setApiError(null);
      setIsSubmitting(false);

      const timer = setTimeout(() => {
        nameInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Gestione tasto ESC per chiudere il modale
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSubmitting, onClose]);

  // Gestione click esterno al contenitore per chiudere il modale
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        isOpen &&
        !isSubmitting &&
        modalContainerRef.current &&
        !modalContainerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (nameError) {
      setNameError(null);
    }
    if (apiError) {
      setApiError(null);
    }
  };

  const handlePresetSelect = (presetId: string) => {
    setSelectedPresetId(presetId);
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('Il nome del progetto è obbligatorio.');
      nameInputRef.current?.focus();
      return;
    }
    if (trimmedName.length < 2) {
      setNameError('Il nome del progetto deve contenere almeno 2 caratteri.');
      nameInputRef.current?.focus();
      return;
    }

    // Calcolo del Base64 dell'icona preset selezionata
    const preset = PRESET_ICONS.find((p) => p.id === selectedPresetId) || PRESET_ICONS[0];
    const iconBase64 = svgToBase64(preset.svg);

    setIsSubmitting(true);
    setApiError(null);

    try {
      const createdProject = await projectService.createProject({
        name: trimmedName,
        icon: iconBase64,
      });

      // Aggiorna l'elenco globale dei progetti e seleziona il nuovo progetto
      await fetchProjects();
      selectProject(createdProject);

      if (onSuccess) {
        onSuccess(createdProject);
      }
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Errore durante la creazione del progetto.';
      setApiError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Icona preset attiva per l'anteprima
  const activePreset = PRESET_ICONS.find((p) => p.id === selectedPresetId) || PRESET_ICONS[0];

  return (
    <dialog
      className="modal-overlay"
      open
      aria-labelledby="create-project-title"
      aria-modal="true"
    >
      <div ref={modalContainerRef} className="modal-container">
        {/* Intestazione Modale */}
        <div className="modal-header">
          <h2 id="create-project-title" className="modal-title">
            <FolderPlus size={20} className="text-primary" />
            <span>Nuovo Progetto</span>
          </h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Chiudi finestra"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corpo del Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            {/* Banner Errore API */}
            {apiError && (
              <div className="alert alert-error" role="alert">
                <AlertCircle size={16} />
                <span>{apiError}</span>
              </div>
            )}

            {/* Campo Nome Progetto */}
            <div className="form-group">
              <label htmlFor="project-name" className="form-label">
                Nome Progetto <span className="text-danger">*</span>
              </label>
              <input
                ref={nameInputRef}
                id="project-name"
                type="text"
                className={`form-input ${nameError ? 'form-input-error' : ''}`}
                placeholder="es. BugBoard Client Frontend"
                value={name}
                onChange={handleNameChange}
                disabled={isSubmitting}
                maxLength={50}
                autoComplete="off"
              />
              {nameError && <span className="form-error">{nameError}</span>}
            </div>

            {/* Sezione Selezione Icona */}
            <div className="project-icon-section">
              <span className="form-label">Icona del Progetto</span>

              {/* Griglia Icone Predefinite */}
              <div className="project-icon-grid">
                {PRESET_ICONS.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      className={`project-icon-preset ${isSelected ? 'active' : ''}`}
                      onClick={() => handlePresetSelect(preset.id)}
                      disabled={isSubmitting}
                      title={`Seleziona icona ${preset.name}`}
                    >
                      <div
                        className="project-icon-preset-svg"
                        dangerouslySetInnerHTML={{ __html: preset.svg }}
                      />
                      <span className="project-icon-preset-label">{preset.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Anteprima Live del Progetto */}
            <div className="form-group">
              <span className="form-label">Anteprima Scheda Progetto</span>
              <div className="project-preview-card">
                <div className="project-preview-icon">
                  <div
                    className="project-icon-preset-svg"
                    dangerouslySetInnerHTML={{ __html: activePreset.svg }}
                  />
                </div>
                <div className="project-preview-details">
                  <span className="project-preview-name">
                    {name.trim() || 'Nome del Progetto'}
                  </span>
                  <span className="project-preview-hint">Creato da Amministratore</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer con Azioni */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Creazione in corso...</span>
                </>
              ) : (
                <>
                  <FolderPlus size={16} />
                  <span>Crea Progetto</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
};
