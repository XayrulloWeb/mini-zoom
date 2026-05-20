"use client";

export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-4 w-40 rounded-lg bg-zinc-800" />
          <div className="h-3 w-24 rounded-lg bg-zinc-800/60" />
        </div>
        <div className="h-6 w-20 rounded-full bg-zinc-800" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="h-3 w-28 rounded bg-zinc-800/60" />
        <div className="h-3 w-32 rounded bg-zinc-800/60" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-8 w-16 rounded-lg bg-zinc-800" />
        <div className="h-8 w-16 rounded-lg bg-zinc-800/60" />
      </div>
    </div>
  );
}

export function SkeletonMetrics() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-zinc-800" />
            <div className="h-3 w-20 rounded bg-zinc-800/60" />
          </div>
          <div className="mt-3 h-8 w-12 rounded bg-zinc-800" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonChat() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="animate-pulse flex items-center gap-3 rounded-xl border border-zinc-800/60 bg-zinc-900/40 px-4 py-3">
          <div className="h-10 w-10 rounded-full bg-zinc-800" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-28 rounded bg-zinc-800" />
            <div className="h-3 w-40 rounded bg-zinc-800/60" />
          </div>
        </div>
      ))}
    </div>
  );
}
