import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Singola opzione per il Custom Filter Dropdown.
 */
export interface FilterDropdownOption {
  value: string;
  label: string;
  shortLabel?: string;
  icon?: React.ReactNode;
  colorDot?: string;
}

export interface FilterDropdownProps {
  label?: string;
  topLabel?: string;
  prefix?: string;
  icon: React.ReactNode;
  value: string;
  options: FilterDropdownOption[];
  onChange: (value: string) => void;
  title?: string;
  isActive?: boolean;
  className?: string;
  buttonClassName?: string;
}

/**
 * Componente Custom Dropdown compatto con altezza massima controllata e scrollbar interna.
 */
export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  label,
  topLabel,
  prefix,
  icon,
  value,
  options,
  onChange,
  title,
  isActive = false,
  className = '',
  buttonClassName = '',
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
  const displayText = selectedOption
    ? (selectedOption.shortLabel || selectedOption.label)
    : (label || 'Tutti');

  let chevronColor = 'text-slate-400 dark:text-slate-500';
  if (isOpen) {
    chevronColor = 'rotate-180 text-blue-600 dark:text-blue-400';
  } else if (isActive) {
    chevronColor = 'text-blue-500 dark:text-blue-400';
  }

  return (
    <div className={`flex flex-col gap-1 min-w-0 ${className}`} ref={dropdownRef} title={title}>
      {topLabel && (
        <div className="flex items-center gap-1.25 px-0.5 select-none min-w-0">
          <span className={`inline-flex items-center justify-center shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>
            {icon}
          </span>
          <span className={`text-[11px] font-bold uppercase tracking-wider truncate ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
            {topLabel}
          </span>
          {isActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 ml-auto shrink-0" />
          )}
        </div>
      )}

      <div className="relative w-full min-w-0">
        <button
          type="button"
          className={`w-full inline-flex items-center justify-between gap-1.5 px-3 py-2 text-[13px] rounded-lg cursor-pointer select-none whitespace-nowrap transition-colors border outline-none h-9.5 ${
            isActive
              ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 font-semibold shadow-xs'
              : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-100 bg-white dark:bg-[#21262d] font-medium hover:border-slate-400 dark:hover:border-slate-600 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800'
          } ${
            isOpen ? 'border-blue-600 dark:border-blue-500 ring-3 ring-blue-600/15 dark:ring-blue-500/25' : ''
          } ${buttonClassName}`}
          onClick={() => setIsOpen((prev) => !prev)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <div className="inline-flex items-center gap-1.5 min-w-0 truncate">
            {selectedOption?.colorDot && (
              <span
                className="w-2 h-2 rounded-full shrink-0 inline-block"
                style={{ backgroundColor: selectedOption.colorDot }}
              />
            )}
            {!topLabel && (
              <>
                <span className={`inline-flex items-center justify-center shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>
                  {icon}
                </span>
                {prefix && (
                  <span className={`mr-1 font-normal ${isActive ? 'text-blue-600/75 dark:text-blue-400/75' : 'text-slate-400 dark:text-slate-500'}`}>
                    {prefix}:
                  </span>
                )}
              </>
            )}
            <span className={`truncate text-left ${isActive ? 'font-semibold' : ''}`}>
              {displayText}
            </span>
          </div>
          <ChevronDown
            size={13}
            className={`ml-1 shrink-0 transition-transform duration-150 ${chevronColor}`}
          />
        </button>

        {isOpen && (
          <div
            className="absolute top-[calc(100%+5px)] left-0 min-w-full max-w-xs max-h-55 overflow-y-auto bg-white dark:bg-[#21262d] border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg z-50 p-1 flex flex-col gap-0.5"
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
    </div>
  );
};
