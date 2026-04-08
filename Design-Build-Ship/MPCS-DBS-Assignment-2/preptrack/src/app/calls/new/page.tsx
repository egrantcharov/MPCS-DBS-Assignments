'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';
import { Call, Contact } from '@/context/types';
import CardShell from '@/components/CardShell';
import { cn } from '@/lib/utils';
import { generateGoogleCalendarUrl } from '@/lib/calendar';
import {
  ChevronRight,
  Plus,
  X,
  Calendar as CalendarIcon,
  UserPlus,
  ExternalLink,
} from 'lucide-react';

export default function NewCallPage() {
  const { state, dispatch } = useAppContext();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [contactId, setContactId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [duration, setDuration] = useState('30');
  const [notes, setNotes] = useState('');
  const [selectedPrepIds, setSelectedPrepIds] = useState<string[]>([]);
  const [talkingPoints, setTalkingPoints] = useState<string[]>(['']);

  // New contact form
  const [showNewContact, setShowNewContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactRole, setNewContactRole] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactCompanyId, setNewContactCompanyId] = useState('');

  const handleAddTalkingPoint = () => {
    setTalkingPoints([...talkingPoints, '']);
  };

  const handleRemoveTalkingPoint = (index: number) => {
    setTalkingPoints(talkingPoints.filter((_, i) => i !== index));
  };

  const handleUpdateTalkingPoint = (index: number, value: string) => {
    const updated = [...talkingPoints];
    updated[index] = value;
    setTalkingPoints(updated);
  };

  const togglePrepQuestion = (qId: string) => {
    setSelectedPrepIds((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
    );
  };

  const handleCreateContact = () => {
    if (!newContactName.trim()) return;
    const newId = `ct-${Date.now()}`;
    const newContact: Contact = {
      id: newId,
      name: newContactName.trim(),
      role: newContactRole.trim(),
      email: newContactEmail.trim(),
      phone: '',
      companyId: newContactCompanyId,
      linkedIn: '',
      twitter: '',
      website: '',
      notes: '',
      birthday: null,
      location: '',
      pronouns: '',
      tags: [],
      circles: ['Professional'],
      interests: [],
      howWeMet: '',
      introducedBy: '',
      lastContactedAt: new Date().toISOString(),
      nextFollowUpAt: null,
      followUpNote: '',
      interactionCount: 0,
      favorsGiven: [],
      favorsReceived: [],
      createdAt: new Date().toISOString(),
      isStarred: false,
    };
    dispatch({ type: 'ADD_CONTACT', payload: newContact });
    setContactId(newId);
    setShowNewContact(false);
    setNewContactName('');
    setNewContactRole('');
    setNewContactEmail('');
    setNewContactCompanyId('');
  };

  const handleSubmit = () => {
    if (!title.trim() || !contactId || !scheduledDate || !scheduledTime) return;

    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
    const callId = `call-${Date.now()}`;

    const call: Call = {
      id: callId,
      title: title.trim(),
      contactId,
      status: 'Scheduled',
      scheduledAt,
      duration: parseInt(duration) || 30,
      prepQuestionIds: selectedPrepIds,
      talkingPoints: talkingPoints
        .filter((tp) => tp.trim())
        .map((tp, i) => ({
          id: `tp-${Date.now()}-${i}`,
          text: tp.trim(),
          checked: false,
        })),
      transcript: [],
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_CALL', payload: call });
    router.push(`/calls/${callId}`);
  };

  const canSubmit = title.trim() && contactId && scheduledDate && scheduledTime;

  const calendarUrl = useMemo(() => {
    if (!canSubmit) return null;
    const contact = state.contacts.find((c) => c.id === contactId);
    const company = contact
      ? state.companies.find((co) => co.id === contact.companyId)
      : null;

    return generateGoogleCalendarUrl({
      title: title.trim(),
      description: `Call with ${contact?.name || 'Contact'}${company ? ` (${company.name})` : ''}\n\n${notes.trim()}`,
      startTime: new Date(`${scheduledDate}T${scheduledTime}`).toISOString(),
      durationMinutes: parseInt(duration) || 30,
    });
  }, [canSubmit, title, contactId, scheduledDate, scheduledTime, duration, notes, state.contacts, state.companies]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/calls" className="hover:text-gray-900 transition-colors">
          Calls
        </Link>
        <ChevronRight size={14} />
        <span className="text-gray-700">New Call</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900">Schedule a Call</h1>

      {/* Title */}
      <CardShell>
        <label className="block text-xs text-gray-500 mb-2">Call Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Recruiter Screen with Marcus"
          className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-indigo-500 transition"
        />
      </CardShell>

      {/* Contact */}
      <CardShell>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-gray-500">Contact</label>
          <button
            onClick={() => setShowNewContact(!showNewContact)}
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
          >
            <UserPlus size={12} />
            {showNewContact ? 'Select Existing' : 'New Contact'}
          </button>
        </div>

        {showNewContact ? (
          <div className="space-y-3">
            <input
              type="text"
              value={newContactName}
              onChange={(e) => setNewContactName(e.target.value)}
              placeholder="Contact name"
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-indigo-500 transition"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={newContactRole}
                onChange={(e) => setNewContactRole(e.target.value)}
                placeholder="Role"
                className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-indigo-500 transition"
              />
              <input
                type="email"
                value={newContactEmail}
                onChange={(e) => setNewContactEmail(e.target.value)}
                placeholder="Email"
                className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-indigo-500 transition"
              />
            </div>
            <select
              value={newContactCompanyId}
              onChange={(e) => setNewContactCompanyId(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-indigo-500"
            >
              <option value="" className="bg-white">
                Select company (optional)
              </option>
              {state.companies.map((c) => (
                <option key={c.id} value={c.id} className="bg-white">
                  {c.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleCreateContact}
              disabled={!newContactName.trim()}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Create Contact
            </button>
          </div>
        ) : (
          <select
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-indigo-500"
          >
            <option value="" className="bg-white">
              Select a contact...
            </option>
            {state.contacts.map((c) => {
              const company = state.companies.find(
                (co) => co.id === c.companyId
              );
              return (
                <option key={c.id} value={c.id} className="bg-white">
                  {c.name}
                  {company ? ` (${company.name})` : ''}
                </option>
              );
            })}
          </select>
        )}
      </CardShell>

      {/* Schedule */}
      <CardShell>
        <label className="block text-xs text-gray-500 mb-2">Schedule</label>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Date</label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 transition"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Time</label>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 transition"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Duration (min)
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-indigo-500"
            >
              <option value="15" className="bg-white">15 min</option>
              <option value="30" className="bg-white">30 min</option>
              <option value="45" className="bg-white">45 min</option>
              <option value="60" className="bg-white">60 min</option>
              <option value="90" className="bg-white">90 min</option>
            </select>
          </div>
        </div>
      </CardShell>

      {/* Talking Points */}
      <CardShell>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs text-gray-500">Talking Points</label>
          <button
            onClick={handleAddTalkingPoint}
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
          >
            <Plus size={12} />
            Add
          </button>
        </div>
        <div className="space-y-2">
          {talkingPoints.map((tp, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={tp}
                onChange={(e) => handleUpdateTalkingPoint(i, e.target.value)}
                placeholder={`Talking point ${i + 1}...`}
                className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-indigo-500 transition"
              />
              {talkingPoints.length > 1 && (
                <button
                  onClick={() => handleRemoveTalkingPoint(i)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </CardShell>

      {/* Prep Questions */}
      <CardShell>
        <label className="block text-xs text-gray-500 mb-3">
          Link Prep Questions (optional)
        </label>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {state.prepQuestions.map((q) => (
            <button
              key={q.id}
              onClick={() => togglePrepQuestion(q.id)}
              className={cn(
                'w-full flex items-center gap-3 p-2.5 rounded-lg text-left text-sm transition-all',
                selectedPrepIds.includes(q.id)
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-500/30'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent'
              )}
            >
              <div
                className={cn(
                  'w-4 h-4 rounded border shrink-0 flex items-center justify-center',
                  selectedPrepIds.includes(q.id)
                    ? 'bg-indigo-500 border-indigo-500'
                    : 'border-gray-300'
                )}
              >
                {selectedPrepIds.includes(q.id) && (
                  <span className="text-white text-xs">&#10003;</span>
                )}
              </div>
              <span className="truncate">{q.question}</span>
              <span className="text-xs text-gray-400 shrink-0">
                {q.category}
              </span>
            </button>
          ))}
        </div>
      </CardShell>

      {/* Notes */}
      <CardShell>
        <label className="block text-xs text-gray-500 mb-2">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any notes for this call..."
          className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-900 placeholder:text-gray-400 min-h-[80px] outline-none focus:border-indigo-500 transition resize-y"
        />
      </CardShell>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <CalendarIcon size={16} />
          Create Call
        </button>

        {calendarUrl && (
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-3 rounded-lg bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-all text-sm"
          >
            <ExternalLink size={14} />
            Add to Google Calendar
          </a>
        )}
      </div>
    </div>
  );
}
