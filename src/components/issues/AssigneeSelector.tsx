import React, { useState, useEffect } from 'react';
import { User, ChevronDown, Check, Search, Loader2, ShieldAlert, Lock, UserX } from 'lucide-react';
import type { IssueResponseDto } from '../../services/issueService';
import { issueService } from '../../services/issueService';
import type { UserResponseDto } from '../../services/projectService';
import { projectService } from '../../services/projectService';
import { useAuth } from '../../context/AuthContext';

export interface AssigneeSelectorProps {
  /** I dati completi del ticket restituito dal backend */
  issue: IssueResponseDto;
  /** ID facoltativo del progetto (se non presente dentro issue.projectId) */
  projectId?: number;
  /** Lista opzionale dei partecipanti al progetto */
  participants?: UserResponseDto[];
  /** Callback invocata quando l'assegnazione è completata con successo */
  onAssigneeChanged?: (updatedIssue: IssueResponseDto) => void;
  /** Disabilita l'interazione */
  disabled?: boolean;
  /** Classe CSS aggiuntiva per il contenitore */
  className?: string;
}

function getUserInitial(name?: string | null): string {
  return name && name.trim().length > 0 ? name.trim().charAt(0).toUpperCase() : 'U';
}

/**
 * Componente per la Selezione e l'Assegnazione di una Issue (F4).
 *
 * - Permette agli Admin di assegnare la issue a qualsiasi partecipante del progetto.
 * - Mostra una vista in sola lettura protetta per utenti standard.
 * - Include ricerca rapida per username/email nel menu a tendina.
 * - Stilato interamente con utility Tailwind CSS v4.
 */
export const AssigneeSelector: React.FC<AssigneeSelectorProps> = ({
  issue,
  projectId,
  participants: externalParticipants,
  onAssigneeChanged,
  disabled = false,
  className = '',
}) => {
  const { isAdmin } = useAuth();
  const effectiveProjectId = issue.projectId ?? projectId;

  const [internalParticipants, setInternalParticipants] = useState<UserResponseDto[]>([]);
  const participants = externalParticipants ?? internalParticipants;
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!externalParticipants && effectiveProjectId) {
      projectService
        .getParticipants(effectiveProjectId)
        .then((data) => setInternalParticipants(data || []))
        .catch(() => setInternalParticipants([]));
    }
  }, [effectiveProjectId, externalParticipants]);

  const currentAssignee =
    participants.find((p) => p.id === issue.assignedToId) ??
    (issue.assignedToUsername
      ? { id: issue.assignedToId, username: issue.assignedToUsername }
      : null);

  const filteredParticipants = searchQuery.trim()
    ? participants.filter(
        (p) =>
          p.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : participants;

  const handleSelect = async (userId: number) => {
    if (!effectiveProjectId || !issue.id || isAssigning || userId === issue.assignedToId) {
      setIsOpen(false);
      return;
    }

    setIsAssigning(true);
    setErrorMessage(null);

    try {
      const updated = await issueService.assignIssue(effectiveProjectId, issue.id, userId);
      setIsOpen(false);
      setSearchQuery('');
      onAssigneeChanged?.(updated);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Errore durante l'assegnazione della issue."
      );
    } finally {
      setIsAssigning(false);
    }
  };

  const isInteractive = isAdmin && !disabled;

  return (
    <div className={`relative flex flex-col gap-2 w-full ${className}`.trim()}>
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <User size={14} aria-hidden="true" /> Assegnatario
        </span>
        {!isAdmin && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full"
            title="Solo gli amministratori possono riassegnare i ticket"
          >
            <Lock size={11} aria-hidden="true" /> Solo Admin
          </span>
        )}
      </div>

      <button
        type="button"
        className={`flex items-center justify-between gap-2.5 w-full px-3 py-2 border rounded-lg font-sans text-sm text-left transition-all duration-150 shadow-xs ${
          isInteractive
            ? 'bg-white dark:bg-[#161b22] border-slate-200 dark:border-slate-700 hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer'
            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 cursor-default'
        } ${isOpen ? 'border-slate-400 bg-slate-50 dark:bg-slate-800/60 ring-1 ring-slate-400/20' : ''}`}
        onClick={() => isInteractive && setIsOpen(!isOpen)}
        disabled={!isInteractive || isAssigning}
        title={!isAdmin ? 'Modifica riservata agli Admin' : 'Clicca per modificare'}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              currentAssignee
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-dashed border-slate-300 dark:border-slate-700'
            }`}
          >
            {currentAssignee ? getUserInitial(currentAssignee.username) : <UserX size={15} />}
          </div>
          <div className="flex flex-col min-w-0 overflow-hidden">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {currentAssignee?.username ?? 'Non assegnato'}
            </span>
            {currentAssignee?.email && (
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {currentAssignee.email}
              </span>
            )}
          </div>
        </div>

        {isInteractive && (
          <div className="text-slate-400 flex items-center">
            {isAssigning ? (
              <Loader2 size={16} className="animate-spin text-blue-600 dark:text-blue-400" aria-hidden="true" />
            ) : (
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            )}
          </div>
        )}
      </button>

      {errorMessage && (
        <div
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-md"
          role="alert"
        >
          <ShieldAlert size={14} aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isOpen && isInteractive && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} aria-hidden="true" />
          <div
            className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 flex flex-col bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg overflow-hidden"
            aria-label="Seleziona partecipante"
          >
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400">
              <Search size={14} aria-hidden="true" />
              <input
                type="text"
                className="w-full border-0 bg-transparent p-0 text-sm text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400"
                placeholder="Cerca partecipante..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            <div className="flex flex-col max-h-50 overflow-y-auto p-1">
              {filteredParticipants.length === 0 ? (
                <div className="p-4 text-xs text-slate-400 text-center">
                  Nessun partecipante trovato
                </div>
              ) : (
                filteredParticipants.map((p) => {
                  const isSelected = p.id === issue.assignedToId;
                  return (
                    <button
                      key={p.id ?? p.username}
                      type="button"
                      className={`flex items-center gap-2.5 w-full px-2.5 py-2 border-0 bg-transparent rounded-md text-slate-900 dark:text-slate-100 font-sans text-left cursor-pointer transition-colors duration-150 hover:bg-slate-100 dark:hover:bg-slate-800 ${
                        isSelected ? 'bg-blue-50 dark:bg-blue-950/40' : ''
                      }`}
                      onClick={() => p.id && handleSelect(p.id)}
                    >
                      <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center shrink-0">
                        {getUserInitial(p.username)}
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-xs font-semibold truncate">{p.username}</span>
                        {p.email && (
                          <span className="text-[11px] text-slate-400 truncate">
                            {p.email}
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <Check size={15} className="text-blue-600 dark:text-blue-400" aria-hidden="true" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
