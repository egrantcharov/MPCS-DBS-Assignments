'use client';

import { useAppContext } from '@/context/AppContext';
import { formatDate } from '@/lib/utils';
import CardShell from './CardShell';
import { Building2, Users, BookOpen } from 'lucide-react';

interface ActivityItem {
  id: string;
  icon: typeof Building2;
  text: string;
  date: string;
  color: string;
}

export default function ActivityFeed() {
  const { state } = useAppContext();

  const activities: ActivityItem[] = [
    ...state.companies.map((c) => ({
      id: `company-${c.id}`,
      icon: Building2,
      text: `${c.name} — ${c.status}`,
      date: c.createdAt,
      color: 'text-indigo-600',
    })),
    ...state.contacts
      .filter((c) => c.lastContactedAt)
      .map((c) => {
        const company = state.companies.find((co) => co.id === c.companyId);
        return {
          id: `contact-${c.id}`,
          icon: Users,
          text: `Contacted ${c.name}${company ? ` at ${company.name}` : ''}`,
          date: c.lastContactedAt,
          color: 'text-emerald-600',
        };
      }),
    ...state.prepQuestions
      .filter((q) => q.lastPracticedAt)
      .map((q) => ({
        id: `prep-${q.id}`,
        icon: BookOpen,
        text: `Practiced: ${q.question.substring(0, 40)}...`,
        date: q.lastPracticedAt!,
        color: 'text-amber-600',
      })),
  ];

  activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const recent = activities.slice(0, 8);

  return (
    <CardShell>
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Recent Activity</h3>
      {recent.length === 0 ? (
        <p className="text-sm text-gray-500">No recent activity</p>
      ) : (
        <div className="space-y-3">
          {recent.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <item.icon size={14} className={`${item.color} mt-0.5 shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 truncate">{item.text}</p>
                <p className="text-xs text-gray-500">{formatDate(item.date)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </CardShell>
  );
}
