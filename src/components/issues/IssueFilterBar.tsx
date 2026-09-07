import React from 'react';
import {Search,X,RotateCcw,ArrowDownUp,ArrowDownWideNarrow,ArrowUpNarrowWide,User,Tag,Flame,CircleDot,Layers,Check} from 'lucide-react';
import type {IssuePriority,IssueState,IssueType,SortDirection} from '../../services/issueService';
import type {UserResponseDto} from '../../services/projectService';
import type {LabelResponseDto} from '../../services/labelService';
import {useAuth} from '../../context/AuthContext';
import {STATUS_CONFIG,PRIORITY_CONFIG,TYPE_CONFIG} from '../common/Badge';
import {FilterDropdown,type FilterDropdownOption} from './filters/FilterDropdown';
import {ActiveFiltersRow} from './filters/ActiveFiltersRow';

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
 * Verifica se sono presenti filtri attivi rispetto ai valori di default (escluso l'ordinamento).
 */
export function hasActiveFilters(filters: IssueFilterState): boolean {
  return getActiveFilterCount(filters) > 0;
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

  const { user } = useAuth();
  const isAssignedToMe = Boolean(user?.id && filters.assignedToId === user.id);

  // Aggiorna un singolo campo mantenendo gli altri
  const updateField = <K extends keyof IssueFilterState>(key: K, value: IssueFilterState[K]) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const toggleAssignedToMe = () => {
    if (!user?.id) return;
    updateField('assignedToId', isAssignedToMe ? undefined : user.id);
  };

  // Risoluzione etichette leggibili per i chip
  const selectedAssignee = participants.find((p) => p.id === filters.assignedToId);
  const isSelectedMe = Boolean(user?.id && filters.assignedToId === user.id);
  const assigneeDisplayName = isSelectedMe ? `Me (${user?.username})` : selectedAssignee?.username;
  const selectedLabel = labels.find((l) => l.id === filters.labelId);

  // Generazione opzioni per i Custom Dropdown
  const stateOptions: FilterDropdownOption[] = [
    { value: '', label: 'Tutti' },
    ...Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({ value: key, label: cfg.label })),
  ];

  const typeOptions: FilterDropdownOption[] = [
    { value: '', label: 'Tutti' },
    ...Object.entries(TYPE_CONFIG).map(([key, cfg]) => ({ value: key, label: cfg.label })),
  ];

  const priorityOptions: FilterDropdownOption[] = [
    { value: '', label: 'Tutte' },
    ...Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => ({ value: key, label: cfg.label })),
  ];

  const otherParticipants = participants.filter((p) => p.id !== user?.id);
  const assigneeOptions: FilterDropdownOption[] = [
    { value: '', label: 'Tutti' },
    ...(user?.id
      ? [{ value: String(user.id), label: `Me (${user.username})`, icon: <User size={13} /> }]
      : []),
    ...otherParticipants.map((p) => ({ value: String(p.id), label: p.username })),
  ];

  const labelOptions: FilterDropdownOption[] = [
    { value: '', label: 'Tutte' },
    ...labels.map((l) => ({ value: String(l.id), label: l.name, colorDot: l.color })),
  ];

  const sortOptions: FilterDropdownOption[] = SORT_FIELD_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }));

  return (
    <div className={`w-full box-border flex flex-col gap-3 bg-white dark:bg-[#161b22] border border-slate-300 dark:border-slate-700 rounded-xl p-3.5 sm:px-4.5 shadow-xs transition-colors hover:border-slate-400/80 dark:hover:border-slate-400/50 ${className}`}>
      {/* 1. Riga Superiore: Ricerca, Quick Toggle "Assegnate a me", Ordinamento & Reset */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 w-full">
        {/* Sezione Sinistra: Barra di Ricerca + Tasto "Assegnate a me" */}
        <div className="flex items-center gap-2 flex-1 min-w-60">
          {/* Campo Ricerca Testuale Flessibile */}
          <div className="relative flex-1 min-w-0 flex items-center">
            <Search size={16} className="absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none" aria-hidden="true" />
            <input
              type="text"
              className="w-full min-w-0 pl-9 pr-8 py-2 text-sm text-slate-900 dark:text-slate-100 bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-[#161b22] focus:ring-3 focus:ring-blue-600/15 dark:focus:ring-blue-500/25 transition-all h-9.5"
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

          {/* Quick Toggle: Assegnate a me */}
          {Boolean(user?.id) && (
            <button
              type="button"
              onClick={toggleAssignedToMe}
              className={`inline-flex items-center justify-center gap-1.5 shrink-0 px-2.5 sm:px-3 py-2 text-[13px] rounded-lg cursor-pointer select-none whitespace-nowrap transition-all border outline-none font-medium h-9.5 ${
                isAssignedToMe
                  ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 font-semibold ring-2 ring-blue-600/20 shadow-xs'
                  : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-100 bg-white dark:bg-[#21262d] hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              title={isAssignedToMe ? 'Rimuovi filtro: Mostra tutte le issue' : 'Mostra solo le issue assegnate a te'}
              aria-pressed={isAssignedToMe}
            >
              <User size={14} className={isAssignedToMe ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'} />
              <span>Assegnate a me</span>
              {isAssignedToMe && <Check size={13} className="text-blue-600 dark:text-blue-400 ml-0.5" />}
            </button>
          )}
        </div>

        {/* Sezione Destra: Ordinamento */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <FilterDropdown
            prefix="Ordina"
            icon={<ArrowDownUp size={14} />}
            value={filters.sortBy ?? 'creationDate'}
            options={sortOptions}
            onChange={(val) => updateField('sortBy', val)}
            title="Ordina per"
            className="w-48 sm:w-52 shrink-0"
          />

          <button
            type="button"
            className="inline-flex items-center justify-center w-9.5 h-9.5 shrink-0 text-slate-600 dark:text-slate-300 bg-white dark:bg-[#21262d] border border-slate-300 dark:border-slate-700 rounded-lg hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-600 cursor-pointer select-none transition-colors outline-none shadow-2xs"
            onClick={() =>
              updateField('sortDir', filters.sortDir === 'asc' ? 'desc' : 'asc')
            }
            title={
              filters.sortDir === 'asc'
                ? 'Ordinamento Crescente (clicca per invertire)'
                : 'Ordinamento Decrescente (clicca per invertire)'
            }
            aria-label={`Inverti direzione ordinamento. Attuale: ${
              filters.sortDir === 'asc' ? 'Crescente' : 'Decrescente'
            }`}
          >
            {filters.sortDir === 'asc' ? (
              <ArrowUpNarrowWide size={17} />
            ) : (
              <ArrowDownWideNarrow size={17} />
            )}
          </button>
        </div>
      </div>

      {/* 2. Riga Intermedia: I Dropdown dei Filtri con etichetta superiore */}
      <div className="flex flex-wrap items-end gap-2.5 w-full pt-1">
        {/* Filtro Stato */}
        <FilterDropdown
          topLabel="Stato"
          icon={<CircleDot size={12} />}
          value={filters.state ?? ''}
          options={stateOptions}
          onChange={(val) => updateField('state', val ? (val as IssueState) : undefined)}
          title="Filtra per Stato"
          isActive={Boolean(filters.state)}
          className="w-36.25 max-w-36.25 shrink-0"
        />

        {/* Filtro Tipo */}
        <FilterDropdown
          topLabel="Tipo"
          icon={<Layers size={12} />}
          value={filters.type ?? ''}
          options={typeOptions}
          onChange={(val) => updateField('type', val ? (val as IssueType) : undefined)}
          title="Filtra per Tipo"
          isActive={Boolean(filters.type)}
          className="w-41.25 max-w-41.25 shrink-0"
        />

        {/* Filtro Priorità */}
        <FilterDropdown
          topLabel="Priorità"
          icon={<Flame size={12} />}
          value={filters.priority ?? ''}
          options={priorityOptions}
          onChange={(val) => updateField('priority', val ? (val as IssuePriority) : undefined)}
          title="Filtra per Priorità"
          isActive={Boolean(filters.priority)}
          className="w-32.5 max-w-32.5 shrink-0"
        />

        {/* Filtro Assegnatario */}
        {participants.length > 0 && (
          <FilterDropdown
            topLabel="Assegnatario"
            icon={<User size={12} />}
            value={filters.assignedToId !== undefined ? String(filters.assignedToId) : ''}
            options={assigneeOptions}
            onChange={(val) => updateField('assignedToId', val ? Number(val) : undefined)}
            title="Filtra per Assegnatario"
            isActive={filters.assignedToId !== undefined}
            className="w-41.25 max-w-41.25 shrink-0"
          />
        )}

        {/* Filtro Label */}
        {labels.length > 0 && (
          <FilterDropdown
            topLabel="Etichetta"
            icon={<Tag size={12} />}
            value={filters.labelId !== undefined ? String(filters.labelId) : ''}
            options={labelOptions}
            onChange={(val) => updateField('labelId', val ? Number(val) : undefined)}
            title="Filtra per Etichetta"
            isActive={filters.labelId !== undefined}
            className="w-38.75 max-w-38.75 shrink-0"
          />
        )}

        {/* Pulsante Reset Filtri: Sempre posizionato nel DOM per riservare lo spazio con zero layout shift */}
        <div
          className={`flex items-center min-w-22.5 max-w-22.5 shrink-0 self-end transition-[opacity,transform] duration-200 ease-out mb-0.5 ${
            isFiltered
              ? 'opacity-100 scale-100 pointer-events-auto'
              : 'opacity-0 scale-95 pointer-events-none select-none'
          }`}
          aria-hidden={!isFiltered}
        >
          <button
            type="button"
            onClick={onResetFilters}
            disabled={!isFiltered}
            className="group flex items-center justify-center gap-1.5 w-full h-9 px-3 text-[13px] font-semibold text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-950/30 border border-red-200/80 dark:border-red-900/40 rounded-lg hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white hover:border-red-600 dark:hover:border-red-600 transition-all cursor-pointer shadow-2xs outline-none focus:ring-2 focus:ring-red-500/30"
            title="Ripristina tutti i filtri attivi"
            aria-label="Resetta filtri"
            tabIndex={isFiltered ? 0 : -1}
          >
            <RotateCcw size={14} />
            <span>Reset</span>
            {activeCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 text-[11px] font-bold bg-red-600 text-white rounded-full group-hover:bg-white group-hover:text-red-600 transition-colors">
                {activeCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 3. Riga Inferiore: Pillole Filtri Attivi & Conteggio Risultati */}
      {(isFiltered || totalCount !== undefined) && (
        <ActiveFiltersRow
          filters={filters}
          activeCount={activeCount}
          selectedAssignee={selectedAssignee}
          isSelectedMe={isSelectedMe}
          assigneeDisplayName={assigneeDisplayName}
          selectedLabel={selectedLabel}
          filteredCount={filteredCount}
          totalCount={totalCount}
          onUpdateField={updateField}
        />
      )}
    </div>
  );
};
