"use client";

import { FormEvent, useState } from 'react';
import { classNames } from './utils';

type AuthPanelProps = {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (input: { name: string; email: string; password: string }) => Promise<void>;
};

export function AuthPanel({ onLogin, onRegister }: AuthPanelProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (mode === 'register') {
        await onRegister({
          name: name.trim(),
          email: email.trim(),
          password,
        });
      } else {
        await onLogin(email.trim(), password);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Autentifikatsiya so'rovi bajarilmadi");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-cyan-900/50 bg-slate-900/80 p-6 shadow-[0_0_50px_rgba(14,116,144,0.2)] backdrop-blur">
        <p className="text-xs tracking-[0.25em] text-cyan-300">1-3 BOSQICH</p>
        <h1 className="mt-2 text-2xl font-bold">Shaxsiy kabinet</h1>
        <p className="mt-1 text-sm text-slate-400">
          Uchrashuvlar va qongiroqlar tarixini boshqarish uchun kiring yoki royxatdan oting.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-950/70 p-1">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={classNames(
              'rounded-lg px-3 py-2 text-sm transition',
              mode === 'login'
                ? 'bg-cyan-500 text-slate-950'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white',
            )}
          >
            Kirish
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={classNames(
              'rounded-lg px-3 py-2 text-sm transition',
              mode === 'register'
                ? 'bg-cyan-500 text-slate-950'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white',
            )}
          >
            Royxatdan otish
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          {mode === 'register' ? (
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ismingiz"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-400 transition focus:ring-2"
            />
          ) : null}

          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-400 transition focus:ring-2"
          />

          <input
            required
            type="password"
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Parol (kamida 8 ta belgi)"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-cyan-400 transition focus:ring-2"
          />

          {error ? <p className="text-sm text-rose-400">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-emerald-400 py-2.5 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting
              ? 'Yuklanmoqda...'
              : mode === 'register'
                ? 'Hisob yaratish'
                : 'Kirish'}
          </button>
        </form>
      </section>
    </main>
  );
}
