"use client";

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { LiveKitRoom, VideoConference, RoomAudioRenderer } from '@livekit/components-react';
import '@livekit/components-styles';
import { ChatPanel } from '@/components/room/ChatPanel';

function parseErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const record = payload as { message?: string | string[] };
  if (Array.isArray(record.message)) {
    return record.message.join(', ');
  }

  if (typeof record.message === 'string' && record.message.trim()) {
    return record.message;
  }

  return fallback;
}

export default function RoomPage() {
  const params = useParams<{ roomName?: string | string[] }>();
  const roomName = useMemo(() => {
    const value = params?.roomName;
    return Array.isArray(value) ? value[0] ?? '' : value ?? '';
  }, [params]);

  const [participantName, setParticipantName] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [token, setToken] = useState('');
  const [livekitUrl, setLivekitUrl] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [disconnected, setDisconnected] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const joinRoom = async () => {
    setError('');

    if (!roomName) {
      setError('URL ichida xona nomi topilmadi');
      return;
    }

    if (!participantName.trim()) {
      setError('Iltimos, ismingizni kiriting');
      return;
    }

    setJoining(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/meetings/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName,
          participantName: participantName.trim(),
          roomPassword: roomPassword.trim() || undefined,
        }),
      });

      const data = (await res.json().catch(() => null)) as unknown;
      if (!res.ok) {
        throw new Error(parseErrorMessage(data, `Server xatosi: ${res.status}`));
      }

      const payload = data as { token: string; livekitUrl: string };
      setToken(payload.token);
      setLivekitUrl(payload.livekitUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Serverga ulanishda xatolik yuz berdi");
    } finally {
      setJoining(false);
    }
  };

  const handleDisconnect = () => {
    setDisconnected(true);
    setToken('');
    setLivekitUrl('');
  };

  if (disconnected) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-100">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800">
            <svg className="h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold">Qo&apos;ng&apos;iroq yakunlandi</h1>
          <p className="mt-2 text-sm text-slate-400">Siz xonadan chiqdingiz.</p>
          <button
            onClick={() => { setDisconnected(false); setError(''); }}
            className="mt-6 w-full rounded-lg bg-cyan-500 py-2.5 font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            Qayta qo&apos;shilish
          </button>
          <a
            href="/dashboard"
            className="mt-3 block text-sm text-slate-400 transition hover:text-cyan-300"
          >
            ← Boshqaruv paneliga qaytish
          </a>
        </div>
      </div>
    );
  }

  if (token === '') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-slate-100">
        <div className="w-full max-w-md rounded-2xl border border-cyan-900/50 bg-slate-900/80 p-8 shadow-[0_0_50px_rgba(14,116,144,0.15)] backdrop-blur">
          <div className="text-center">
            <p className="text-xs tracking-[0.25em] text-cyan-300">VIDEO QO&apos;NG&apos;IROQ</p>
            <h1 className="mt-2 text-xl font-bold">Xonaga kirish</h1>
            <p className="mt-1 text-sm text-slate-400">
              <span className="font-medium text-cyan-300">{roomName || "noma'lum-xona"}</span>
            </p>
          </div>

          <div className="mt-6 space-y-3">
            <div>
              <label htmlFor="participant-name" className="mb-1 block text-xs font-medium text-slate-400">
                Ismingiz
              </label>
              <input
                id="participant-name"
                type="text"
                placeholder="Masalan: Ali"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none ring-cyan-400 transition focus:ring-2"
                value={participantName}
                onChange={(event) => setParticipantName(event.target.value)}
                onKeyDown={(event) => { if (event.key === 'Enter') joinRoom(); }}
                aria-label="Ismingizni kiriting"
              />
            </div>

            <div>
              <label htmlFor="room-password" className="mb-1 block text-xs font-medium text-slate-400">
                Xona paroli (ixtiyoriy)
              </label>
              <input
                id="room-password"
                type="password"
                placeholder="Agar o'rnatilgan bo'lsa"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none ring-cyan-400 transition focus:ring-2"
                value={roomPassword}
                onChange={(event) => setRoomPassword(event.target.value)}
                onKeyDown={(event) => { if (event.key === 'Enter') joinRoom(); }}
                aria-label="Xona parolini kiriting"
              />
            </div>

            {error ? (
              <div className="rounded-lg border border-rose-700/60 bg-rose-950/30 px-3 py-2 text-sm text-rose-300" role="alert">
                {error}
              </div>
            ) : null}

            <button
              onClick={joinRoom}
              disabled={joining}
              className="mt-2 w-full rounded-lg bg-emerald-400 py-2.5 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
              aria-label="Qo'ng'iroqqa kirish"
            >
              {joining ? 'Ulanmoqda...' : "Qo'ng'iroqqa kirish"}
            </button>
          </div>

          <a
            href="/dashboard"
            className="mt-4 block text-center text-sm text-slate-400 transition hover:text-cyan-300"
          >
            ← Boshqaruv paneliga qaytish
          </a>
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={livekitUrl}
      data-lk-theme="default"
      style={{ height: '100dvh' }}
      onDisconnected={handleDisconnect}
    >
      <div className="relative h-full">
        <VideoConference />
        <RoomAudioRenderer />

        {/* Chat toggle button */}
        <button
          onClick={() => setChatOpen((v) => !v)}
          className="fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500 text-slate-950 shadow-lg transition hover:bg-cyan-400 hover:scale-105"
          aria-label={chatOpen ? 'Chatni yopish' : 'Chatni ochish'}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>

        {/* Chat panel */}
        <ChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      </div>
    </LiveKitRoom>
  );
}
