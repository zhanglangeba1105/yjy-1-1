import * as React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import type { ToastMessage } from '@/store/useAppStore';

export interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

const variantConfig: Record<
  ToastVariant,
  {
    icon: React.ComponentType<{ className?: string }>;
    container: string;
    iconColor: string;
    progress: string;
    border: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    container: 'bg-success/10',
    iconColor: 'text-success',
    progress: 'bg-gradient-to-r from-success to-[#66bb6a]',
    border: 'border-success/30',
  },
  error: {
    icon: XCircle,
    container: 'bg-danger/10',
    iconColor: 'text-danger',
    progress: 'bg-gradient-to-r from-danger to-[#ff5252]',
    border: 'border-danger/30',
  },
  warning: {
    icon: AlertTriangle,
    container: 'bg-warning/10',
    iconColor: 'text-warning',
    progress: 'bg-gradient-to-r from-warning to-[#ffc107]',
    border: 'border-warning/30',
  },
  info: {
    icon: Info,
    container: 'bg-info/10',
    iconColor: 'text-info',
    progress: 'bg-gradient-to-r from-info to-[#26c6da]',
    border: 'border-info/30',
  },
};

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const config = variantConfig[toast.type];
  const Icon = config.icon;
  const [isVisible, setIsVisible] = React.useState(false);
  const [isExiting, setIsExiting] = React.useState(false);
  const [progress, setProgress] = React.useState(100);

  const startTimeRef = React.useRef<number>(Date.now());
  const animationFrameRef = React.useRef<number>();

  React.useEffect(() => {
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsVisible(true));
    });

    const updateProgress = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, 100 - (elapsed / toast.duration) * 100);
      setProgress(remaining);
      if (remaining > 0 && !isExiting) {
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      }
    };
    animationFrameRef.current = requestAnimationFrame(updateProgress);

    return () => {
      cancelAnimationFrame(raf);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [toast.duration, isExiting]);

  const handleClose = React.useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);
    setIsVisible(false);
    setTimeout(() => {
      onClose(toast.id);
    }, 200);
  }, [isExiting, onClose, toast.id]);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border backdrop-blur-md',
        'shadow-lg shadow-black/20',
        'transition-all duration-300 ease-out',
        config.container,
        config.border,
        isVisible && !isExiting
          ? 'opacity-100 translate-x-0'
          : 'opacity-0 translate-x-8'
      )}
      role="alert"
    >
      <div className="flex items-start gap-3 p-4 pr-10">
        <div className={cn('flex-shrink-0 mt-0.5', config.iconColor)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white leading-relaxed break-words">
            {toast.message}
          </p>
        </div>
      </div>

      <button
        onClick={handleClose}
        className={cn(
          'absolute top-3 right-3',
          'w-6 h-6 flex items-center justify-center rounded-md',
          'text-gray-400 hover:text-white hover:bg-white/10',
          'transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30'
        )}
        aria-label="关闭通知"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
        <div
          className={cn(
            'h-full transition-all duration-75 ease-linear',
            config.progress
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
