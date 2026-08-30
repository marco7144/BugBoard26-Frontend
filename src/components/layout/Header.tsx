import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { ThemeToggle } from '../common/ThemeToggle';
import './Header.css';

/**
 * Barra superiore (Top Header).
 * Responsabilità: Visualizzazione contesto progetto attivo, ThemeToggle, Profilo Utente e Logout.
 */
export const Header: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const { selectedProject } = useProject();

  const userInitial = user?.username ? user.username.charAt(0).toUpperCase() : 'U';

  return (
    <header className="header">
      {/* Sezione Sinistra: Stato Progetto Attivo */}
      <div className="header-left">
        <div className="header-project-badge">
          <span className="header-project-dot" />
          <span>{selectedProject ? selectedProject.name : 'Nessun progetto selezionato'}</span>
        </div>
      </div>

      {/* Sezione Destra: ThemeToggle, Profilo Utente & Logout */}
      <div className="header-right">
        <ThemeToggle />

        <div className="header-user-profile" title={`Connesso come ${user?.username || 'Utente'}`}>
          <div className="header-user-avatar">{userInitial}</div>
          <span className="header-username">{user?.username}</span>
          <span className={`badge ${isAdmin ? 'badge-danger' : 'badge-info'}`}>
            {user?.role || 'USER'}
          </span>
        </div>

        <button
          type="button"
          onClick={logout}
          className="btn btn-secondary btn-sm"
          title="Disconnettiti dalla sessione"
          aria-label="Logout"
        >
          <LogOut size={16} />
          <span className="header-logout-text">Esci</span>
        </button>
      </div>
    </header>
  );
};
