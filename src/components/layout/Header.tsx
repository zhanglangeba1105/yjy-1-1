import { useLocation } from 'react-router-dom';
import { Menu, Search, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const routeTitles: Record<string, string> = {
  '/': '仪表盘',
  '/vendors': '摊主管理',
  '/stalls': '摊位管理',
  '/schedule': '排班管理',
  '/conflicts': '冲突中心',
  '/revenue': '收益记录',
};

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation();
  const title = routeTitles[location.pathname] ?? '未知页面';
  const today = format(new Date(), 'yyyy年M月d日 EEEE', { locale: zhCN });

  return (
    <header
      className={cn(
        'sticky top-0 z-30 h-16 bg-dark-card border-b border-dark-border',
        'flex items-center px-4 lg:px-6 gap-4'
      )}
    >
      <button
        onClick={onMenuClick}
        className={cn(
          'lg:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-secondary transition-colors'
        )}
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-display text-white truncate">{title}</h2>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary text-gray-400 text-sm">
          <CalendarIcon className="w-4 h-4 text-neon-orange" />
          <span className="whitespace-nowrap">{today}</span>
        </div>
        <button className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-secondary transition-colors">
          <Search className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
