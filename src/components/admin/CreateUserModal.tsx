import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, UserPlus, X } from 'lucide-react';
import { authService, type UserRequestDto } from '../../services/authService';

export interface CreateUserModalProps {
  /** Indica se la finestra modale è visibile */
  isOpen: boolean;
  /** Callback per chiudere la modale */
  onClose: () => void;
  /** Callback opzionale invocata al completamento della registrazione */
  onUserCreated?: () => void;
}

const DEFAULT_FORM_STATE: UserRequestDto = {
  username: '',
  email: '',
  password: '',
  type: 'BASEUSER',
};

/**
 * Modale di Registrazione Nuovo Utente (Step 27 - Fase 7)
 *
 * Responsabilità:
 * - Form per la creazione di un nuovo utente con ruolo BASEUSER o ADMIN.
 * - Invoca `authService.createUser` e notifica il genitore per aggiornare la tabella.
 */
export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onUserCreated,
}) => {
  const [formData, setFormData] = useState<UserRequestDto>(DEFAULT_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    setFormData(DEFAULT_FORM_STATE);
    setError(null);
    onClose();
  }, [isSubmitting, onClose]);

  // Gestione tasto ESC per chiudere il modale
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        handleClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSubmitting, handleClose]);

  // Gestione click esterno al contenitore per chiudere il modale
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        isOpen &&
        !isSubmitting &&
        modalContainerRef.current &&
        !modalContainerRef.current.contains(e.target as Node)
      ) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, isSubmitting, handleClose]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await authService.createUser(formData);
      setFormData(DEFAULT_FORM_STATE);
      onUserCreated?.();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Errore durante la registrazione dell\'utente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <dialog
      className="fixed inset-0 z-1000 flex items-center justify-center w-screen h-screen max-w-none max-h-none m-0 p-4 border-none bg-black/30 backdrop-blur-xs box-border"
      open
      aria-labelledby="create-user-modal-title"
      aria-modal="true"
    >
      <div
        ref={modalContainerRef}
        className="w-full max-w-md bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header Modale */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
            <UserPlus size={18} className="text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <h2 id="create-user-modal-title" className="text-base font-bold m-0">Registra Nuovo Utente</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
            aria-label="Chiudi modale"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form di Creazione */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {error && (
            <div
              role="alert"
              className="p-3 text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-lg"
            >
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="create-user-username"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Username *
            </label>
            <input
              id="create-user-username"
              required
              minLength={3}
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0d1117] border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-slate-500 dark:focus:border-slate-400 text-slate-900 dark:text-slate-100"
              placeholder="es. mario.rossi"
            />
          </div>

          <div>
            <label
              htmlFor="create-user-email"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Email *
            </label>
            <input
              id="create-user-email"
              required
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0d1117] border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-slate-500 dark:focus:border-slate-400 text-slate-900 dark:text-slate-100"
              placeholder="es. mario.rossi@bugboard.it"
            />
          </div>

          <div>
            <label
              htmlFor="create-user-password"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Password *
            </label>
            <input
              id="create-user-password"
              required
              minLength={4}
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0d1117] border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-slate-500 dark:focus:border-slate-400 text-slate-900 dark:text-slate-100"
              placeholder="Minimo 4 caratteri"
            />
          </div>

          <div>
            <label
              htmlFor="create-user-type"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Ruolo *
            </label>
            <select
              id="create-user-type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'ADMIN' | 'BASEUSER' })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0d1117] border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-slate-500 dark:focus:border-slate-400 text-slate-900 dark:text-slate-100 cursor-pointer"
            >
              <option value="BASEUSER">Standard User</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>

          {/* Footer Azioni */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-[#21262d] border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 hover:border-slate-400 dark:hover:border-slate-600 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:opacity-50 rounded-lg transition-all cursor-pointer shadow-xs"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
              <span>{isSubmitting ? 'Registrazione...' : 'Registra Utente'}</span>
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
};

