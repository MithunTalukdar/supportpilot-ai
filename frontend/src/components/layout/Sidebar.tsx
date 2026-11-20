import React from 'react';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Ticket,
  BookOpen,
  BotMessageSquare,
  BarChart3,
  Activity,
  Settings,
  ChevronRight,
  ShieldCheck,
  X,
  LogOut,
} from 'lucide-react';
import { ViewSection } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';
import { SupportPilotLogo } from '../common/SupportPilotLogo.js';

interface SidebarProps {
  currentSection: ViewSection;
  onSelectSection: (section: ViewSection) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onProfileClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  isOpenMobile,
  onCloseMobile,
  onProfileClick,
}) => {
  const { role, user, logout } = useAuth();

  const allNavItems: Array<{
    id: ViewSection;
    label: string;
    icon: React.ReactNode;
    badge?: string;
    allowedRoles?: Array<'OWNER' | 'AGENT' | 'CUSTOMER'>;
  }> = [
    {
      id: 'dashboard',
      label: 'Overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
      allowedRoles: ['OWNER', 'AGENT', 'CUSTOMER'],
    },
    {
      id: 'tickets',
      label: role === 'CUSTOMER' ? 'My Tickets' : 'Support Tickets',
      icon: <Ticket className="w-4 h-4" />,
      allowedRoles: ['OWNER', 'AGENT', 'CUSTOMER'],
    },
    {
      id: 'kb',
      label: 'Knowledge Base',
      icon: <BookOpen className="w-4 h-4" />,
      allowedRoles: ['OWNER', 'AGENT'],
    },
    {
      id: 'chat',
      label: role === 'CUSTOMER' ? '24/7 AI Support' : 'RAG Assistant',
      icon: <BotMessageSquare className="w-4 h-4" />,
      badge: 'AI',
      allowedRoles: ['OWNER', 'AGENT', 'CUSTOMER'],
    },
    {
      id: 'analytics',
      label: 'Analytics & AI Usage',
      icon: <BarChart3 className="w-4 h-4" />,
      badge: 'LIVE',
      allowedRoles: ['OWNER', 'AGENT'],
    },
    {
      id: 'settings',
      label: 'Org & Team Settings',
      icon: <Settings className="w-4 h-4" />,
      allowedRoles: ['OWNER'],
    },
    {
      id: 'health',
      label: 'Health & System',
      icon: <Activity className="w-4 h-4" />,
      allowedRoles: ['OWNER', 'AGENT'],
    },
  ];

  const navItems = allNavItems.filter((item) => {
    if (!item.allowedRoles) return true;
    if (!role) return true;
    return item.allowedRoles.includes(role);
  });

  const displayName = user?.fullName || 'Mithun Talukdar';
  const displayRole = role === 'OWNER' ? 'Admin' : role === 'AGENT' ? 'Support Agent' : 'Customer';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={clsx(
          'fixed lg:sticky top-0 left-0 h-screen w-64 glass-panel border-r border-white/5 z-40 flex flex-col justify-between transition-transform duration-300 bg-navy-950/95',
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* Logo & Close */}
          <div className="h-16 px-6 border-b border-white/5 flex items-center justify-between">
            <SupportPilotLogo size="sm" />
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-slate-400 hover:text-white lg:hidden cursor-pointer"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Pill matching reference mockup (Middle Left) */}
          <div className="p-4 mx-3 my-3 rounded-2xl bg-navy-900/80 border border-white/5 flex items-center justify-between">
            <div
              onClick={onProfileClick}
              className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0 mr-2"
            >
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {displayName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .substring(0, 2)}
                </div>
                {/* Active status indicator dot */}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-navy-950" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate group-hover:text-violet-300 transition-colors">
                  {displayName}
                </div>
                <div className="text-[10px] text-slate-400 truncate flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                  <span>{displayRole}</span>
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="px-3 py-2 space-y-1">
            <div className="px-3 pb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Management Portal
            </div>

            {navItems.map((item) => {
              const isActive = currentSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectSection(item.id);
                    onCloseMobile();
                  }}
                  className={clsx(
                    'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group cursor-pointer',
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600/30 to-violet-600/30 text-white border border-violet-500/30 shadow-glow'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={clsx(
                        'transition-colors',
                        isActive ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-300'
                      )}
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.badge && (
                      <span
                        className={clsx(
                          'px-1.5 py-0.5 rounded text-[10px] font-bold',
                          item.badge === 'AI'
                            ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                            : 'bg-navy-900 text-slate-400'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-violet-400" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Section: Tenant Isolation Indicator */}
        <div className="p-3 m-3 rounded-2xl bg-navy-900/60 border border-white/5 space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Multi-Tenant Guard</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            All queries cryptographically isolated by Organization ID.
          </p>
        </div>
      </aside>
    </>
  );
};
