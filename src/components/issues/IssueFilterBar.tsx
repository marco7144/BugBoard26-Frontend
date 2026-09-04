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
    <div className="relative inline-flex w-full lg:w-auto" ref={dropdownRef} title={title}>
      <button
        type="button"
        className={`w-full lg:w-auto inline-flex items-center justify-between lg:justify-start gap-1.75 px-3 py-2 text-[13px] rounded-lg cursor-pointer select-none whitespace-nowrap transition-all border outline-none ${
          isActive
            ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 font-semibold'
            : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-100 bg-white dark:bg-[#21262d] font-medium hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800'
        } ${
          isOpen ? 'border-blue-600 dark:border-blue-500 ring-3 ring-blue-600/15 dark:ring-blue-500/25' : ''
        }`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="inline-flex items-center justify-center text-inherit shrink-0">{icon}</span>
        <span className="inline-block max-w-45 truncate text-left">{displayLabel}</span>
        <ChevronDown
          size={13}
          className={`text-slate-400 dark:text-slate-500 ml-0.5 shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute top-[calc(100%+5px)] left-0 w-full lg:w-auto min-w-42.5 max-w-xs max-h-55 overflow-y-auto bg-white dark:bg-[#21262d] border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg z-50 p-1 flex flex-col gap-0.5"
          role="listbox"
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                className={`flex items-center gap-2 w-full px-2.5 py-1.75 text-[13px] rounded-md text-left cursor-pointer select-none transition-colors border-none bg-transparent ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400'
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
                    className="w-2 h-2 rounded-full shrink-0 inline-block"
                    style={{ backgroundColor: opt.colorDot }}
                  />
                )}
                {opt.icon && <span className="inline-flex items-center justify-center shrink-0">{opt.icon}</span>}
                <span className="flex-1 truncate">{opt.label}</span>
                {isSelected && <Check size={13} className="ml-auto text-blue-600 dark:text-blue-400 shrink-0" />}
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
    <div className={`flex flex-col gap-3 bg-white dark:bg-[#161b22] border border-slate-300 dark:border-slate-700 rounded-xl p-3.5 sm:px-4.5 shadow-xs transition-all hover:border-slate-400/80 dark:hover:border-slate-400/50 ${className}`}>
      {/* 1. Riga Superiore: Ricerca, Dropdown Filtri, Ordinamento & Reset */}
      <div className="flex flex-col lg:flex-row flex-wrap items-stretch lg:items-center gap-2.5 w-full">
        {/* Campo Ricerca Testuale */}
        <div className="relative flex-1 min-w-50 w-full lg:w-auto flex items-center">
          <Search size={16} className="absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none" aria-hidden="true" />
          <input
            type="text"
            className="w-full pl-9 pr-8 py-2 text-sm text-slate-900 dark:text-slate-100 bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-[#161b22] focus:ring-3 focus:ring-blue-600/15 dark:focus:ring-blue-500/25 transition-all"
            placeholder="Cerca per titolo, ID, testo..."
            value={filters.search ?? ''}
            onChange={(e) => updateField('search', e.target.value)}
            aria-label="Cerca issue"
          />
          {filters.search && (
            <button
              type="button"
              className="absolute right-2 flex items-center justify-center w-5 h-5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer"
              onClick={() => updateField('search', '')}
              title="Cancella ricerca"
              aria-label="Cancella testo di ricerca"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Gruppo Dropdown Filtri */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Filtro Stato */}
          <FilterDropdown
            label="Stato: Tutti"
            icon={<CircleDot size={14} className="text-slate-400 dark:text-slate-500" />}
            value={filters.state ?? ''}
            options={stateOptions}
            onChange={(val) => updateField('state', val ? (val as IssueState) : undefined)}
            title="Filtra per Stato"
            isActive={Boolean(filters.state)}
          />

          {/* Filtro Tipo */}
          <FilterDropdown
            label="Tipo: Tutti"
            icon={<Layers size={14} className="text-slate-400 dark:text-slate-500" />}
            value={filters.type ?? ''}
            options={typeOptions}
            onChange={(val) => updateField('type', val ? (val as IssueType) : undefined)}
            title="Filtra per Tipo"
            isActive={Boolean(filters.type)}
          />

          {/* Filtro Priorità */}
          <FilterDropdown
            label="Priorità: Tutte"
            icon={<Flame size={14} className="text-slate-400 dark:text-slate-500" />}
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
              icon={<User size={14} className="text-slate-400 dark:text-slate-500" />}
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
              icon={<Tag size={14} className="text-slate-400 dark:text-slate-500" />}
              value={filters.labelId !== undefined ? String(filters.labelId) : ''}
              options={labelOptions}
              onChange={(val) => updateField('labelId', val ? Number(val) : undefined)}
              title="Filtra per Etichetta"
              isActive={filters.labelId !== undefined}
            />
          )}
        </div>

        {/* Gruppo Ordinamento (Sort By + Sort Dir Toggle) */}
        <div className="flex items-center gap-1.5 w-full lg:w-auto">
          <div className="flex-1 lg:flex-initial">
            <FilterDropdown
              label={`Ordina: ${
                SORT_FIELD_OPTIONS.find((o) => o.value === (filters.sortBy ?? 'creationDate'))?.label ||
                'Data di creazione'
              }`}
              icon={<ArrowDownUp size={14} className="text-slate-400 dark:text-slate-500" />}
              value={filters.sortBy ?? 'creationDate'}
              options={sortOptions}
              onChange={(val) => updateField('sortBy', val)}
              title="Ordina per"
            />
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center gap-1 px-2.5 py-2 text-xs font-semibold font-mono text-slate-600 dark:text-slate-300 bg-white dark:bg-[#21262d] border border-slate-200 dark:border-slate-800 rounded-lg hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer select-none transition-all"
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
            <span className="tracking-wider">
              {filters.sortDir === 'asc' ? 'ASC' : 'DESC'}
            </span>
          </button>
        </div>

        {/* Pulsante Reset Filtri */}
        {isFiltered && (
          <button
            type="button"
            className="w-full lg:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.75 text-[13px] font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-lg hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white hover:border-red-600 shadow-xs cursor-pointer select-none transition-all lg:ml-auto group"
            onClick={() => (onResetFilters ? onResetFilters() : onFilterChange(DEFAULT_ISSUE_FILTERS))}
            title="Ripristina filtri e ordinamento di default"
            aria-label="Resetta filtri"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
            {activeCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 text-[11px] font-bold bg-red-600 text-white rounded-full group-hover:bg-white group-hover:text-red-600 transition-colors">
                {activeCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* 2. Riga Inferiore: Pillole Filtri Attivi & Conteggio Risultati */}
      {(isFiltered || totalCount !== undefined) && (
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-2.5 pt-2.5 border-t border-dashed border-slate-200 dark:border-slate-800">
          {/* Chip dei filtri applicati */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1">
              <SlidersHorizontal size={13} />
              <span>Filtri attivi:</span>
            </span>

            {/* Chip Ricerca Testo */}
            {filters.search && filters.search.trim().length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full">
                <Search size={12} />
                <span>Testo: &ldquo;{filters.search}&rdquo;</span>
                <button
                  type="button"
                  className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors ml-0.5 cursor-pointer"
                  onClick={() => updateField('search', '')}
                  aria-label="Rimuovi filtro testo"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {/* Chip Stato */}
            {filters.state && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium text-slate-800 dark:text-slate-200 bg-white dark:bg-[#21262d] border border-teal-500/30 rounded-full">
                <CircleDot size={12} className="text-teal-600 dark:text-teal-400" />
                <span>Stato: {STATUS_CONFIG[filters.state]?.label || filters.state}</span>
                <button
                  type="button"
                  className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors ml-0.5 cursor-pointer"
                  onClick={() => updateField('state', undefined)}
                  aria-label="Rimuovi filtro stato"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {/* Chip Tipo */}
            {filters.type && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium text-slate-800 dark:text-slate-200 bg-white dark:bg-[#21262d] border border-indigo-500/30 rounded-full">
                <Layers size={12} className="text-indigo-600 dark:text-indigo-400" />
                <span>Tipo: {TYPE_CONFIG[filters.type]?.label || filters.type}</span>
                <button
                  type="button"
                  className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors ml-0.5 cursor-pointer"
                  onClick={() => updateField('type', undefined)}
                  aria-label="Rimuovi filtro tipo"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {/* Chip Priorità */}
            {filters.priority && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium text-slate-800 dark:text-slate-200 bg-white dark:bg-[#21262d] border border-orange-500/30 rounded-full">
                <Flame size={12} className="text-orange-600 dark:text-orange-400" />
                <span>Priorità: {PRIORITY_CONFIG[filters.priority]?.label || filters.priority}</span>
                <button
                  type="button"
                  className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors ml-0.5 cursor-pointer"
                  onClick={() => updateField('priority', undefined)}
                  aria-label="Rimuovi filtro priorità"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {/* Chip Assegnatario */}
            {filters.assignedToId !== undefined && selectedAssignee && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium text-slate-800 dark:text-slate-200 bg-white dark:bg-[#21262d] border border-blue-500/30 rounded-full">
                <User size={12} className="text-blue-600 dark:text-blue-400" />
                <span>Assegnato a: {selectedAssignee.username}</span>
                <button
                  type="button"
                  className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors ml-0.5 cursor-pointer"
                  onClick={() => updateField('assignedToId', undefined)}
                  aria-label="Rimuovi filtro assegnatario"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {/* Chip Label */}
            {filters.labelId !== undefined && selectedLabel && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium text-slate-800 dark:text-slate-200 bg-white dark:bg-[#21262d] border border-slate-300 dark:border-slate-700 rounded-full">
                <Tag size={12} />
                {selectedLabel.color && (
                  <span
                    className="w-2 h-2 rounded-full shrink-0 inline-block"
                    style={{ backgroundColor: selectedLabel.color }}
                  />
                )}
                <span>Label: {selectedLabel.name}</span>
                <button
                  type="button"
                  className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors ml-0.5 cursor-pointer"
                  onClick={() => updateField('labelId', undefined)}
                  aria-label="Rimuovi filtro etichetta"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {activeCount === 0 && !filters.search && (
              <span className="text-xs text-slate-400 dark:text-slate-500 italic">Nessun filtro attivo (visualizzazione completa)</span>
            )}
          </div>

          {/* Conteggio Risultati */}
          {(filteredCount !== undefined || totalCount !== undefined) && (
            <div className="text-[13px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
              {filteredCount !== undefined && totalCount !== undefined && filteredCount !== totalCount ? (
                <span>
                  Mostrando <strong className="text-slate-900 dark:text-slate-100 font-semibold">{filteredCount}</strong> di{' '}
                  <strong className="text-slate-900 dark:text-slate-100 font-semibold">{totalCount}</strong> issue
                </span>
              ) : (
                <span>
                  <strong className="text-slate-900 dark:text-slate-100 font-semibold">{filteredCount ?? totalCount}</strong>{' '}
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
