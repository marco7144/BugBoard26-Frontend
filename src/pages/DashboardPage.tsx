import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  RefreshCw,
  AlertCircle,
  FolderKanban,
  Clock,
  Bug,
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
import './DashboardPage.css';

const ITEMS_PER_PAGE = 9;

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
      icon: Bug,
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
      <div className="dashboard-page">
        <div className="dashboard-no-project">
          <FolderKanban size={32} className="dashboard-no-project-icon" />
          <h3>Nessun progetto selezionato</h3>
          <p>Seleziona o crea un progetto dalla barra laterale per visualizzare le sue issue.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* 1. Header Pagina & Azioni */}
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          {selectedProject && (
            <span className="dashboard-project-tag">
              <FolderKanban size={12} />
              <span>{selectedProject.name}</span>
            </span>
          )}
          <h1 className="dashboard-title">Dashboard Issue</h1>
          <p className="dashboard-subtitle">
            Panoramica delle attività e segnalazioni del progetto.
          </p>
        </div>

        <div className="dashboard-header-actions">
          <button
            type="button"
            className="dashboard-refresh-btn"
            onClick={() => selectedProject?.id && loadDashboardData(selectedProject.id)}
            disabled={isLoading}
            title="Sincronizza con il server"
          >
            <RefreshCw size={15} className={isLoading ? 'icon-spin' : ''} />
            <span>Aggiorna</span>
          </button>

          {isAuthenticated && selectedProject && (
            <button
              type="button"
              className="dashboard-create-btn"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus size={16} />
              <span>Nuova Issue</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. Bento KPI Cards */}
      <section className="dashboard-kpi-grid" aria-label="Statistiche issue">
        {kpiCards.map(({ label, value, icon: Icon, variant, active, onClick }) => (
          <button
            key={label}
            type="button"
            className={`kpi-card ${active ? 'kpi-card--active' : ''}`}
            onClick={onClick}
          >
            <div className={`kpi-icon kpi-icon--${variant}`}>
              <Icon size={20} />
            </div>
            <div className="kpi-info">
              <span className="kpi-value">{value}</span>
              <span className="kpi-label">{label}</span>
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
        <div className="dashboard-error-banner" role="alert">
          <div className="dashboard-error-content">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
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
        <nav className="dashboard-pagination" aria-label="Paginazione ticket">
          <button
            type="button"
            className="btn btn-outline btn-sm dashboard-page-btn"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            aria-label="Pagina precedente"
          >
            <ChevronLeft size={16} />
            <span>Precedente</span>
          </button>

          <div className="dashboard-pagination-pages">
            {getPageNumbers(currentPage, totalPages).map((item) =>
              typeof item === 'number' ? (
                <button
                  key={item}
                  type="button"
                  className={`dashboard-page-num ${item === currentPage ? 'dashboard-page-num--active' : ''}`}
                  onClick={() => setCurrentPage(item)}
                  aria-label={`Pagina ${item}`}
                  aria-current={item === currentPage ? 'page' : undefined}
                >
                  {item}
                </button>
              ) : (
                <span key={item} className="dashboard-page-ellipsis" aria-hidden="true">
                  ...
                </span>
              )
            )}
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm dashboard-page-btn"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            aria-label="Pagina successiva"
          >
            <span>Successiva</span>
            <ChevronRight size={16} />
          </button>
        </nav>
      )}

      {/* 7. Modale Creazione Nuova Issue (F2 - Step 17) */}
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
    </div>
  );
};
