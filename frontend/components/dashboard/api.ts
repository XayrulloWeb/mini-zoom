import type { CreateMeetingPayload, Meeting, RegisterPayload } from './types';
import { getBackendUrl, parseApiError } from './utils';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  accessToken?: string;
  body?: unknown;
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
  return apiRequest<Meeting[]>('/meetings/my', {
    accessToken,
  });
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
