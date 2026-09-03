import React, { useState, useEffect, useRef } from 'react';
import { FolderPlus, X, AlertCircle, Loader2 } from 'lucide-react';
import { projectService, type ProjectResponseDto } from '../../services/projectService';
import { useProject } from '../../context/ProjectContext';
import { PRESET_ICONS, svgToBase64 } from './projectPresets';

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
      className="fixed inset-0 z-1000 flex items-center justify-center w-screen h-screen max-w-none max-h-none m-0 p-4 border-none bg-slate-900/55 backdrop-blur-xs box-border animate-in fade-in duration-150"
      open
      aria-labelledby="create-project-title"
      aria-modal="true"
    >
      <div
        ref={modalContainerRef}
        className="relative w-full max-w-130 max-h-[90vh] bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Intestazione Modale */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 gap-3">
          <h2 id="create-project-title" className="flex items-center gap-2.5 text-lg font-semibold text-slate-900 dark:text-slate-100 m-0">
            <FolderPlus size={20} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <span>Nuovo Progetto</span>
          </h2>
          <button
            type="button"
            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Chiudi finestra"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corpo del Form */}
        <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 overflow-hidden m-0">
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-4">
            {/* Banner Errore API */}
            {apiError && (
              <div
                className="flex items-start gap-2.5 p-3 rounded-lg text-[13px] leading-snug bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400"
                role="alert"
              >
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                <span>{apiError}</span>
              </div>
            )}

            {/* Campo Nome Progetto */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="project-name" className="text-sm font-medium text-slate-800 dark:text-slate-200">
                Nome Progetto <span className="text-red-500">*</span>
              </label>
              <input
                ref={nameInputRef}
                id="project-name"
                type="text"
                className={`w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-[#161b22] border rounded-lg transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 ${
                  nameError
                    ? 'border-red-500 bg-red-50/20 dark:bg-red-950/10 focus:border-red-500 focus:ring-red-500/20 text-red-900 dark:text-red-200'
                    : 'border-slate-300 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-blue-600/20'
                }`}
                placeholder="es. BugBoard Client Frontend"
                value={name}
                onChange={handleNameChange}
                disabled={isSubmitting}
                maxLength={50}
                autoComplete="off"
              />
              {nameError && (
                <span className="text-xs text-red-600 dark:text-red-400">
                  {nameError}
                </span>
              )}
            </div>

            {/* Sezione Selezione Icona */}
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Icona del Progetto</span>

              {/* Griglia Icone Predefinite */}
              <div className="grid grid-cols-4 gap-2">
                {PRESET_ICONS.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      className={`flex flex-col items-center justify-center gap-1 py-2 px-1.5 rounded-lg border-2 transition-all cursor-pointer select-none font-sans ${
                        isSelected
                          ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/50 ring-1 ring-blue-600/30'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] hover:border-blue-500 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                      onClick={() => handlePresetSelect(preset.id)}
                      disabled={isSubmitting}
                      title={`Seleziona icona ${preset.name}`}
                    >
                      <div
                        className="w-7 h-7 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                        dangerouslySetInnerHTML={{ __html: preset.svg }}
                      />
                      <span
                        className={`text-[11px] leading-none ${
                          isSelected
                            ? 'font-semibold text-blue-600 dark:text-blue-400'
                            : 'font-medium text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {preset.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Anteprima Live del Progetto */}
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Anteprima Scheda Progetto</span>
              <div className="flex items-center gap-3 px-3.5 py-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 [&>div]:w-6 [&>div]:h-6 [&>div>svg]:w-full [&>div>svg]:h-full">
                  <div dangerouslySetInnerHTML={{ __html: activePreset.svg }} />
                </div>
                <div className="flex flex-col gap-0.5 overflow-hidden min-w-0">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {name.trim() || 'Nome del Progetto'}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">Creato da Amministratore</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer con Azioni */}
          <div className="flex items-center justify-end gap-3 px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#161b22]">
            <button
              type="button"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-[#21262d] border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs disabled:opacity-60 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-blue-600/30"
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin shrink-0" />
                  <span>Creazione in corso...</span>
                </>
              ) : (
                <>
                  <FolderPlus size={16} className="shrink-0" />
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
