import type { ReactNode } from 'react';
import { classNames } from './utils';
import type { DashboardTab } from './types';

type DashboardShellProps = {
  userName: string;
  userEmail: string;
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  onLogout: () => void;
  metrics: ReactNode;
  children: ReactNode;
};

const tabs: Array<{ id: DashboardTab; label: string }> = [
  { id: 'meetings', label: 'Uchrashuvlar' },
  { id: 'recordings', label: 'Yozuvlar' },
];

export function DashboardShell({
  userName,
  userEmail,
  activeTab,
  onTabChange,
  onLogout,
  metrics,
  children,
}: DashboardShellProps) {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <section className="mx-auto w-full max-w-6xl rounded-3xl border border-cyan-900/40 bg-gradient-to-b from-slate-900 to-slate-950 p-5 shadow-[0_0_70px_rgba(8,145,178,0.22)] md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs tracking-[0.25em] text-cyan-300">BOSHQARUV PANELI V2</p>
            <h1 className="mt-1 text-2xl font-bold">Shaxsiy kabinet</h1>
            <p className="mt-1 text-sm text-slate-400">Qongiroqlar, tarix va yozuvlarni boshqarish.</p>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2">
            <div className="text-right text-sm">
              <p className="font-semibold">{userName}</p>
              <p className="text-slate-400">{userEmail}</p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm transition hover:bg-slate-800"
            >
              Chiqish
            </button>
          </div>
        </div>

        <div className="mt-5">{metrics}</div>

        <div className="mt-5 flex gap-2 rounded-xl bg-slate-900/70 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={classNames(
                'rounded-lg px-4 py-2 text-sm transition',
                activeTab === tab.id
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-4">{children}</div>
      </section>
    </main>
  );
}
