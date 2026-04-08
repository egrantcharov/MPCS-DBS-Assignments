'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';
import { InteractionType, Interaction } from '@/context/types';
import CardShell from '@/components/CardShell';
import {
  Star,
  Mail,
  Phone as PhoneIcon,
  MapPin,
  Globe,
  ExternalLink,
  Calendar,
  ArrowLeft,
  Plus,
  MessageSquare,
  Coffee,
  Users,
  Send,
  Link2,
  Clock,
  Gift,
  StickyNote,
  X,
} from 'lucide-react';
import {
  getRelationshipScore,
  getRelationshipStrength,
  getRelationshipColor,
  formatDate,
  cn,
} from '@/lib/utils';

const interactionTypes: InteractionType[] = [
  'Call',
  'Email',
  'Meeting',
  'Coffee',
  'Message',
  'LinkedIn',
  'Introduction',
  'Other',
];

const interactionIcon = (type: InteractionType) => {
  switch (type) {
    case 'Call':
      return <PhoneIcon size={14} />;
    case 'Email':
      return <Send size={14} />;
    case 'Meeting':
      return <Users size={14} />;
    case 'Coffee':
      return <Coffee size={14} />;
    case 'Message':
      return <MessageSquare size={14} />;
    case 'LinkedIn':
      return <ExternalLink size={14} />;
    case 'Introduction':
      return <Link2 size={14} />;
    default:
      return <MessageSquare size={14} />;
  }
};

export default function ContactDetailPage() {
  const params = useParams();
  const contactId = params.id as string;
  const { state, dispatch } = useAppContext();

  const contact = state.contacts.find((c) => c.id === contactId);
  const company = contact
    ? state.companies.find((c) => c.id === contact.companyId)
    : null;

  // Interaction form
  const [showLogInteraction, setShowLogInteraction] = useState(false);
  const [intType, setIntType] = useState<InteractionType>('Call');
  const [intTitle, setIntTitle] = useState('');
  const [intNotes, setIntNotes] = useState('');
  const [intDate, setIntDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Follow-up form
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNote, setFollowUpNote] = useState('');

  // Notes form
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState('');

  // Interactions for this contact
  const interactions = useMemo(() => {
    return state.interactions
      .filter((i) => i.contactId === contactId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.interactions, contactId]);

  if (!contact) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <p className="text-gray-500 mb-4">Contact not found</p>
        <Link
          href="/contacts"
          className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
        >
          &larr; Back to Contacts
        </Link>
      </div>
    );
  }

  const score = getRelationshipScore(contact);
  const strength = getRelationshipStrength(score);
  const strengthColor = getRelationshipColor(strength);

  const handleToggleStar = () => {
    dispatch({ type: 'TOGGLE_STAR_CONTACT', payload: contact.id });
  };

  const handleLogInteraction = () => {
    if (!intTitle.trim()) return;
    const interaction: Interaction = {
      id: `int-${Date.now()}`,
      contactId: contact.id,
      type: intType,
      title: intTitle.trim(),
      notes: intNotes.trim(),
      date: new Date(intDate).toISOString(),
      followUpDate: null,
      followUpNote: '',
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_INTERACTION', payload: interaction });
    setIntTitle('');
    setIntNotes('');
    setIntDate(new Date().toISOString().split('T')[0]);
    setShowLogInteraction(false);
  };

  const handleSetFollowUp = () => {
    if (!followUpDate) return;
    dispatch({
      type: 'UPDATE_CONTACT',
      payload: {
        ...contact,
        nextFollowUpAt: new Date(followUpDate).toISOString(),
        followUpNote: followUpNote.trim(),
      },
    });
    setFollowUpDate('');
    setFollowUpNote('');
    setShowFollowUp(false);
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const updatedNotes = contact.notes
      ? `${contact.notes}\n\n---\n${new Date().toLocaleDateString()}: ${newNote.trim()}`
      : `${new Date().toLocaleDateString()}: ${newNote.trim()}`;
    dispatch({
      type: 'UPDATE_CONTACT',
      payload: { ...contact, notes: updatedNotes },
    });
    setNewNote('');
    setShowAddNote(false);
  };

  const inputClass =
    'bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-indigo-500 transition w-full';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/contacts"
          className="text-gray-400 hover:text-indigo-600 flex items-center gap-1"
        >
          <ArrowLeft size={14} />
          Contacts
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-700 font-medium">{contact.name}</span>
      </div>

      {/* Header */}
      <CardShell>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">
                {contact.name}
              </h1>
              <button
                onClick={handleToggleStar}
                className="p-1 rounded hover:bg-gray-100 transition"
              >
                <Star
                  size={18}
                  className={cn(
                    contact.isStarred
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-gray-300'
                  )}
                />
              </button>
              <span
                className={cn(
                  'text-xs font-medium px-2.5 py-0.5 rounded-full',
                  strengthColor
                )}
              >
                {strength} ({score})
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {contact.role}
              {contact.role && company ? ` @ ${company.name}` : company?.name || ''}
            </p>
            {contact.pronouns && (
              <p className="text-xs text-gray-400 mt-0.5">
                {contact.pronouns}
              </p>
            )}
          </div>
        </div>
      </CardShell>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Info */}
        <CardShell>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Contact Info
          </h3>
          <div className="space-y-2.5">
            {contact.email && (
              <div className="flex items-center gap-2.5 text-sm">
                <Mail size={14} className="text-gray-400 flex-shrink-0" />
                <a
                  href={`mailto:${contact.email}`}
                  className="text-indigo-600 hover:underline"
                >
                  {contact.email}
                </a>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-2.5 text-sm">
                <PhoneIcon
                  size={14}
                  className="text-gray-400 flex-shrink-0"
                />
                <span className="text-gray-700">{contact.phone}</span>
              </div>
            )}
            {contact.linkedIn && (
              <div className="flex items-center gap-2.5 text-sm">
                <ExternalLink
                  size={14}
                  className="text-gray-400 flex-shrink-0"
                />
                <a
                  href={contact.linkedIn}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline truncate"
                >
                  {contact.linkedIn}
                </a>
              </div>
            )}
            {contact.twitter && (
              <div className="flex items-center gap-2.5 text-sm">
                <ExternalLink
                  size={14}
                  className="text-gray-400 flex-shrink-0"
                />
                <span className="text-gray-700">{contact.twitter}</span>
              </div>
            )}
            {contact.website && (
              <div className="flex items-center gap-2.5 text-sm">
                <Globe size={14} className="text-gray-400 flex-shrink-0" />
                <a
                  href={contact.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline truncate"
                >
                  {contact.website}
                </a>
              </div>
            )}
            {contact.location && (
              <div className="flex items-center gap-2.5 text-sm">
                <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                <span className="text-gray-700">{contact.location}</span>
              </div>
            )}
            {contact.birthday && (
              <div className="flex items-center gap-2.5 text-sm">
                <Calendar
                  size={14}
                  className="text-gray-400 flex-shrink-0"
                />
                <span className="text-gray-700">
                  {new Date(contact.birthday).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>
        </CardShell>

        {/* Tags, Circles, Interests */}
        <div className="space-y-4">
          {contact.tags && contact.tags.length > 0 && (
            <CardShell>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {contact.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 text-xs rounded-full bg-indigo-50 text-indigo-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </CardShell>
          )}

          {contact.circles && contact.circles.length > 0 && (
            <CardShell>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Circles
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {contact.circles.map((circle) => (
                  <span
                    key={circle}
                    className="px-2.5 py-1 text-xs rounded-full bg-gray-100 text-gray-700 font-medium"
                  >
                    {circle}
                  </span>
                ))}
              </div>
            </CardShell>
          )}

          {contact.interests && contact.interests.length > 0 && (
            <CardShell>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Interests
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {contact.interests.map((interest) => (
                  <span
                    key={interest}
                    className="px-2.5 py-1 text-xs rounded-full bg-emerald-50 text-emerald-700"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </CardShell>
          )}
        </div>
      </div>

      {/* How We Met */}
      {contact.howWeMet && (
        <CardShell>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            How We Met
          </h3>
          <p className="text-sm text-gray-600">{contact.howWeMet}</p>
        </CardShell>
      )}

      {/* Follow-up Section */}
      <CardShell>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Clock size={14} className="text-indigo-600" />
            Follow-up
          </h3>
          <button
            onClick={() => setShowFollowUp(!showFollowUp)}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
          >
            {contact.nextFollowUpAt ? 'Update' : 'Set Follow-up'}
          </button>
        </div>

        {contact.nextFollowUpAt ? (
          <div className="bg-indigo-50 rounded-lg p-3">
            <p className="text-sm text-indigo-700 font-medium">
              {new Date(contact.nextFollowUpAt).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            {contact.followUpNote && (
              <p className="text-xs text-indigo-600 mt-1">
                {contact.followUpNote}
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-400">No follow-up scheduled</p>
        )}

        {showFollowUp && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className={inputClass}
            />
            <input
              type="text"
              value={followUpNote}
              onChange={(e) => setFollowUpNote(e.target.value)}
              placeholder="Follow-up note (optional)"
              className={inputClass}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSetFollowUp}
                disabled={!followUpDate}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition text-xs font-medium disabled:opacity-40"
              >
                Save Follow-up
              </button>
              <button
                onClick={() => setShowFollowUp(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition text-xs font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </CardShell>

      {/* Interaction Timeline */}
      <CardShell>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">
            Interaction Timeline
          </h3>
          <button
            onClick={() => setShowLogInteraction(!showLogInteraction)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition text-xs font-medium"
          >
            {showLogInteraction ? (
              <X size={12} />
            ) : (
              <Plus size={12} />
            )}
            {showLogInteraction ? 'Cancel' : 'Log Interaction'}
          </button>
        </div>

        {/* Log Interaction Form */}
        {showLogInteraction && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <select
                value={intType}
                onChange={(e) =>
                  setIntType(e.target.value as InteractionType)
                }
                className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-indigo-500"
              >
                {interactionTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={intDate}
                onChange={(e) => setIntDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <input
              type="text"
              value={intTitle}
              onChange={(e) => setIntTitle(e.target.value)}
              placeholder="Title *"
              className={inputClass}
            />
            <textarea
              value={intNotes}
              onChange={(e) => setIntNotes(e.target.value)}
              placeholder="Notes (optional)"
              className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-900 placeholder:text-gray-400 min-h-[60px] outline-none focus:border-indigo-500 transition resize-y"
            />
            <button
              onClick={handleLogInteraction}
              disabled={!intTitle.trim()}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition text-xs font-medium disabled:opacity-40"
            >
              Log Interaction
            </button>
          </div>
        )}

        {interactions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            No interactions logged yet
          </p>
        ) : (
          <div className="space-y-3">
            {interactions.map((interaction) => (
              <div
                key={interaction.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-50"
              >
                <div className="mt-0.5 text-gray-400">
                  {interactionIcon(interaction.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">
                      {interaction.title}
                    </p>
                    <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                      {interaction.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatDate(interaction.date)}
                  </p>
                  {interaction.notes && (
                    <p className="text-xs text-gray-600 mt-1">
                      {interaction.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardShell>

      {/* Favors Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardShell>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Gift size={14} className="text-emerald-500" />
            Favors Given
          </h3>
          {contact.favorsGiven && contact.favorsGiven.length > 0 ? (
            <ul className="space-y-1.5">
              {contact.favorsGiven.map((favor, idx) => (
                <li
                  key={idx}
                  className="text-sm text-gray-600 flex items-start gap-2"
                >
                  <span className="text-emerald-400 mt-0.5">-</span>
                  {favor}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-400">None recorded</p>
          )}
        </CardShell>

        <CardShell>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Gift size={14} className="text-blue-500" />
            Favors Received
          </h3>
          {contact.favorsReceived && contact.favorsReceived.length > 0 ? (
            <ul className="space-y-1.5">
              {contact.favorsReceived.map((favor, idx) => (
                <li
                  key={idx}
                  className="text-sm text-gray-600 flex items-start gap-2"
                >
                  <span className="text-blue-400 mt-0.5">-</span>
                  {favor}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-400">None recorded</p>
          )}
        </CardShell>
      </div>

      {/* Notes Section */}
      <CardShell>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <StickyNote size={14} className="text-gray-400" />
            Notes
          </h3>
          <button
            onClick={() => setShowAddNote(!showAddNote)}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
          >
            {showAddNote ? 'Cancel' : 'Add Note'}
          </button>
        </div>

        {showAddNote && (
          <div className="mb-3 space-y-2">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note..."
              className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-900 placeholder:text-gray-400 min-h-[60px] outline-none focus:border-indigo-500 transition resize-y"
            />
            <button
              onClick={handleAddNote}
              disabled={!newNote.trim()}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition text-xs font-medium disabled:opacity-40"
            >
              Save Note
            </button>
          </div>
        )}

        {contact.notes ? (
          <div className="text-sm text-gray-600 whitespace-pre-wrap">
            {contact.notes}
          </div>
        ) : (
          <p className="text-xs text-gray-400">No notes yet</p>
        )}
      </CardShell>
    </div>
  );
}
