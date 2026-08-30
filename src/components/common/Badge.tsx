import React from 'react';
import {
  CircleDashed,
  Clock,
  CheckCircle2,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Bug,
  Sparkles,
  CircleHelp,
  BookOpen,
  type LucideIcon,
} from 'lucide-react';
import type { IssueState, IssuePriority, IssueType } from '../../services/issueService';
import './Badge.css';

export type BadgeSize = 'sm' | 'md' | 'lg';
export type BadgeVariant = 'subtle' | 'solid' | 'outline' | 'pill';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode;
  icon?: LucideIcon | React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

/**
 * Componente Badge generico e versatile per etichette, tag e indicatori di stato.
 */
export const Badge: React.FC<BadgeProps> = ({
  children,
  icon: IconOrElement,
  variant = 'subtle',
  size = 'md',
  dot = false,
  className = '',
  ...rest
}) => {
  const sizeClass = `badge-${size}`;
  const variantClass = `badge-${variant}`;
  const isClickable = Boolean(rest.onClick);

  const renderIcon = () => {
    if (!IconOrElement) return null;

    // Se è un componente Lucide Icon
    if (typeof IconOrElement === 'function' || (typeof IconOrElement === 'object' && 'render' in (IconOrElement as any))) {
      const LucideComp = IconOrElement as LucideIcon;
      let iconSize = 13;
      if (size === 'sm') {
        iconSize = 12;
      } else if (size === 'lg') {
        iconSize = 15;
      }
      return <LucideComp size={iconSize} className="badge-icon" aria-hidden="true" />;
    }

    // Se è già un elemento JSX
    return <span className="badge-icon" aria-hidden="true">{IconOrElement}</span>;
  };

  return (
    <span
      className={`badge ${sizeClass} ${variantClass} ${isClickable ? 'badge-clickable' : ''} ${className}`}
      {...rest}
    >
      {dot && <span className="badge-dot" aria-hidden="true" />}
      {renderIcon()}
      {children && <span className="badge-label">{children}</span>}
    </span>
  );
};

/* ==========================================================================
   CONFIGURAZIONI STATO, PRIORITÀ E TIPO (DRY & Didattico)
   ========================================================================== */

export interface StatusBadgeConfig {
  label: string;
  icon: LucideIcon;
  className: string;
}

export interface PriorityBadgeConfig {
  label: string;
  icon: LucideIcon;
  className: string;
}

export interface TypeBadgeConfig {
  label: string;
  icon: LucideIcon;
  className: string;
}

export const STATUS_CONFIG: Record<IssueState, StatusBadgeConfig> = {
  TODO: {
    label: 'To Do',
    icon: CircleDashed,
    className: 'badge-status-todo',
  },
  INPROGRESS: {
    label: 'In Progress',
    icon: Clock,
    className: 'badge-status-inprogress',
  },
  CLOSED: {
    label: 'Closed',
    icon: CheckCircle2,
    className: 'badge-status-closed',
  },
};

export const PRIORITY_CONFIG: Record<IssuePriority, PriorityBadgeConfig> = {
  LOW: {
    label: 'Bassa',
    icon: ArrowDown,
    className: 'badge-priority-low',
  },
  MEDIUM: {
    label: 'Media',
    icon: ArrowRight,
    className: 'badge-priority-medium',
  },
  HIGH: {
    label: 'Alta',
    icon: ArrowUp,
    className: 'badge-priority-high',
  },
};

export const TYPE_CONFIG: Record<IssueType, TypeBadgeConfig> = {
  BUG: {
    label: 'Bug',
    icon: Bug,
    className: 'badge-type-bug',
  },
  FEATURE: {
    label: 'Feature',
    icon: Sparkles,
    className: 'badge-type-feature',
  },
  QUESTION: {
    label: 'Domanda',
    icon: CircleHelp,
    className: 'badge-type-question',
  },
  DOCUMENTATION: {
    label: 'Documentazione',
    icon: BookOpen,
    className: 'badge-type-documentation',
  },
};

/**
 * Restituisce la configurazione per un determinato stato della issue con fallback di sicurezza.
 */
export function getStatusConfig(status?: string | null): StatusBadgeConfig {
  if (status && status in STATUS_CONFIG) {
    return STATUS_CONFIG[status as IssueState];
  }
  return {
    label: status || 'Sconosciuto',
    icon: CircleDashed,
    className: 'badge-status-todo',
  };
}

/**
 * Restituisce la configurazione per una determinata priorità con fallback di sicurezza.
 */
export function getPriorityConfig(priority?: string | null): PriorityBadgeConfig {
  if (priority && priority in PRIORITY_CONFIG) {
    return PRIORITY_CONFIG[priority as IssuePriority];
  }
  return {
    label: priority || 'Non impostata',
    icon: ArrowRight,
    className: 'badge-priority-low',
  };
}

/**
 * Restituisce la configurazione per una determinata tipologia di issue con fallback di sicurezza.
 */
export function getTypeConfig(type?: string | null): TypeBadgeConfig {
  if (type && type in TYPE_CONFIG) {
    return TYPE_CONFIG[type as IssueType];
  }
  return {
    label: type || 'Issue',
    icon: Bug,
    className: 'badge-type-bug',
  };
}

/* ==========================================================================
   COMPONENTI SPECIALIZZATI
   ========================================================================== */

export interface StatusBadgeProps extends Omit<BadgeProps, 'children' | 'icon'> {
  status?: IssueState | null;
  showIcon?: boolean;
  customLabel?: string;
}

/**
 * Badge per renderizzare lo stato di una issue (TO-DO, INPROGRESS, CLOSED).
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showIcon = true,
  customLabel,
  variant = 'subtle',
  className = '',
  ...props
}) => {
  const config = getStatusConfig(status);

  return (
    <Badge
      icon={showIcon ? config.icon : undefined}
      variant={variant}
      className={`${config.className} ${className}`}
      title={`Stato: ${config.label}`}
      {...props}
    >
      {customLabel ?? config.label}
    </Badge>
  );
};

export interface PriorityBadgeProps extends Omit<BadgeProps, 'children' | 'icon'> {
  priority?: IssuePriority | null;
  showIcon?: boolean;
  customLabel?: string;
}

/**
 * Badge per renderizzare il livello di priorità di una issue (LOW, MEDIUM, HIGH).
 */
export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  showIcon = true,
  customLabel,
  variant = 'subtle',
  className = '',
  ...props
}) => {
  const config = getPriorityConfig(priority);

  return (
    <Badge
      icon={showIcon ? config.icon : undefined}
      variant={variant}
      className={`${config.className} ${className}`}
      title={`Priorità: ${config.label}`}
      {...props}
    >
      {customLabel ?? config.label}
    </Badge>
  );
};

export interface TypeBadgeProps extends Omit<BadgeProps, 'children' | 'icon'> {
  type?: IssueType | null;
  showIcon?: boolean;
  customLabel?: string;
}

/**
 * Badge per renderizzare la tipologia di una issue (BUG, FEATURE, QUESTION, DOCUMENTATION).
 */
export const TypeBadge: React.FC<TypeBadgeProps> = ({
  type,
  showIcon = true,
  customLabel,
  variant = 'subtle',
  className = '',
  ...props
}) => {
  const config = getTypeConfig(type);

  return (
    <Badge
      icon={showIcon ? config.icon : undefined}
      variant={variant}
      className={`${config.className} ${className}`}
      title={`Tipo: ${config.label}`}
      {...props}
    >
      {customLabel ?? config.label}
    </Badge>
  );
};
