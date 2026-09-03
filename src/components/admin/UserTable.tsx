import React from 'react';
import { Loader2, Shield, Users } from 'lucide-react';
import type { UserResponseDto } from '../../services/userService';

export interface UserTableProps {
  /** Elenco degli utenti registrati da visualizzare */
  users?: UserResponseDto[];
  /** Flag di caricamento dati */
  isLoading?: boolean;
  /** Classe CSS opzionale per il contenitore */
  className?: string;
}

/**
 * Componente di Presentazione: Tabella Utenti (Step 26 - Fase 7)
 *
 * Responsabilità:
 * - Renderizza l'elenco degli utenti registrati in formato tabellare responsive (Tailwind CSS).
 * - Mostra ID (#id), Avatar con iniziale, Username, Email e Badge Ruolo (ADMIN / USER).
 * - Gestisce in modo minimale lo stato di caricamento e lo stato vuoto (KISS).
 */
export const UserTable: React.FC<UserTableProps> = ({
  users,
  isLoading = false,
  className = '',
}) => {
  // 1. Stato di Caricamento
  if (isLoading) {
    return (
      <div
        className={`w-full p-12 flex flex-col items-center justify-center gap-3 bg-white dark:bg-[#161b22] border border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 ${className}`.trim()}
      >
        <Loader2 className="animate-spin text-slate-700 dark:text-slate-300" size={28} aria-hidden="true" />
        <p className="text-sm font-medium">Caricamento utenti in corso...</p>
      </div>
    );
  }

  // 2. Stato Vuoto (Nessun utente trovato)
  if (!users || users.length === 0) {
    return (
      <div
        className={`w-full p-12 flex flex-col items-center justify-center gap-2 bg-white dark:bg-[#161b22] border border-slate-300 dark:border-slate-700 rounded-xl text-center text-slate-500 dark:text-slate-400 ${className}`.trim()}
      >
        <Users size={32} className="opacity-50" aria-hidden="true" />
        <p className="text-sm font-medium">Nessun utente registrato trovato.</p>
      </div>
    );
  }

  // 3. Tabella Utenti
  return (
    <div
      className={`w-full bg-white dark:bg-[#161b22] border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden shadow-xs ${className}`.trim()}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-20">
                ID
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Utente
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Email
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Ruolo
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
            {users.map((u) => {
              const isAdmin = u.type === 'ADMIN';
              const initial = u.username ? u.username.charAt(0).toUpperCase() : 'U';

              return (
                <tr
                  key={u.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                    #{u.id}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 select-none border ${
                          isAdmin
                            ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-300 dark:border-red-500/40'
                            : 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-500/40'
                        }`}
                        aria-hidden="true"
                      >
                        {initial}
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {u.username}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">
                    {u.email || '-'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded ${
                        isAdmin
                          ? 'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-500/50'
                          : 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-500/50'
                      }`}
                      title={`Ruolo di sistema: ${u.type || (isAdmin ? 'ADMIN' : 'USER')}`}
                    >
                      {isAdmin && <Shield size={11} aria-hidden="true" className="shrink-0" />}
                      <span>{u.type || (isAdmin ? 'ADMIN' : 'USER')}</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
