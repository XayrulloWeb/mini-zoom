import type { Meeting, MeetingStatus } from './types';

const errorMap: Record<string, string> = {
  'title is required': 'Uchrashuv nomi majburiy',
  'roomPassword is required when isPasswordProtected=true':
    "isPasswordProtected=true bo'lsa, xona paroli majburiy",
  'Meeting room not found': 'Uchrashuv xonasi topilmadi',
  'This room requires a password': 'Bu xonaga kirish uchun parol kerak',
  'Invalid room password': "Xona paroli noto'g'ri",
  'User with this email already exists': 'Bu email bilan foydalanuvchi allaqachon mavjud',
  'Valid email is required': "To'g'ri email manzilini kiriting",
  'Password must be at least 8 characters': 'Parol kamida 8 ta belgidan iborat bo\'lishi kerak',
  'Invalid email or password': "Email yoki parol noto'g'ri",
  'Authenticated user is required': "Tasdiqlangan foydalanuvchi talab qilinadi",
  'Meeting not found': 'Uchrashuv topilmadi',
};

export function getBackendUrl(): string {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendUrl) {
    throw new Error('NEXT_PUBLIC_BACKEND_URL sozlanmagan');
  }
  return backendUrl;
}

function translateError(message: string): string {
  const normalized = message.trim();
  return errorMap[normalized] || normalized;
}

export async function parseApiError(
  response: Response,
  fallback = "So'rov bajarilmadi",
): Promise<string> {
  const payload = (await response.json().catch(() => null)) as
    | { message?: string | string[]; error?: string }
    | null;

  if (payload?.message) {
    if (Array.isArray(payload.message)) {
      return payload.message.map(translateError).join(', ');
    }
    return translateError(payload.message);
  }

  if (payload?.error) {
    return translateError(payload.error);
  }

  return `${fallback} (${response.status})`;
}

export function getMeetingStatus(meeting: Meeting, now = new Date()): MeetingStatus {
  if (meeting.endedAt) {
    return 'finished';
  }

  if (meeting.startedAt) {
    return 'live';
  }

  if (meeting.scheduledFor) {
    const scheduled = new Date(meeting.scheduledFor);
    if (!Number.isNaN(scheduled.getTime()) && scheduled.getTime() > now.getTime()) {
      return 'scheduled';
    }
  }

  return 'pending';
}

export function formatDateTime(value: string | null): string {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatDuration(startedAt: string | null, endedAt: string | null): string {
  if (!startedAt || !endedAt) {
    return '-';
  }

  const started = new Date(startedAt).getTime();
  const ended = new Date(endedAt).getTime();

  if (Number.isNaN(started) || Number.isNaN(ended) || ended <= started) {
    return '-';
  }

  const totalMinutes = Math.floor((ended - started) / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours} soat ${minutes} daqiqa`;
  }

  return `${minutes} daqiqa`;
}

export function classNames(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}
