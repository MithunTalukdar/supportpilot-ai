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
} from 'lucide-react';
import { ViewSection } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';

interface SidebarProps {
  currentSection: ViewSection;
  onSelectSection: (section: ViewSection) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { role } = useAuth();

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

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={clsx(
          'fixed lg:sticky top-0 left-0 h-screen w-64 glass-panel border-r border-white/5 z-40 flex flex-col justify-between transition-transform duration-300',
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div>
          {/* Logo & Header */}
          <div className="h-16 px-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-glow">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight gradient-text">
                  SupportPilot
                </span>
                <span className="text-[10px] text-brand-400 font-bold ml-1 px-1 py-0.5 rounded bg-brand-500/10 border border-brand-500/20">
                  AI
                </span>
              </div>
            </div>

            <button
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-slate-400 hover:text-white lg:hidden"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="px-3 py-6 space-y-1">
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
                      ? 'bg-gradient-to-r from-brand-600/30 to-indigo-600/20 text-white border border-brand-500/30 shadow-glow'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={clsx(
                        'transition-colors',
                        isActive ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'
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
                            ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                            : 'bg-slate-800 text-slate-400'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-brand-400" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Section: Tenant Isolation Indicator */}
        <div className="p-4 border-t border-white/5 m-3 rounded-2xl bg-surface-dark/50 border border-white/5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Multi-Tenant Guard</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 leading-tight">
            All queries cryptographically isolated by Organization ID.
          </p>
        </div>
      </aside>
    </>
  );
};
