import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Bug, LayoutDashboard, Users, FolderKanban, Plus, Tag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { CreateProjectModal } from '../projects/CreateProjectModal';
import { ProjectParticipantsModal } from '../projects/ProjectParticipantsModal';
import { LabelManagerModal } from '../labels/LabelManagerModal';

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
      <aside className="w-17 md:w-62.5 h-screen sticky top-0 bg-white dark:bg-[#151c2c] border-r border-slate-200 dark:border-slate-800 flex flex-col py-3.5 px-2 md:py-5 md:px-3.5 gap-4 shrink-0 transition-colors">
        {/* 1. Branding */}
        <Link
          to="/"
          className="flex items-center gap-2.5 font-bold text-[1.15rem] text-blue-600 dark:text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 p-[4px_6px] select-none transition-colors"
          title="BugBoard26 Home"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center shrink-0">
            <Bug size={18} />
          </div>
          <span className="hidden md:inline">BugBoard26</span>
        </Link>

        {/* 2. Selettore Progetto Attivo & Azioni */}
        <div className="bg-slate-100/70 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 md:p-[10px_12px] flex flex-col gap-2">
          <div className="flex items-center justify-center md:justify-start gap-1.5 text-[0.72rem] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <FolderKanban size={14} className="shrink-0" />
            <span className="hidden md:inline">Progetto Attivo</span>
          </div>
          <select
            className="hidden md:block w-full px-2 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e293b] text-slate-900 dark:text-slate-100 font-semibold text-sm outline-none cursor-pointer focus:border-blue-600 dark:focus:border-blue-500 transition-colors"
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
          <div className="hidden md:flex flex-col gap-1.5">
            {selectedProject && (
              <button
                type="button"
                className="w-full inline-flex items-center justify-center gap-1.5 px-2 py-1.5 text-[13px] font-semibold rounded-md border border-solid border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1e293b] text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-600 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer select-none whitespace-nowrap"
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
                className="w-full inline-flex items-center justify-center gap-1.5 px-2 py-1.5 text-[13px] font-semibold rounded-md border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1e293b] text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-600 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer select-none whitespace-nowrap"
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
        <nav className="flex flex-col gap-1 flex-1" aria-label="Navigazione Principale">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center justify-center md:justify-start gap-2.5 p-2.5 md:px-3 md:py-2.25 rounded-lg text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
              }`
            }
            title="Dashboard Issue"
          >
            <LayoutDashboard size={18} className="shrink-0" />
            <span className="hidden md:inline">Dashboard</span>
          </NavLink>

          <button
            type="button"
            className="w-full flex items-center justify-center md:justify-start gap-2.5 p-2.5 md:px-3 md:py-2.25 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-all duration-150 cursor-pointer text-left"
            onClick={() => setIsLabelsModalOpen(true)}
            title="Gestione Globale Etichette"
          >
            <Tag size={18} className="shrink-0" />
            <span className="hidden md:inline">Etichette</span>
          </button>

          {isAdmin && (
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                `flex items-center justify-center md:justify-start gap-2.5 p-2.5 md:px-3 md:py-2.25 rounded-lg text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                }`
              }
              title="Gestione Utenti (Riservato agli Amministratori)"
            >
              <Users size={18} className="shrink-0" />
              <span className="hidden md:inline">Utenti</span>
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
