export type DashboardTab = 'meetings' | 'recordings' | 'friends' | 'chat' | 'groups' | 'profile';

export type MeetingStatus = 'pending' | 'scheduled' | 'live' | 'finished';

export type Meeting = {
  id: string;
  title: string;
  roomName: string;
  isPasswordProtected: boolean;
  waitingRoomEnabled?: boolean;
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
  waitingRoomEnabled?: boolean;
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

export type Friend = {
  friendshipId: string;
  id: string;
  name: string | null;
  email: string;
};

export type FriendRequest = {
  friendshipId: string;
  from: {
    id: string;
    name: string | null;
    email: string;
  };
  createdAt: string;
};

export type Conversation = {
  friend: {
    id: string;
    name: string | null;
    email: string;
  };
  lastMessage: {
    text: string;
    createdAt: string;
    senderId: string;
  } | null;
  unreadCount: number;
};

export type DirectMessage = {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: string;
  read: boolean;
  sender: {
    id: string;
    name: string | null;
    email: string;
  };
};
