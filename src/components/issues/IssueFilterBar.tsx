import React, { useState, useRef, useEffect } from 'react';
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
  ChevronDown,
  Check,
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

/**
 * Singola opzione per il Custom Filter Dropdown.
 */
export interface FilterDropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  colorDot?: string;
}

interface FilterDropdownProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  options: FilterDropdownOption[];
  onChange: (value: string) => void;
  title?: string;
  isActive?: boolean;
}

/**
 * Componente Custom Dropdown compatto con altezza massima controllata e scrollbar interna.
 */
const FilterDropdown: React.FC<FilterDropdownProps> = ({
  label,
  icon,
  value,
  options,
  onChange,
  title,
  isActive = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Chiudi al click esterno o pressione Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEvents = (e: MouseEvent | KeyboardEvent) => {
      if (
        (e instanceof MouseEvent && dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) ||
        (e instanceof KeyboardEvent && e.key === 'Escape')
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleEvents);
    document.addEventListener('keydown', handleEvents);
    return () => {
      document.removeEventListener('mousedown', handleEvents);
      document.removeEventListener('keydown', handleEvents);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption && selectedOption.value !== '' ? selectedOption.label : label;

  return (
    <div className="filter-dropdown-wrapper" ref={dropdownRef} title={title}>
      <button
        type="button"
        className={`filter-dropdown-btn ${isActive ? 'filter-dropdown-btn-active' : ''} ${
          isOpen ? 'filter-dropdown-btn-open' : ''
        }`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="filter-dropdown-icon">{icon}</span>
        <span className="filter-dropdown-label">{displayLabel}</span>
        <ChevronDown
          size={13}
          className={`filter-dropdown-chevron ${isOpen ? 'filter-dropdown-chevron-rotated' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="filter-dropdown-menu" role="listbox">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                className={`filter-dropdown-item ${
                  isSelected ? 'filter-dropdown-item-selected' : ''
                }`}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                role="option"
                aria-selected={isSelected}
              >
                {opt.colorDot && (
                  <span
                    className="filter-chip-color-dot"
                    style={{ backgroundColor: opt.colorDot }}
                  />
                )}
                {opt.icon && <span className="filter-dropdown-item-icon">{opt.icon}</span>}
                <span className="filter-dropdown-item-text">{opt.label}</span>
                {isSelected && <Check size={13} className="filter-dropdown-check" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export interface IssueFilterBarProps {
  filters: IssueFilterState;
  onFilterChange: (newFilters: IssueFilterState) => void;
  participants?: UserResponseDto[];
  labels?: LabelResponseDto[];
  onResetFilters?: () => void;
  totalCount?: number;
  filteredCount?: number;
  className?: string;
}

/**
 * Barra di Filtraggio & Ordinamento Issue (F3).
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
  const updateField = <K extends keyof IssueFilterState>(key: K, value: IssueFilterState[K]) => {
    onFilterChange({ ...filters, [key]: value });
  };

  // Risoluzione etichette leggibili per i chip
  const selectedAssignee = participants.find((p) => p.id === filters.assignedToId);
  const selectedLabel = labels.find((l) => l.id === filters.labelId);

  // Generazione opzioni per i Custom Dropdown
  const stateOptions: FilterDropdownOption[] = [
    { value: '', label: 'Stato: Tutti' },
    ...Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({ value: key, label: cfg.label })),
  ];

  const typeOptions: FilterDropdownOption[] = [
    { value: '', label: 'Tipo: Tutti' },
    ...Object.entries(TYPE_CONFIG).map(([key, cfg]) => ({ value: key, label: cfg.label })),
  ];

  const priorityOptions: FilterDropdownOption[] = [
    { value: '', label: 'Priorità: Tutte' },
    ...Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => ({ value: key, label: cfg.label })),
  ];

  const assigneeOptions: FilterDropdownOption[] = [
    { value: '', label: 'Assegnatario: Tutti' },
    ...participants.map((p) => ({ value: String(p.id), label: p.username })),
  ];

  const labelOptions: FilterDropdownOption[] = [
    { value: '', label: 'Etichetta: Tutte' },
    ...labels.map((l) => ({ value: String(l.id), label: l.name, colorDot: l.color })),
  ];

  const sortOptions: FilterDropdownOption[] = SORT_FIELD_OPTIONS.map((opt) => ({
    value: opt.value,
    label: `Ordina: ${opt.label}`,
  }));

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
            onChange={(e) => updateField('search', e.target.value)}
            aria-label="Cerca issue"
          />
          {filters.search && (
            <button
              type="button"
              className="filter-search-clear"
              onClick={() => updateField('search', '')}
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
          <FilterDropdown
            label="Stato: Tutti"
            icon={<CircleDot size={14} className="text-muted" />}
            value={filters.state ?? ''}
            options={stateOptions}
            onChange={(val) => updateField('state', val ? (val as IssueState) : undefined)}
            title="Filtra per Stato"
            isActive={Boolean(filters.state)}
          />

          {/* Filtro Tipo */}
          <FilterDropdown
            label="Tipo: Tutti"
            icon={<Layers size={14} className="text-muted" />}
            value={filters.type ?? ''}
            options={typeOptions}
            onChange={(val) => updateField('type', val ? (val as IssueType) : undefined)}
            title="Filtra per Tipo"
            isActive={Boolean(filters.type)}
          />

          {/* Filtro Priorità */}
          <FilterDropdown
            label="Priorità: Tutte"
            icon={<Flame size={14} className="text-muted" />}
            value={filters.priority ?? ''}
            options={priorityOptions}
            onChange={(val) => updateField('priority', val ? (val as IssuePriority) : undefined)}
            title="Filtra per Priorità"
            isActive={Boolean(filters.priority)}
          />

          {/* Filtro Assegnatario */}
          {participants.length > 0 && (
            <FilterDropdown
              label="Assegnatario: Tutti"
              icon={<User size={14} className="text-muted" />}
              value={filters.assignedToId !== undefined ? String(filters.assignedToId) : ''}
              options={assigneeOptions}
              onChange={(val) => updateField('assignedToId', val ? Number(val) : undefined)}
              title="Filtra per Assegnatario"
              isActive={filters.assignedToId !== undefined}
            />
          )}

          {/* Filtro Label */}
          {labels.length > 0 && (
            <FilterDropdown
              label="Etichetta: Tutte"
              icon={<Tag size={14} className="text-muted" />}
              value={filters.labelId !== undefined ? String(filters.labelId) : ''}
              options={labelOptions}
              onChange={(val) => updateField('labelId', val ? Number(val) : undefined)}
              title="Filtra per Etichetta"
              isActive={filters.labelId !== undefined}
            />
          )}
        </div>

        {/* Gruppo Ordinamento (Sort By + Sort Dir Toggle) */}
        <div className="filter-sort-group">
          <FilterDropdown
            label={`Ordina: ${
              SORT_FIELD_OPTIONS.find((o) => o.value === (filters.sortBy ?? 'creationDate'))?.label ||
              'Data di creazione'
            }`}
            icon={<ArrowDownUp size={14} className="text-muted" />}
            value={filters.sortBy ?? 'creationDate'}
            options={sortOptions}
            onChange={(val) => updateField('sortBy', val)}
            title="Ordina per"
          />

          <button
            type="button"
            className="filter-sort-dir-btn"
            onClick={() =>
              updateField('sortDir', filters.sortDir === 'asc' ? 'desc' : 'asc')
            }
            title={
              filters.sortDir === 'asc'
                ? 'Ordinamento Crescente (clicca per decrescente)'
                : 'Ordinamento Decrescente (clicca per crescente)'
            }
            aria-label={`Inverti direzione ordinamento. Attuale: ${
              filters.sortDir === 'asc' ? 'Crescente' : 'Decrescente'
            }`}
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
            onClick={() => (onResetFilters ? onResetFilters() : onFilterChange(DEFAULT_ISSUE_FILTERS))}
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
                  onClick={() => updateField('search', '')}
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
                  onClick={() => updateField('state', undefined)}
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
                  onClick={() => updateField('type', undefined)}
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
                  onClick={() => updateField('priority', undefined)}
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
                  onClick={() => updateField('assignedToId', undefined)}
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
                  onClick={() => updateField('labelId', undefined)}
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
