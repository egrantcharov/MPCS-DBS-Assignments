'use client';

import { useState, useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Contact, ContactCircle, RelationshipStrength } from '@/context/types';
import SearchBar from '@/components/SearchBar';
import CardShell from '@/components/CardShell';
import Link from 'next/link';
import { Plus, X, Star, Mail, Phone as PhoneIcon, MapPin } from 'lucide-react';
import {
  getRelationshipScore,
  getRelationshipStrength,
  getRelationshipColor,
  formatDate,
  cn,
} from '@/lib/utils';

const allCircles: ContactCircle[] = [
  'Professional',
  'Academic',
  'Personal',
  'Mentor',
  'Recruiter',
];

const allStrengths: RelationshipStrength[] = [
  'Strong',
  'Good',
  'Fading',
  'Cold',
];

type SortOption = 'name' | 'lastContacted' | 'relationshipScore';

export default function ContactsPage() {
  const { state, dispatch } = useAppContext();
  const [search, setSearch] = useState('');
  const [showNewContact, setShowNewContact] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filter state
  const [circleFilter, setCircleFilter] = useState<string>('All');
  const [strengthFilter, setStrengthFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('name');

  // New contact form state
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCompanyId, setNewCompanyId] = useState('');
  const [newLinkedIn, setNewLinkedIn] = useState('');
  const [newTwitter, setNewTwitter] = useState('');
  const [newWebsite, setNewWebsite] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newBirthday, setNewBirthday] = useState('');
  const [newPronouns, setNewPronouns] = useState('');
  const [newHowWeMet, setNewHowWeMet] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newCircles, setNewCircles] = useState<ContactCircle[]>([]);
  const [newInterests, setNewInterests] = useState('');

  const contactsWithCompany = useMemo(() => {
    return state.contacts.map((contact) => {
      const company = state.companies.find((c) => c.id === contact.companyId);
      const score = getRelationshipScore(contact);
      const strength = getRelationshipStrength(score);
      return { contact, companyName: company?.name || 'Unknown', score, strength };
    });
  }, [state.contacts, state.companies]);

  const filtered = useMemo(() => {
    let result = contactsWithCompany;

    // Text search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        ({ contact, companyName }) =>
          contact.name.toLowerCase().includes(q) ||
          contact.role.toLowerCase().includes(q) ||
          companyName.toLowerCase().includes(q) ||
          contact.email.toLowerCase().includes(q)
      );
    }

    // Circle filter
    if (circleFilter !== 'All') {
      result = result.filter(({ contact }) =>
        contact.circles?.includes(circleFilter as ContactCircle)
      );
    }

    // Strength filter
    if (strengthFilter !== 'All') {
      result = result.filter(
        ({ strength }) => strength === strengthFilter
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'name') return a.contact.name.localeCompare(b.contact.name);
      if (sortBy === 'lastContacted')
        return (
          new Date(b.contact.lastContactedAt).getTime() -
          new Date(a.contact.lastContactedAt).getTime()
        );
      if (sortBy === 'relationshipScore') return b.score - a.score;
      return 0;
    });

    return result;
  }, [contactsWithCompany, search, circleFilter, strengthFilter, sortBy]);

  const handleToggleCircle = (circle: ContactCircle) => {
    setNewCircles((prev) =>
      prev.includes(circle)
        ? prev.filter((c) => c !== circle)
        : [...prev, circle]
    );
  };

  const handleCreateContact = () => {
    if (!newName.trim()) return;
    const newContact: Contact = {
      id: `ct-${Date.now()}`,
      name: newName.trim(),
      role: newRole.trim(),
      email: newEmail.trim(),
      phone: newPhone.trim(),
      companyId: newCompanyId,
      linkedIn: newLinkedIn.trim(),
      twitter: newTwitter.trim(),
      website: newWebsite.trim(),
      notes: '',
      birthday: newBirthday || null,
      location: newLocation.trim(),
      pronouns: newPronouns.trim(),
      tags: newTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      circles: newCircles,
      interests: newInterests
        .split(',')
        .map((i) => i.trim())
        .filter(Boolean),
      howWeMet: newHowWeMet.trim(),
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
    // Reset form
    setNewName('');
    setNewRole('');
    setNewEmail('');
    setNewPhone('');
    setNewCompanyId('');
    setNewLinkedIn('');
    setNewTwitter('');
    setNewWebsite('');
    setNewLocation('');
    setNewBirthday('');
    setNewPronouns('');
    setNewHowWeMet('');
    setNewTags('');
    setNewCircles([]);
    setNewInterests('');
    setShowNewContact(false);
  };

  const inputClass =
    'bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-indigo-500 transition w-full';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Contacts</h1>
          <p className="text-sm text-gray-500">
            {state.contacts.length} contacts across {state.companies.length}{' '}
            companies
          </p>
        </div>
        <button
          onClick={() => setShowNewContact(!showNewContact)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all text-sm font-medium"
        >
          {showNewContact ? <X size={16} /> : <Plus size={16} />}
          {showNewContact ? 'Cancel' : 'New Contact'}
        </button>
      </div>

      {/* New Contact Form */}
      {showNewContact && (
        <CardShell>
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Create New Contact
          </h3>
          <div className="space-y-3">
            {/* Row 1: Name */}
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Full name *"
              className={inputClass}
            />

            {/* Row 2: Role, Email */}
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                placeholder="Role / Title"
                className={inputClass}
              />
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Email"
                className={inputClass}
              />
            </div>

            {/* Row 3: Phone, Company */}
            <div className="grid grid-cols-2 gap-3">
              <input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="Phone"
                className={inputClass}
              />
              <select
                value={newCompanyId}
                onChange={(e) => setNewCompanyId(e.target.value)}
                className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-indigo-500"
              >
                <option value="">Select company (optional)</option>
                {state.companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Row 4: LinkedIn, Twitter */}
            <div className="grid grid-cols-2 gap-3">
              <input
                type="url"
                value={newLinkedIn}
                onChange={(e) => setNewLinkedIn(e.target.value)}
                placeholder="LinkedIn URL"
                className={inputClass}
              />
              <input
                type="text"
                value={newTwitter}
                onChange={(e) => setNewTwitter(e.target.value)}
                placeholder="Twitter handle"
                className={inputClass}
              />
            </div>

            {/* Row 5: Website, Location */}
            <div className="grid grid-cols-2 gap-3">
              <input
                type="url"
                value={newWebsite}
                onChange={(e) => setNewWebsite(e.target.value)}
                placeholder="Website"
                className={inputClass}
              />
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="Location"
                className={inputClass}
              />
            </div>

            {/* Row 6: Birthday, Pronouns */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Birthday
                </label>
                <input
                  type="date"
                  value={newBirthday}
                  onChange={(e) => setNewBirthday(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Pronouns
                </label>
                <input
                  type="text"
                  value={newPronouns}
                  onChange={(e) => setNewPronouns(e.target.value)}
                  placeholder="e.g. they/them"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Row 7: How We Met */}
            <input
              type="text"
              value={newHowWeMet}
              onChange={(e) => setNewHowWeMet(e.target.value)}
              placeholder="How did you meet?"
              className={inputClass}
            />

            {/* Row 8: Tags */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="e.g. startup, AI, mentor"
                className={inputClass}
              />
            </div>

            {/* Row 9: Circles */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Circles
              </label>
              <div className="flex flex-wrap gap-2">
                {allCircles.map((circle) => (
                  <label
                    key={circle}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-all',
                      newCircles.includes(circle)
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={newCircles.includes(circle)}
                      onChange={() => handleToggleCircle(circle)}
                      className="sr-only"
                    />
                    {circle}
                  </label>
                ))}
              </div>
            </div>

            {/* Row 10: Interests */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Interests (comma-separated)
              </label>
              <input
                type="text"
                value={newInterests}
                onChange={(e) => setNewInterests(e.target.value)}
                placeholder="e.g. hiking, machine learning, coffee"
                className={inputClass}
              />
            </div>

            <button
              onClick={handleCreateContact}
              disabled={!newName.trim()}
              className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Create Contact
            </button>
          </div>
        </CardShell>
      )}

      {/* Search & Filters */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search by name, role, company, or email..."
      />

      <div className="flex flex-wrap gap-3">
        {/* Circle filter */}
        <select
          value={circleFilter}
          onChange={(e) => setCircleFilter(e.target.value)}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-indigo-500"
        >
          <option value="All">All Circles</option>
          {allCircles.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Relationship filter */}
        <select
          value={strengthFilter}
          onChange={(e) => setStrengthFilter(e.target.value)}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-indigo-500"
        >
          <option value="All">All Relationships</option>
          {allStrengths.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-indigo-500"
        >
          <option value="name">Sort by Name</option>
          <option value="lastContacted">Sort by Last Contacted</option>
          <option value="relationshipScore">Sort by Relationship Score</option>
        </select>
      </div>

      {/* Contact List */}
      {filtered.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-12">
          No contacts match your search
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map(({ contact, companyName, strength }) => {
            const color = getRelationshipColor(strength);
            const isExpanded = expandedId === contact.id;

            return (
              <CardShell
                key={contact.id}
                onClick={() =>
                  setExpandedId(isExpanded ? null : contact.id)
                }
                className="cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {/* Relationship dot */}
                    <div
                      className={cn(
                        'w-2.5 h-2.5 rounded-full flex-shrink-0',
                        strength === 'Strong' && 'bg-emerald-500',
                        strength === 'Good' && 'bg-blue-500',
                        strength === 'Fading' && 'bg-amber-500',
                        strength === 'Cold' && 'bg-red-500',
                        strength === 'New' && 'bg-indigo-500'
                      )}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">
                          {contact.name}
                        </p>
                        {contact.isStarred && (
                          <Star
                            size={14}
                            className="text-amber-400 fill-amber-400"
                          />
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {contact.role}
                        {contact.role && companyName !== 'Unknown'
                          ? ` @ ${companyName}`
                          : companyName !== 'Unknown'
                            ? companyName
                            : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded-full',
                        color
                      )}
                    >
                      {strength}
                    </span>
                  </div>
                </div>

                {/* Contact quick info */}
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                  {contact.email && (
                    <span className="flex items-center gap-1">
                      <Mail size={11} />
                      {contact.email}
                    </span>
                  )}
                  {contact.phone && (
                    <span className="flex items-center gap-1">
                      <PhoneIcon size={11} />
                      {contact.phone}
                    </span>
                  )}
                  {contact.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={11} />
                      {contact.location}
                    </span>
                  )}
                  <span>Last contacted: {formatDate(contact.lastContactedAt)}</span>
                </div>

                {/* Tags */}
                {contact.tags && contact.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {contact.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Expanded details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {contact.linkedIn && (
                        <div>
                          <p className="text-xs text-gray-400">LinkedIn</p>
                          <a
                            href={contact.linkedIn}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline text-xs"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {contact.linkedIn}
                          </a>
                        </div>
                      )}
                      {contact.twitter && (
                        <div>
                          <p className="text-xs text-gray-400">Twitter</p>
                          <p className="text-xs text-gray-700">
                            {contact.twitter}
                          </p>
                        </div>
                      )}
                      {contact.website && (
                        <div>
                          <p className="text-xs text-gray-400">Website</p>
                          <a
                            href={contact.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline text-xs"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {contact.website}
                          </a>
                        </div>
                      )}
                      {contact.pronouns && (
                        <div>
                          <p className="text-xs text-gray-400">Pronouns</p>
                          <p className="text-xs text-gray-700">
                            {contact.pronouns}
                          </p>
                        </div>
                      )}
                      {contact.birthday && (
                        <div>
                          <p className="text-xs text-gray-400">Birthday</p>
                          <p className="text-xs text-gray-700">
                            {new Date(contact.birthday).toLocaleDateString(
                              'en-US',
                              { month: 'long', day: 'numeric' }
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                    {contact.howWeMet && (
                      <div>
                        <p className="text-xs text-gray-400">How We Met</p>
                        <p className="text-xs text-gray-700">
                          {contact.howWeMet}
                        </p>
                      </div>
                    )}
                    {contact.circles && contact.circles.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Circles</p>
                        <div className="flex gap-1.5">
                          {contact.circles.map((c) => (
                            <span
                              key={c}
                              className="px-2 py-0.5 text-xs rounded-full bg-indigo-50 text-indigo-700"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {contact.interests && contact.interests.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Interests</p>
                        <div className="flex flex-wrap gap-1.5">
                          {contact.interests.map((i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600"
                            >
                              {i}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {contact.notes && (
                      <div>
                        <p className="text-xs text-gray-400">Notes</p>
                        <p className="text-xs text-gray-700">
                          {contact.notes}
                        </p>
                      </div>
                    )}
                    <div className="pt-2">
                      <Link
                        href={`/contacts/${contact.id}`}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Full Profile &rarr;
                      </Link>
                    </div>
                  </div>
                )}
              </CardShell>
            );
          })}
        </div>
      )}
    </div>
  );
}
