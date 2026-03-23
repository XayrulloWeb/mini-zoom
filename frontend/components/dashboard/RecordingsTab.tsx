import type { Meeting } from './types';
import { formatDateTime, formatDuration } from './utils';

type RecordingsTabProps = {
  meetings: Meeting[];
};

export function RecordingsTab({ meetings }: RecordingsTabProps) {
  const recordings = [...meetings]
    .filter((meeting) => Boolean(meeting.endedAt))
    .sort((left, right) => {
      const leftTime = new Date(left.endedAt || '').getTime();
      const rightTime = new Date(right.endedAt || '').getTime();
      return rightTime - leftTime;
    });

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h2 className="text-lg font-semibold">Yozuvlar</h2>
      <p className="mt-1 text-sm text-slate-400">
        Yakunlangan qongiroqlar tarixi. Yozuv fayllarini LiveKit egress orqali ulash mumkin.
      </p>

      <div className="mt-4 space-y-3">
        {recordings.length === 0 ? (
          <p className="text-sm text-slate-400">Hali yakunlangan qongiroqlar yoq.</p>
        ) : (
          recordings.map((meeting) => (
            <article
              key={meeting.id}
              className="rounded-xl border border-slate-700 bg-slate-900/80 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold">{meeting.title}</h3>
                  <p className="text-sm text-slate-400">{meeting.roomName}</p>
                </div>
                <span className="rounded-md border border-slate-600 bg-slate-700/40 px-2 py-1 text-xs text-slate-200">
                  Yakunlangan
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-300">
                <p>Boshlangan: {formatDateTime(meeting.startedAt)}</p>
                <p>Tugagan: {formatDateTime(meeting.endedAt)}</p>
                <p>Davomiyligi: {formatDuration(meeting.startedAt, meeting.endedAt)}</p>
                <p>Boshlovchi: {meeting.host.name || meeting.host.email}</p>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
