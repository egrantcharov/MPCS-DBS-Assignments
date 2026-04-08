'use client';

import { useMemo, useRef } from 'react';
import { useAppContext } from '@/context/AppContext';
import PipelineStats from '@/components/PipelineStats';
import CardShell from '@/components/CardShell';
import Link from 'next/link';
import {
  CalendarDays,
  Bell,
  Users,
  TrendingUp,
  AlertTriangle,
  Heart,
  Phone as PhoneIcon,
  ArrowRight,
} from 'lucide-react';
import {
  getRelationshipScore,
  getRelationshipStrength,
  getRelationshipColor,
  getGoingColdContacts,
  isUpcomingBirthday,
  daysSince,
} from '@/lib/utils';
import { RelationshipStrength } from '@/context/types';

export default function Dashboard() {
  const { state } = useAppContext();

  const todayRef = useRef(new Date());
  const today = todayRef.current;
  const todayStr = today.toISOString().split('T')[0];
  const greeting =
    today.getHours() < 12
      ? 'Good morning'
      : today.getHours() < 17
        ? 'Good afternoon'
        : 'Good evening';
  const dateLabel = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Daily briefing data
  const todayCalls = useMemo(
    () =>
      state.calls.filter(
        (c) =>
          c.status === 'Scheduled' &&
          c.scheduledAt.startsWith(todayStr)
      ),
    [state.calls, todayStr]
  );

  const dueReminders = useMemo(
    () =>
      state.reminders.filter(
        (r) => !r.completed && r.dueDate.startsWith(todayStr)
      ),
    [state.reminders, todayStr]
  );

  const goingCold = useMemo(
    () => getGoingColdContacts(state.contacts),
    [state.contacts]
  );

  const upcomingBirthdays = useMemo(
    () => state.contacts.filter((c) => isUpcomingBirthday(c.birthday)),
    [state.contacts]
  );

  // Relationship health counts
  const strengthCounts = useMemo(() => {
    const counts: Record<RelationshipStrength, number> = {
      Strong: 0,
      Good: 0,
      Fading: 0,
      Cold: 0,
      New: 0,
    };
    state.contacts.forEach((c) => {
      const score = getRelationshipScore(c);
      const strength = getRelationshipStrength(score);
      counts[strength]++;
    });
    return counts;
  }, [state.contacts]);

  // Quick stats
  const interactionsThisMonth = useMemo(() => {
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .split('T')[0];
    return state.interactions.filter((i) => i.date >= monthStart).length;
  }, [state.interactions, today]);

  const pendingFollowUps = useMemo(
    () => state.contacts.filter((c) => c.nextFollowUpAt).length,
    [state.contacts]
  );

  const activeReminders = useMemo(
    () => state.reminders.filter((r) => !r.completed).length,
    [state.reminders]
  );

  const strengthOrder: RelationshipStrength[] = [
    'Strong',
    'Good',
    'Fading',
    'Cold',
    'New',
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{greeting}</h1>
        <p className="text-sm text-gray-500">{dateLabel}</p>
      </div>

      {/* Daily Briefing */}
      <CardShell>
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays size={18} className="text-indigo-600" />
          <h3 className="text-sm font-semibold text-gray-700">
            Daily Briefing
          </h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Today you have{' '}
          <span className="font-semibold text-gray-900">
            {todayCalls.length} call{todayCalls.length !== 1 ? 's' : ''}
          </span>
          ,{' '}
          <span className="font-semibold text-gray-900">
            {dueReminders.length} reminder{dueReminders.length !== 1 ? 's' : ''}{' '}
            due
          </span>
          , and{' '}
          <span className="font-semibold text-gray-900">
            {goingCold.length} contact{goingCold.length !== 1 ? 's' : ''} going
            cold
          </span>
          .
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Today's Calls */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <PhoneIcon size={14} className="text-indigo-600" />
              <p className="text-xs font-semibold text-gray-600">
                Today&apos;s Calls
              </p>
            </div>
            {todayCalls.length === 0 ? (
              <p className="text-xs text-gray-400">No calls scheduled</p>
            ) : (
              <div className="space-y-1.5">
                {todayCalls.map((call) => {
                  const contact = state.contacts.find(
                    (c) => c.id === call.contactId
                  );
                  return (
                    <Link
                      key={call.id}
                      href="/calls"
                      className="block text-xs text-gray-700 hover:text-indigo-600"
                    >
                      {call.title}
                      {contact && (
                        <span className="text-gray-400">
                          {' '}
                          - {contact.name}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Due Reminders */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Bell size={14} className="text-amber-600" />
              <p className="text-xs font-semibold text-gray-600">
                Due Reminders
              </p>
            </div>
            {dueReminders.length === 0 ? (
              <p className="text-xs text-gray-400">No reminders due</p>
            ) : (
              <div className="space-y-1.5">
                {dueReminders.map((r) => (
                  <p key={r.id} className="text-xs text-gray-700">
                    {r.title}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Birthdays */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Heart size={14} className="text-pink-500" />
              <p className="text-xs font-semibold text-gray-600">
                Upcoming Birthdays
              </p>
            </div>
            {upcomingBirthdays.length === 0 ? (
              <p className="text-xs text-gray-400">None in the next 30 days</p>
            ) : (
              <div className="space-y-1.5">
                {upcomingBirthdays.map((c) => (
                  <p key={c.id} className="text-xs text-gray-700">
                    {c.name}
                    {c.birthday && (
                      <span className="text-gray-400">
                        {' '}
                        -{' '}
                        {new Date(c.birthday).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardShell>

      {/* Relationship Health */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <TrendingUp size={16} className="text-indigo-600" />
          Relationship Health
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {strengthOrder.map((strength) => {
            const color = getRelationshipColor(strength);
            return (
              <CardShell key={strength} className="text-center">
                <div
                  className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium mb-2 ${color}`}
                >
                  {strength}
                </div>
                <p className="text-2xl font-bold font-mono text-gray-900">
                  {strengthCounts[strength]}
                </p>
                <p className="text-xs text-gray-500 mt-1">contacts</p>
              </CardShell>
            );
          })}
        </div>
      </div>

      {/* Going Cold Alert */}
      {goingCold.length > 0 && (
        <CardShell className="border-l-4 border-l-amber-400">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-700">
              Going Cold - Reach Out Soon
            </h3>
          </div>
          <div className="space-y-3">
            {goingCold.slice(0, 3).map((contact) => {
              const company = state.companies.find(
                (c) => c.id === contact.companyId
              );
              const days = daysSince(contact.lastContactedAt);
              return (
                <Link
                  key={contact.id}
                  href="/contacts"
                  className="flex items-center justify-between p-3 rounded-lg bg-amber-50 hover:bg-amber-100 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {contact.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {company?.name || 'No company'} &middot; Last contacted{' '}
                      {days} days ago
                    </p>
                  </div>
                  <span className="text-xs text-amber-700 font-medium flex items-center gap-1">
                    Reach out <ArrowRight size={12} />
                  </span>
                </Link>
              );
            })}
          </div>
        </CardShell>
      )}

      {/* Pipeline Stats */}
      <PipelineStats />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CardShell>
          <div className="flex items-center gap-2 mb-1">
            <Users size={14} className="text-gray-400" />
            <p className="text-xs text-gray-500">Total Contacts</p>
          </div>
          <p className="text-xl font-bold font-mono text-gray-900">
            {state.contacts.length}
          </p>
        </CardShell>
        <CardShell>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-gray-400" />
            <p className="text-xs text-gray-500">Interactions This Month</p>
          </div>
          <p className="text-xl font-bold font-mono text-gray-900">
            {interactionsThisMonth}
          </p>
        </CardShell>
        <CardShell>
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays size={14} className="text-gray-400" />
            <p className="text-xs text-gray-500">Pending Follow-ups</p>
          </div>
          <p className="text-xl font-bold font-mono text-gray-900">
            {pendingFollowUps}
          </p>
        </CardShell>
        <CardShell>
          <div className="flex items-center gap-2 mb-1">
            <Bell size={14} className="text-gray-400" />
            <p className="text-xs text-gray-500">Active Reminders</p>
          </div>
          <p className="text-xl font-bold font-mono text-gray-900">
            {activeReminders}
          </p>
        </CardShell>
      </div>
    </div>
  );
}
