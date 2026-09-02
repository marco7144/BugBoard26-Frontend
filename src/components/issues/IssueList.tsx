import React from 'react';
import { Inbox, Loader2, RotateCcw, SearchX } from 'lucide-react';
import type { IssueResponseDto } from '../../services/issueService';
import { IssueCard } from './IssueCard';

export interface IssueListProps {
  /** Array di issue da visualizzare nella griglia */
  issues?: IssueResponseDto[];
  /** Flag per indicare lo stato di caricamento dei dati */
  isLoading?: boolean;
  /** Callback invocata al click su una issue card */
  onIssueClick?: (issue: IssueResponseDto) => void;
  /** Callback opzionale per resettare i filtri quando la lista è vuota */
  onResetFilters?: () => void;
  /** Titolo personalizzato per lo stato vuoto */
  emptyTitle?: string;
  /** Descrizione personalizzata per lo stato vuoto */
  emptyDescription?: string;
  /** ID del progetto di appartenenza per la navigazione */
  projectId?: number;
  /** Classe CSS aggiuntiva per il contenitore */
  className?: string;
}

/**
 * Componente di Presentazione: Grid di Issue
 *
 * Responsabilità:
 * - Renderizza la griglia responsive di IssueCard.
 * - Gestisce lo stato di caricamento mostrando un elegante spinner rotante.
 * - Gestisce lo stato vuoto (Empty State) con icone contestuali e azione opzionale di reset filtri.
 */
export const IssueList: React.FC<IssueListProps> = ({
  issues,
  isLoading = false,
  onIssueClick,
  onResetFilters,
  emptyTitle = 'Nessuna issue trovata',
  emptyDescription = 'Non ci sono ticket corrispondenti ai filtri applicati o questo progetto non ha ancora issue registrate.',
  projectId,
  className = '',
}) => {
  // 1. Stato di Caricamento (Loading State con Spinner compatto)
  if (isLoading) {
    return (
      <div className={`w-full flex flex-col gap-4 ${className}`.trim()}>
        <output className="flex flex-col items-center justify-center p-16 bg-white dark:bg-[#151c2c] border border-slate-200 dark:border-slate-800 rounded-xl gap-4 text-center" aria-label="Caricamento issue in corso...">
          <Loader2 className="text-blue-600 dark:text-blue-500 animate-spin" size={32} aria-hidden="true" />
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Caricamento issue in corso...</span>
        </output>
      </div>
    );
  }

  // 2. Stato Vuoto (Empty State)
  if (!issues || issues.length === 0) {
    const isFilterResetAvailable = Boolean(onResetFilters);
    const EmptyIcon = isFilterResetAvailable ? SearchX : Inbox;

    return (
      <div className={`w-full flex flex-col gap-4 ${className}`.trim()}>
        <section className="flex flex-col items-center justify-center text-center p-14 bg-white dark:bg-[#151c2c] border border-dashed border-slate-200 dark:border-slate-800 rounded-xl gap-4" aria-label="Nessun ticket">
          <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center border border-slate-200 dark:border-slate-700">
            <EmptyIcon size={28} aria-hidden="true" />
          </div>

          <div className="max-w-105 flex flex-col gap-1.5">
            <h4 className="text-[17px] font-semibold text-slate-900 dark:text-slate-100 m-0">{emptyTitle}</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed m-0">{emptyDescription}</p>
          </div>

          {isFilterResetAvailable && (
            <div className="mt-2">
              <button
                type="button"
                onClick={onResetFilters}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer shadow-xs transition-all"
              >
                <RotateCcw size={14} aria-hidden="true" />
                <span>Reimposta filtri</span>
              </button>
            </div>
          )}
        </section>
      </div>
    );
  }

  // 3. Stato Normale: Griglia di Issue Cards
  return (
    <div className={`w-full flex flex-col gap-4 ${className}`.trim()}>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full list-none p-0 m-0">
        {issues.map((issue) => (
          <li key={issue.id ?? `${issue.title}-${issue.creationDate}`} className="list-none flex flex-col h-full">
            <IssueCard
              issue={issue}
              projectId={projectId}
              onClick={onIssueClick}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};
