import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Image as ImageIcon, UserX } from 'lucide-react';
import type { IssueResponseDto } from '../../services/issueService';
import { StatusBadge, PriorityBadge, TypeBadge } from '../common/Badge';
import { LabelBadge } from '../labels/LabelBadge';

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

  const hasLabels = Boolean(issue.labels && issue.labels.length > 0);
  const hasImage = Boolean(issue.image && issue.image.trim().length > 0);
  const visibleLabels = issue.labels ? issue.labels.slice(0, 3) : [];
  const extraLabelsCount = (issue.labels ? issue.labels.length : 0) - visibleLabels.length;

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`group relative w-full text-left font-inherit color-inherit bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-3.5 sm:px-4 flex flex-col justify-between h-38 cursor-pointer select-none shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2 active:translate-y-0 active:shadow-xs ${className}`.trim()}
      aria-label={`Issue #${issue.id || '?'}: ${issue.title || 'Senza titolo'}`}
    >
      <div className="flex flex-col gap-1.5 w-full">
        {/* Testata della Card: Badges di Stato/Tipo/Priorità & ID Ticket */}
        <div className="flex items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-1.5 flex-wrap">
            <TypeBadge type={issue.type} size="sm" />
            <PriorityBadge priority={issue.priority} size="sm" />
            <StatusBadge status={issue.state} size="sm" />
          </div>
          <span
            className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-tight whitespace-nowrap bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-sm border border-slate-200 dark:border-slate-700"
            title={`ID Ticket: #${issue.id}`}
          >
            #ISS-{issue.id ?? '---'}
          </span>
        </div>

        {/* Corpo della Card: Titolo & Descrizione */}
        <div className="flex flex-col gap-0.5 w-full">
          <h3
            className={`text-[14px] sm:text-[15px] font-semibold leading-snug line-clamp-1 transition-colors ${
              issue.state === 'CLOSED'
                ? 'text-slate-500 dark:text-slate-400 group-hover:text-teal-600'
                : 'text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400'
            }`}
            title={issue.title}
          >
            {issue.title || 'Senza titolo'}
          </h3>
          <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-1">
            {issue.description && issue.description.trim().length > 0
              ? issue.description
              : 'Nessuna descrizione fornita per questo ticket.'}
          </p>
        </div>

        {/* Sezione Tag / Etichette e Allegato: Slot ad altezza fissa h-6 sempre presente per uniformità visiva */}
        <div className="flex items-center gap-1.5 flex-nowrap h-6 overflow-hidden">
          {hasLabels ? (
            <>
              {visibleLabels.map((label) => (
                <LabelBadge
                  key={label.id ?? label.name}
                  label={label}
                  size="sm"
                />
              ))}

              {extraLabelsCount > 0 && (
                <span
                  className="inline-flex items-center text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded-full shrink-0"
                  title={`Altre ${extraLabelsCount} etichette`}
                >
                  +{extraLabelsCount}
                </span>
              )}
            </>
          ) : (
            <span className="text-xs text-slate-400 dark:text-slate-500 italic">
              Nessuna etichetta
            </span>
          )}

          {hasImage && (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.75 py-0.75 rounded-sm shrink-0 ml-auto"
              title="Questa issue include un'immagine allegata"
            >
              <ImageIcon size={12} aria-hidden="true" />
              <span>Allegato</span>
            </span>
          )}
        </div>
      </div>

      {/* Footer della Card: Assegnatario, Autore e Data */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 w-full mt-1">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {issue.assignedToUsername ? (
            <div
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap overflow-hidden text-ellipsis"
              title={`Assegnato a: ${issue.assignedToUsername}`}
            >
              <div
                className="w-5.5 h-5.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800/50"
                aria-hidden="true"
              >
                {getUserInitial(issue.assignedToUsername)}
              </div>
              <span className="truncate">{issue.assignedToUsername}</span>
            </div>
          ) : (
            <div
              className="text-xs text-slate-400 dark:text-slate-500 italic inline-flex items-center gap-1"
              title="Nessun partecipante assegnato a questa issue"
            >
              <UserX size={13} aria-hidden="true" />
              <span>Non assegnato</span>
            </div>
          )}
        </div>

        <div className="inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap shrink-0">
          <Clock size={12} aria-hidden="true" />
          <span>{formatDate(issue.creationDate)}</span>
        </div>
      </div>
    </button>
  );
};
