"use client";

import type { ReactNode } from 'react';
import type { DashboardTab } from './types';
import { Sidebar } from './Sidebar';

type DashboardShellProps = {
  userName: string;
  userEmail: string;
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  onLogout: () => void;
  metrics: ReactNode;
  children: ReactNode;
  unreadMessages?: number;
  pendingRequests?: number;
};

export function DashboardShell({
  userName,
  userEmail,
  activeTab,
  onTabChange,
  onLogout,
  metrics,
  children,
  unreadMessages = 0,
  pendingRequests = 0,
}: DashboardShellProps) {
  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        onLogout={onLogout}
        userName={userName}
        userEmail={userEmail}
        unreadMessages={unreadMessages}
        pendingRequests={pendingRequests}
      />

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-zinc-800/60 px-6 py-4 md:px-8">
          <div className="pl-12 md:pl-0">
            <h2 className="text-xl font-semibold text-white">
              {activeTab === 'meetings' && 'Uchrashuvlar'}
              {activeTab === 'recordings' && 'Tarix'}
              {activeTab === 'friends' && "Do'stlar"}
              {activeTab === 'chat' && 'Xabarlar'}
              {activeTab === 'groups' && 'Guruhlar'}
              {activeTab === 'profile' && 'Profil'}
            </h2>
            <p className="mt-0.5 text-sm text-zinc-500">
              {activeTab === 'meetings' && "Video qo'ng'iroqlarni boshqaring"}
              {activeTab === 'recordings' && "O'tgan uchrashuvlar tarixi"}
              {activeTab === 'friends' && "Do'stlarni qo'shing va boshqaring"}
              {activeTab === 'chat' && "Do'stlar bilan suhbatlashing"}
              {activeTab === 'groups' && "Guruh suhbatlari"}
              {activeTab === 'profile' && "Profil sozlamalari"}
            </p>
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 md:px-8">
          {/* Metrics (only on meetings tab) */}
          {activeTab === 'meetings' && <div className="mb-6">{metrics}</div>}

          {/* Tab content */}
          {children}
        </div>
      </main>
    </div>
  );
}
