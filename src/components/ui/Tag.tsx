import * as React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

type TagVariant = 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'default' | 'pink' | 'purple' | 'teal';

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: TagVariant;
  closable?: boolean;
  onClose?: () => void;
  className?: string;
  children?: React.ReactNode;
}

const variantClasses: Record<TagVariant, string> = {
  primary:
    'bg-primary/20 text-primary border-primary/40 hover:bg-primary/30',
  success:
    'bg-success/20 text-success border-success/40 hover:bg-success/30',
  danger:
    'bg-danger/20 text-danger border-danger/40 hover:bg-danger/30',
  warning:
    'bg-warning/20 text-warning border-warning/40 hover:bg-warning/30',
  info:
    'bg-info/20 text-info border-info/40 hover:bg-info/30',
  default:
    'bg-gray-500/20 text-gray-300 border-gray-500/40 hover:bg-gray-500/30',
  pink:
    'bg-[#FF4081]/20 text-[#FF80AB] border-[#FF4081]/40 hover:bg-[#FF4081]/30',
  purple:
    'bg-[#B388FF]/20 text-[#B388FF] border-[#B388FF]/40 hover:bg-[#B388FF]/30',
  teal:
    'bg-[#64FFDA]/20 text-[#64FFDA] border-[#64FFDA]/40 hover:bg-[#64FFDA]/30',
};

const closeBtnColors: Record<TagVariant, string> = {
  primary: 'hover:bg-primary/40',
  success: 'hover:bg-success/40',
  danger: 'hover:bg-danger/40',
  warning: 'hover:bg-warning/40',
  info: 'hover:bg-info/40',
  default: 'hover:bg-gray-500/40',
  pink: 'hover:bg-[#FF4081]/40',
  purple: 'hover:bg-[#B388FF]/40',
  teal: 'hover:bg-[#64FFDA]/40',
};

export const Tag: React.FC<TagProps> = ({
  variant = 'default',
  closable = false,
  onClose,
  className,
  children,
  onClick,
  ...props
}) => {
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose?.();
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5',
        'px-2.5 py-1 text-xs font-medium rounded-lg border',
        'transition-all duration-200 ease-out',
        variantClasses[variant],
        onClick && 'cursor-pointer select-none',
        className
      )}
      onClick={onClick}
      {...props}
    >
      <span>{children}</span>
      {closable && (
        <button
          type="button"
          onClick={handleClose}
          className={cn(
            '-mr-1 ml-0.5 -my-1',
            'w-5 h-5 flex items-center justify-center rounded-md',
            'opacity-70 hover:opacity-100',
            'transition-all duration-150',
            closeBtnColors[variant],
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/50'
          )}
          aria-label="删除标签"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
};
Tag.displayName = 'Tag';
