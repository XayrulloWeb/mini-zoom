"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';
import {
  createMeeting,
  fetchMyMeetings,
  finishMeeting,
  registerUser,
} from '@/components/dashboard/api';
import { AuthPanel } from '@/components/dashboard/AuthPanel';
import { CreateMeetingForm } from '@/components/dashboard/CreateMeetingForm';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { MeetingsTab } from '@/components/dashboard/MeetingsTab';
import { MetricsGrid } from '@/components/dashboard/MetricsGrid';
import { RecordingsTab } from '@/components/dashboard/RecordingsTab';
import type {
  CreateMeetingPayload,
  DashboardMetrics,
  DashboardTab,
  Meeting,
} from '@/components/dashboard/types';
import { getMeetingStatus } from '@/components/dashboard/utils';

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [activeTab, setActiveTab] = useState<DashboardTab>('meetings');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [refreshingMeetings, setRefreshingMeetings] = useState(false);
  const [creatingMeeting, setCreatingMeeting] = useState(false);
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const [pageError, setPageError] = useState('');

  const accessToken = session?.accessToken || '';

  const loadMeetings = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (!accessToken) {
        return;
      }

      setPageError('');
      if (mode === 'initial') {
        setLoadingMeetings(true);
      } else {
        setRefreshingMeetings(true);
      }

      try {
        const data = await fetchMyMeetings(accessToken);
        setMeetings(data);
      } catch (error) {
        setPageError(error instanceof Error ? error.message : "Uchrashuvlarni yuklab bo'lmadi");
      } finally {
        setLoadingMeetings(false);
        setRefreshingMeetings(false);
      }
    },
    [accessToken],
  );

  useEffect(() => {
    if (status === 'authenticated') {
      void loadMeetings('initial');
    }
  }, [status, loadMeetings]);

  const metrics = useMemo<DashboardMetrics>(() => {
    return meetings.reduce<DashboardMetrics>(
      (acc, meeting) => {
        const statusValue = getMeetingStatus(meeting);
        acc.total += 1;

        if (statusValue === 'live') {
          acc.live += 1;
        }

        if (statusValue === 'scheduled') {
          acc.scheduled += 1;
        }

        if (statusValue === 'finished') {
          acc.recordings += 1;
        }

        return acc;
      },
      { total: 0, live: 0, scheduled: 0, recordings: 0 },
    );
  }, [meetings]);

  async function handleLogin(email: string, password: string) {
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (!result || result.error) {
      throw new Error("Email yoki parol noto'g'ri");
    }
  }

  async function handleRegister(input: { name: string; email: string; password: string }) {
    await registerUser({
      name: input.name || undefined,
      email: input.email,
      password: input.password,
    });

    const result = await signIn('credentials', {
      email: input.email,
      password: input.password,
      redirect: false,
    });

    if (!result || result.error) {
      throw new Error("Hisob yaratildi, lekin kirish bajarilmadi. Qayta urinib ko'ring.");
    }
  }

  async function handleCreateMeeting(payload: CreateMeetingPayload) {
    if (!accessToken) {
      throw new Error('Access token topilmadi');
    }

    setCreatingMeeting(true);
    setPageError('');
    try {
      await createMeeting(accessToken, payload);
      await loadMeetings('refresh');
    } finally {
      setCreatingMeeting(false);
    }
  }

  async function handleFinishMeeting(meetingId: string) {
    if (!accessToken) {
      throw new Error('Access token topilmadi');
    }

    setActiveMeetingId(meetingId);
    setPageError('');
    try {
      await finishMeeting(accessToken, meetingId);
      await loadMeetings('refresh');
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Qo'ng'iroqni yakunlab bo'lmadi");
    } finally {
      setActiveMeetingId(null);
    }
  }

  function handleJoinRoom(roomName: string) {
    router.push(`/room/${encodeURIComponent(roomName)}`);
  }

  if (status === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        Sessiya tekshirilmoqda...
      </main>
    );
  }

  if (status === 'unauthenticated') {
    return <AuthPanel onLogin={handleLogin} onRegister={handleRegister} />;
  }

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        Sessiya mavjud emas.
      </main>
    );
  }

  const userName = session.user?.name || 'Foydalanuvchi';
  const userEmail = session.user?.email || '-';

  return (
    <DashboardShell
      userName={userName}
      userEmail={userEmail}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={() => signOut({ callbackUrl: '/dashboard' })}
      metrics={<MetricsGrid metrics={metrics} />}
    >
      {pageError ? (
        <div className="mb-3 rounded-lg border border-rose-700 bg-rose-950/30 px-3 py-2 text-sm text-rose-300">
          {pageError}
        </div>
      ) : null}

      {activeTab === 'meetings' ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_1fr]">
          <CreateMeetingForm onCreate={handleCreateMeeting} busy={creatingMeeting} />
          <MeetingsTab
            meetings={meetings}
            loading={loadingMeetings}
            refreshing={refreshingMeetings}
            activeMeetingId={activeMeetingId}
            onRefresh={() => loadMeetings('refresh')}
            onJoin={handleJoinRoom}
            onFinish={handleFinishMeeting}
          />
        </div>
      ) : (
        <RecordingsTab meetings={meetings} />
      )}
    </DashboardShell>
  );
}
