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
    <header className="h-16 bg-white dark:bg-[#161b22] border-b border-slate-300 dark:border-slate-700 shadow-xs flex items-center justify-between px-3.5 sm:px-6 sticky top-0 z-50 transition-colors">
      {/* Sezione Sinistra: Stato Progetto Attivo */}
      <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
        <div className="inline-flex items-center gap-1.5 text-xl font-semibold text-slate-900 dark:text-slate-100 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span
            className="truncate max-w-50 sm:max-w-xs md:max-w-md lg:max-w-xl"
            title={selectedProject ? selectedProject.name : 'Nessun progetto selezionato'}
          >
            {selectedProject ? selectedProject.name : 'Nessun progetto selezionato'}
          </span>
        </div>
      </div>

      {/* Sezione Destra: ThemeToggle, Profilo Utente & Logout */}
      <div className="flex items-center gap-3">
        <ThemeToggle />

        <div
          className="flex items-center gap-2 py-1 pl-1.5 pr-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full"
          title={`Connesso come ${user?.username || 'Utente'}`}
        >
          <div
            className={`w-6.5 h-6.5 rounded-full text-white text-xs font-bold flex items-center justify-center ${
              isAdmin ? 'bg-red-600' : 'bg-blue-600'
            }`}
          >
            {userInitial}
          </div>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 hidden sm:inline">
            {user?.username}
          </span>
          <span
            className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-sm ${
              isAdmin
                ? 'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-500/50'
                : 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-500/50'
            }`}
          >
            {user?.role || 'USER'}
          </span>
        </div>

        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold text-white bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 border border-red-800 dark:border-red-400 rounded-md transition-all cursor-pointer shadow-xs"
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
