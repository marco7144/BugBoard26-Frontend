import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Bug, LayoutDashboard, Users, FolderKanban, Plus, Tag, ChevronDown, Check } from 'lucide-react';
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
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState<boolean>(false);
  const projectDropdownRef = useRef<HTMLDivElement>(null);

  // Chiudi la tendina al click esterno o pressione di Escape
  useEffect(() => {
    if (!isProjectDropdownOpen) return;

    const handleEvents = (e: MouseEvent | KeyboardEvent) => {
      if (
        (e instanceof MouseEvent && projectDropdownRef.current && !projectDropdownRef.current.contains(e.target as Node)) ||
        (e instanceof KeyboardEvent && e.key === 'Escape')
      ) {
        setIsProjectDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleEvents);
    document.addEventListener('keydown', handleEvents);
    return () => {
      document.removeEventListener('mousedown', handleEvents);
      document.removeEventListener('keydown', handleEvents);
    };
  }, [isProjectDropdownOpen]);

  return (
    <>
      <aside className="w-17 md:w-62.5 h-screen sticky top-0 bg-white dark:bg-[#161b22] border-r border-slate-300 dark:border-slate-700 flex flex-col py-3.5 px-2 md:py-5 md:px-3.5 gap-4 shrink-0 transition-colors">
        {/* 1. Branding */}
        <Link
          to="/"
          className="flex items-center gap-2.5 font-bold text-[1.15rem] text-slate-900 dark:text-slate-100 hover:text-slate-500 dark:hover:text-slate-400 p-[4px_6px] select-none transition-colors"
          title="BugBoard26 Home"
        >
          <div className="w-8 h-8 rounded-lg bg-none dark:bg-[#161b22] text-slate-900 dark:text-slate-100 flex items-center justify-center shrink-0">
            <Bug size={23} />
          </div>
          <span className="hidden md:inline">BugBoard26</span>
        </Link>

        {/* 2. Selettore Progetto Attivo & Azioni */}
        <div className="bg-slate-100/70 dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 md:p-[10px_12px] flex flex-col gap-2">
          <div className="flex items-center justify-center md:justify-start gap-1.5 text-[0.72rem] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <FolderKanban size={14} className="shrink-0" />
            <span className="hidden md:inline">Progetto Attivo</span>
          </div>
          {/* Menu a tendina personalizzato Progetti (con limite altezza max-h-55 e scrollbar) */}
          <div className="relative hidden md:block" ref={projectDropdownRef}>
            <button
              type="button"
              disabled={projects.length === 0}
              className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md border bg-white dark:bg-[#21262d] text-slate-900 dark:text-slate-100 font-semibold text-sm outline-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-colors ${
                isProjectDropdownOpen
                  ? 'border-blue-600 dark:border-blue-500 ring-2 ring-blue-600/15 dark:ring-blue-500/25'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
              onClick={() => setIsProjectDropdownOpen((prev) => !prev)}
              aria-haspopup="listbox"
              aria-expanded={isProjectDropdownOpen}
              aria-label="Seleziona Progetto Attivo"
            >
              <span className="truncate text-left">
                {selectedProject?.name ?? (projects.length === 0 ? 'Nessun progetto' : 'Seleziona progetto')}
              </span>
              <ChevronDown
                size={14}
                className={`text-slate-400 dark:text-slate-500 shrink-0 transition-transform duration-150 ${
                  isProjectDropdownOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
                }`}
              />
            </button>

            {isProjectDropdownOpen && projects.length > 0 && (
              <div
                className="absolute top-[calc(100%+4px)] left-0 w-full max-h-55 overflow-y-auto overscroll-contain bg-white dark:bg-[#21262d] border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg z-50 p-1 flex flex-col gap-0.5"
                role="listbox"
              >
                {projects.map((proj) => {
                  const isSelected = selectedProject?.id === proj.id;
                  return (
                    <button
                      key={proj.id}
                      type="button"
                      className={`flex items-center justify-between gap-2 w-full px-2.5 py-1.75 text-[13px] rounded-md text-left cursor-pointer select-none transition-colors border-none bg-transparent ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400'
                      }`}
                      onClick={() => {
                        selectProjectById(proj.id);
                        setIsProjectDropdownOpen(false);
                      }}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <span className="truncate">{proj.name}</span>
                      {isSelected && (
                        <Check size={13} className="shrink-0 text-blue-600 dark:text-blue-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Azioni Progetto: Partecipanti & Nuovo Progetto */}
          <div className="hidden md:flex flex-col gap-1.5">
            {selectedProject && (
              <button
                type="button"
                className="w-full inline-flex items-center justify-center gap-1.5 px-2 py-1.5 text-[13px] font-semibold rounded-md border border-solid border-slate-300 dark:border-slate-700 bg-white dark:bg-[#21262d] text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-600 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer select-none whitespace-nowrap"
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
                className="w-full inline-flex items-center justify-center gap-1.5 px-2 py-1.5 text-[13px] font-semibold rounded-md border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-[#21262d] text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-600 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer select-none whitespace-nowrap"
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
      {isAdmin && isCreateModalOpen && (
        <CreateProjectModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}

      {/* Finestra Modale Gestione Partecipanti Progetto */}
      {selectedProject && isParticipantsModalOpen && (
        <ProjectParticipantsModal
          isOpen={isParticipantsModalOpen}
          onClose={() => setIsParticipantsModalOpen(false)}
        />
      )}

      {/* Finestra Modale Gestione Etichette */}
      {isLabelsModalOpen && (
        <LabelManagerModal
          isOpen={isLabelsModalOpen}
          onClose={() => setIsLabelsModalOpen(false)}
        />
      )}
    </>
  );
};
