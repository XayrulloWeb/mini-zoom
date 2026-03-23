import type { DashboardMetrics } from './types';

type MetricsGridProps = {
  metrics: DashboardMetrics;
};

export function MetricsGrid({ metrics }: MetricsGridProps) {
  const items = [
    { label: 'Jami uchrashuvlar', value: metrics.total },
    { label: 'Hozir jonli', value: metrics.live },
    { label: 'Rejalashtirilgan', value: metrics.scheduled },
    { label: 'Yozuvlar', value: metrics.recordings },
  ];

  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((item) => (
        <article
          key={item.label}
          className="rounded-xl border border-slate-800 bg-slate-900/60 p-3"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
          <p className="mt-1 text-2xl font-bold text-cyan-300">{item.value}</p>
        </article>
      ))}
    </section>
  );
}
