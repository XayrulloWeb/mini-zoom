"use client";

import { Clock, User } from 'lucide-react';
import type { Meeting } from './types';
import { formatDateTime, formatDuration } from './utils';

type RecordingsTabProps = {
  meetings: Meeting[];
};

export function RecordingsTab({ meetings }: RecordingsTabProps) {
  const recordings = [...meetings]
    .filter((m) => Boolean(m.endedAt))
    .sort((a, b) => new Date(b.endedAt || '').getTime() - new Date(a.endedAt || '').getTime());

  return (
    <div className="space-y-4">
      {recordings.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 py-16 text-center">
          <Clock className="mx-auto h-8 w-8 text-zinc-600" />
          <p className="mt-3 text-sm text-zinc-500">Hali yakunlangan uchrashuvlar yo&apos;q</p>
        </div>
      ) : (
        recordings.map((meeting) => (
          <div
            key={meeting.id}
            className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5 transition hover:border-zinc-700/80"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-white">{meeting.title}</h3>
                <p className="mt-0.5 font-mono text-xs text-zinc-500">{meeting.roomName}</p>
              </div>
              <span className="rounded-full border border-zinc-700 bg-zinc-800/60 px-2.5 py-1 text-[11px] font-medium text-zinc-400">
                Yakunlangan
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-600">Boshlangan</p>
                <p className="mt-0.5 text-zinc-300">{formatDateTime(meeting.startedAt)}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-600">Tugagan</p>
                <p className="mt-0.5 text-zinc-300">{formatDateTime(meeting.endedAt)}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-zinc-500" />
                <span className="text-zinc-300">{formatDuration(meeting.startedAt, meeting.endedAt)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-zinc-500" />
                <span className="text-zinc-300">{meeting.host.name || meeting.host.email}</span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
