import React, { useState } from 'react';
import { RotateCcw, CheckCircle2, Loader2, Play } from 'lucide-react';
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
 * Calcola i permessi di promozione e retrocessione secondo lo State Pattern del backend.
 */
function getStatePermissions(state: string, isAssignee: boolean, isAdmin: boolean) {
  const isAuthorized = isAssignee || isAdmin;
  const canPromote = state === 'TODO' || (state === 'INPROGRESS' && isAuthorized);
  const canDemote = (state === 'INPROGRESS' && isAuthorized) || (state === 'CLOSED' && isAdmin);

  return { canPromote, canDemote };
}

/**
 * Restituisce label e motivazione per l'azione di promozione.
 */
function getPromoteInfo(state: string, canPromote: boolean) {
  if (state === 'CLOSED') {
    return { label: 'Chiudi Issue', reason: 'La issue è già chiusa e non può avanzare' };
  }
  if (state === 'TODO') {
    return { label: 'Assegna', reason: undefined };
  }
  return {
    label: 'Chiudi Issue',
    reason: canPromote ? undefined : "Solo l'assegnatario o un amministratore possono chiudere la issue",
  };
}

/**
 * Restituisce label e motivazione per l'azione di retrocessione.
 */
function getDemoteInfo(state: string, canDemote: boolean) {
  if (state === 'TODO') {
    return { label: 'Retrocedi a To Do', reason: 'La issue è già nello stato iniziale (To Do)' };
  }
  if (state === 'CLOSED') {
    return {
      label: 'Riapri Issue',
      reason: canDemote ? undefined : 'Solo un amministratore può riaprire una issue chiusa',
    };
  }
  return {
    label: 'Retrocedi a To Do',
    reason: canDemote ? undefined : "Solo l'assegnatario o un amministratore possono retrocedere la issue a To Do",
  };
}

/**
 * Componente per i Controlli di Transizione di Stato (Promuovi / Retrocedi - F9).
 * Gestisce le transizioni del Pattern State (TO-DO -> INPROGRESS -> CLOSED)
 * e applica le autorizzazioni definite nel backend.
 * Stilato interamente con utility Tailwind CSS v4 pixel-perfect.
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

  const { canPromote, canDemote } = getStatePermissions(state, isAssignee, isAdmin);
  const promoteInfo = getPromoteInfo(state, canPromote);
  const demoteInfo = getDemoteInfo(state, canDemote);

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
      {/* Pulsante Retrocedi (Demote) */}
      {state !== 'TODO' && (
        <button
          type="button"
          onClick={() => handleAction('demote')}
          disabled={!canDemote || Boolean(loadingAction)}
          title={demoteInfo.reason}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 font-sans text-sm font-medium leading-tight rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#161b22] text-slate-700 dark:text-slate-200 hover:not-disabled:bg-slate-50 dark:hover:not-disabled:bg-slate-800 hover:not-disabled:border-slate-300 dark:hover:not-disabled:border-slate-600 cursor-pointer whitespace-nowrap transition-all duration-150 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 disabled:opacity-45 disabled:cursor-not-allowed"
        >
          {isDemoteLoading ? (
            <Loader2 size={15} className="animate-spin text-blue-600 dark:text-blue-400" aria-hidden="true" />
          ) : (
            <RotateCcw size={15} aria-hidden="true" />
          )}
          <span>{demoteInfo.label}</span>
        </button>
      )}

      {/* Pulsante Promuovi (Promote) */}
      {state !== 'CLOSED' && (
        <button
          type="button"
          onClick={() => handleAction('promote')}
          disabled={!canPromote || Boolean(loadingAction)}
          title={promoteInfo.reason}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 font-sans text-sm font-medium leading-tight rounded-lg border border-blue-600 bg-blue-600 text-white hover:not-disabled:bg-blue-700 cursor-pointer whitespace-nowrap transition-all duration-150 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 disabled:opacity-45 disabled:cursor-not-allowed"
        >
          {isPromoteLoading && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
          {!isPromoteLoading && state === 'TODO' && <Play size={15} aria-hidden="true" />}
          {!isPromoteLoading && state !== 'TODO' && <CheckCircle2 size={15} aria-hidden="true" />}
          <span>{promoteInfo.label}</span>
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
