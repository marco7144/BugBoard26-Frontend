import React from 'react';
import { X } from 'lucide-react';
import type { LabelResponseDto } from '../../services/labelService';
import './Labels.css';

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
      {showDot && <span className="label-badge-dot" style={{ backgroundColor: hex }} />}
      <span className="label-badge-name">{displayName}</span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={`label-badge label-badge--${size} label-badge--clickable ${className}`.trim()}
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
      className={`label-badge label-badge--${size} ${className}`.trim()}
      style={style}
      title={badgeTitle}
    >
      {badgeContent}
      {onRemove && (
        <button
          type="button"
          className="label-badge-remove-btn"
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
