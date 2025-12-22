import * as React from 'react';
import { cn } from '../lib/utils';
import {
  LayoutGrid,
  FolderOpen,
  Settings,
  Play,
  Users,
  Map,
  Menu,
  LucideIcon,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  badge?: number;
}

interface AppSidebarProps {
  items: NavItem[];
  activeId?: string;
  onItemClick?: (id: string) => void;
  collapsed?: boolean;
  onToggle?: () => void;
  logo?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

/**
 * Main navigation sidebar with icon navigation
 * Matches the Game View dark theme design
 */
export function AppSidebar({
  items,
  activeId,
  onItemClick,
  collapsed = true,
  onToggle,
  logo,
  footer,
  className,
}: AppSidebarProps) {
  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-gv-neutral-900 border-r border-gv-neutral-800',
        collapsed ? 'w-16' : 'w-56',
        'transition-all duration-200',
        className
      )}
    >
      {/* Logo / Toggle */}
      <div className="flex items-center justify-center h-16 border-b border-gv-neutral-800">
        {collapsed ? (
          <button
            onClick={onToggle}
            className="p-2 text-gv-neutral-400 hover:text-gv-neutral-200 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        ) : (
          <div className="flex items-center gap-2 px-4">
            {logo}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        <ul className="space-y-1 px-2">
          {items.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              isActive={activeId === item.id}
              collapsed={collapsed}
              onClick={() => onItemClick?.(item.id)}
            />
          ))}
        </ul>
      </nav>

      {/* Footer */}
      {footer && (
        <div className="p-4 border-t border-gv-neutral-800">
          {footer}
        </div>
      )}
    </aside>
  );
}

interface SidebarItemProps {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
  onClick?: () => void;
}

function SidebarItem({ item, isActive, collapsed, onClick }: SidebarItemProps) {
  const Icon = item.icon;

  return (
    <li>
      <button
        onClick={() => {
          item.onClick?.();
          onClick?.();
        }}
        className={cn(
          'relative w-full flex items-center gap-3 px-3 py-2.5 rounded-gv transition-all',
          collapsed ? 'justify-center' : 'justify-start',
          isActive
            ? 'bg-gv-primary-500 text-white'
            : 'text-gv-neutral-400 hover:text-gv-neutral-200 hover:bg-gv-neutral-800'
        )}
        title={collapsed ? item.label : undefined}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />

        {!collapsed && (
          <span className="text-sm font-medium">{item.label}</span>
        )}

        {/* Badge */}
        {item.badge !== undefined && item.badge > 0 && (
          <span
            className={cn(
              'absolute flex items-center justify-center min-w-[18px] h-[18px] text-xs font-bold rounded-full',
              collapsed ? 'top-0 right-0' : 'ml-auto',
              isActive ? 'bg-white text-gv-primary-500' : 'bg-gv-primary-500 text-white'
            )}
          >
            {item.badge > 99 ? '99+' : item.badge}
          </span>
        )}
      </button>
    </li>
  );
}

/**
 * Default navigation items for Game View
 */
export const defaultNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
  { id: 'productions', label: 'Productions', icon: FolderOpen },
  { id: 'viewer', label: 'Viewer', icon: Play },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'maps', label: 'Maps', icon: Map },
  { id: 'settings', label: 'Settings', icon: Settings },
];
