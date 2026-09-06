import React, { useState } from 'react';
import { RotateCcw, CheckCircle2, Loader2 } from 'lucide-react';
import type { IssueResponseDto } from '../../services/issueService';
import { issueService } from '../../services/issueService';
import { useAuth } from '../../context/AuthContext';

export interface IssueStateActionsProps {
  /** I dati della issue corrente */
  issue: IssueResponseDto;
  /** ID facoltativo del progetto di appartenenza (se non presente dentro issue.projectId) */
  projectId?: number;
  /** Callback invocata dopo il successo di una transizione di stato */
  onStateChanged?: (updatedIssue: IssueResponseDto) => void;
  /** Classe CSS aggiuntiva per il contenitore */
  className?: string;
}

/**
 * Componente per i Controlli di Transizione di Stato (F9).
 * - TO-DO: nessun pulsante (l'avanzamento a INPROGRESS avviene all'assegnazione da parte dell'Admin).
 * - INPROGRESS: "Chiudi Issue" visibile ad Assegnatario o Admin; "Retrocedi a To Do" visibile solo ad Admin.
 * - CLOSED: "Riapri Issue" visibile solo ad Admin.
 * - Se nessuna azione è consentita all'utente corrente, non renderizza nulla.
 */
export const IssueStateActions: React.FC<IssueStateActionsProps> = ({
  issue,
  projectId,
  onStateChanged,
  className = '',
}) => {
  const { user, isAdmin } = useAuth();
  const [loadingAction, setLoadingAction] = useState<'promote' | 'demote' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const effectiveProjectId = issue.projectId ?? projectId;
  const isAssignee = Boolean(user && issue.assignedToId && issue.assignedToId === user.id);
  const state = issue.state || 'TODO';

  // Determinazione della visibilità dei pulsanti secondo le regole di business
  const canClose = state === 'INPROGRESS' && (isAssignee || isAdmin);
  const canDemoteToTodo = state === 'INPROGRESS' && isAdmin;
  const canReopen = state === 'CLOSED' && isAdmin;

  // Se l'utente non ha permessi per nessuna transizione, non renderizzare nulla
  if (!canClose && !canDemoteToTodo && !canReopen && !errorMessage) {
    return null;
  }

  const handleAction = async (action: 'promote' | 'demote') => {
    if (!issue.id || !effectiveProjectId || loadingAction) return;

    setLoadingAction(action);
    setErrorMessage(null);

    try {
      const apiCall = action === 'promote' ? issueService.promoteIssue : issueService.demoteIssue;
      const updated = await apiCall(effectiveProjectId, issue.id);
      onStateChanged?.(updated);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Operazione di cambio stato non riuscita.');
    } finally {
      setLoadingAction(null);
    }
  };

  const isPromoteLoading = loadingAction === 'promote';
  const isDemoteLoading = loadingAction === 'demote';

  return (
    <div className={`inline-flex items-center gap-2 flex-wrap ${className}`.trim()}>
      {/* Pulsante Retrocedi a To Do (solo Admin in INPROGRESS) */}
      {canDemoteToTodo && (
        <button
          type="button"
          onClick={() => handleAction('demote')}
          disabled={Boolean(loadingAction)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 font-sans text-sm font-medium leading-tight rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#161b22] text-slate-700 dark:text-slate-200 hover:not-disabled:bg-slate-50 dark:hover:not-disabled:bg-slate-800 hover:not-disabled:border-slate-300 dark:hover:not-disabled:border-slate-600 cursor-pointer whitespace-nowrap transition-all duration-150 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 disabled:opacity-45 disabled:cursor-not-allowed"
        >
          {isDemoteLoading ? (
            <Loader2 size={15} className="animate-spin text-blue-600 dark:text-blue-400" aria-hidden="true" />
          ) : (
            <RotateCcw size={15} aria-hidden="true" />
          )}
          <span>Retrocedi a To Do</span>
        </button>
      )}

      {/* Pulsante Riapri Issue (solo Admin in CLOSED) */}
      {canReopen && (
        <button
          type="button"
          onClick={() => handleAction('demote')}
          disabled={Boolean(loadingAction)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 font-sans text-sm font-medium leading-tight rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#161b22] text-slate-700 dark:text-slate-200 hover:not-disabled:bg-slate-50 dark:hover:not-disabled:bg-slate-800 hover:not-disabled:border-slate-300 dark:hover:not-disabled:border-slate-600 cursor-pointer whitespace-nowrap transition-all duration-150 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 disabled:opacity-45 disabled:cursor-not-allowed"
        >
          {isDemoteLoading ? (
            <Loader2 size={15} className="animate-spin text-blue-600 dark:text-blue-400" aria-hidden="true" />
          ) : (
            <RotateCcw size={15} aria-hidden="true" />
          )}
          <span>Riapri Issue</span>
        </button>
      )}

      {/* Pulsante Chiudi Issue (Assegnatario o Admin in INPROGRESS) */}
      {canClose && (
        <button
          type="button"
          onClick={() => handleAction('promote')}
          disabled={Boolean(loadingAction)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 font-sans text-sm font-medium leading-tight rounded-lg border border-blue-600 bg-blue-600 text-white hover:not-disabled:bg-blue-700 cursor-pointer whitespace-nowrap transition-all duration-150 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 disabled:opacity-45 disabled:cursor-not-allowed"
        >
          {isPromoteLoading ? (
            <Loader2 size={15} className="animate-spin" aria-hidden="true" />
          ) : (
            <CheckCircle2 size={15} aria-hidden="true" />
          )}
          <span>Chiudi Issue</span>
        </button>
      )}

      {errorMessage && (
        <span className="text-xs text-red-600 dark:text-red-400 font-medium">
          {errorMessage}
        </span>
      )}
    </div>
  );
};
