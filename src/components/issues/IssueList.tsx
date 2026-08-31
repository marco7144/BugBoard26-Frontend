import React from 'react';
import { Inbox, Loader2, RotateCcw, SearchX } from 'lucide-react';
import type { IssueResponseDto } from '../../services/issueService';
import { IssueCard } from './IssueCard';
import './IssueList.css';

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
      <div className={`issue-list-container ${className}`.trim()}>
        <output className="issue-loading-state" aria-label="Caricamento issue in corso...">
          <Loader2 className="issue-loading-spinner" size={32} aria-hidden="true" />
          <span className="issue-loading-text">Caricamento issue in corso...</span>
        </output>
      </div>
    );
  }

  // 2. Stato Vuoto (Empty State)
  if (!issues || issues.length === 0) {
    const isFilterResetAvailable = Boolean(onResetFilters);
    const EmptyIcon = isFilterResetAvailable ? SearchX : Inbox;

    return (
      <div className={`issue-list-container ${className}`.trim()}>
        <section className="issue-empty-state" aria-label="Nessun ticket">
          <div className="issue-empty-icon-wrapper">
            <EmptyIcon size={28} aria-hidden="true" />
          </div>

          <div className="issue-empty-content">
            <h4 className="issue-empty-title">{emptyTitle}</h4>
            <p className="issue-empty-description">{emptyDescription}</p>
          </div>

          {isFilterResetAvailable && (
            <div className="issue-empty-action">
              <button
                type="button"
                onClick={onResetFilters}
                className="btn btn-secondary btn-sm"
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
    <div className={`issue-list-container ${className}`.trim()}>
      <ul className="issue-grid">
        {issues.map((issue) => (
          <li key={issue.id ?? `${issue.title}-${issue.creationDate}`} className="issue-grid-item">
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
