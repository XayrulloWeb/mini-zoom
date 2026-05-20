import { signOut } from 'next-auth/react';
import type { CreateMeetingPayload, Meeting, RegisterPayload } from './types';
import { getBackendUrl, parseApiError } from './utils';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  accessToken?: string;
  body?: unknown;
};

type PaginatedResponse<T> = {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${getBackendUrl()}${path}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  // Auto-logout on 401
  if (response.status === 401 && options.accessToken) {
    signOut({ callbackUrl: '/dashboard' });
    throw new Error('Sessiya muddati tugadi. Qayta kiring.');
  }

  if (!response.ok) {
    throw new Error(await parseApiError(response, `So'rov bajarilmadi: ${path}`));
  }

  return (await response.json()) as T;
}

export async function registerUser(payload: RegisterPayload) {
  return apiRequest<{ user: { id: string } }>('/auth/register', {
    method: 'POST',
    body: payload,
  });
}

export async function fetchMyMeetings(accessToken: string) {
  const result = await apiRequest<PaginatedResponse<Meeting>>('/meetings/my?limit=100', {
    accessToken,
  });
  return result.data;
}

export async function createMeeting(accessToken: string, payload: CreateMeetingPayload) {
  return apiRequest<Meeting>('/meetings', {
    method: 'POST',
    accessToken,
    body: payload,
  });
}

export async function finishMeeting(accessToken: string, meetingId: string) {
  return apiRequest<Meeting>(`/meetings/${meetingId}/finish`, {
    method: 'POST',
    accessToken,
  });
}

export async function deleteMeeting(accessToken: string, meetingId: string) {
  return apiRequest<{ message: string }>(`/meetings/${meetingId}`, {
    method: 'DELETE',
    accessToken,
  });
}

export async function updateMeeting(accessToken: string, meetingId: string, payload: Partial<CreateMeetingPayload>) {
  return apiRequest<Meeting>(`/meetings/${meetingId}`, {
    method: 'PATCH',
    accessToken,
    body: payload,
  });
}
