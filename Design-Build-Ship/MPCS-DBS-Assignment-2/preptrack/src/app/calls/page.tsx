'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';
import { CallStatus } from '@/context/types';
import CardShell from '@/components/CardShell';
import SearchBar from '@/components/SearchBar';
import { cn } from '@/lib/utils';
import { Plus, Phone, Calendar, Clock, ChevronRight, Mic } from 'lucide-react';

const statusColors: Record<CallStatus, string> = {
  Scheduled: 'text-blue-700 bg-blue-50',
  'In Progress': 'text-amber-700 bg-amber-50',
  Completed: 'text-emerald-700 bg-emerald-50',
  Cancelled: 'text-red-700 bg-red-50',
};

const tabs: ('Upcoming' | 'Past' | 'All')[] = ['Upcoming', 'Past', 'All'];

export default function CallsPage() {
  const { state } = useAppContext();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'Upcoming' | 'Past' | 'All'>('Upcoming');

  const callsWithContact = useMemo(() => {
    return state.calls.map((call) => {
      const contact = state.contacts.find((c) => c.id === call.contactId);
      const company = contact
        ? state.companies.find((co) => co.id === contact.companyId)
        : null;
      return { call, contact, company };
    });
  }, [state.calls, state.contacts, state.companies]);

  const filtered = useMemo(() => {
    return callsWithContact
      .filter(({ call, contact, company }) => {
        // Tab filter
        if (activeTab === 'Upcoming') {
          if (call.status === 'Completed' || call.status === 'Cancelled') return false;
        } else if (activeTab === 'Past') {
          if (call.status !== 'Completed' && call.status !== 'Cancelled') return false;
        }
        // Search filter
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          call.title.toLowerCase().includes(q) ||
          (contact?.name.toLowerCase().includes(q) ?? false) ||
          (company?.name.toLowerCase().includes(q) ?? false)
        );
      })
      .sort((a, b) => {
        if (activeTab === 'Past') {
          return new Date(b.call.scheduledAt).getTime() - new Date(a.call.scheduledAt).getTime();
        }
        return new Date(a.call.scheduledAt).getTime() - new Date(b.call.scheduledAt).getTime();
      });
  }, [callsWithContact, search, activeTab]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Calls</h1>
          <p className="text-sm text-gray-500">
            {state.calls.length} calls &middot;{' '}
            {state.calls.filter((c) => c.status === 'Scheduled').length} upcoming
          </p>
        </div>
        <Link
          href="/calls/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all text-sm font-medium"
        >
          <Plus size={16} />
          New Call
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 pb-0">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-all border-b-2 -mb-px',
              activeTab === tab
                ? 'text-indigo-600 border-indigo-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search calls, contacts, companies..."
      />

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Phone size={32} className="text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No calls found</p>
          <Link
            href="/calls/new"
            className="text-sm text-indigo-600 hover:text-indigo-700 mt-2 inline-block"
          >
            Schedule your first call
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(({ call, contact, company }) => (
            <Link key={call.id} href={`/calls/${call.id}`}>
              <CardShell className="hover:border-indigo-500/40 transition-all cursor-pointer mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {call.title}
                      </h3>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium shrink-0',
                          statusColors[call.status]
                        )}
                      >
                        {call.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {contact && (
                        <span>
                          {contact.name}
                          {company && ` at ${company.name}`}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(call.scheduledAt).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {new Date(call.scheduledAt).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                      {call.duration && <span>{call.duration} min</span>}
                      {call.transcript.length > 0 && (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <Mic size={11} />
                          Transcript
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 shrink-0" />
                </div>
              </CardShell>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
