'use client';

import CardShell from '@/components/CardShell';
import { ExternalLink } from 'lucide-react';

export default function CalendarPage() {
  const embedUrl =
    'https://calendar.google.com/calendar/embed?src=emil.a.grantcharov%40gmail.com&ctz=America%2FChicago&mode=WEEK';
  const calendarUrl = 'https://calendar.google.com/calendar/u/0/r';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Calendar</h1>
          <p className="text-sm text-gray-500">
            View and manage your interview schedule
          </p>
        </div>
        <a
          href={calendarUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-all font-medium"
        >
          <ExternalLink size={14} />
          Open in Google Calendar
        </a>
      </div>

      <CardShell className="p-0 overflow-hidden">
        <iframe
          src={embedUrl}
          style={{ border: 0, width: '100%', height: 'calc(100vh - 140px)' }}
          frameBorder="0"
          scrolling="no"
          title="Google Calendar"
        />
      </CardShell>
    </div>
  );
}
