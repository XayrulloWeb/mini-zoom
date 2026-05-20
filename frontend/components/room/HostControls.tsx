"use client";

import { useState, useEffect, useCallback } from 'react';
import { Users, MicOff, UserX, RefreshCw, X, Shield } from 'lucide-react';

type Participant = {
  identity: string;
  name: string;
  joinedAt: number | null;
  tracks: Array<{ sid: string; type: number; source: number; muted: boolean }>;
};

type HostControlsProps = {
  meetingId: string;
  accessToken: string;
  isOpen: boolean;
  onClose: () => void;
};

export function HostControls({ meetingId, accessToken, isOpen, onClose }: HostControlsProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` };
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  const loadParticipants = useCallback(async () => {
    if (!meetingId || !accessToken) return;
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/meetings/${meetingId}/participants`, { headers });
      if (res.ok) setParticipants(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [meetingId, accessToken]);

  useEffect(() => {
    if (isOpen) {
      loadParticipants();
      const interval = setInterval(loadParticipants, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, loadParticipants]);

  async function handleMute(identity: string, trackSid: string, muted: boolean) {
    try {
      await fetch(`${backendUrl}/meetings/${meetingId}/mute`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ participantIdentity: identity, trackSid, muted }),
      });
      loadParticipants();
    } catch { /* ignore */ }
  }

  async function handleKick(identity: string) {
    if (!confirm(`${identity} ni chiqarishni tasdiqlaysizmi?`)) return;
    try {
      await fetch(`${backendUrl}/meetings/${meetingId}/kick`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ participantIdentity: identity }),
      });
      loadParticipants();
    } catch { /* ignore */ }
  }

  if (!isOpen) return null;

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-full w-80 flex-col border-r border-zinc-700 bg-zinc-900/95 backdrop-blur-sm md:w-96">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-700 px-4 py-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-white">Boshqaruv paneli</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadParticipants}
            disabled={loading}
            className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Participants count */}
      <div className="border-b border-zinc-800 px-4 py-2">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Users className="h-3.5 w-3.5" />
          <span>{participants.length} ishtirokchi</span>
        </div>
      </div>

      {/* Participants list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {participants.length === 0 ? (
          <p className="text-center text-sm text-zinc-500 mt-8">Hali ishtirokchilar yo&apos;q</p>
        ) : (
          participants.map((p) => {
            const audioTrack = p.tracks.find((t) => t.source === 1); // MICROPHONE
            return (
              <div key={p.identity} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-300">
                      {(p.name || p.identity).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{p.name || p.identity}</p>
                      <p className="text-[10px] text-zinc-500">{p.tracks.length} track</p>
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex gap-2">
                  {audioTrack && (
                    <button
                      onClick={() => handleMute(p.identity, audioTrack.sid, !audioTrack.muted)}
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition ${
                        audioTrack.muted
                          ? 'border border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
                          : 'border border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      <MicOff className="h-3 w-3" />
                      {audioTrack.muted ? 'Unmute' : 'Mute'}
                    </button>
                  )}
                  <button
                    onClick={() => handleKick(p.identity)}
                    className="flex items-center gap-1 rounded-lg border border-rose-500/30 px-2.5 py-1.5 text-[11px] font-medium text-rose-400 transition hover:bg-rose-500/10"
                  >
                    <UserX className="h-3 w-3" />
                    Chiqarish
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
