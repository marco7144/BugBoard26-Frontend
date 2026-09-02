import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Users,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  UserPlus,
  Crown,
  Search,
  User,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { projectService } from '../../services/projectService';
import { userService, type UserResponseDto } from '../../services/userService';

export interface ProjectParticipantsModalProps {
  /** Indica se la finestra modale è visibile */
  isOpen: boolean;
  /** Callback invocata per richiedere la chiusura della modale */
  onClose: () => void;
}

/**
 * Modale per la visualizzazione e gestione dei partecipanti a un progetto.
 * Responsabilità:
 * 1. Consultare la lista dei membri associati al progetto corrente (GET /api/projects/{id}/participants).
 * 2. Consentire all'Amministratore creatore di associare nuovi utenti (POST /api/projects/{id}/participants).
 */
export const ProjectParticipantsModal: React.FC<ProjectParticipantsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, isAdmin } = useAuth();
  const { selectedProject } = useProject();

  // Risoluzione dati progetto dal contesto attivo
  const activeProjectId = selectedProject?.id;
  const activeProjectName = selectedProject?.name ?? 'Progetto';
  const activeCreatorId = selectedProject?.creatorId;

  // Verifica se l'utente corrente è l'Admin creatore del progetto (per mostrare il badge di creatore)
  const isCreator = user?.id !== undefined && activeCreatorId !== undefined && user.id === activeCreatorId;

  // Stati locali per dati e interazione
  const [participants, setParticipants] = useState<UserResponseDto[]>([]);
  const [allUsers, setAllUsers] = useState<UserResponseDto[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Stati per caricamento, submit e messaggi
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const modalContainerRef = useRef<HTMLDivElement>(null);

  // Caricamento iniziale dei dati alla visualizzazione della modale
  useEffect(() => {
    if (!isOpen || activeProjectId === undefined) {
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setApiError(null);
    setSuccessMessage(null);
    setSelectedUserId('');
    setSearchQuery('');

    const fetchInitialData = async () => {
      const [participantsResult, usersResult] = await Promise.allSettled([
        projectService.getParticipants(activeProjectId),
        isAdmin ? userService.getAllUsers() : Promise.resolve([]),
      ]);

      if (!isMounted) return;

      if (participantsResult.status === 'fulfilled') {
        setParticipants(Array.isArray(participantsResult.value) ? participantsResult.value : []);
      } else {
        const err = participantsResult.reason;
        const msg = err instanceof Error ? err.message : 'Errore durante il caricamento dei partecipanti.';
        setApiError(msg);
      }

      if (usersResult.status === 'fulfilled' && Array.isArray(usersResult.value)) {
        setAllUsers(usersResult.value);
      }

      setIsLoading(false);
    };

    void fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, activeProjectId, isAdmin]);

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

  // Gestione click all'esterno del modale
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

  // Utenti disponibili da aggiungere (esclusi quelli già partecipanti)
  const availableUsersToAdd = useMemo(() => {
    const participantIds = new Set(participants.map((p) => p.id));
    return allUsers.filter((u) => u.id !== undefined && !participantIds.has(u.id));
  }, [allUsers, participants]);

  // Filtro di ricerca sui partecipanti
  const filteredParticipants = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return participants;
    }
    return participants.filter(
      (p) =>
        p.username?.toLowerCase().includes(query) ||
        p.email?.toLowerCase().includes(query)
    );
  }, [participants, searchQuery]);

  if (!isOpen) {
    return null;
  }

  // Azione: Aggiunta nuovo partecipante
  const handleAddParticipant = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!activeProjectId || !selectedUserId) {
      return;
    }

    const userIdToAdd = Number(selectedUserId);
    if (Number.isNaN(userIdToAdd)) {
      return;
    }

    setIsSubmitting(true);
    setApiError(null);
    setSuccessMessage(null);

    try {
      await projectService.addParticipant(activeProjectId, userIdToAdd);

      // Ricarica la lista aggiornata dei partecipanti
      const updatedList = await projectService.getParticipants(activeProjectId);
      setParticipants(Array.isArray(updatedList) ? updatedList : []);

      setSelectedUserId('');
      setSuccessMessage('Partecipante aggiunto con successo al progetto!');
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Errore durante l'aggiunta del partecipante al progetto.";
      setApiError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rendering dello stato di caricamento, lista vuota o elenco partecipanti
  const renderParticipantsContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center gap-2.5 py-7 px-4 text-slate-500 dark:text-slate-400 text-sm text-center">
          <Loader2 size={24} className="animate-spin text-blue-600 dark:text-blue-400" />
          <span>Caricamento membri in corso...</span>
        </div>
      );
    }

    if (filteredParticipants.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-2.5 py-7 px-4 text-slate-400 dark:text-slate-500 text-sm text-center">
          <User size={32} className="opacity-60" />
          <span>
            {searchQuery
              ? 'Nessun partecipante corrisponde alla ricerca.'
              : 'Nessun partecipante presente in questo progetto.'}
          </span>
        </div>
      );
    }

    return (
      <ul className="list-none p-0 m-0 flex flex-col gap-2 max-h-70 overflow-y-auto pr-1" aria-label="Elenco Partecipanti">
        {filteredParticipants.map((participant) => {
          const isProjectCreator =
            activeCreatorId !== undefined && participant.id === activeCreatorId;
          const isCurrentUser = user?.id !== undefined && participant.id === user.id;
          const isUserAdmin = participant.type === 'ADMIN';
          const initial = participant.username
            ? participant.username.charAt(0).toUpperCase()
            : 'U';

          return (
            <li
              key={participant.id}
              className="flex items-center gap-3 p-2.5 sm:px-3 sm:py-2.5 bg-white dark:bg-[#151c2c] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 rounded-lg transition-all"
            >
              <div
                className="w-8.5 h-8.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0 select-none border border-blue-200/60 dark:border-blue-900/50"
                aria-hidden="true"
              >
                {initial}
              </div>

              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    {participant.username}
                  </span>
                  {isCurrentUser && (
                    <span className="font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/50">
                      Tu
                    </span>
                  )}
                  {isProjectCreator && (
                    <span
                      className="inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                      title="Creatore del Progetto"
                    >
                      <Crown size={12} />
                      <span>Creatore</span>
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {participant.email}
                </span>
              </div>

              <div className="flex items-center shrink-0">
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded ${
                    isUserAdmin
                      ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50'
                      : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50'
                  }`}
                  title={`Ruolo di sistema: ${participant.type || 'USER'}`}
                >
                  {isUserAdmin && <Shield size={11} />}
                  <span>{participant.type || 'USER'}</span>
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <dialog
      className="fixed inset-0 z-1000 flex items-center justify-center w-screen h-screen max-w-none max-h-none m-0 p-4 border-none bg-slate-900/55 backdrop-blur-xs box-border animate-in fade-in duration-150"
      open
      aria-labelledby="participants-modal-title"
      aria-modal="true"
    >
      <div
        ref={modalContainerRef}
        className="relative w-full max-w-145 max-h-[90vh] bg-white dark:bg-[#151c2c] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Intestazione Modale */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 gap-3">
          <div className="flex flex-col gap-1">
            <h2 id="participants-modal-title" className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100 m-0">
              <Users size={20} className="text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Partecipanti al Progetto</span>
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400" title={activeProjectName}>
                {activeProjectName}
              </span>
              {isCreator && (
                <span
                  className="inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                  title="Sei l'amministratore creatore di questo progetto"
                >
                  <Crown size={12} />
                  <span>Sei il creatore</span>
                </span>
              )}
            </div>
          </div>
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

        {/* Corpo Modale */}
        <div className="p-4.5 sm:p-5 overflow-y-auto flex-1 flex flex-col gap-3.5">
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

          {/* Banner Successo con semantic tag output */}
          {successMessage && (
            <output
              className="flex items-start gap-2.5 p-3 rounded-lg text-[13px] leading-snug bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400"
            >
              <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <span>{successMessage}</span>
            </output>
          )}

          {/* Sezione Aggiungi Partecipante (Abilitata per Amministratori) */}
          {isAdmin && (
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-3.5 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-900 dark:text-slate-100">
                <UserPlus size={16} className="text-blue-600 dark:text-blue-400" />
                <span>Aggiungi Membro al Progetto</span>
              </div>

              {availableUsersToAdd.length > 0 ? (
                <form onSubmit={handleAddParticipant} className="w-full">
                  <div className="flex gap-2 items-center">
                    <select
                      className="flex-1 px-2.5 py-2 text-[13px] text-slate-900 dark:text-slate-100 bg-white dark:bg-[#151c2c] border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-600/20 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      disabled={isSubmitting || isLoading}
                      aria-label="Seleziona un utente da aggiungere"
                    >
                      <option value="">-- Seleziona un utente --</option>
                      {availableUsersToAdd.map((availUser) => (
                        <option key={availUser.id} value={availUser.id}>
                          {availUser.username} ({availUser.email}) — [{availUser.type || 'USER'}]
                        </option>
                      ))}
                    </select>

                    <button
                      type="submit"
                      className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs disabled:opacity-60 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                      disabled={isSubmitting || !selectedUserId || isLoading}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          <span>Aggiunta...</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={15} />
                          <span>Aggiungi</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-[13px] text-slate-500 dark:text-slate-400 m-0">
                  Tutti gli utenti registrati nel sistema sono già partecipanti a questo progetto.
                </p>
              )}
            </div>
          )}

          {/* Informazione per utenti non-admin */}
          {!isAdmin && (
            <div className="text-[13px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2">
              <span>Solo gli amministratori possono associare nuovi partecipanti a questo progetto.</span>
            </div>
          )}

          {/* Intestazione Lista Partecipanti & Campo Ricerca */}
          <div className="flex justify-between items-center pb-1.5 border-b border-slate-200 dark:border-slate-800 gap-3">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-600 dark:text-slate-400">
              <span>Membri del team</span>
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">
                {participants.length}
              </span>
            </div>

            {participants.length > 4 && (
              <div className="relative flex items-center">
                <Search size={14} className="absolute left-2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  className="pl-6.5 pr-2 py-1 text-[13px] text-slate-900 dark:text-slate-100 bg-white dark:bg-[#151c2c] border border-slate-300 dark:border-slate-700 rounded-md w-40 focus:w-48 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 transition-all"
                  placeholder="Cerca membro..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Cerca membro"
                />
              </div>
            )}
          </div>

          {/* Elenco Partecipanti */}
          {renderParticipantsContent()}
        </div>

        {/* Footer Modale */}
        <div className="flex items-center justify-end px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#111827]">
          <button
            type="button"
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Chiudi
          </button>
        </div>
      </div>
    </dialog>
  );
};
