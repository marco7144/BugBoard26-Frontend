import React, { useState } from 'react';
import { Send, Loader2, AlertCircle } from 'lucide-react';
import { commentService } from '../../services/commentService';
import type { CommentResponseDto } from '../../services/commentService';
import { useAuth } from '../../context/AuthContext';

export interface CommentInputProps {
  /** ID del progetto contenitore */
  projectId: number;
  /** ID della issue a cui aggiungere il commento */
  issueId: number;
  /** Callback invocata con successo dopo l'aggiunta del commento */
  onCommentAdded: (newComment: CommentResponseDto) => void;
  /** Disabilita il form */
  disabled?: boolean;
  /** Classe CSS aggiuntiva */
  className?: string;
}

/**
 * Componente Form per l'invio di un nuovo commento a una Issue (F5).
 * Rispetta il principio KISS: stato essenziale, semantica HTML5 e invio rapido con Ctrl+Enter.
 * Stilato interamente con utility Tailwind CSS v4.
 */
export const CommentInput: React.FC<CommentInputProps> = ({
  projectId,
  issueId,
  onCommentAdded,
  disabled = false,
  className = '',
}) => {
  const { user } = useAuth();
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || isSubmitting || disabled) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const created = await commentService.addComment(projectId, issueId, { body: trimmed });
      setBody('');
      onCommentAdded(created);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Errore durante l'invio del commento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const userInitial = user?.username ? user.username.charAt(0).toUpperCase() : 'U';

  return (
    <form
      className={`flex flex-col gap-3 bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs mt-2 ${className}`.trim()}
      onSubmit={handleSubmit}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8.5 h-8.5 rounded-full bg-blue-600 dark:bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0 border border-blue-700 dark:border-blue-500">
          {userInitial}
        </div>
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {user?.username ?? 'Il tuo commento'}
        </span>
      </div>

      <textarea
        className="w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-md resize-y min-h-20 focus:outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-[#161b22] focus:ring-3 focus:ring-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all font-sans"
        placeholder="Scrivi un commento... (Ctrl + Invio per inviare)"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled || isSubmitting}
        rows={3}
        maxLength={255}
        required
      />

      {error && (
        <div
          className="flex items-center gap-2 px-3 py-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-md"
          role="alert"
        >
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-3">
        <span className="text-xs text-slate-500 dark:text-slate-400 self-start sm:self-auto">
          Premi Ctrl + Invio per inviare
        </span>
        <button
          type="submit"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none rounded-md transition-all cursor-pointer font-sans"
          disabled={disabled || isSubmitting || !body.trim()}
        >
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          <span>{isSubmitting ? 'Invio in corso...' : 'Commenta'}</span>
        </button>
      </div>
    </form>
  );
};
