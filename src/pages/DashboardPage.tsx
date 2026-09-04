import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  RefreshCw,
  AlertCircle,
  FolderKanban,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { issueService, type IssueResponseDto } from '../services/issueService';
import { projectService, type UserResponseDto } from '../services/projectService';
import { labelService, type LabelResponseDto } from '../services/labelService';
import {
  IssueFilterBar,
  type IssueFilterState,
  DEFAULT_ISSUE_FILTERS,
} from '../components/issues/IssueFilterBar';
import { IssueList } from '../components/issues/IssueList';
import { CreateIssueModal } from '../components/issues/CreateIssueModal';

const ITEMS_PER_PAGE = 6;

const KPI_ICON_STYLES: Record<string, string> = {
  total: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
  open: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
  bugs: 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400',
  closed: 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400',
};

/**
 * Calcola i numeri di pagina con finestra mobile ed ellissi per gestire qualsiasi numero di pagine.
 */
function getPageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, 4, 'ellipsis-right', total];
  if (current >= total - 2) return [1, 'ellipsis-left', total - 3, total - 2, total - 1, total];
  return [1, 'ellipsis-left', current - 1, current, current + 1, 'ellipsis-right', total];
}

/**
 * Pagina Principale Dashboard Issue (Step 16 - Dev 2).
 *
 * Responsabilità:
 * - Mostra le issue del progetto selezionato con filtri e ordinamento.
 * - Fornisce KPI di riepilogo (Totale, Aperti, Bug, Risolti) con filtri rapidi.
 * - Ricerca testuale istantanea in memoria.
 * - Paginazione client-side intelligente con salto pagine ed ellissi.
 */
export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { selectedProject, isLoading: isProjectLoading } = useProject();

  // Stati principali
  const [filters, setFilters] = useState<IssueFilterState>(DEFAULT_ISSUE_FILTERS);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rawIssues, setRawIssues] = useState<IssueResponseDto[]>([]);
  const [participants, setParticipants] = useState<UserResponseDto[]>([]);
  const [labels, setLabels] = useState<LabelResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // Caricamento in parallelo di issue, partecipanti e label del progetto
  const loadDashboardData = useCallback(async (projectId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const [issuesData, partsData, labelsData] = await Promise.all([
        issueService.getIssues(projectId, filters),
        projectService.getParticipants(projectId).catch(() => []),
        labelService.getAllLabels(),
      ]);
      setRawIssues(Array.isArray(issuesData) ? issuesData : []);
      setParticipants(partsData);
      setLabels(labelsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento della dashboard.');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Ricarica i dati quando cambia il progetto o uno dei filtri
  useEffect(() => {
    if (!selectedProject?.id) return;

    let isMounted = true;
    const projectId = selectedProject.id;

    Promise.all([
      issueService.getIssues(projectId, filters),
      projectService.getParticipants(projectId).catch(() => []),
      labelService.getAllLabels(),
    ])
      .then(([issuesData, partsData, labelsData]) => {
        if (!isMounted) return;
        setRawIssues(Array.isArray(issuesData) ? issuesData : []);
        setParticipants(partsData);
        setLabels(labelsData);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Errore nel caricamento della dashboard.');
      });

    return () => {
      isMounted = false;
    };
  }, [selectedProject?.id, filters]);

  // Reset a pagina 1 quando cambiano filtri o ricerca
  const handleFilterChange = (newFilters: IssueFilterState) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_ISSUE_FILTERS);
    setCurrentPage(1);
  };

  // Ricerca testuale in-memory ultra-reattiva
  const filteredIssues = useMemo(() => {
    const query = filters.search?.trim().toLowerCase();
    if (!query) return rawIssues;

    return rawIssues.filter((i) =>
      `${i.id} ${i.title} ${i.description} ${i.assignedToUsername} ${i.creatorUsername} ${i.labels?.map((l) => l.name).join(' ')}`
        .toLowerCase()
        .includes(query)
    );
  }, [rawIssues, filters.search]);

  // Paginazione client-side
  const totalPages = Math.max(1, Math.ceil(filteredIssues.length / ITEMS_PER_PAGE));
  const paginatedIssues = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredIssues.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredIssues, currentPage]);

  // Calcolo metriche KPI
  const stats = useMemo(() => ({
    total: rawIssues.length,
    open: rawIssues.filter((i) => i.state === 'TODO' || i.state === 'INPROGRESS').length,
    bugs: rawIssues.filter((i) => i.type === 'BUG').length,
    closed: rawIssues.filter((i) => i.state === 'CLOSED').length,
  }), [rawIssues]);

  // Configurazione card KPI
  const kpiCards = [
    {
      label: 'Totale Ticket',
      value: stats.total,
      icon: Layers,
      variant: 'total',
      active: false,
      onClick: () => handleResetFilters(),
    },
    {
      label: 'Aperti / In Corso',
      value: stats.open,
      icon: Clock,
      variant: 'open',
      active: filters.state === 'INPROGRESS',
      onClick: () => {
        handleFilterChange({
          ...filters,
          state: filters.state === 'INPROGRESS' ? undefined : 'INPROGRESS',
        });
      },
    },
    {
      label: 'Bug Segnalati',
      value: stats.bugs,
      icon: AlertTriangle,
      variant: 'bugs',
      active: filters.type === 'BUG',
      onClick: () => {
        handleFilterChange({
          ...filters,
          type: filters.type === 'BUG' ? undefined : 'BUG',
        });
      },
    },
    {
      label: 'Risolti / Chiusi',
      value: stats.closed,
      icon: CheckCircle2,
      variant: 'closed',
      active: filters.state === 'CLOSED',
      onClick: () => {
        handleFilterChange({
          ...filters,
          state: filters.state === 'CLOSED' ? undefined : 'CLOSED',
        });
      },
    },
  ];

  // Render caso: nessun progetto selezionato
  if (!selectedProject && !isProjectLoading) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12 box-border">
        <div className="flex flex-col items-center justify-center p-14 bg-white dark:bg-[#161b22] border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center gap-3 max-w-125 mx-auto my-8">
          <FolderKanban size={36} className="text-blue-600 dark:text-blue-500" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 m-0">Nessun progetto selezionato</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 m-0">Seleziona o crea un progetto dalla barra laterale per visualizzare le sue issue.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12 box-border">
      {/* 1. Header Pagina & Azioni */}
      <header className="flex justify-between items-start gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          {selectedProject && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.75 rounded-full w-fit">
              <FolderKanban size={12} />
              <span>{selectedProject.name}</span>
            </span>
          )}
          <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 dark:text-slate-100 m-0">Dashboard Issue</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 m-0">
            Panoramica delle attività e segnalazioni del progetto.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-[#21262d] border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer shadow-xs transition-all disabled:opacity-50"
            onClick={() => selectedProject?.id && loadDashboardData(selectedProject.id)}
            disabled={isLoading}
            title="Sincronizza con il server"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            <span>Aggiorna</span>
          </button>

          {isAuthenticated && selectedProject && (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 active:bg-green-800 rounded-lg cursor-pointer shadow-xs transition-all"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus size={16} />
              <span>Nuova Issue</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. Bento KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Statistiche issue">
        {kpiCards.map(({ label, value, icon: Icon, variant, active, onClick }) => (
          <button
            key={label}
            type="button"
            className={`flex items-center gap-3.5 p-4 bg-white dark:bg-[#161b22] border rounded-xl cursor-pointer text-left transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm ${
              active
                ? 'border-blue-600 dark:border-blue-500 ring-2 ring-blue-600/15'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
            onClick={onClick}
          >
            <div className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${KPI_ICON_STYLES[variant]}`}>
              <Icon size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-[22px] font-bold text-slate-900 dark:text-slate-100 leading-tight">{value}</span>
              <span className="text-[13px] text-slate-500 dark:text-slate-400">{label}</span>
            </div>
          </button>
        ))}
      </section>

      {/* 3. Barra dei Filtri */}
      <IssueFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        participants={participants}
        labels={labels}
        onResetFilters={handleResetFilters}
        totalCount={rawIssues.length}
        filteredCount={filteredIssues.length}
      />

      {/* 4. Banner di Errore */}
      {error && (
        <div className="flex items-center justify-between gap-4 p-3 px-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-lg text-red-700 dark:text-red-300" role="alert">
          <div className="flex items-center gap-2 text-sm font-medium">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button
            type="button"
            className="px-3 py-1.5 text-xs font-medium border border-red-300 dark:border-red-800 rounded bg-white dark:bg-[#21262d] text-red-700 dark:text-red-300 hover:bg-red-50 cursor-pointer"
            onClick={() => selectedProject?.id && loadDashboardData(selectedProject.id)}
          >
            Riprova
          </button>
        </div>
      )}

      {/* 5. Lista Issue (Paginata) */}
      <IssueList
        issues={paginatedIssues}
        isLoading={isLoading}
        projectId={selectedProject?.id}
        onIssueClick={(issue) =>
          selectedProject?.id && issue.id && navigate(`/projects/${selectedProject.id}/issues/${issue.id}`)
        }
        onResetFilters={handleResetFilters}
        emptyTitle={rawIssues.length === 0 ? 'Nessuna issue presente' : 'Nessun risultato'}
        emptyDescription={
          rawIssues.length === 0
            ? 'Questo progetto non ha ancora issue registrate.'
            : 'Nessuna issue corrisponde ai filtri selezionati.'
        }
      />

      {/* 6. Controlli di Paginazione Numerati con Finestra Mobile */}
      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-3 pt-5 mt-2 border-t border-slate-200 dark:border-slate-800 flex-wrap" aria-label="Paginazione ticket">
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
                <span key={item} className="inline-flex items-center justify-center min-w-6 text-slate-400 dark:text-slate-500 text-sm select-none" aria-hidden="true">
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

      {/* 7. Modale Creazione Nuova Issue */}
      {isCreateModalOpen && (
        <CreateIssueModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          projectId={selectedProject?.id}
          onSuccess={() => {
            if (selectedProject?.id) {
              loadDashboardData(selectedProject.id);
            }
          }}
        />
      )}
    </div>
  );
};
