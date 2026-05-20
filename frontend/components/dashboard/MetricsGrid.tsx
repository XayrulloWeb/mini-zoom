"use client";

import { Video, Radio, Calendar, Archive } from 'lucide-react';
import type { DashboardMetrics } from './types';

type MetricsGridProps = {
  metrics: DashboardMetrics;
};

const metricConfig = [
  { key: 'total' as const, label: 'Jami', icon: Video, color: 'from-indigo-500/20 to-indigo-500/5', iconColor: 'text-indigo-400', border: 'border-indigo-500/20' },
  { key: 'live' as const, label: 'Jonli', icon: Radio, color: 'from-emerald-500/20 to-emerald-500/5', iconColor: 'text-emerald-400', border: 'border-emerald-500/20' },
  { key: 'scheduled' as const, label: 'Rejalashtirilgan', icon: Calendar, color: 'from-amber-500/20 to-amber-500/5', iconColor: 'text-amber-400', border: 'border-amber-500/20' },
  { key: 'recordings' as const, label: 'Yakunlangan', icon: Archive, color: 'from-purple-500/20 to-purple-500/5', iconColor: 'text-purple-400', border: 'border-purple-500/20' },
];

export function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {metricConfig.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.key}
            className={`rounded-2xl border ${item.border} bg-gradient-to-br ${item.color} p-4 backdrop-blur-sm`}
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-lg bg-zinc-900/60 p-2 ${item.iconColor}`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-xs font-medium text-zinc-400">{item.label}</p>
            </div>
            <p className="mt-3 text-3xl font-bold text-white">{metrics[item.key]}</p>
          </div>
        );
      })}
    </div>
  );
}
