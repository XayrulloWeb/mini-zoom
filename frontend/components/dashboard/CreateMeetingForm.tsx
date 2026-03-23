"use client";

import { FormEvent, useState } from 'react';
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
  const [error, setError] = useState('');

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
        scheduledFor: scheduledFor || undefined,
      });

      setTitle('');
      setRoomName('');
      setScheduledFor('');
      setIsPasswordProtected(false);
      setRoomPassword('');
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Uchrashuv yaratilmadi');
    }
  }

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h2 className="text-lg font-semibold">Yangi uchrashuv</h2>
      <form onSubmit={handleSubmit} className="mt-3 space-y-3">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Uchrashuv nomi"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-400 transition focus:ring-2"
        />

        <input
          value={roomName}
          onChange={(event) => setRoomName(event.target.value)}
          placeholder="xona-nomi (ixtiyoriy)"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-400 transition focus:ring-2"
        />

        <input
          type="datetime-local"
          value={scheduledFor}
          onChange={(event) => setScheduledFor(event.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-400 transition focus:ring-2"
        />

        <label className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={isPasswordProtected}
            onChange={(event) => setIsPasswordProtected(event.target.checked)}
          />
          Xonani parol bilan himoyalash
        </label>

        {isPasswordProtected ? (
          <input
            value={roomPassword}
            onChange={(event) => setRoomPassword(event.target.value)}
            placeholder="Xona paroli"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-400 transition focus:ring-2"
          />
        ) : null}

        {error ? <p className="text-sm text-rose-400">{error}</p> : null}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-emerald-400 py-2.5 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {busy ? 'Yaratilmoqda...' : 'Uchrashuv yaratish'}
        </button>
      </form>
    </section>
  );
}
