import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Image as ImageIcon, UserX } from 'lucide-react';
import type { IssueResponseDto } from '../../services/issueService';
import { StatusBadge, PriorityBadge, TypeBadge } from '../common/Badge';
import { LabelBadge } from '../labels/LabelBadge';
import './IssueList.css';

export interface IssueCardProps {
  /** I dati completi del ticket restituito dal backend */
  issue: IssueResponseDto;
  /** Callback opzionale invocata quando la card viene cliccata */
  onClick?: (issue: IssueResponseDto) => void;
  /** ID del progetto di appartenenza per la navigazione verso il dettaglio */
  projectId?: number;
  /** Classe CSS aggiuntiva per il contenitore */
  className?: string;
}

/**
 * Estrae l'iniziale maiuscola da un nome utente (es. 'M' per Marco, 'U' di fallback).
 */
function getUserInitial(name?: string | null): string {
  return name && name.trim().length > 0 ? name.trim().charAt(0).toUpperCase() : 'U';
}

/**
 * Formatta una data ISO in formato chiaro e preciso (es. '30 ago 2026').
 */
function formatDate(dateString?: string | null): string {
  if (!dateString) return '---';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Componente Atomico di Presentazione: Card Issue.
 *
 * Visualizza i dettagli chiave di una issue:
 * - Tipo, Priorità e Stato tramite Badge riutilizzabili
 * - Identificativo ticket monospace (#ISS-xxx)
 * - Titolo e anteprima descrizione
 * - Elenco etichette / labels colorate
 * - Indicatore allegato immagine
 * - Assegnatario, Creatore e Data di creazione
 */
export const IssueCard: React.FC<IssueCardProps> = ({
  issue,
  onClick,
  projectId,
  className = '',
}) => {
  const navigate = useNavigate();

  // Determina l'ID progetto effettivo
  const effectiveProjectId = issue.projectId ?? projectId;

  // Gestione del click sulla card
  const handleClick = () => {
    if (onClick) {
      onClick(issue);
    } else if (issue.id && effectiveProjectId) {
      navigate(`/projects/${effectiveProjectId}/issues/${issue.id}`);
    }
  };

  // Costruisce la classe per il bordo sinistro colorato
  const typeClass = issue.type ? `issue-card--type-${issue.type.toLowerCase()}` : '';
  const stateClass = issue.state ? `issue-card--state-${issue.state.toLowerCase()}` : '';

  const hasLabels = Boolean(issue.labels && issue.labels.length > 0);
  const hasImage = Boolean(issue.image && issue.image.trim().length > 0);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`issue-card ${typeClass} ${stateClass} ${className}`.trim()}
      aria-label={`Issue #${issue.id || '?'}: ${issue.title || 'Senza titolo'}`}
    >
      {/* Testata della Card: Badges di Stato/Tipo/Priorità & ID Ticket */}
      <div className="issue-card-header">
        <div className="issue-card-badges">
          <TypeBadge type={issue.type} size="sm" />
          <PriorityBadge priority={issue.priority} size="sm" />
          <StatusBadge status={issue.state} size="sm" />
        </div>
        <span className="issue-card-id" title={`ID Ticket: #${issue.id}`}>
          #ISS-{issue.id ?? '---'}
        </span>
      </div>

      {/* Corpo della Card: Titolo & Descrizione */}
      <div className="issue-card-body">
        <h3 className="issue-card-title" title={issue.title}>
          {issue.title || 'Senza titolo'}
        </h3>
        <p className="issue-card-description">
          {issue.description && issue.description.trim().length > 0
            ? issue.description
            : 'Nessuna descrizione fornita per questo ticket.'}
        </p>
      </div>

      {/* Sezione Tag / Etichette e Allegato */}
      {(hasLabels || hasImage) && (
        <div className="issue-card-tags">
          {hasLabels &&
            issue.labels?.map((label) => (
              <LabelBadge
                key={label.id ?? label.name}
                label={label}
                size="sm"
              />
            ))}

          {hasImage && (
            <span className="issue-card-attachment" title="Questa issue include un'immagine allegata">
              <ImageIcon size={12} aria-hidden="true" />
              <span>Allegato</span>
            </span>
          )}
        </div>
      )}

      {/* Footer della Card: Assegnatario, Autore e Data */}
      <div className="issue-card-footer">
        <div className="issue-card-users">
          {issue.assignedToUsername ? (
            <div
              className="issue-card-user"
              title={`Assegnato a: ${issue.assignedToUsername}`}
            >
              <div className="issue-card-avatar issue-card-avatar--assignee" aria-hidden="true">
                {getUserInitial(issue.assignedToUsername)}
              </div>
              <span>{issue.assignedToUsername}</span>
            </div>
          ) : (
            <div
              className="issue-card-user issue-card-user--unassigned"
              title="Nessun partecipante assegnato a questa issue"
            >
              <UserX size={13} aria-hidden="true" />
              <span>Non assegnato</span>
            </div>
          )}
        </div>

        <div className="issue-card-date">
          <Clock size={12} aria-hidden="true" />
          <span>{formatDate(issue.creationDate)}</span>
        </div>
      </div>
    </button>
  );
};
