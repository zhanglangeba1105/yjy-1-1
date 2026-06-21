import * as React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'default';
type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  primary:
    'bg-primary/15 text-primary border border-primary/30',
  success:
    'bg-success/15 text-success border border-success/30',
  danger:
    'bg-danger/15 text-danger border border-danger/30',
  warning:
    'bg-warning/15 text-warning border border-warning/30',
  info:
    'bg-info/15 text-info border border-info/30',
  default:
    'bg-gray-500/15 text-gray-400 border border-gray-500/30',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
};

const dotColors: Record<BadgeVariant, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  danger: 'bg-danger',
  warning: 'bg-warning',
  info: 'bg-info',
  default: 'bg-gray-500',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  dot = false,
  className,
  children,
  ...props
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full border',
        'transition-colors duration-200',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            'shadow-[0_0_6px_currentColor]',
            dotColors[variant]
          )}
        />
      )}
      {children}
    </span>
  );
};
Badge.displayName = 'Badge';
