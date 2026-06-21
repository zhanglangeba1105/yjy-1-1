import * as React from 'react';
import { cn } from '@/lib/utils';
import { Inbox } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface EmptyProps {
  icon?: LucideIcon;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  iconClassName?: string;
}

export const Empty: React.FC<EmptyProps> = ({
  icon: Icon = Inbox,
  title = '暂无数据',
  description,
  action,
  className,
  iconClassName,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'py-12 px-6',
        className
      )}
    >
      <div
        className={cn(
          'mb-5 p-5 rounded-2xl',
          'bg-dark-card border border-dark-border',
          iconClassName
        )}
      >
        <Icon className="w-12 h-12 text-gray-500" strokeWidth={1.5} />
      </div>

      <h3 className="text-lg font-semibold text-gray-300 mb-2">{title}</h3>

      {description && (
        <p className="text-sm text-gray-500 max-w-sm leading-relaxed mb-6">
          {description}
        </p>
      )}

      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};
Empty.displayName = 'Empty';
