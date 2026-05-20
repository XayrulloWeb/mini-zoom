"use client";

import { FormEvent, useState } from 'react';
import { Plus, Lock, Users as UsersIcon, Calendar } from 'lucide-react';
import type { CreateMeetingPayload } from './types';

type CreateMeetingFormProps = {
  onCreate: (payload: CreateMeetingPayload) => Promise<void>;
  busy?: boolean;
};

export function CreateMeetingForm({ onCreate, busy = false }: CreateMeetingFormProps) {
  const [title, setTitle] = useState('');
  const [roomName, setRoomName] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [roomPassword, setRoomPassword] = useState('');
  const [waitingRoomEnabled, setWaitingRoomEnabled] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Uchrashuv nomi majburiy');
      return;
    }

    if (isPasswordProtected && !roomPassword.trim()) {
      setError("Himoyalangan xona uchun parol kiriting");
      return;
    }

    try {
      await onCreate({
        title: title.trim(),
        roomName: roomName.trim() || undefined,
        isPasswordProtected,
        roomPassword: isPasswordProtected ? roomPassword.trim() : undefined,
        waitingRoomEnabled,
        scheduledFor: scheduledFor || undefined,
      });

      setTitle('');
      setRoomName('');
      setScheduledFor('');
      setIsPasswordProtected(false);
      setRoomPassword('');
      setWaitingRoomEnabled(false);
      setExpanded(false);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Uchrashuv yaratilmadi');
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Yangi uchrashuv</h3>
        {!expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-400"
          >
            <Plus className="h-3.5 w-3.5" />
            Yaratish
          </button>
        )}
      </div>

      {expanded && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Uchrashuv nomi *"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2.5 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
            autoFocus
          />

          <input
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Xona nomi (ixtiyoriy)"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2.5 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
          />

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 py-2.5 pl-10 pr-4 text-sm text-zinc-200 outline-none transition focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
            />
          </div>

          {/* Options */}
          <div className="space-y-2">
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-2.5 text-sm transition hover:border-zinc-700">
              <input
                type="checkbox"
                checked={isPasswordProtected}
                onChange={(e) => setIsPasswordProtected(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-indigo-500 focus:ring-indigo-500/30"
              />
              <Lock className="h-4 w-4 text-zinc-500" />
              <span className="text-zinc-300">Parol bilan himoyalash</span>
            </label>

            {isPasswordProtected && (
              <input
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                placeholder="Xona paroli"
                type="password"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2.5 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
              />
            )}

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-2.5 text-sm transition hover:border-zinc-700">
              <input
                type="checkbox"
                checked={waitingRoomEnabled}
                onChange={(e) => setWaitingRoomEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-indigo-500 focus:ring-indigo-500/30"
              />
              <UsersIcon className="h-4 w-4 text-zinc-500" />
              <span className="text-zinc-300">Kutish xonasi (Waiting Room)</span>
            </label>
          </div>

          {error && (
            <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-400">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={busy}
              className="flex-1 rounded-xl bg-indigo-500 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:opacity-50"
            >
              {busy ? 'Yaratilmoqda...' : 'Yaratish'}
            </button>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-400 transition hover:bg-zinc-800"
            >
              Bekor
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
