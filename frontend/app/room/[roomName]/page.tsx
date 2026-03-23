"use client";

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { LiveKitRoom, VideoConference, RoomAudioRenderer } from '@livekit/components-react';
import '@livekit/components-styles';

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

  const joinRoom = async () => {
    if (!roomName) {
      alert('URL ichida xona nomi topilmadi');
      return;
    }

    if (!participantName.trim()) {
      alert('Iltimos, ismingizni kiriting');
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
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Serverga ulanishda xatolik yuz berdi");
    } finally {
      setJoining(false);
    }
  };

  if (token === '') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 text-black">
        <div className="w-96 rounded-xl bg-white p-8 text-center shadow-lg">
          <h1 className="mb-6 text-2xl font-bold">
            Xonaga kirish:
            <br />
            <span className="text-blue-600">{roomName || "noma'lum-xona"}</span>
          </h1>

          <input
            type="text"
            placeholder="Ismingiz nima?"
            className="mb-3 w-full rounded-lg border p-3 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={participantName}
            onChange={(event) => setParticipantName(event.target.value)}
          />

          <input
            type="text"
            placeholder="Xona paroli (agar o'rnatilgan bo'lsa)"
            className="mb-4 w-full rounded-lg border p-3 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={roomPassword}
            onChange={(event) => setRoomPassword(event.target.value)}
          />

          <button
            onClick={joinRoom}
            disabled={joining}
            className="w-full rounded-lg bg-blue-600 py-3 font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {joining ? 'Ulanmoqda...' : "Qo'ng'iroqqa kirish"}
          </button>
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
      style={{ height: '100vh' }}
    >
      <VideoConference />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}
