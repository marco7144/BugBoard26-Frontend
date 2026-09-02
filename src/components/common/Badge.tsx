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

const SIZE_CONFIG: Record<BadgeSize, { badge: string; dot: string; iconSize: number; radius: string }> = {
  sm: {
    badge: 'text-[11px] px-1.5 py-0.5 gap-1',
    dot: 'w-[5px] h-[5px]',
    iconSize: 12,
    radius: 'rounded-[4px]',
  },
  md: {
    badge: 'text-xs px-2 py-[3px] gap-1.25',
    dot: 'w-1.5 h-1.5',
    iconSize: 13,
    radius: 'rounded-md',
  },
  lg: {
    badge: 'text-[13px] px-2.5 py-1 gap-1.5',
    dot: 'w-[7px] h-[7px]',
    iconSize: 15,
    radius: 'rounded-lg',
  },
};

const VARIANT_CONFIG: Record<BadgeVariant, string> = {
  solid: 'bg-blue-600 dark:bg-blue-500 text-white border border-blue-600 dark:border-blue-500',
  outline: 'bg-transparent text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700',
  subtle: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
  pill: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
};

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
  const currentSize = SIZE_CONFIG[size] || SIZE_CONFIG.md;
  const isClickable = Boolean(rest.onClick);
  const radiusClass = variant === 'pill' ? 'rounded-full' : currentSize.radius;

  // Stile di fallback solo se il consumer non ha specificato classi custom di background o bordo
  const defaultVariantStyle = VARIANT_CONFIG[variant] || VARIANT_CONFIG.subtle;
  const hasColorClass = className.includes('bg-') || className.includes('text-');
  const variantClasses = hasColorClass ? '' : defaultVariantStyle;

  const renderIcon = () => {
    if (!IconOrElement) return null;

    // Se è un componente Lucide Icon
    if (typeof IconOrElement === 'function' || (typeof IconOrElement === 'object' && 'render' in (IconOrElement as any))) {
      const LucideComp = IconOrElement as LucideIcon;
      return (
        <LucideComp
          size={currentSize.iconSize}
          className="inline-flex items-center justify-center shrink-0"
          aria-hidden="true"
        />
      );
    }

    // Se è già un elemento JSX
    return (
      <span className="inline-flex items-center justify-center shrink-0" aria-hidden="true">
        {IconOrElement}
      </span>
    );
  };

  return (
    <span
      className={`inline-flex items-center justify-center font-semibold tracking-wide select-none whitespace-nowrap leading-none align-middle box-border transition-all duration-150 ${currentSize.badge} ${radiusClass} ${variantClasses} ${
        isClickable ? 'cursor-pointer hover:brightness-95 hover:-translate-y-px active:translate-y-0' : ''
      } ${className}`}
      {...rest}
    >
      {dot && <span className={`${currentSize.dot} rounded-full bg-current shrink-0`} aria-hidden="true" />}
      {renderIcon()}
      {children && <span className="inline-block">{children}</span>}
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
    className: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/80 dark:border-slate-700',
  },
  INPROGRESS: {
    label: 'In Progress',
    icon: Clock,
    className: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-300/80 dark:border-amber-900/50',
  },
  CLOSED: {
    label: 'Closed',
    icon: CheckCircle2,
    className: 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border border-teal-300/80 dark:border-teal-900/50',
  },
};

export const PRIORITY_CONFIG: Record<IssuePriority, PriorityBadgeConfig> = {
  LOW: {
    label: 'Bassa',
    icon: ArrowDown,
    className: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300/80 dark:border-slate-700',
  },
  MEDIUM: {
    label: 'Media',
    icon: ArrowRight,
    className: 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-orange-300/80 dark:border-orange-900/50',
  },
  HIGH: {
    label: 'Alta',
    icon: ArrowUp,
    className: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-300/80 dark:border-red-900/50',
  },
};

export const TYPE_CONFIG: Record<IssueType, TypeBadgeConfig> = {
  BUG: {
    label: 'Bug',
    icon: Bug,
    className: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-300/80 dark:border-red-900/50',
  },
  FEATURE: {
    label: 'Feature',
    icon: Sparkles,
    className: 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-orange-300/80 dark:border-orange-900/50',
  },
  QUESTION: {
    label: 'Domanda',
    icon: CircleHelp,
    className: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-300/80 dark:border-indigo-900/50',
  },
  DOCUMENTATION: {
    label: 'Documentazione',
    icon: BookOpen,
    className: 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border border-teal-300/80 dark:border-teal-900/50',
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
    className: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/80 dark:border-slate-700',
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
    className: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300/80 dark:border-slate-700',
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
    className: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-300/80 dark:border-red-900/50',
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

