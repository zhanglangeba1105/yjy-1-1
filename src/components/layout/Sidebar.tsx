import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Store,
  Calendar,
  AlertTriangle,
  Coins,
  Upload,
  Download,
  X,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const menuItems: MenuItem[] = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard },
  { path: '/vendors', label: '摊主管理', icon: Users },
  { path: '/stalls', label: '摊位管理', icon: Store },
  { path: '/schedule', label: '排班管理', icon: Calendar },
  { path: '/conflicts', label: '冲突中心', icon: AlertTriangle },
  { path: '/revenue', label: '收益记录', icon: Coins },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  return (
    <>
      <div
        className={cn(
          'fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-[260px] bg-secondary border-r border-dark-border',
          'flex flex-col transition-transform duration-300 ease-in-out',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between h-16 px-5 border-b border-dark-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-neon-orange flex items-center justify-center shadow-neon-orange">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-lg text-neon-orange text-shadow-neon leading-tight">
                夜市排班器
              </h1>
              <p className="text-[10px] text-gray-500">Night Market Scheduler</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-dark-card transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3 space-y-1">
          {menuItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                  'group relative overflow-hidden',
                  isActive
                    ? 'bg-primary text-white shadow-neon-orange'
                    : 'text-gray-400 hover:text-white hover:bg-dark-card'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      'w-5 h-5 flex-shrink-0 transition-colors',
                      isActive ? 'text-white' : 'text-gray-500 group-hover:text-neon-orange'
                    )}
                  />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-dark-border space-y-2">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-dark-card transition-all duration-200 group">
            <Upload className="w-4 h-4 text-gray-500 group-hover:text-neon-green transition-colors" />
            <span>导入数据</span>
          </button>
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-dark-card transition-all duration-200 group">
            <Download className="w-4 h-4 text-gray-500 group-hover:text-neon-orange transition-colors" />
            <span>导出数据</span>
          </button>
        </div>
      </aside>
    </>
  );
}
