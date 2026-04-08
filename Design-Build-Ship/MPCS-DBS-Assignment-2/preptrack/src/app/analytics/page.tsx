'use client';

import { useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import CardShell from '@/components/CardShell';
import { BarChart3, Users, TrendingUp, AlertTriangle, Handshake, Activity } from 'lucide-react';
import {
  getRelationshipScore,
  getRelationshipStrength,
  getRelationshipColor,
  getGoingColdContacts,
  daysSince,
  cn,
} from '@/lib/utils';
import { RelationshipStrength } from '@/context/types';

const strengthOrder: RelationshipStrength[] = ['Strong', 'Good', 'Fading', 'Cold', 'New'];

export default function AnalyticsPage() {
  const { state, dispatch } = useAppContext();

  // Overview stats
  const totalContacts = state.contacts.length;
  const totalInteractions = state.interactions.length;
  const avgInteractions =
    totalContacts > 0
      ? Math.round((totalInteractions / totalContacts) * 10) / 10
      : 0;
  const goingCold = useMemo(
    () => getGoingColdContacts(state.contacts),
    [state.contacts]
  );

  // Outreach over time (last 6 months)
  const monthlyInteractions = useMemo(() => {
    const now = new Date();
    const months: { label: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = d.toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
      });
      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const count = state.interactions.filter((int) =>
        int.date.startsWith(yearMonth)
      ).length;
      months.push({ label: monthStr, count });
    }
    return months;
  }, [state.interactions]);

  const maxMonthly = Math.max(...monthlyInteractions.map((m) => m.count), 1);

  // Relationship distribution
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

  const maxStrengthCount = Math.max(...Object.values(strengthCounts), 1);

  // Circles breakdown
  const circleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    state.contacts.forEach((c) => {
      (c.circles || []).forEach((circle) => {
        counts[circle] = (counts[circle] || 0) + 1;
      });
    });
    return counts;
  }, [state.contacts]);

  // Top connected contacts
  const topConnected = useMemo(() => {
    return [...state.contacts]
      .sort((a, b) => (b.interactionCount || 0) - (a.interactionCount || 0))
      .slice(0, 5);
  }, [state.contacts]);

  // Contacts needing attention
  const needsAttention = useMemo(() => {
    return state.contacts.filter((c) => {
      const score = getRelationshipScore(c);
      const strength = getRelationshipStrength(score);
      return (
        (strength === 'Fading' || strength === 'Cold') && !c.nextFollowUpAt
      );
    });
  }, [state.contacts]);

  // Introduction stats
  const introStats = useMemo(() => {
    const pending = state.introductions.filter(
      (i) => i.status === 'Pending'
    ).length;
    const completed = state.introductions.filter(
      (i) => i.status === 'Accepted' || i.status === 'Made'
    ).length;
    return { pending, completed, total: state.introductions.length };
  }, [state.introductions]);

  const handleScheduleFollowUp = (contactId: string, contactName: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dispatch({
      type: 'ADD_REMINDER',
      payload: {
        id: `rem-${Date.now()}`,
        contactId,
        type: 'FollowUp',
        title: `Follow up with ${contactName}`,
        dueDate: tomorrow.toISOString(),
        completed: false,
        createdAt: new Date().toISOString(),
      },
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
          <BarChart3 size={24} className="text-indigo-600" />
          Analytics
        </h1>
        <p className="text-sm text-gray-500">
          Network health and relationship insights
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CardShell>
          <div className="flex items-center gap-2 mb-1">
            <Users size={14} className="text-gray-400" />
            <p className="text-xs text-gray-500">Total Contacts</p>
          </div>
          <p className="text-2xl font-bold font-mono text-gray-900">
            {totalContacts}
          </p>
        </CardShell>
        <CardShell>
          <div className="flex items-center gap-2 mb-1">
            <Activity size={14} className="text-gray-400" />
            <p className="text-xs text-gray-500">Total Interactions</p>
          </div>
          <p className="text-2xl font-bold font-mono text-gray-900">
            {totalInteractions}
          </p>
        </CardShell>
        <CardShell>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-gray-400" />
            <p className="text-xs text-gray-500">Avg Interactions/Contact</p>
          </div>
          <p className="text-2xl font-bold font-mono text-gray-900">
            {avgInteractions}
          </p>
        </CardShell>
        <CardShell>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} className="text-amber-500" />
            <p className="text-xs text-gray-500">Going Cold</p>
          </div>
          <p className="text-2xl font-bold font-mono text-amber-600">
            {goingCold.length}
          </p>
        </CardShell>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Outreach Over Time */}
        <CardShell>
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Outreach Over Time
          </h3>
          <div className="space-y-3">
            {monthlyInteractions.map(({ label, count }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-16 text-right">
                  {label}
                </span>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${(count / maxMonthly) * 100}%`,
                      minWidth: count > 0 ? '8px' : '0px',
                    }}
                  />
                </div>
                <span className="text-xs font-mono text-gray-600 w-6 text-right">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </CardShell>

        {/* Relationship Distribution */}
        <CardShell>
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Relationship Distribution
          </h3>
          <div className="space-y-3">
            {strengthOrder.map((strength) => {
              const count = strengthCounts[strength];
              const color = getRelationshipColor(strength);
              const bgColor =
                strength === 'Strong'
                  ? 'bg-emerald-500'
                  : strength === 'Good'
                    ? 'bg-blue-500'
                    : strength === 'Fading'
                      ? 'bg-amber-500'
                      : strength === 'Cold'
                        ? 'bg-red-500'
                        : 'bg-indigo-500';
              return (
                <div key={strength} className="flex items-center gap-3">
                  <span
                    className={cn(
                      'text-xs font-medium w-16 text-right px-1.5 py-0.5 rounded-full',
                      color
                    )}
                  >
                    {strength}
                  </span>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        bgColor
                      )}
                      style={{
                        width: `${(count / maxStrengthCount) * 100}%`,
                        minWidth: count > 0 ? '8px' : '0px',
                      }}
                    />
                  </div>
                  <span className="text-xs font-mono text-gray-600 w-6 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </CardShell>
      </div>

      {/* Circles Breakdown */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Circles Breakdown
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(circleCounts).map(([circle, count]) => (
            <CardShell key={circle} className="text-center">
              <p className="text-xs text-gray-500 mb-1">{circle}</p>
              <p className="text-xl font-bold font-mono text-gray-900">
                {count}
              </p>
            </CardShell>
          ))}
          {Object.keys(circleCounts).length === 0 && (
            <p className="text-sm text-gray-400 col-span-full">
              No circle data yet
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Connected */}
        <CardShell>
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Top Connected
          </h3>
          {topConnected.length === 0 ? (
            <p className="text-sm text-gray-400">No contacts yet</p>
          ) : (
            <div className="space-y-3">
              {topConnected.map((contact, idx) => {
                const company = state.companies.find(
                  (c) => c.id === contact.companyId
                );
                return (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-gray-400 w-5">
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {contact.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {company?.name || ''}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-indigo-600 font-medium">
                      {contact.interactionCount || 0} interactions
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardShell>

        {/* Contacts Needing Attention */}
        <CardShell>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-700">
              Needs Attention
            </h3>
          </div>
          {needsAttention.length === 0 ? (
            <p className="text-sm text-gray-400">
              All contacts are in good shape
            </p>
          ) : (
            <div className="space-y-3">
              {needsAttention.slice(0, 5).map((contact) => {
                const company = state.companies.find(
                  (c) => c.id === contact.companyId
                );
                const days = daysSince(contact.lastContactedAt);
                return (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-amber-50"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {contact.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {company?.name || ''} &middot; {days}d since last
                        contact
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        handleScheduleFollowUp(contact.id, contact.name)
                      }
                      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition whitespace-nowrap"
                    >
                      Schedule Follow-up
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </CardShell>
      </div>

      {/* Introduction Stats */}
      <CardShell>
        <div className="flex items-center gap-2 mb-4">
          <Handshake size={16} className="text-indigo-600" />
          <h3 className="text-sm font-semibold text-gray-700">
            Introduction Stats
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xl font-bold font-mono text-gray-900">
              {introStats.total}
            </p>
            <p className="text-xs text-gray-500 mt-1">Total</p>
          </div>
          <div className="text-center p-3 bg-amber-50 rounded-lg">
            <p className="text-xl font-bold font-mono text-amber-700">
              {introStats.pending}
            </p>
            <p className="text-xs text-gray-500 mt-1">Pending</p>
          </div>
          <div className="text-center p-3 bg-emerald-50 rounded-lg">
            <p className="text-xl font-bold font-mono text-emerald-700">
              {introStats.completed}
            </p>
            <p className="text-xs text-gray-500 mt-1">Completed</p>
          </div>
        </div>
      </CardShell>
    </div>
  );
}
