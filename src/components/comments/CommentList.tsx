import React from 'react';
import { MessageSquare, Loader2 } from 'lucide-react';
import type { CommentResponseDto } from '../../services/commentService';

export interface CommentListProps {
  /** Elenco dei commenti associati alla issue */
  comments: CommentResponseDto[];
  /** Flag di caricamento in corso */
  isLoading?: boolean;
  /** Titolo personalizzato per la sezione (default: "Attività & Commenti") */
  title?: string;
  /** Classe CSS aggiuntiva */
  className?: string;
}

/**
 * Formatta una data ISO in stringa leggibile giorno/mese/anno ore:minuti (es. "30 ago 2026, 15:45").
 * Usa le API native JS senza librerie esterne nel rispetto del principio KISS.
 */
function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '---';
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime())
    ? dateStr
    : d.toLocaleString('it-IT', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
}

/**
 * Componente di Presentazione: Cronologia Commenti Issue (F5).
 * Visualizza il feed ordinato dei commenti con avatar, autore, data e testo.
 * Stilato interamente con classi utility Tailwind CSS v4.
 */
export const CommentList: React.FC<CommentListProps> = ({
  comments,
  isLoading = false,
  title = 'Attività & Commenti',
  className = '',
}) => {
  if (isLoading) {
    return (
      <div
        className={`flex flex-col items-center justify-center py-8 px-4 text-center bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 dark:text-slate-400 gap-2 ${className}`.trim()}
      >
        <Loader2 size={24} className="animate-spin text-blue-600 dark:text-blue-400" aria-hidden="true" />
        <p className="text-sm">Caricamento commenti in corso...</p>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center py-8 px-4 text-center bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 dark:text-slate-400 gap-1.5 ${className}`.trim()}
      >
        <MessageSquare size={32} className="text-slate-400 dark:text-slate-500 opacity-60 mb-1" aria-hidden="true" />
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Nessun commento</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Non ci sono ancora commenti per questa issue. Sii il primo a commentare!
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-4 w-full ${className}`.trim()}>
      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 m-0">{title}</h3>
        <span
          className="inline-flex items-center justify-center min-w-5.5 h-5.5 px-1.5 text-xs font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
          title={`${comments.length} commenti presenti`}
        >
          {comments.length}
        </span>
      </div>

      <div className="flex flex-col gap-3.5">
        {comments.map((comment) => {
          const initial = comment.creatorUsername
            ? comment.creatorUsername.trim().charAt(0).toUpperCase()
            : 'U';

          return (
            <div
              key={comment.id ?? `${comment.creatorUsername}-${comment.date}`}
              className="flex items-start gap-3"
            >
              <div
                className="w-8.5 h-8.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold text-sm flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-800"
                aria-hidden="true"
              >
                {initial}
              </div>
              <div className="flex-1 bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-lg p-3 sm:p-3.5 shadow-xs min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {comment.creatorUsername ?? 'Utente sconosciuto'}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                    {formatDate(comment.date)}
                  </span>
                </div>
                <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap wrap-anywhere">
                  {comment.body}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
