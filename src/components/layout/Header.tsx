import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { ThemeToggle } from '../common/ThemeToggle';

/**
 * Barra superiore (Top Header).
 * Responsabilità: Visualizzazione contesto progetto attivo, ThemeToggle, Profilo Utente e Logout.
 */
export const Header: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const { selectedProject } = useProject();

  const userInitial = user?.username ? user.username.charAt(0).toUpperCase() : 'U';

  return (
    <header className="h-16 bg-white dark:bg-[#151c2c] border-b border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between px-3.5 sm:px-6 sticky top-0 z-50 transition-colors">
      {/* Sezione Sinistra: Stato Progetto Attivo */}
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>{selectedProject ? selectedProject.name : 'Nessun progetto selezionato'}</span>
        </div>
      </div>

      {/* Sezione Destra: ThemeToggle, Profilo Utente & Logout */}
      <div className="flex items-center gap-3">
        <ThemeToggle />

        <div
          className="flex items-center gap-2 py-1 pl-1.5 pr-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full"
          title={`Connesso come ${user?.username || 'Utente'}`}
        >
          <div className="w-6.5 h-6.5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
            {userInitial}
          </div>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 hidden sm:inline">
            {user?.username}
          </span>
          <span
            className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-sm ${
              isAdmin
                ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50'
                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50'
            }`}
          >
            {user?.role || 'USER'}
          </span>
        </div>

        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
          title="Disconnettiti dalla sessione"
          aria-label="Logout"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Esci</span>
        </button>
      </div>
    </header>
  );
};
