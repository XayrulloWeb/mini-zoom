"use client";

import { useMemo, useState } from 'react';
import { Search, RefreshCw, Filter } from 'lucide-react';
import { MeetingCard } from './MeetingCard';
import type { Meeting, MeetingStatus } from './types';
import { getMeetingStatus } from './utils';

type MeetingsTabProps = {
  meetings: Meeting[];
  loading: boolean;
  refreshing: boolean;
  activeMeetingId: string | null;
  onRefresh: () => Promise<void>;
  onJoin: (roomName: string) => void;
  onFinish: (meetingId: string) => Promise<void>;
};

const filterOptions: Array<{ value: 'all' | MeetingStatus; label: string }> = [
  { value: 'all', label: 'Barchasi' },
  { value: 'live', label: 'Jonli' },
  { value: 'pending', label: 'Kutilmoqda' },
  { value: 'scheduled', label: 'Rejalashtirilgan' },
  { value: 'finished', label: 'Yakunlangan' },
];

export function MeetingsTab({
  meetings,
  loading,
  refreshing,
  activeMeetingId,
  onRefresh,
  onJoin,
  onFinish,
}: MeetingsTabProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | MeetingStatus>('all');

  const filteredMeetings = useMemo(() => {
    const term = search.trim().toLowerCase();
    const now = new Date();

    return meetings.filter((meeting) => {
      const status = getMeetingStatus(meeting, now);
      if (statusFilter !== 'all' && status !== statusFilter) return false;
      if (!term) return true;
      return (
        meeting.title.toLowerCase().includes(term) ||
        meeting.roomName.toLowerCase().includes(term)
      );
    });
  }, [meetings, search, statusFilter]);

  return (
    <div className="space-y-4">
      {/* Search & Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Qidirish..."
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 py-2.5 pl-10 pr-4 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | MeetingStatus)}
              className="appearance-none rounded-xl border border-zinc-800 bg-zinc-900/60 py-2.5 pl-9 pr-8 text-sm text-zinc-300 outline-none transition focus:border-indigo-500/50"
            >
              {filterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Yangilash
          </button>
        </div>
      </div>

      {/* Meeting cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : filteredMeetings.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 py-12 text-center">
          <p className="text-sm text-zinc-500">Uchrashuv topilmadi</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredMeetings.map((meeting) => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              onJoin={onJoin}
              onFinish={onFinish}
              actionBusy={activeMeetingId === meeting.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
