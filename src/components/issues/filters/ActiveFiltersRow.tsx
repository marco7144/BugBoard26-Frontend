import React from 'react';
import { SlidersHorizontal,Search,X,CircleDot,Layers,Flame,User,Tag } from 'lucide-react';
import type { IssueFilterState } from '../IssueFilterBar';
import type { UserResponseDto } from '../../../services/projectService';
import type { LabelResponseDto } from '../../../services/labelService';
import { STATUS_CONFIG, PRIORITY_CONFIG, TYPE_CONFIG } from '../../common/Badge';

export interface ActiveFiltersRowProps {
  filters: IssueFilterState;
  activeCount: number;
  selectedAssignee?: UserResponseDto;
  isSelectedMe: boolean;
  assigneeDisplayName?: string;
  selectedLabel?: LabelResponseDto;
  filteredCount?: number;
  totalCount?: number;
  onUpdateField: <K extends keyof IssueFilterState>(key: K, value: IssueFilterState[K]) => void;
}

/**
 * Riga inferiore per la visualizzazione delle pillole dei filtri attivi e conteggio risultati.
 */
export const ActiveFiltersRow: React.FC<ActiveFiltersRowProps> = ({
  filters,
  activeCount,
  selectedAssignee,
  isSelectedMe,
  assigneeDisplayName,
  selectedLabel,
  filteredCount,
  totalCount,
  onUpdateField,
}) => {
  return (
    <div className="w-full flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-2.5 pt-2.5 border-t border-dashed border-slate-200 dark:border-slate-800">
      {/* Chip dei filtri applicati */}
      <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1 min-h-6.5">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1">
          <SlidersHorizontal size={13} />
          <span>Filtri attivi:</span>
        </span>

        {/* Chip Ricerca Testo */}
        {Boolean(filters.search && filters.search.trim().length > 0) && (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full">
            <Search size={12} />
            <span>Testo: &ldquo;{filters.search}&rdquo;</span>
            <button
              type="button"
              className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors ml-0.5 cursor-pointer"
              onClick={() => onUpdateField('search', '')}
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
              onClick={() => onUpdateField('state', undefined)}
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
              onClick={() => onUpdateField('type', undefined)}
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
              onClick={() => onUpdateField('priority', undefined)}
              aria-label="Rimuovi filtro priorità"
            >
              <X size={12} />
            </button>
          </span>
        )}

        {/* Chip Assegnatario */}
        {filters.assignedToId !== undefined && (selectedAssignee || isSelectedMe) && (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium text-slate-800 dark:text-slate-200 bg-white dark:bg-[#21262d] border border-blue-500/30 rounded-full">
            <User size={12} className="text-blue-600 dark:text-blue-400" />
            <span>Assegnato a: {assigneeDisplayName}</span>
            <button
              type="button"
              className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors ml-0.5 cursor-pointer"
              onClick={() => onUpdateField('assignedToId', undefined)}
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
              onClick={() => onUpdateField('labelId', undefined)}
              aria-label="Rimuovi filtro etichetta"
            >
              <X size={12} />
            </button>
          </span>
        )}

        {activeCount === 0 && !filters.search && (
          <span className="text-xs text-slate-400 dark:text-slate-500 italic h-6.5 flex items-center">
            Nessun filtro attivo (visualizzazione completa)
          </span>
        )}
      </div>

      {/* Conteggio Risultati */}
      {(filteredCount !== undefined || totalCount !== undefined) && (
        <div className="text-[13px] text-slate-600 dark:text-slate-400 whitespace-nowrap sm:ml-auto">
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
  );
};
