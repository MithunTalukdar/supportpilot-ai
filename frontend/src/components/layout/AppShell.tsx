import React, { useState } from 'react';
import { Sidebar } from './Sidebar.js';
import { Navbar } from './Navbar.js';
import { ViewSection } from '../../types/index.js';

interface AppShellProps {
  children: React.ReactNode;
  currentSection: ViewSection;
  onSelectSection: (section: ViewSection) => void;
  pageTitle: string;
  pageSubtitle?: string;
  headerAction?: React.ReactNode;
  onCreateOrgClick?: () => void;
  onProfileClick?: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  currentSection,
  onSelectSection,
  pageTitle,
  pageSubtitle,
  headerAction,
  onCreateOrgClick = () => {},
  onProfileClick,
}) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-surface-darkest">
      {/* Sidebar */}
      <Sidebar
        currentSection={currentSection}
        onSelectSection={onSelectSection}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)}
          onCreateOrgClick={onCreateOrgClick}
          onProfileClick={onProfileClick}
        />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
            <div>
              <div className="text-xs text-brand-400 font-medium mb-1">
                SupportPilot AI &gt; {pageTitle}
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">{pageTitle}</h1>
              {pageSubtitle && (
                <p className="text-xs text-slate-400 mt-1">{pageSubtitle}</p>
              )}
            </div>
            {headerAction && <div>{headerAction}</div>}
          </div>

          {/* Children View Content */}
          {children}
        </main>
      </div>
    </div>
  );
};
