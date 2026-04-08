import { CompanyStatus, Difficulty, Contact, RelationshipStrength } from '@/context/types';

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getStatusColor(status: CompanyStatus): string {
  const colors: Record<CompanyStatus, string> = {
    Researching: 'text-blue-700 bg-blue-50 border border-blue-200',
    Applied: 'text-amber-700 bg-amber-50 border border-amber-200',
    Interviewing: 'text-indigo-700 bg-indigo-50 border border-indigo-200',
    Offer: 'text-emerald-700 bg-emerald-50 border border-emerald-200',
    Rejected: 'text-red-700 bg-red-50 border border-red-200',
  };
  return colors[status];
}

export function getDifficultyColor(difficulty: Difficulty): string {
  const colors: Record<Difficulty, string> = {
    Easy: 'text-emerald-700 bg-emerald-50 border border-emerald-200',
    Medium: 'text-amber-700 bg-amber-50 border border-amber-200',
    Hard: 'text-red-700 bg-red-50 border border-red-200',
  };
  return colors[difficulty];
}

// Relationship health score (0-100)
export function getRelationshipScore(contact: Contact): number {
  const now = new Date();
  const lastContact = new Date(contact.lastContactedAt);
  const daysSinceContact = Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24));

  let score = 100;
  if (daysSinceContact > 90) score -= 50;
  else if (daysSinceContact > 60) score -= 35;
  else if (daysSinceContact > 30) score -= 20;
  else if (daysSinceContact > 14) score -= 10;

  // Bonus for interactions
  score += Math.min(contact.interactionCount * 3, 20);

  // Bonus for having follow-up scheduled
  if (contact.nextFollowUpAt) score += 10;

  return Math.max(0, Math.min(100, score));
}

// Get relationship strength label
export function getRelationshipStrength(score: number): RelationshipStrength {
  if (score >= 80) return 'Strong';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fading';
  if (score >= 20) return 'Cold';
  return 'New';
}

// Get relationship color
export function getRelationshipColor(strength: RelationshipStrength): string {
  const colors: Record<RelationshipStrength, string> = {
    Strong: 'text-emerald-700 bg-emerald-50',
    Good: 'text-blue-700 bg-blue-50',
    Fading: 'text-amber-700 bg-amber-50',
    Cold: 'text-red-700 bg-red-50',
    New: 'text-indigo-700 bg-indigo-50',
  };
  return colors[strength];
}

// Days until date
export function daysUntil(iso: string): number {
  const date = new Date(iso);
  const now = new Date();
  return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// Days since date
export function daysSince(iso: string): number {
  const date = new Date(iso);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

// Get contacts going cold (not contacted in 30+ days, no follow-up scheduled)
export function getGoingColdContacts(contacts: Contact[]): Contact[] {
  return contacts.filter(c => {
    const days = daysSince(c.lastContactedAt);
    return days > 30 && !c.nextFollowUpAt;
  }).sort((a, b) => daysSince(b.lastContactedAt) - daysSince(a.lastContactedAt));
}

// Format phone number for display
export function formatPhone(phone: string): string {
  if (!phone) return '';
  return phone;
}

// Check if birthday is upcoming (within next 30 days)
export function isUpcomingBirthday(birthday: string | null): boolean {
  if (!birthday) return false;
  const bday = new Date(birthday);
  const now = new Date();
  const thisYearBday = new Date(now.getFullYear(), bday.getMonth(), bday.getDate());
  if (thisYearBday < now) {
    thisYearBday.setFullYear(thisYearBday.getFullYear() + 1);
  }
  const daysUntilBday = Math.ceil((thisYearBday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return daysUntilBday <= 30;
}
