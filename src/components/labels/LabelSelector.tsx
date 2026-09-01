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
import './Labels.css';

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

  const renderLabelsList = () => {
    if (filteredLabels.length > 0) {
      return filteredLabels.map((lbl) => {
        if (lbl.id === undefined) return null;
        const isSelected = selectedLabelIds.includes(lbl.id);
        return (
          <button
            key={lbl.id}
            type="button"
            className={`label-selector-item ${isSelected ? 'label-selector-item--selected' : ''}`}
            onClick={() => handleToggleLabel(lbl.id!)}
            aria-pressed={isSelected}
          >
            <span
              className="label-selector-item-dot"
              style={{ backgroundColor: lbl.color || '#3b82f6' }}
            />
            <span className="label-selector-item-name">{lbl.name}</span>
            {isSelected && <Check size={14} className="label-selector-item-check" />}
          </button>
        );
      });
    }

    if (!allowCreate || !normalizedQuery) {
      return <div className="label-selector-empty">Nessuna etichetta disponibile</div>;
    }

    return null;
  };

  return (
    <div
      className={`label-selector ${disabled ? 'label-selector--disabled' : ''} ${className}`.trim()}
      ref={containerRef}
      id={id}
    >
      {/* Pulsante Trigger */}
      <button
        type="button"
        className={`label-selector-trigger ${isOpen ? 'label-selector-trigger--open' : ''} ${
          selectedLabelIds.length > 0 ? 'label-selector-trigger--active' : ''
        }`}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        disabled={disabled}
        aria-expanded={isOpen}
      >
        <div className="label-selector-trigger-left">
          <Tag size={15} className="label-selector-icon" aria-hidden="true" />
          <span className={`label-selector-trigger-text ${selectedLabels.length === 0 ? 'label-selector-placeholder' : ''}`}>
            {summaryText}
          </span>
        </div>
        <ChevronDown
          size={15}
          className={`label-selector-chevron ${isOpen ? 'label-selector-chevron--rotated' : ''}`}
          aria-hidden="true"
        />
      </button>

      {/* Menu Dropdown */}
      {isOpen && (
        <div className="label-selector-dropdown">
          {/* Barra Ricerca Live */}
          <div className="label-selector-search-box">
            <Search size={14} className="label-selector-search-icon" aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="text"
              className="label-selector-search-input"
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
                className="label-selector-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Cancella ricerca"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Lista Etichette */}
          <div className="label-selector-list">
            {renderLabelsList()}
          </div>

          {/* Creazione Rapida Inline */}
          {allowCreate && normalizedQuery.length > 0 && !exactMatchExists && (
            <div className="label-selector-create-panel">
              {createError && (
                <div className="label-selector-create-error" role="alert">
                  <AlertCircle size={13} />
                  <span>{createError}</span>
                </div>
              )}

              <div className="label-selector-create-header">
                <span>{filteredLabels.length === 0 ? 'Nessun risultato. ' : ''}Crea:</span>
                <strong className="label-selector-create-name">&ldquo;{searchQuery.trim()}&rdquo;</strong>
              </div>

              {/* Palette 8 Colori */}
              <div className="label-selector-palette" title="Scegli un colore per l'etichetta">
                {PRESET_LABEL_COLORS.map((col) => (
                  <button
                    key={col}
                    type="button"
                    className={`label-selector-color-btn ${selectedColor === col ? 'label-selector-color-btn--active' : ''}`}
                    style={{ backgroundColor: col }}
                    onClick={() => setSelectedColor(col)}
                    aria-label={`Colore ${col}`}
                  />
                ))}
              </div>

              <button
                type="button"
                className="label-selector-create-btn"
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
        <div className="label-selector-pills-row">
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
