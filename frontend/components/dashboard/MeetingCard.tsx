"use client";

import { useMemo, useState } from 'react';
import { Copy, Check, LogIn, Square, Link2, Shield, Clock, Calendar } from 'lucide-react';
import type { Meeting, MeetingStatus } from './types';
import { formatDateTime, formatDuration, getMeetingStatus } from './utils';

type MeetingCardProps = {
  meeting: Meeting;
  onJoin: (roomName: string) => void;
  onFinish: (meetingId: string) => Promise<void>;
  actionBusy?: boolean;
};

const statusConfig: Record<MeetingStatus, { label: string; dot: string; bg: string }> = {
  pending: { label: 'Kutilmoqda', dot: 'bg-amber-400', bg: 'bg-amber-400/10 text-amber-300 border-amber-400/20' },
  scheduled: { label: 'Rejalashtirilgan', dot: 'bg-blue-400', bg: 'bg-blue-400/10 text-blue-300 border-blue-400/20' },
  live: { label: 'Jonli', dot: 'bg-emerald-400 animate-pulse', bg: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20' },
  finished: { label: 'Yakunlangan', dot: 'bg-zinc-400', bg: 'bg-zinc-400/10 text-zinc-400 border-zinc-400/20' },
};

export function MeetingCard({ meeting, onJoin, onFinish, actionBusy = false }: MeetingCardProps) {
  const [copyState, setCopyState] = useState<'idle' | 'ok'>('idle');
  const [confirmFinish, setConfirmFinish] = useState(false);
  const status = useMemo(() => getMeetingStatus(meeting), [meeting]);

  const config = statusConfig[status];
  const canJoin = status !== 'finished';
  const canFinish = status === 'live' || status === 'pending' || status === 'scheduled';

  async function copyLink() {
    try {
      const joinLink = `${window.location.origin}/room/${encodeURIComponent(meeting.roomName)}`;
      await navigator.clipboard.writeText(joinLink);
      setCopyState('ok');
      setTimeout(() => setCopyState('idle'), 2000);
    } catch { /* ignore */ }
  }

  async function handleFinish() {
    setConfirmFinish(false);
    await onFinish(meeting.id);
  }

  return (
    <div className="group rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5 transition-all hover:border-zinc-700/80 hover:bg-zinc-900/60">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-white">{meeting.title}</h3>
          <div className="mt-1 flex items-center gap-2 text-sm text-zinc-500">
            <Link2 className="h-3.5 w-3.5" />
            <span className="truncate font-mono text-xs">{meeting.roomName}</span>
          </div>
        </div>
        <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${config.bg}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
          {config.label}
        </span>
      </div>

      {/* Info grid */}
      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        {meeting.isPasswordProtected && (
          <div className="flex items-center gap-2 text-zinc-400">
            <Shield className="h-3.5 w-3.5 text-amber-400" />
            <span>Himoyalangan</span>
          </div>
        )}
        {meeting.scheduledFor && (
          <div className="flex items-center gap-2 text-zinc-400">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDateTime(meeting.scheduledFor)}</span>
          </div>
        )}
        {(meeting.startedAt || meeting.endedAt) && (
          <div className="flex items-center gap-2 text-zinc-400">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatDuration(meeting.startedAt, meeting.endedAt)}</span>
          </div>
        )}
      </div>

      {/* Confirmation */}
      {confirmFinish ? (
        <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3">
          <p className="text-sm text-rose-300">Uchrashuvni yakunlashni tasdiqlaysizmi?</p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={handleFinish}
              disabled={actionBusy}
              className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-rose-400 disabled:opacity-50"
            >
              {actionBusy ? 'Kutib turing...' : 'Ha, yakunlash'}
            </button>
            <button
              onClick={() => setConfirmFinish(false)}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 transition hover:bg-zinc-800"
            >
              Bekor
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {canJoin && (
            <button
              onClick={() => onJoin(meeting.roomName)}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-indigo-400"
            >
              <LogIn className="h-3.5 w-3.5" />
              Kirish
            </button>
          )}
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800"
          >
            {copyState === 'ok' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copyState === 'ok' ? 'Nusxalandi' : 'Havola'}
          </button>
          {canFinish && (
            <button
              onClick={() => setConfirmFinish(true)}
              disabled={actionBusy}
              className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 px-3.5 py-2 text-xs font-medium text-rose-400 transition hover:bg-rose-500/10 disabled:opacity-50"
            >
              <Square className="h-3.5 w-3.5" />
              Yakunlash
            </button>
          )}
        </div>
      )}
    </div>
  );
}
