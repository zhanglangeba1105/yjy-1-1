import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'success' | 'warning';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';
type ButtonType = 'button' | 'submit' | 'reset';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: ButtonType;
  asChild?: boolean;
}

const Slot = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }>(
  ({ children, ...props }, ref) => {
    if (!React.isValidElement(children)) {
      return null;
    }
    return React.cloneElement(children as React.ReactElement<any>, {
      ...props,
      ref,
    });
  }
);
Slot.displayName = 'Slot';

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-primary to-neon-orange text-white shadow-neon-orange hover:shadow-[0_0_15px_rgba(255,140,66,0.8),0_0_30px_rgba(255,107,53,0.5)]',
  secondary:
    'bg-gradient-to-r from-secondary to-[#3d3a45] text-white border border-dark-border',
  danger:
    'bg-gradient-to-r from-danger to-[#ff5252] text-white shadow-[0_0_10px_rgba(229,57,53,0.5),0_0_20px_rgba(229,57,53,0.3)] hover:shadow-[0_0_15px_rgba(229,57,53,0.7),0_0_30px_rgba(229,57,53,0.4)]',
  success:
    'bg-gradient-to-r from-success to-[#66bb6a] text-white shadow-[0_0_10px_rgba(76,175,80,0.5),0_0_20px_rgba(76,175,80,0.3)] hover:shadow-[0_0_15px_rgba(76,175,80,0.7),0_0_30px_rgba(76,175,80,0.4)]',
  warning:
    'bg-gradient-to-r from-warning to-[#ffc107] text-dark-bg shadow-[0_0_10px_rgba(255,179,0,0.5),0_0_20px_rgba(255,179,0,0.3)] hover:shadow-[0_0_15px_rgba(255,179,0,0.7),0_0_30px_rgba(255,179,0,0.4)]',
  ghost:
    'bg-transparent text-white hover:bg-white/10 border border-transparent',
  outline:
    'bg-transparent text-white border-2 border-dark-border hover:border-primary hover:text-primary',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  icon: 'w-10 h-10 p-0',
};

const spinnerSizeMap: Record<ButtonSize, string> = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
  icon: 'w-5 h-5',
};

const Spinner = ({ size, className }: { size: ButtonSize; className?: string }) => (
  <Loader2 className={cn('animate-spin', spinnerSizeMap[size], className)} />
);

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      className,
      children,
      disabled,
      loading,
      onClick,
      type = 'button',
      asChild = false,
      ...props
    },
    ref
  ) => {
    const Comp: any = asChild ? Slot : 'button';

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled) {
        e.preventDefault();
        return;
      }
      onClick?.(e);
    };

    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : type}
        disabled={disabled || loading}
        onClick={handleClick}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium rounded-xl',
          'transition-all duration-200 ease-out',
          'hover:translate-y-[-1px] active:translate-y-[1px]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:translate-y-0',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading && <Spinner size={size} />}
        {children}
      </Comp>
    );
  }
);
Button.displayName = 'Button';
