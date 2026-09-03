import React, { useEffect, useState, useMemo } from 'react';
import { UserPlus, ChevronLeft, ChevronRight, Search, Users } from 'lucide-react';
import { UserTable } from '../components/admin/UserTable';
import { CreateUserModal } from '../components/admin/CreateUserModal';
import { userService, type UserResponseDto } from '../services/userService';

/** Numero di utenti visualizzati per pagina (identico al valore 6 della Dashboard) */
const ITEMS_PER_PAGE = 8;

/**
 * Calcola i numeri di pagina con finestra mobile ed ellissi (identico a DashboardPage).
 */
function getPageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, 4, 'ellipsis-right', total];
  if (current >= total - 2) return [1, 'ellipsis-left', total - 3, total - 2, total - 1, total];
  return [1, 'ellipsis-left', current - 1, current, current + 1, 'ellipsis-right', total];
}

/**
 * Pagina di Amministrazione Utenti (/admin/users)
 *
 * Responsabilità:
 * - Vista protetta riservata agli utenti con ruolo ADMIN.
 * - Recupera l'elenco degli utenti registrati tramite `userService.getAllUsers()`.
 * - Fornisce ricerca testuale e paginazione client-side identica a DashboardPage (6 elementi per pagina).
 * - Renderizza la tabella `UserTable` e permette di registrare nuovi utenti con `CreateUserModal`.
 */
export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const reloadUsers = () => {
    setIsLoading(true);
    userService
      .getAllUsers()
      .then((data) => {
        setUsers(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('Errore durante il recupero degli utenti:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    let isMounted = true;

    userService
      .getAllUsers()
      .then((data) => {
        if (isMounted) {
          setUsers(Array.isArray(data) ? data : []);
        }
      })
      .catch((err) => {
        console.error('Errore durante il recupero degli utenti:', err);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Filtro in memoria per username, email, ID o ruolo
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase().trim();
    return users.filter(
      (u) =>
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        String(u.id).includes(q) ||
        u.type?.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  // Calcolo totale pagine
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));

  // Slice paginato per la pagina corrente
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12 box-border">
      {/* 1. Header della Vista & Azioni */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 rounded-full">
              <Users size={12} aria-hidden="true" />
              <span>{users.length} {users.length === 1 ? 'utente registrato' : 'utenti registrati'}</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 dark:text-slate-100 m-0">
            Gestione Utenti
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 m-0">
            Elenco e amministrazione degli account abilitati all'accesso sul sistema.
          </p>
        </div>

        {/* Barra di Ricerca e Bottone Nuovo Utente */}
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cerca utente o email..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white dark:bg-[#161b22] border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-slate-500 dark:focus:border-slate-400 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 border border-emerald-800 dark:border-emerald-400 rounded-lg cursor-pointer shadow-xs transition-all shrink-0"
            title="Registra un nuovo account"
          >
            <UserPlus size={16} aria-hidden="true" />
            <span>Nuovo Utente</span>
          </button>
        </div>
      </header>

      {/* 2. Tabella Utenti (Paginata) */}
      <UserTable users={paginatedUsers} isLoading={isLoading} />

      {/* 3. Controlli di Paginazione */}
      {totalPages > 1 && (
        <nav
          className="flex items-center justify-center gap-3 pt-5 mt-2 border-t border-slate-200 dark:border-slate-800 flex-wrap"
          aria-label="Paginazione utenti"
        >
          <button
            type="button"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-[#21262d] border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shadow-xs"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            aria-label="Pagina precedente"
          >
            <ChevronLeft size={16} />
            <span>Precedente</span>
          </button>

          <div className="flex items-center gap-1.5">
            {getPageNumbers(currentPage, totalPages).map((item) =>
              typeof item === 'number' ? (
                <button
                  key={item}
                  type="button"
                  className={`inline-flex items-center justify-center min-w-8.5 h-8.5 px-2 text-sm rounded-lg cursor-pointer transition-all ${
                    item === currentPage
                      ? 'bg-slate-100 dark:bg-slate-800 border border-slate-400 dark:border-slate-500 text-slate-950 dark:text-white font-bold shadow-xs ring-1 ring-slate-400/40 dark:ring-slate-500/40'
                      : 'text-slate-600 dark:text-slate-300 bg-white dark:bg-[#21262d] border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 font-medium'
                  }`}
                  onClick={() => setCurrentPage(item)}
                  aria-label={`Pagina ${item}`}
                  aria-current={item === currentPage ? 'page' : undefined}
                >
                  {item}
                </button>
              ) : (
                <span
                  key={item}
                  className="inline-flex items-center justify-center min-w-6 text-slate-400 dark:text-slate-500 text-sm select-none"
                  aria-hidden="true"
                >
                  ...
                </span>
              )
            )}
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-[#21262d] border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shadow-xs"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            aria-label="Pagina successiva"
          >
            <span>Successiva</span>
            <ChevronRight size={16} />
          </button>
        </nav>
      )}

      {/* 4. Modale di Registrazione Nuovo Utente */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onUserCreated={reloadUsers}
      />
    </div>
  );
};
