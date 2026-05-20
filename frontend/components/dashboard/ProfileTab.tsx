"use client";

import { useEffect, useState } from 'react';
import { User, Lock, Trash2, Save, Copy, Check } from 'lucide-react';
import { getBackendUrl, parseApiError } from './utils';

type ProfileTabProps = {
  accessToken: string;
  currentUserId: string;
  onLogout: () => void;
};

export function ProfileTab({ accessToken, currentUserId, onLogout }: ProfileTabProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [idCopied, setIdCopied] = useState(false);

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` };

  useEffect(() => {
    fetch(`${getBackendUrl()}/auth/profile`, { headers })
      .then((r) => r.json())
      .then((data: any) => {
        setName(data.name || '');
        setEmail(data.email || '');
      })
      .catch(() => {});
  }, [accessToken]);

  async function handleSave() {
    setError('');
    setSuccess('');
    setSaving(true);

    const body: any = {};
    if (name.trim()) body.name = name.trim();
    if (newPassword) {
      body.newPassword = newPassword;
      body.currentPassword = currentPassword;
    }

    try {
      const res = await fetch(`${getBackendUrl()}/auth/profile`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await parseApiError(res));
      setSuccess("Profil yangilandi!");
      setCurrentPassword('');
      setNewPassword('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Xatolik');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletePassword) { setError('Parolni kiriting'); return; }
    try {
      const res = await fetch(`${getBackendUrl()}/auth/account`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ password: deletePassword }),
      });
      if (!res.ok) throw new Error(await parseApiError(res));
      onLogout();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Xatolik');
    }
  }

  async function copyId() {
    await navigator.clipboard.writeText(currentUserId);
    setIdCopied(true);
    setTimeout(() => setIdCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* User ID */}
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5">
        <h3 className="text-sm font-semibold text-white">Sizning ID</h3>
        <p className="mt-1 text-xs text-zinc-500">Do&apos;stlar shu ID orqali sizni qo&apos;sha oladi</p>
        <div className="mt-3 flex items-center gap-2">
          <code className="flex-1 rounded-lg bg-zinc-950 px-3 py-2 text-xs text-zinc-300 font-mono">{currentUserId}</code>
          <button onClick={copyId} className="rounded-lg border border-zinc-700 p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white">
            {idCopied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Profile info */}
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-lg font-bold text-white">
            {(name || email).charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Profil ma&apos;lumotlari</h3>
            <p className="text-xs text-zinc-500">{email}</p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Ism</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 py-2.5 pl-10 pr-4 text-sm text-zinc-200 outline-none transition focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Joriy parol (parolni o&apos;zgartirish uchun)</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Joriy parol"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 py-2.5 pl-10 pr-4 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Yangi parol</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Yangi parol (kamida 8 ta belgi)"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 py-2.5 pl-10 pr-4 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
              />
            </div>
          </div>

          {error && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-400">{error}</p>}
          {success && <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">{success}</p>}

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5">
        <h3 className="text-sm font-semibold text-rose-400">Xavfli zona</h3>
        {!showDelete ? (
          <button
            onClick={() => setShowDelete(true)}
            className="mt-3 flex items-center gap-2 rounded-lg border border-rose-500/30 px-4 py-2 text-xs text-rose-400 transition hover:bg-rose-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Hisobni o&apos;chirish
          </button>
        ) : (
          <div className="mt-3 space-y-3">
            <p className="text-xs text-rose-300">Bu amalni qaytarib bo&apos;lmaydi. Barcha ma&apos;lumotlaringiz o&apos;chiriladi.</p>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Parolingizni tasdiqlang"
              className="w-full rounded-xl border border-rose-500/30 bg-zinc-950/60 px-4 py-2.5 text-sm text-zinc-200 outline-none"
            />
            <div className="flex gap-2">
              <button onClick={handleDelete} className="rounded-lg bg-rose-500 px-4 py-2 text-xs font-medium text-white transition hover:bg-rose-400">
                Ha, o&apos;chirish
              </button>
              <button onClick={() => setShowDelete(false)} className="rounded-lg border border-zinc-700 px-4 py-2 text-xs text-zinc-400 transition hover:bg-zinc-800">
                Bekor
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
