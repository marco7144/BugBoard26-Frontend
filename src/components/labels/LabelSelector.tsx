import React, { useState, useEffect, useRef } from 'react';
import {
  Tag,
  ChevronDown,
  Search,
  X,
  Check,
  Plus,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { labelService, type LabelResponseDto } from '../../services/labelService';
import { LabelBadge } from './LabelBadge';

/** 8 tonalità di colore predefinite e armoniose per la creazione rapida delle etichette */
export const PRESET_LABEL_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#64748b', // Slate
];

export interface LabelSelectorProps {
  /** Array di ID delle etichette attualmente selezionate */
  selectedLabelIds: number[];
  /** Callback invocata quando la selezione delle etichette cambia */
  onChange: (selectedIds: number[]) => void;
  /** Lista delle etichette disponibili (opzionale, caricata automaticamente se assente) */
  availableLabels?: LabelResponseDto[];
  /** Callback opzionale invocata quando una nuova etichetta viene creata inline */
  onLabelCreated?: (newLabel: LabelResponseDto) => void;
  /** Abilita la creazione rapida di nuove etichette (default: true) */
  allowCreate?: boolean;
  /** Testo segnaposto quando non ci sono selezioni */
  placeholder?: string;
  /** Disabilita il selettore */
  disabled?: boolean;
  /** Classe CSS aggiuntiva */
  className?: string;
  /** Identificativo univoco */
  id?: string;
}

/**
 * Componente Selettore Multiplo di Etichette / Labels (Step 18 - KISS & Didattico).
 */
export const LabelSelector: React.FC<LabelSelectorProps> = ({
  selectedLabelIds,
  onChange,
  availableLabels: propAvailableLabels,
  onLabelCreated,
  allowCreate = true,
  placeholder = 'Seleziona o crea etichette...',
  disabled = false,
  className = '',
  id,
}) => {
  const [internalLabels, setInternalLabels] = useState<LabelResponseDto[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(PRESET_LABEL_COLORS[0]);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Lista etichette effettiva (senza useMemo superfluo)
  const labelsList = propAvailableLabels && propAvailableLabels.length > 0
    ? propAvailableLabels
    : internalLabels;

  // Caricamento iniziale etichette se non fornite dall'esterno
  useEffect(() => {
    if (propAvailableLabels && propAvailableLabels.length > 0) return;
    labelService
      .getAllLabels()
      .then((data) => setInternalLabels(Array.isArray(data) ? data : []))
      .catch(() => setInternalLabels([]));
  }, [propAvailableLabels]);

  // Focus automatico sul campo di ricerca all'apertura
  useEffect(() => {
    if (isOpen) searchInputRef.current?.focus();
  }, [isOpen]);

  // Chiusura al click esterno o pressione tasto Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEvents = (e: MouseEvent | KeyboardEvent) => {
      if (
        (e instanceof MouseEvent && containerRef.current && !containerRef.current.contains(e.target as Node)) ||
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

  // Toggle selezione singola etichetta
  const handleToggleLabel = (labelId: number) => {
    if (disabled) return;
    const isSelected = selectedLabelIds.includes(labelId);
    onChange(isSelected ? selectedLabelIds.filter((i) => i !== labelId) : [...selectedLabelIds, labelId]);
  };

  // Creazione rapida di una nuova etichetta inline
  const handleCreateLabel = async () => {
    const name = searchQuery.trim();
    if (!name || disabled || !allowCreate) return;

    // Controllo client-side duplicati
    if (labelsList.some((l) => (l.name || '').trim().toLowerCase() === name.toLowerCase())) {
      setCreateError(`Un'etichetta con il nome "${name}" esiste già.`);
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const newLabel = await labelService.createLabel({ name, color: selectedColor });
      if (newLabel?.id !== undefined) {
        setInternalLabels((prev) => (prev.some((l) => l.id === newLabel.id) ? prev : [...prev, newLabel]));
        onLabelCreated?.(newLabel);
        if (!selectedLabelIds.includes(newLabel.id)) {
          onChange([...selectedLabelIds, newLabel.id]);
        }
        setSearchQuery('');
      }
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Errore durante la creazione dell'etichetta.");
    } finally {
      setIsCreating(false);
    }
  };

  // Filtro ricerca live
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredLabels = labelsList.filter((lbl) =>
    (lbl.name || '').toLowerCase().includes(normalizedQuery)
  );
  const exactMatchExists = labelsList.some(
    (lbl) => (lbl.name || '').trim().toLowerCase() === normalizedQuery
  );

  // Etichette attualmente selezionate
  const selectedLabels = selectedLabelIds
    .map((lblId) => labelsList.find((l) => l.id === lblId))
    .filter((l): l is LabelResponseDto => Boolean(l));

  const selectedCount = selectedLabels.length;
  const countSuffix = selectedCount === 1 ? 'a' : 'e';
  const summaryText = selectedCount === 0
    ? placeholder
    : `${selectedCount} etichett${countSuffix} selezionat${countSuffix}`;

  let triggerBorderClass = 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600';
  if (isOpen) {
    triggerBorderClass = 'border-blue-600 dark:border-blue-500 ring-3 ring-blue-600/15';
  } else if (selectedLabelIds.length > 0) {
    triggerBorderClass = 'border-slate-300 dark:border-slate-600';
  }

  const renderLabelsList = () => {
    if (filteredLabels.length > 0) {
      return filteredLabels.map((lbl) => {
        if (lbl.id === undefined) return null;
        const isSelected = selectedLabelIds.includes(lbl.id);
        return (
          <button
            key={lbl.id}
            type="button"
            className={`w-full flex items-center gap-2 px-2.5 py-1.75 bg-transparent border-none rounded-md cursor-pointer text-left font-sans transition-colors ${
              isSelected
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            onClick={() => handleToggleLabel(lbl.id!)}
            aria-pressed={isSelected}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: lbl.color || '#3b82f6' }}
            />
            <span className="flex-1 text-[13px] truncate">{lbl.name}</span>
            {isSelected && <Check size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />}
          </button>
        );
      });
    }

    if (!allowCreate || !normalizedQuery) {
      return <div className="p-3 text-center text-xs text-slate-400 dark:text-slate-500">Nessuna etichetta disponibile</div>;
    }

    return null;
  };

  return (
    <div
      className={`relative w-full flex flex-col gap-2 ${disabled ? 'opacity-60 pointer-events-none' : ''} ${className}`.trim()}
      ref={containerRef}
      id={id}
    >
      {/* Pulsante Trigger */}
      <button
        type="button"
        className={`w-full flex items-center justify-between px-3 py-2 min-h-10 bg-white dark:bg-[#1e293b] border rounded-lg cursor-pointer text-left font-sans transition-all outline-none ${triggerBorderClass}`}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        disabled={disabled}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Tag
            size={15}
            className={`shrink-0 ${
              selectedLabelIds.length > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
            }`}
            aria-hidden="true"
          />
          <span
            className={`text-[13px] font-medium truncate ${
              selectedLabels.length === 0
                ? 'text-slate-400 dark:text-slate-500 font-normal'
                : 'text-slate-900 dark:text-slate-100'
            }`}
          >
            {summaryText}
          </span>
        </div>
        <ChevronDown
          size={15}
          className={`text-slate-400 dark:text-slate-500 ml-2 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Menu Dropdown */}
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl z-50 flex flex-col overflow-hidden animate-in fade-in duration-100">
          {/* Barra Ricerca Live */}
          <div className="flex items-center gap-1.5 px-2.5 py-2 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
            <Search size={14} className="text-slate-400 dark:text-slate-500 shrink-0" aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="text"
              className="flex-1 border-none bg-transparent text-[13px] text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400"
              placeholder="Cerca o scrivi nuova etichetta..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (createError) setCreateError(null);
              }}
              aria-label="Cerca etichetta"
            />
            {searchQuery && (
              <button
                type="button"
                className="bg-transparent border-none text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer flex items-center p-0"
                onClick={() => setSearchQuery('')}
                aria-label="Cancella ricerca"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Lista Etichette */}
          <div className="max-h-45 overflow-y-auto p-1 flex flex-col gap-0.5">
            {renderLabelsList()}
          </div>

          {/* Creazione Rapida Inline */}
          {allowCreate && normalizedQuery.length > 0 && !exactMatchExists && (
            <div className="p-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex flex-col gap-2">
              {createError && (
                <div className="flex items-center gap-1 px-2 py-1 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded text-xs" role="alert">
                  <AlertCircle size={13} className="shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 truncate">
                <span>{filteredLabels.length === 0 ? 'Nessun risultato. ' : ''}Crea:</span>
                <strong className="text-blue-600 dark:text-blue-400 font-semibold truncate">&ldquo;{searchQuery.trim()}&rdquo;</strong>
              </div>

              {/* Palette 8 Colori */}
              <div className="flex items-center gap-1.5 flex-wrap" title="Scegli un colore per l'etichetta">
                {PRESET_LABEL_COLORS.map((col) => (
                  <button
                    key={col}
                    type="button"
                    className={`w-4.5 h-4.5 rounded-full border-2 cursor-pointer transition-transform hover:scale-115 ${
                      selectedColor === col
                        ? 'border-slate-900 dark:border-slate-100 scale-115 ring-2 ring-white dark:ring-slate-900'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: col }}
                    onClick={() => setSelectedColor(col)}
                    aria-label={`Colore ${col}`}
                  />
                ))}
              </div>

              <button
                type="button"
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-md text-xs font-medium cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={handleCreateLabel}
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Creazione...</span>
                  </>
                ) : (
                  <>
                    <Plus size={14} />
                    <span>Crea e Seleziona</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Pillole Selezionate */}
      {selectedLabels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-0.5">
          {selectedLabels.map((lbl) => {
            if (lbl.id === undefined) return null;
            return (
              <LabelBadge
                key={lbl.id}
                label={lbl}
                size="sm"
                onRemove={disabled ? undefined : () => handleToggleLabel(lbl.id!)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
