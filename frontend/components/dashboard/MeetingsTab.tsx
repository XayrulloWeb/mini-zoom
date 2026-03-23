"use client";

import { useMemo, useState } from 'react';
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
  { value: 'all', label: 'Barcha holatlar' },
  { value: 'pending', label: 'Kutilmoqda' },
  { value: 'scheduled', label: 'Rejalashtirilgan' },
  { value: 'live', label: 'Jonli' },
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
      if (statusFilter !== 'all' && status !== statusFilter) {
        return false;
      }

      if (!term) {
        return true;
      }

      return (
        meeting.title.toLowerCase().includes(term) ||
        meeting.roomName.toLowerCase().includes(term) ||
        meeting.host.email.toLowerCase().includes(term)
      );
    });
  }, [meetings, search, statusFilter]);

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-lg font-semibold">Mening uchrashuvlarim</h2>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="w-full rounded-lg border border-cyan-500 px-3 py-1.5 text-sm text-cyan-300 transition hover:bg-cyan-950/40 md:w-auto disabled:cursor-not-allowed disabled:opacity-60"
        >
          {refreshing ? 'Yangilanmoqda...' : 'Yangilash'}
        </button>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Nomi yoki xona bo'yicha qidirish"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-400 transition focus:ring-2"
        />

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as 'all' | MeetingStatus)}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-400 transition focus:ring-2"
        >
          {filterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          <p className="text-sm text-slate-400">Uchrashuvlar yuklanmoqda...</p>
        ) : filteredMeetings.length === 0 ? (
          <p className="text-sm text-slate-400">Uchrashuv topilmadi.</p>
        ) : (
          filteredMeetings.map((meeting) => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              onJoin={onJoin}
              onFinish={onFinish}
              actionBusy={activeMeetingId === meeting.id}
            />
          ))
        )}
      </div>
    </section>
  );
}
