"use client";

import {
  Video,
  History,
  Users,
  MessageCircle,
  LogOut,
  Menu,
  X,
  Plus,
  Settings,
  UsersRound,
} from 'lucide-react';
import { useState } from 'react';
import type { DashboardTab } from './types';

type SidebarProps = {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  onLogout: () => void;
  userName: string;
  userEmail: string;
  unreadMessages?: number;
  pendingRequests?: number;
};

const navItems: Array<{ id: DashboardTab; label: string; icon: typeof Video }> = [
  { id: 'meetings', label: 'Uchrashuvlar', icon: Video },
  { id: 'recordings', label: 'Tarix', icon: History },
  { id: 'friends', label: "Do'stlar", icon: Users },
  { id: 'chat', label: 'Xabarlar', icon: MessageCircle },
  { id: 'groups', label: 'Guruhlar', icon: UsersRound },
  { id: 'profile', label: 'Profil', icon: Settings },
];

export function Sidebar({
  activeTab,
  onTabChange,
  onLogout,
  userName,
  userEmail,
  unreadMessages = 0,
  pendingRequests = 0,
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  function getBadge(id: DashboardTab): number {
    if (id === 'chat') return unreadMessages;
    if (id === 'friends') return pendingRequests;
    return 0;
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
          <Video className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">ZoomUz</h1>
          <p className="text-[11px] text-zinc-500">Video platform</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-2 flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const badge = getBadge(item.id);

          return (
            <button
              key={item.id}
              onClick={() => { onTabChange(item.id); setMobileOpen(false); }}
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-500/10 text-indigo-400 shadow-sm'
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
              }`}
            >
              <Icon className={`h-[18px] w-[18px] ${isActive ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
              <span className="flex-1 text-left">{item.label}</span>
              {badge > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-500 px-1.5 text-[10px] font-bold text-white">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-zinc-800/60 px-3 py-4">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-200">{userName}</p>
            <p className="truncate text-[11px] text-zinc-500">{userEmail}</p>
          </div>
          <button
            onClick={onLogout}
            className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-800 hover:text-rose-400"
            aria-label="Chiqish"
            title="Chiqish"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-xl bg-zinc-900 p-2.5 text-zinc-400 shadow-lg md:hidden"
        aria-label="Menyu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative h-full w-64 bg-zinc-900 border-r border-zinc-800">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-1.5 text-zinc-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-zinc-800/60 md:bg-zinc-900/50">
        {sidebarContent}
      </aside>
    </>
  );
}
