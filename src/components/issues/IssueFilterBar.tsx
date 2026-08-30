import React, { useCallback } from 'react';
import {
  Search,
  X,
  RotateCcw,
  SlidersHorizontal,
  ArrowDownUp,
  ArrowDown,
  ArrowUp,
  User,
  Tag,
  Flame,
  CircleDot,
  Layers,
} from 'lucide-react';
import type {
  IssuePriority,
  IssueState,
  IssueType,
  SortDirection,
} from '../../services/issueService';
import type { UserResponseDto } from '../../services/projectService';
import type { LabelResponseDto } from '../../services/labelService';
import { STATUS_CONFIG, PRIORITY_CONFIG, TYPE_CONFIG } from '../common/Badge';
import './IssueFilterBar.css';

/**
 * Rappresenta lo stato completo dei filtri e dell'ordinamento delle issue.
 */
export interface IssueFilterState {
  type?: IssueType;
  state?: IssueState;
  priority?: IssuePriority;
  assignedToId?: number;
  labelId?: number;
  sortBy?: string;
  sortDir?: SortDirection;
  search?: string;
}

/**
 * Valori di default per i filtri e l'ordinamento delle issue.
 */
export const DEFAULT_ISSUE_FILTERS: IssueFilterState = {
  type: undefined,
  state: undefined,
  priority: undefined,
  assignedToId: undefined,
  labelId: undefined,
  sortBy: 'creationDate',
  sortDir: 'desc',
  search: '',
};

/**
 * Opzioni configurate per il selettore del campo di ordinamento.
 */
export const SORT_FIELD_OPTIONS: { value: string; label: string }[] = [
  { value: 'creationDate', label: 'Data di creazione' },
  { value: 'priority', label: 'Priorità' },
  { value: 'title', label: 'Titolo' },
  { value: 'state', label: 'Stato' },
  { value: 'type', label: 'Tipo' },
  { value: 'id', label: 'ID Ticket' },
];

/**
 * Verifica se sono presenti filtri attivi rispetto ai valori di default.
 */
export function hasActiveFilters(filters: IssueFilterState): boolean {
  return Boolean(
    filters.type ||
      filters.state ||
      filters.priority ||
      filters.assignedToId !== undefined ||
      filters.labelId !== undefined ||
      (filters.search && filters.search.trim().length > 0) ||
      filters.sortBy !== DEFAULT_ISSUE_FILTERS.sortBy ||
      filters.sortDir !== DEFAULT_ISSUE_FILTERS.sortDir
  );
}

/**
 * Conta il numero di criteri di filtro attivi (esclusi ordinamento standard).
 */
export function getActiveFilterCount(filters: IssueFilterState): number {
  let count = 0;
  if (filters.type) count++;
  if (filters.state) count++;
  if (filters.priority) count++;
  if (filters.assignedToId !== undefined) count++;
  if (filters.labelId !== undefined) count++;
  if (filters.search && filters.search.trim().length > 0) count++;
  return count;
}

export interface IssueFilterBarProps {
  /** Stato corrente dei filtri e dell'ordinamento */
  filters: IssueFilterState;
  /** Callback invocata alla modifica dei filtri */
  onFilterChange: (newFilters: IssueFilterState) => void;
  /** Lista opzionale dei partecipanti al progetto per il filtro Assegnatario */
  participants?: UserResponseDto[];
  /** Lista opzionale delle etichette globali per il filtro Label */
  labels?: LabelResponseDto[];
  /** Callback opzionale invocata al reset completo dei filtri */
  onResetFilters?: () => void;
  /** Conteggio totale delle issue nel progetto (per indicatore numerico) */
  totalCount?: number;
  /** Conteggio delle issue risultanti dopo il filtraggio */
  filteredCount?: number;
  /** Classe CSS aggiuntiva per il contenitore */
  className?: string;
}

/**
 * Barra di Filtraggio & Ordinamento Issue (F3).
 *
 * Responsabilità:
 * - Filtri per Stato, Tipo, Priorità, Assegnatario e Label.
 * - Ricerca testuale rapida su titolo/descrizione/ID.
 * - Ordinamento per data, priorità, titolo, stato, tipo con toggle direzione (ASC/DESC).
 * - Chip visivi dei filtri attivi con rimozione rapida del singolo filtro.
 * - Reset globale dei filtri.
 */
export const IssueFilterBar: React.FC<IssueFilterBarProps> = ({
  filters,
  onFilterChange,
  participants = [],
  labels = [],
  onResetFilters,
  totalCount,
  filteredCount,
  className = '',
}) => {
  const activeCount = getActiveFilterCount(filters);
  const isFiltered = hasActiveFilters(filters);

  // Aggiorna un singolo campo mantenendo gli altri
  const updateField = useCallback(
    <K extends keyof IssueFilterState>(key: K, value: IssueFilterState[K]) => {
      onFilterChange({
        ...filters,
        [key]: value,
      });
    },
    [filters, onFilterChange]
  );

  // Gestione ricerca testuale
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('search', e.target.value);
  };

  const handleClearSearch = () => {
    updateField('search', '');
  };

  // Gestione selettori dropdown
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    updateField('type', val ? (val as IssueType) : undefined);
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    updateField('state', val ? (val as IssueState) : undefined);
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    updateField('priority', val ? (val as IssuePriority) : undefined);
  };

  const handleAssigneeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    updateField('assignedToId', val ? Number(val) : undefined);
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    updateField('labelId', val ? Number(val) : undefined);
  };

  const handleSortByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateField('sortBy', e.target.value);
  };

  // Inverte la direzione dell'ordinamento (ASC <-> DESC)
  const handleToggleSortDir = () => {
    const nextDir: SortDirection = filters.sortDir === 'asc' ? 'desc' : 'asc';
    updateField('sortDir', nextDir);
  };

  // Reset completo
  const handleReset = () => {
    if (onResetFilters) {
      onResetFilters();
    } else {
      onFilterChange(DEFAULT_ISSUE_FILTERS);
    }
  };

  // Rimozione selettiva singoli filtri dai chip
  const handleRemoveType = () => updateField('type', undefined);
  const handleRemoveState = () => updateField('state', undefined);
  const handleRemovePriority = () => updateField('priority', undefined);
  const handleRemoveAssignee = () => updateField('assignedToId', undefined);
  const handleRemoveLabel = () => updateField('labelId', undefined);

  // Risoluzione etichette leggibili per i chip
  const selectedAssignee = participants.find((p) => p.id === filters.assignedToId);
  const selectedLabel = labels.find((l) => l.id === filters.labelId);

  return (
    <div className={`issue-filter-bar ${className}`}>
      {/* 1. Riga Superiore: Ricerca, Dropdown Filtri, Ordinamento & Reset */}
      <div className="filter-bar-main">
        {/* Campo Ricerca Testuale */}
        <div className="filter-search-wrapper">
          <Search size={16} className="filter-search-icon" aria-hidden="true" />
          <input
            type="text"
            className="filter-search-input"
            placeholder="Cerca per titolo, ID, testo..."
            value={filters.search ?? ''}
            onChange={handleSearchChange}
            aria-label="Cerca issue"
          />
          {filters.search && (
            <button
              type="button"
              className="filter-search-clear"
              onClick={handleClearSearch}
              title="Cancella ricerca"
              aria-label="Cancella testo di ricerca"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Gruppo Dropdown Filtri */}
        <div className="filter-selects-group">
          {/* Filtro Stato */}
          <div className="filter-select-wrapper" title="Filtra per Stato">
            <CircleDot size={14} className="filter-select-icon text-muted" />
            <select
              className={`filter-select ${filters.state ? 'filter-select-active' : ''}`}
              value={filters.state ?? ''}
              onChange={handleStateChange}
              aria-label="Filtra per Stato"
            >
              <option value="">Stato: Tutti</option>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>
                  {cfg.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Tipo */}
          <div className="filter-select-wrapper" title="Filtra per Tipo">
            <Layers size={14} className="filter-select-icon text-muted" />
            <select
              className={`filter-select ${filters.type ? 'filter-select-active' : ''}`}
              value={filters.type ?? ''}
              onChange={handleTypeChange}
              aria-label="Filtra per Tipo"
            >
              <option value="">Tipo: Tutti</option>
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>
                  {cfg.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Priorità */}
          <div className="filter-select-wrapper" title="Filtra per Priorità">
            <Flame size={14} className="filter-select-icon text-muted" />
            <select
              className={`filter-select ${filters.priority ? 'filter-select-active' : ''}`}
              value={filters.priority ?? ''}
              onChange={handlePriorityChange}
              aria-label="Filtra per Priorità"
            >
              <option value="">Priorità: Tutte</option>
              {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>
                  {cfg.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Assegnatario (se partecipanti disponibili) */}
          {participants.length > 0 && (
            <div className="filter-select-wrapper" title="Filtra per Assegnatario">
              <User size={14} className="filter-select-icon text-muted" />
              <select
                className={`filter-select ${filters.assignedToId !== undefined ? 'filter-select-active' : ''}`}
                value={filters.assignedToId ?? ''}
                onChange={handleAssigneeChange}
                aria-label="Filtra per Assegnatario"
              >
                <option value="">Assegnatario: Tutti</option>
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.username}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filtro Label (se label disponibili) */}
          {labels.length > 0 && (
            <div className="filter-select-wrapper" title="Filtra per Etichetta">
              <Tag size={14} className="filter-select-icon text-muted" />
              <select
                className={`filter-select ${filters.labelId !== undefined ? 'filter-select-active' : ''}`}
                value={filters.labelId ?? ''}
                onChange={handleLabelChange}
                aria-label="Filtra per Etichetta"
              >
                <option value="">Etichetta: Tutte</option>
                {labels.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Gruppo Ordinamento (Sort By + Sort Dir Toggle) */}
        <div className="filter-sort-group">
          <div className="filter-select-wrapper" title="Ordina per">
            <ArrowDownUp size={14} className="filter-select-icon text-muted" />
            <select
              className="filter-select filter-sort-select"
              value={filters.sortBy ?? 'creationDate'}
              onChange={handleSortByChange}
              aria-label="Campo di ordinamento"
            >
              {SORT_FIELD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  Ordina: {opt.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="filter-sort-dir-btn"
            onClick={handleToggleSortDir}
            title={
              filters.sortDir === 'asc'
                ? 'Ordinamento Crescente (clicca per decrescente)'
                : 'Ordinamento Decrescente (clicca per crescente)'
            }
            aria-label={`Inverti direzione ordinamento. Attuale: ${filters.sortDir === 'asc' ? 'Crescente' : 'Decrescente'}`}
          >
            {filters.sortDir === 'asc' ? <ArrowUp size={15} /> : <ArrowDown size={15} />}
            <span className="filter-sort-dir-label">
              {filters.sortDir === 'asc' ? 'ASC' : 'DESC'}
            </span>
          </button>
        </div>

        {/* Pulsante Reset Filtri */}
        {isFiltered && (
          <button
            type="button"
            className="filter-reset-btn"
            onClick={handleReset}
            title="Ripristina filtri e ordinamento di default"
            aria-label="Resetta filtri"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
            {activeCount > 0 && <span className="filter-count-badge">{activeCount}</span>}
          </button>
        )}
      </div>

      {/* 2. Riga Inferiore: Pillole Filtri Attivi & Conteggio Risultati */}
      {(isFiltered || totalCount !== undefined) && (
        <div className="filter-bar-chips-row">
          {/* Chip dei filtri applicati */}
          <div className="filter-chips-list">
            <span className="filter-chips-caption">
              <SlidersHorizontal size={13} />
              <span>Filtri attivi:</span>
            </span>

            {/* Chip Ricerca Testo */}
            {filters.search && filters.search.trim().length > 0 && (
              <span className="filter-chip">
                <Search size={12} />
                <span>Testo: &ldquo;{filters.search}&rdquo;</span>
                <button
                  type="button"
                  className="filter-chip-remove"
                  onClick={handleClearSearch}
                  aria-label="Rimuovi filtro testo"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {/* Chip Stato */}
            {filters.state && (
              <span className="filter-chip filter-chip-state">
                <CircleDot size={12} />
                <span>Stato: {STATUS_CONFIG[filters.state]?.label || filters.state}</span>
                <button
                  type="button"
                  className="filter-chip-remove"
                  onClick={handleRemoveState}
                  aria-label="Rimuovi filtro stato"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {/* Chip Tipo */}
            {filters.type && (
              <span className="filter-chip filter-chip-type">
                <Layers size={12} />
                <span>Tipo: {TYPE_CONFIG[filters.type]?.label || filters.type}</span>
                <button
                  type="button"
                  className="filter-chip-remove"
                  onClick={handleRemoveType}
                  aria-label="Rimuovi filtro tipo"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {/* Chip Priorità */}
            {filters.priority && (
              <span className="filter-chip filter-chip-priority">
                <Flame size={12} />
                <span>Priorità: {PRIORITY_CONFIG[filters.priority]?.label || filters.priority}</span>
                <button
                  type="button"
                  className="filter-chip-remove"
                  onClick={handleRemovePriority}
                  aria-label="Rimuovi filtro priorità"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {/* Chip Assegnatario */}
            {filters.assignedToId !== undefined && selectedAssignee && (
              <span className="filter-chip filter-chip-user">
                <User size={12} />
                <span>Assegnato a: {selectedAssignee.username}</span>
                <button
                  type="button"
                  className="filter-chip-remove"
                  onClick={handleRemoveAssignee}
                  aria-label="Rimuovi filtro assegnatario"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {/* Chip Label */}
            {filters.labelId !== undefined && selectedLabel && (
              <span className="filter-chip filter-chip-label">
                <Tag size={12} />
                {selectedLabel.color && (
                  <span
                    className="filter-chip-color-dot"
                    style={{ backgroundColor: selectedLabel.color }}
                  />
                )}
                <span>Label: {selectedLabel.name}</span>
                <button
                  type="button"
                  className="filter-chip-remove"
                  onClick={handleRemoveLabel}
                  aria-label="Rimuovi filtro etichetta"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {activeCount === 0 && !filters.search && (
              <span className="filter-chips-empty">Nessun filtro attivo (visualizzazione completa)</span>
            )}
          </div>

          {/* Conteggio Risultati */}
          {(filteredCount !== undefined || totalCount !== undefined) && (
            <div className="filter-results-count">
              {filteredCount !== undefined && totalCount !== undefined && filteredCount !== totalCount ? (
                <span>
                  Mostrando <strong>{filteredCount}</strong> di <strong>{totalCount}</strong> issue
                </span>
              ) : (
                <span>
                  <strong>{filteredCount ?? totalCount}</strong>{' '}
                  {(filteredCount ?? totalCount) === 1 ? 'issue trovata' : 'issue trovate'}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
