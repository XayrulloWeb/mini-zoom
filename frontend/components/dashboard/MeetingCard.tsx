"use client";

import { useMemo, useState } from 'react';
import type { Meeting, MeetingStatus } from './types';
import { classNames, formatDateTime, formatDuration, getMeetingStatus } from './utils';

type MeetingCardProps = {
  meeting: Meeting;
  onJoin: (roomName: string) => void;
  onFinish: (meetingId: string) => Promise<void>;
  actionBusy?: boolean;
};

const statusLabelMap: Record<MeetingStatus, string> = {
  pending: 'Kutilmoqda',
  scheduled: 'Rejalashtirilgan',
  live: 'Jonli',
  finished: 'Yakunlangan',
};

const statusStyleMap: Record<MeetingStatus, string> = {
  pending: 'border-amber-600/60 bg-amber-500/20 text-amber-300',
  scheduled: 'border-sky-600/60 bg-sky-500/20 text-sky-300',
  live: 'border-emerald-600/60 bg-emerald-500/20 text-emerald-300',
  finished: 'border-slate-600/60 bg-slate-500/20 text-slate-300',
};

export function MeetingCard({ meeting, onJoin, onFinish, actionBusy = false }: MeetingCardProps) {
  const [copyState, setCopyState] = useState<'idle' | 'ok' | 'error'>('idle');
  const status = useMemo(() => getMeetingStatus(meeting), [meeting]);

  const joinPath = `/room/${encodeURIComponent(meeting.roomName)}`;
  const canJoin = status !== 'finished';
  const canFinish = status === 'live' || status === 'pending' || status === 'scheduled';

  async function copyLink() {
    try {
      const joinLink = `${window.location.origin}${joinPath}`;
      await navigator.clipboard.writeText(joinLink);
      setCopyState('ok');
    } catch {
      setCopyState('error');
    } finally {
      setTimeout(() => setCopyState('idle'), 1200);
    }
  }

  return (
    <article className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-100">{meeting.title}</h3>
          <p className="text-sm text-slate-400">{meeting.roomName}</p>
        </div>
        <span
          className={classNames(
            'rounded-md border px-2 py-1 text-xs font-medium',
            statusStyleMap[status],
          )}
        >
          {statusLabelMap[status]}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-300">
        <p>Himoya: {meeting.isPasswordProtected ? 'ha' : "yo'q"}</p>
        <p>Davomiyligi: {formatDuration(meeting.startedAt, meeting.endedAt)}</p>
        <p>Yaratilgan: {formatDateTime(meeting.createdAt)}</p>
        <p>Rejalashtirilgan: {formatDateTime(meeting.scheduledFor)}</p>
        <p>Boshlangan: {formatDateTime(meeting.startedAt)}</p>
        <p>Tugagan: {formatDateTime(meeting.endedAt)}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onJoin(meeting.roomName)}
          disabled={!canJoin}
          className="rounded-lg border border-slate-500 px-3 py-1.5 text-sm text-slate-100 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Qoshilish
        </button>

        <button
          type="button"
          onClick={copyLink}
          className="rounded-lg border border-slate-500 px-3 py-1.5 text-sm text-slate-100 transition hover:bg-slate-700"
        >
          {copyState === 'ok'
            ? 'Havola nusxalandi'
            : copyState === 'error'
              ? 'Nusxalashda xato'
              : 'Havolani nusxalash'}
        </button>

        <button
          type="button"
          onClick={() => onFinish(meeting.id)}
          disabled={!canFinish || actionBusy}
          className="rounded-lg border border-rose-600 px-3 py-1.5 text-sm text-rose-300 transition hover:bg-rose-950/60 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {actionBusy ? 'Yakunlanmoqda...' : 'Yakunlash'}
        </button>
      </div>
    </article>
  );
}
