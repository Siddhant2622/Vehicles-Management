"use client";

import { useState } from 'react';
import { useTransitStore, UserRole } from '@/lib/store/transitStore';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  Map, 
  CalendarRange, 
  Wrench, 
  Droplet, 
  Receipt, 
  FileSpreadsheet, 
  BarChart3, 
  FolderLock, 
  Settings, 
  LogOut,
  Lock,
  ChevronLeft,
  ChevronRight,
  Navigation
} from 'lucide-react';
import Link from 'next/link';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  allowedRoles: UserRole[];
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, allowedRoles: ['Administrator', 'Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'] },
  { name: 'Fleet Tracking', href: '/tracking', icon: Navigation, allowedRoles: ['Administrator', 'Fleet Manager', 'Dispatcher', 'Safety Officer'] },
  { name: 'Vehicles', href: '/vehicles', icon: Truck, allowedRoles: ['Administrator', 'Fleet Manager', 'Dispatcher', 'Safety Officer'] },
  { name: 'Drivers', href: '/drivers', icon: Users, allowedRoles: ['Administrator', 'Fleet Manager', 'Dispatcher', 'Safety Officer'] },
  { name: 'Trips', href: '/trips', icon: Map, allowedRoles: ['Administrator', 'Fleet Manager', 'Dispatcher'] },
  { name: 'Dispatch Board', href: '/dispatch', icon: CalendarRange, allowedRoles: ['Administrator', 'Dispatcher'] },
  { name: 'Maintenance', href: '/maintenance', icon: Wrench, allowedRoles: ['Administrator', 'Fleet Manager'] },
  { name: 'Fuel Logs', href: '/fuel', icon: Droplet, allowedRoles: ['Administrator', 'Fleet Manager', 'Financial Analyst'] },
  { name: 'Expenses', href: '/expenses', icon: Receipt, allowedRoles: ['Administrator', 'Financial Analyst'] },
  { name: 'Reports', href: '/reports', icon: FileSpreadsheet, allowedRoles: ['Administrator', 'Fleet Manager', 'Financial Analyst'] },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, allowedRoles: ['Administrator', 'Fleet Manager', 'Financial Analyst', 'Safety Officer'] },
  { name: 'Documents', href: '/documents', icon: FolderLock, allowedRoles: ['Administrator', 'Safety Officer', 'Fleet Manager'] },
  { name: 'Settings', href: '/settings', icon: Settings, allowedRoles: ['Administrator'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useTransitStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const currentRole = currentUser?.role || 'Fleet Manager';

  return (
    <aside className={`shrink-0 bg-white dark:bg-[#1e293b] border-r border-[#e2e8f0] dark:border-[#2a2c35] flex flex-col h-screen transition-all duration-300 relative shadow-[1px_0_10px_rgba(0,0,0,0.02)] ${isCollapsed ? 'w-20' : 'w-64'}`}>
      
      {/* Collapse Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 h-6 w-6 rounded-full border border-[#e2e8f0] dark:border-[#2a2c35] bg-white dark:bg-[#1e293b] text-slate-400 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center shadow-sm cursor-pointer z-50 transition-colors"
      >
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Platform Branding */}
      <div className={`h-16 px-6 flex items-center gap-3 border-b border-[#e2e8f0] dark:border-[#2a2c35] ${isCollapsed ? 'justify-center px-0' : ''}`}>
        <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm shrink-0">
          <Truck className="h-4.5 w-4.5" />
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden">
            <span className="text-sm font-bold text-slate-800 dark:text-white tracking-tight block leading-none">TransitOps</span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Enterprise</span>
          </div>
        )}
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scrollbar-thin">
        {SIDEBAR_ITEMS.map((item) => {
          const hasAccess = item.allowedRoles.includes(currentRole);
          const isActive = pathname.startsWith(item.href);

          if (!hasAccess) {
            if (isCollapsed) return null;
            return (
              <div 
                key={item.name}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-300 dark:text-slate-600 bg-slate-50/50 dark:bg-slate-800/10 border border-transparent cursor-not-allowed text-xs select-none group"
                title={`Access denied for ${currentRole}`}
              >
                <div className="flex items-center gap-2.5">
                  <item.icon size={16} className="text-slate-300 dark:text-slate-600 shrink-0" />
                  <span>{item.name}</span>
                </div>
                <Lock size={10} className="text-slate-300 dark:text-slate-600 shrink-0" />
              </div>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center rounded-xl text-xs transition-all duration-200 border ${
                isCollapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2.5'
              } ${
                isActive 
                  ? 'bg-blue-50 dark:bg-[#334155]/60 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30 font-semibold shadow-[0_2px_8px_rgba(37,99,235,0.06)]' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40 border-transparent'
              }`}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon size={16} className={isActive ? 'text-blue-600 dark:text-blue-400 shrink-0' : 'text-slate-400 dark:text-slate-400 shrink-0'} />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile & Logout */}
      <div className={`p-4 border-t border-[#e2e8f0] dark:border-[#2a2c35] bg-slate-50/50 dark:bg-transparent ${isCollapsed ? 'flex flex-col items-center gap-4 px-2' : ''}`}>
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#2a2c35] mb-2.5 shadow-sm">
              <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-950 flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{currentUser?.fullName || 'User'}</h4>
                <span className="text-[10px] font-medium text-slate-400 block truncate">{currentUser?.role || 'Operator'}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium text-red-500 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/10 border border-transparent hover:border-red-100 dark:hover:border-red-900/30 transition-all cursor-pointer"
            >
              <LogOut size={14} />
              <span>Exit Console</span>
            </button>
          </>
        ) : (
          <>
            <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-950 flex items-center justify-center font-bold text-xs shrink-0" title={currentUser?.fullName}>
              {currentUser?.fullName?.charAt(0) || 'U'}
            </div>
            <button
              onClick={handleLogout}
              className="h-8 w-8 rounded-xl text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              title="Exit Console"
            >
              <LogOut size={16} />
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
