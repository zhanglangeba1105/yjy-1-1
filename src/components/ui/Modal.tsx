import * as React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  className?: string;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
}) => {
  const [isMounted, setIsMounted] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setIsMounted(true);
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsVisible(true));
      });
      return () => cancelAnimationFrame(raf);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setIsMounted(false), 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onClose]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isMounted) return null;

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'transition-opacity duration-200 ease-out',
        isVisible ? 'opacity-100' : 'opacity-0'
      )}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className={cn(
          'absolute inset-0 backdrop-blur-sm bg-black/60',
          'transition-opacity duration-200 ease-out',
          isVisible ? 'opacity-100' : 'opacity-0'
        )}
      />

      <div
        className={cn(
          'relative w-full z-10 rounded-2xl bg-dark-card border border-dark-border',
          'shadow-card-glow shadow-[0_0_40px_rgba(255,107,53,0.2)]',
          'transition-all duration-300 ease-out',
          isVisible
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-8 scale-95',
          sizeClasses[size],
          className
        )}
      >
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none p-[1px] -z-10"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,140,66,0.3), rgba(255,64,129,0.2), rgba(105,240,174,0.3))',
            WebkitMask:
              'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            opacity: isVisible ? 1 : 0,
          }}
        />

        <button
          onClick={onClose}
          className={cn(
            'absolute top-4 right-4 z-20',
            'w-8 h-8 flex items-center justify-center',
            'rounded-lg text-gray-400 hover:text-white hover:bg-white/10',
            'transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50'
          )}
          aria-label="关闭"
        >
          <X className="w-5 h-5" />
        </button>

        {(title || description) && (
          <div className="flex flex-col space-y-1.5 p-6 pb-4 pr-14">
            {title && (
              <h2
                id="modal-title"
                className="text-xl font-bold text-white leading-tight"
              >
                {title}
              </h2>
            )}
            {description && (
              <p className="text-sm text-gray-400 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        )}

        <div className={cn('px-6', !title && !description && 'pt-6')}>
          {children}
        </div>

        {footer && (
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 pt-4 space-y-2 sm:space-y-0">
            {footer}
          </div>
        )}

        {!footer && !children && <div className="p-6" />}
        {!footer && children && <div className="pb-6" />}
      </div>
    </div>,
    document.body
  );
};
