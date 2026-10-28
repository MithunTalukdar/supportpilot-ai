import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, Building2, ChevronDown, Plus, LogOut, Check, Sun, Moon } from 'lucide-react';
import { Badge } from '../ui/Badge.js';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';

interface NavbarProps {
  onToggleMobileSidebar: () => void;
  onCreateOrgClick: () => void;
  onProfileClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileSidebar,
  onCreateOrgClick,
  onProfileClick,
}) => {
  const { user, memberships, activeOrg, role, switchOrg, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOrgDropdownOpen(false);
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

  return (
    <header className="h-16 border-b border-white/5 glass-panel sticky top-0 z-20 px-4 lg:px-8 flex items-center justify-between">
      {/* Left: Mobile trigger & Org Selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 lg:hidden cursor-pointer"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Organization Switcher Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOrgDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-white/5 transition-colors cursor-pointer"
          >
            <Building2 className="w-4 h-4 text-brand-400" />
            <span className="text-xs font-semibold text-slate-200">{activeOrg?.organizationName || 'Select Organization'}</span>
            {role && (
              <Badge variant="brand" size="sm">
                {role}
              </Badge>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {orgDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-64 rounded-2xl glass-panel shadow-2xl p-2 z-50 border border-white/10 space-y-1">
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
                    {isSelected && <Check className="w-3.5 h-3.5 text-brand-400" />}
                  </button>
                );
              })}

              <div className="border-t border-white/5 pt-1 mt-1">
                <button
                  onClick={() => {
                    setOrgDropdownOpen(false);
                    onCreateOrgClick();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-brand-400 hover:bg-brand-500/10 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Organization</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Theme Toggle, User Profile & Logout */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Switcher Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-400" />
          )}
        </button>

        <button
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors relative cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500" />
        </button>

        <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />

        {/* User Profile Trigger Button */}
        <button
          onClick={onProfileClick}
          className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-white/5 transition-colors cursor-pointer text-left"
          title="Account Settings & Profile"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow-glow">
            {getInitials(user?.fullName)}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-semibold text-slate-200 hover:text-brand-300 transition-colors">
              {user?.fullName || 'User'}
            </div>
            <div className="text-[10px] text-slate-400">{user?.email}</div>
          </div>
        </button>

        <button
          onClick={logout}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
