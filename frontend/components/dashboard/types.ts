export type DashboardTab = 'meetings' | 'recordings';

export type MeetingStatus = 'pending' | 'scheduled' | 'live' | 'finished';

export type Meeting = {
  id: string;
  title: string;
  roomName: string;
  isPasswordProtected: boolean;
  hostId: string;
  createdAt: string;
  scheduledFor: string | null;
  startedAt: string | null;
  endedAt: string | null;
  host: {
    id: string;
    name: string | null;
    email: string;
  };
};

export type CreateMeetingPayload = {
  title: string;
  roomName?: string;
  isPasswordProtected?: boolean;
  roomPassword?: string;
  scheduledFor?: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  name?: string;
};

export type DashboardMetrics = {
  total: number;
  live: number;
  scheduled: number;
  recordings: number;
};
