import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Bug, LayoutDashboard, Users, FolderKanban, Plus, Tag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { CreateProjectModal } from '../projects/CreateProjectModal';
import { ProjectParticipantsModal } from '../projects/ProjectParticipantsModal';
import { LabelManagerModal } from '../labels/LabelManagerModal';
import './Sidebar.css';

/**
 * Barra di navigazione laterale (Sidebar).
 * Responsabilità: Branding, Selettore Progetto Attivo, Trigger Modali Progetto, Gestione Etichette e Link di Navigazione Principale.
 */
export const Sidebar: React.FC = () => {
  const { isAdmin } = useAuth();
  const { selectedProject, projects, selectProjectById } = useProject();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState<boolean>(false);
  const [isLabelsModalOpen, setIsLabelsModalOpen] = useState<boolean>(false);

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

          {/* Azioni Progetto: Partecipanti & Nuovo Progetto */}
          <div className="sidebar-project-actions">
            {selectedProject && (
              <button
                type="button"
                className="btn btn-outline btn-sm sidebar-project-btn sidebar-project-btn-participants"
                onClick={() => setIsParticipantsModalOpen(true)}
                title="Visualizza e gestisci i partecipanti del progetto"
              >
                <Users size={14} />
                <span>Partecipanti</span>
              </button>
            )}

            {isAdmin && (
              <button
                type="button"
                className="btn btn-outline btn-sm sidebar-project-btn sidebar-project-btn-create"
                onClick={() => setIsCreateModalOpen(true)}
                title="Crea un nuovo progetto"
              >
                <Plus size={14} />
                <span>Nuovo Progetto</span>
              </button>
            )}
          </div>
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

          <button
            type="button"
            className="sidebar-link sidebar-btn-action"
            onClick={() => setIsLabelsModalOpen(true)}
            title="Gestione Globale Etichette"
          >
            <Tag size={18} />
            <span>Etichette</span>
          </button>

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

      {/* Finestra Modale Gestione Partecipanti Progetto */}
      {selectedProject && (
        <ProjectParticipantsModal
          isOpen={isParticipantsModalOpen}
          onClose={() => setIsParticipantsModalOpen(false)}
        />
      )}

      {/* Finestra Modale Gestione Etichette */}
      <LabelManagerModal
        isOpen={isLabelsModalOpen}
        onClose={() => setIsLabelsModalOpen(false)}
      />
    </>
  );
};
