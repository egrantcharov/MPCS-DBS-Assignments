export function generateGoogleCalendarUrl({
  title,
  description,
  startTime,
  durationMinutes,
  location,
}: {
  title: string;
  description: string;
  startTime: string; // ISO string
  durationMinutes: number;
  location?: string;
}): string {
  const start = new Date(startTime);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const formatDate = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    details: description,
    dates: `${formatDate(start)}/${formatDate(end)}`,
  });

  if (location) {
    params.set('location', location);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
