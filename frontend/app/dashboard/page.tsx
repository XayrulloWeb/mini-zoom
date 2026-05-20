"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/Toast';
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
import { FriendsTab } from '@/components/dashboard/FriendsTab';
import { ChatTab } from '@/components/dashboard/ChatTab';
import { GroupsTab } from '@/components/dashboard/GroupsTab';
import { ProfileTab } from '@/components/dashboard/ProfileTab';
import { SkeletonList, SkeletonMetrics } from '@/components/dashboard/Skeleton';
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
  const toast = useToast();

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
        setMeetings(Array.isArray(data) ? data : []);
      } catch (error) {
        setPageError(error instanceof Error ? error.message : "Uchrashuvlarni yuklab bo'lmadi");
        setMeetings([]);
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
      toast.success('Uchrashuv yaratildi!');
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
      toast.success('Uchrashuv yakunlandi');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Qo'ng'iroqni yakunlab bo'lmadi");
    } finally {
      setActiveMeetingId(null);
    }
  }

  function handleJoinRoom(roomName: string) {
    router.push(`/room/${encodeURIComponent(roomName)}`);
    toast.info("Xonaga yo'naltirilmoqda...");
  }

  // If refresh token expired, force re-login
  if (session?.error === 'RefreshAccessTokenError') {
    signOut({ callbackUrl: '/dashboard' });
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        Sessiya muddati tugadi. Qayta kirish...
      </main>
    );
  }

  if (status === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <span>Sessiya tekshirilmoqda...</span>
        </div>
      </main>
    );
  }

  if (status === 'unauthenticated') {
    return <AuthPanel onLogin={handleLogin} onRegister={handleRegister} />;
  }

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
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
      metrics={loadingMeetings ? <SkeletonMetrics /> : <MetricsGrid metrics={metrics} />}
    >
      {pageError ? (
        <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm text-rose-400">
          {pageError}
        </div>
      ) : null}

      {activeTab === 'meetings' ? (
        <div className="space-y-4">
          <CreateMeetingForm onCreate={handleCreateMeeting} busy={creatingMeeting} />
          {loadingMeetings ? (
            <SkeletonList count={4} />
          ) : (
            <MeetingsTab
              meetings={meetings}
              loading={false}
              refreshing={refreshingMeetings}
              activeMeetingId={activeMeetingId}
              onRefresh={() => loadMeetings('refresh')}
              onJoin={handleJoinRoom}
              onFinish={handleFinishMeeting}
            />
          )}
        </div>
      ) : activeTab === 'recordings' ? (
        <RecordingsTab meetings={meetings} />
      ) : activeTab === 'friends' ? (
        <FriendsTab accessToken={accessToken} />
      ) : activeTab === 'chat' ? (
        <ChatTab accessToken={accessToken} currentUserId={session.user?.id || ''} />
      ) : activeTab === 'groups' ? (
        <GroupsTab accessToken={accessToken} currentUserId={session.user?.id || ''} />
      ) : activeTab === 'profile' ? (
        <ProfileTab accessToken={accessToken} currentUserId={session.user?.id || ''} onLogout={() => signOut({ callbackUrl: '/dashboard' })} />
      ) : null}
    </DashboardShell>
  );
}
