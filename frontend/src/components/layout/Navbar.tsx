import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, Building2, ChevronDown, Plus, Check, Sun, Moon, Search } from 'lucide-react';
import { Badge } from '../ui/Badge.js';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';

interface NavbarProps {
  onToggleMobileSidebar: () => void;
  onCreateOrgClick: () => void;
  onProfileClick?: () => void;
  onSearchChange?: (term: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileSidebar,
  onCreateOrgClick,
  onProfileClick,
  onSearchChange,
}) => {
  const { user, memberships, activeOrg, role, switchOrg } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOrgDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (onSearchChange) onSearchChange(e.target.value);
  };

  return (
    <header className="h-16 border-b border-white/5 glass-panel sticky top-0 z-20 px-4 lg:px-8 flex items-center justify-between gap-4 bg-navy-950/80 backdrop-blur-md">
      {/* Left: Mobile trigger & Search Bar (From mockup) */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          onClick={onToggleMobileSidebar}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 lg:hidden cursor-pointer"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar from reference image: "Search tickets..." */}
        <div className="relative w-full hidden sm:block">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search tickets, knowledge docs, users..."
            className="w-full bg-navy-900/90 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>
      </div>

      {/* Right: Org Selector, Notifications, Theme, Profile */}
      <div className="flex items-center gap-2.5">
        {/* Organization Switcher Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOrgDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-navy-900 border border-white/10 hover:border-violet-500/40 transition-colors cursor-pointer"
          >
            <Building2 className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-semibold text-slate-200 truncate max-w-[120px] sm:max-w-none">
              {activeOrg?.organizationName || 'Select Organization'}
            </span>
            {role && (
              <Badge variant="brand" size="sm">
                {role}
              </Badge>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {orgDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-64 rounded-2xl glass-panel shadow-2xl p-2 z-50 border border-white/10 space-y-1 bg-navy-950">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Your Organizations
              </div>

              {memberships.map((m) => {
                const isSelected = activeOrg?.organizationId === m.organizationId;
                return (
                  <button
                    key={m.organizationId}
                    onClick={() => {
                      switchOrg(m.organizationId);
                      setOrgDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="font-semibold text-slate-200">{m.organizationName}</div>
                      <div className="text-[10px] text-slate-400">{m.role}</div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-violet-400" />}
                  </button>
                );
              })}

              <div className="border-t border-white/5 pt-1 mt-1">
                <button
                  onClick={() => {
                    setOrgDropdownOpen(false);
                    onCreateOrgClick();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-violet-400 hover:bg-violet-500/10 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create New Organization</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen((prev) => !prev)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-violet-500 absolute top-2 right-2 ring-2 ring-navy-950" />
          </button>

          {notificationsOpen && (
            <div className="absolute top-full right-0 mt-2 w-72 rounded-2xl glass-panel shadow-2xl p-3 z-50 border border-white/10 space-y-2 bg-navy-950 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <span className="font-bold text-white">Notifications</span>
                <span className="text-[10px] text-violet-400 font-semibold">2 new</span>
              </div>
              <div className="p-2 rounded-xl bg-navy-900/60 border border-white/5 space-y-1">
                <div className="font-semibold text-white">High Priority Ticket Created</div>
                <div className="text-[11px] text-slate-400">Ticket #102 assigned to triage queue.</div>
                <div className="text-[9px] text-slate-500">2 min ago</div>
              </div>
              <div className="p-2 rounded-xl bg-navy-900/60 border border-white/5 space-y-1">
                <div className="font-semibold text-white">Knowledge Ingestion Complete</div>
                <div className="text-[11px] text-slate-400">12 chunks vector-indexed with pgvector.</div>
                <div className="text-[9px] text-slate-500">15 min ago</div>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
        </button>

        {/* User Profile Avatar */}
        <button
          onClick={onProfileClick}
          className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-sm hover:scale-105 transition-transform cursor-pointer"
          title="Account Profile"
        >
          {getInitials(user?.fullName)}
        </button>
      </div>
    </header>
  );
};
