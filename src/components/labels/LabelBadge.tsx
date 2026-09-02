import React from 'react';
import { X } from 'lucide-react';
import type { LabelResponseDto } from '../../services/labelService';

export type LabelBadgeSize = 'sm' | 'md' | 'lg';

export interface LabelBadgeProps {
  label?: LabelResponseDto | null;
  name?: string;
  color?: string | null;
  size?: LabelBadgeSize;
  showDot?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
  title?: string;
  className?: string;
}

const REMOVE_ICON_SIZES: Record<LabelBadgeSize, number> = {
  sm: 11,
  md: 12,
  lg: 14,
};

const SIZE_CLASSES: Record<LabelBadgeSize, { badge: string; dot: string }> = {
  sm: { badge: 'text-[11px] px-1.5 py-0.5 rounded-[4px]', dot: 'w-1.25 h-1.25' },
  md: { badge: 'text-xs px-2 py-0.75 rounded-md', dot: 'w-1.5 h-1.5' },
  lg: { badge: 'text-[13px] px-2.5 py-1 rounded-lg', dot: 'w-1.75 h-1.75' },
};

/**
 * Componente Atomico di Presentazione: LabelBadge (Step 18 - KISS & Sonar Clean).
 */
export const LabelBadge: React.FC<LabelBadgeProps> = ({
  label,
  name,
  color,
  size = 'md',
  showDot = true,
  onRemove,
  onClick,
  title,
  className = '',
}) => {
  const displayName = label?.name ?? name ?? 'Senza nome';
  const rawColor = (label?.color ?? color ?? '#64748b').trim();
  const hex = rawColor.startsWith('#') ? rawColor : `#${rawColor}`;
  const removeIconSize = REMOVE_ICON_SIZES[size];

  const style = {
    backgroundColor: `${hex}1A`,
    color: hex,
    borderColor: `${hex}33`,
  };

  const badgeTitle = title || `Etichetta: ${displayName}`;

  const badgeContent = (
    <>
      {showDot && (
        <span
          className={`${SIZE_CLASSES[size].dot} rounded-full shrink-0`}
          style={{ backgroundColor: hex }}
        />
      )}
      <span className="max-w-40 truncate">{displayName}</span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={`inline-flex items-center gap-1.25 font-sans font-medium leading-none whitespace-nowrap border select-none cursor-pointer transition-all hover:brightness-95 hover:-translate-y-px ${SIZE_CLASSES[size].badge} ${className}`.trim()}
        style={style}
        onClick={onClick}
        title={badgeTitle}
      >
        {badgeContent}
      </button>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.25 font-sans font-medium leading-none whitespace-nowrap border select-none ${SIZE_CLASSES[size].badge} ${className}`.trim()}
      style={style}
      title={badgeTitle}
    >
      {badgeContent}
      {onRemove && (
        <button
          type="button"
          className="inline-flex items-center justify-center bg-transparent border-none p-0 ml-0.5 text-current opacity-70 hover:opacity-100 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          title={`Rimuovi ${displayName}`}
          aria-label={`Rimuovi etichetta ${displayName}`}
        >
          <X size={removeIconSize} />
        </button>
      )}
    </span>
  );
};
