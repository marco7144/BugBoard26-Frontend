import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Bug, LayoutDashboard, Users, FolderKanban, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { CreateProjectModal } from '../projects/CreateProjectModal';
import './Sidebar.css';

/**
 * Barra di navigazione laterale (Sidebar).
 * Responsabilità: Branding, Selettore Progetto Attivo, Trigger Modali Progetto e Link di Navigazione Principale.
 */
export const Sidebar: React.FC = () => {
  const { isAdmin } = useAuth();
  const { selectedProject, projects, selectProjectById } = useProject();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const projectId = Number(e.target.value);
    if (!Number.isNaN(projectId)) {
      selectProjectById(projectId);
    }
  };

  return (
    <>
      <aside className="sidebar">
        {/* 1. Branding */}
        <Link to="/" className="sidebar-brand" title="BugBoard26 Home">
          <div className="sidebar-brand-icon">
            <Bug size={18} />
          </div>
          <span>BugBoard26</span>
        </Link>

        {/* 2. Selettore Progetto Attivo & Azioni */}
        <div className="sidebar-project-card">
          <div className="sidebar-project-header">
            <FolderKanban size={14} />
            <span>Progetto Attivo</span>
          </div>
          <select
            className="sidebar-project-select"
            value={selectedProject?.id ?? ''}
            onChange={handleProjectChange}
            aria-label="Seleziona Progetto Attivo"
          >
            {projects.length === 0 ? (
              <option value="" disabled>
                Nessun progetto
              </option>
            ) : (
              projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.name}
                </option>
              ))
            )}
          </select>

          {isAdmin && (
            <button
              type="button"
              className="btn btn-outline btn-sm sidebar-project-btn"
              onClick={() => setIsCreateModalOpen(true)}
              title="Crea un nuovo progetto"
            >
              <Plus size={15} />
              <span>Nuovo Progetto</span>
            </button>
          )}
        </div>

        {/* 3. Link di Navigazione */}
        <nav className="sidebar-nav" aria-label="Navigazione Principale">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title="Dashboard Issue"
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          {isAdmin && (
            <NavLink
              to="/admin/users"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              title="Gestione Utenti (Riservato agli Amministratori)"
            >
              <Users size={18} />
              <span>Utenti</span>
            </NavLink>
          )}
        </nav>
      </aside>

      {/* Finestra Modale Creazione Progetto (Admin) */}
      {isAdmin && (
        <CreateProjectModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}
    </>
  );
};
