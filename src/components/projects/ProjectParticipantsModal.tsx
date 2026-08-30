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
import './ProjectModal.css';

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
        <div className="participants-loading-container">
          <Loader2 size={24} className="animate-spin text-primary" />
          <span>Caricamento membri in corso...</span>
        </div>
      );
    }

    if (filteredParticipants.length === 0) {
      return (
        <div className="participants-empty-container">
          <User size={32} className="text-muted" />
          <span>
            {searchQuery
              ? 'Nessun partecipante corrisponde alla ricerca.'
              : 'Nessun partecipante presente in questo progetto.'}
          </span>
        </div>
      );
    }

    return (
      <ul className="participants-list" aria-label="Elenco Partecipanti">
        {filteredParticipants.map((participant) => {
          const isProjectCreator =
            activeCreatorId !== undefined && participant.id === activeCreatorId;
          const isCurrentUser = user?.id !== undefined && participant.id === user.id;
          const isUserAdmin = participant.type === 'ADMIN';
          const initial = participant.username
            ? participant.username.charAt(0).toUpperCase()
            : 'U';

          return (
            <li key={participant.id} className="participant-item">
              <div className="participant-avatar" aria-hidden="true">
                {initial}
              </div>

              <div className="participant-info">
                <div className="participant-name-row">
                  <span className="participant-username">{participant.username}</span>
                  {isCurrentUser && (
                    <span className="badge badge-code participant-me-badge">Tu</span>
                  )}
                  {isProjectCreator && (
                    <span
                      className="badge participant-creator-badge"
                      title="Creatore del Progetto"
                    >
                      <Crown size={12} />
                      <span>Creatore</span>
                    </span>
                  )}
                </div>
                <span className="participant-email">{participant.email}</span>
              </div>

              <div className="participant-role-wrapper">
                <span
                  className={`badge ${
                    isUserAdmin ? 'badge-danger' : 'badge-info'
                  } participant-role-badge`}
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
      className="modal-overlay"
      open
      aria-labelledby="participants-modal-title"
      aria-modal="true"
    >
      <div ref={modalContainerRef} className="modal-container participants-modal-container">
        {/* Intestazione Modale */}
        <div className="modal-header">
          <div className="modal-title-wrapper">
            <h2 id="participants-modal-title" className="modal-title">
              <Users size={20} className="text-primary" />
              <span>Partecipanti al Progetto</span>
            </h2>
            <div className="participants-project-info-row">
              <span className="participants-project-name" title={activeProjectName}>
                {activeProjectName}
              </span>
              {isCreator && (
                <span className="badge participant-creator-badge" title="Sei l'amministratore creatore di questo progetto">
                  <Crown size={11} />
                  <span>Sei il creatore</span>
                </span>
              )}
            </div>
          </div>
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

        {/* Corpo Modale */}
        <div className="modal-body participants-modal-body">
          {/* Banner Errore API */}
          {apiError && (
            <div className="alert alert-error" role="alert">
              <AlertCircle size={16} />
              <span>{apiError}</span>
            </div>
          )}

          {/* Banner Successo con semantic tag output */}
          {successMessage && (
            <output className="alert alert-success">
              <CheckCircle2 size={16} />
              <span>{successMessage}</span>
            </output>
          )}

          {/* Sezione Aggiungi Partecipante (Abilitata per Amministratori) */}
          {isAdmin && (
            <div className="add-participant-box">
              <div className="add-participant-header">
                <UserPlus size={16} className="text-primary" />
                <span className="add-participant-title">Aggiungi Membro al Progetto</span>
              </div>

              {availableUsersToAdd.length > 0 ? (
                <form onSubmit={handleAddParticipant} className="add-participant-form">
                  <div className="add-participant-input-group">
                    <select
                      className="form-select add-participant-select"
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
                      className="btn btn-primary add-participant-submit-btn"
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
                <p className="add-participant-empty-note">
                  Tutti gli utenti registrati nel sistema sono già partecipanti a questo progetto.
                </p>
              )}
            </div>
          )}

          {/* Informazione per utenti non-admin */}
          {!isAdmin && (
            <div className="participants-readonly-info">
              <span>Solo gli amministratori possono associare nuovi partecipanti a questo progetto.</span>
            </div>
          )}

          {/* Intestazione Lista Partecipanti & Campo Ricerca */}
          <div className="participants-list-header">
            <div className="participants-count-tag">
              <span>Membri del team</span>
              <span className="badge badge-info">{participants.length}</span>
            </div>

            {participants.length > 4 && (
              <div className="participants-search-wrapper">
                <Search size={14} className="participants-search-icon" />
                <input
                  type="text"
                  className="participants-search-input"
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
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
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
