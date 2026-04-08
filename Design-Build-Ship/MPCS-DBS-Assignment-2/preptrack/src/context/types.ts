export type CompanyStatus = 'Researching' | 'Applied' | 'Interviewing' | 'Offer' | 'Rejected';

export interface Company {
  id: string;
  name: string;
  slug: string;
  status: CompanyStatus;
  industry: string;
  website: string;
  notes: string;
  contactIds: string[];
  createdAt: string;
}

// Robust Contact schema
export type RelationshipStrength = 'Strong' | 'Good' | 'Fading' | 'Cold' | 'New';
export type ContactCircle = 'Professional' | 'Academic' | 'Personal' | 'Mentor' | 'Recruiter';

export interface Contact {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  companyId: string;
  linkedIn: string;
  twitter: string;
  website: string;
  notes: string;
  // Personal details
  birthday: string | null; // ISO date
  location: string;
  pronouns: string;
  // Relationship tracking
  tags: string[];
  circles: ContactCircle[];
  interests: string[];
  howWeMet: string;
  introducedBy: string; // contactId of who introduced them
  // Tracking
  lastContactedAt: string;
  nextFollowUpAt: string | null;
  followUpNote: string;
  interactionCount: number;
  // Favors
  favorsGiven: string[];
  favorsReceived: string[];
  // Metadata
  createdAt: string;
  isStarred: boolean;
}

// Interaction log - every touchpoint with a contact
export type InteractionType = 'Call' | 'Email' | 'Meeting' | 'Coffee' | 'Message' | 'LinkedIn' | 'Introduction' | 'Other';

export interface Interaction {
  id: string;
  contactId: string;
  type: InteractionType;
  title: string;
  notes: string;
  date: string;
  followUpDate: string | null;
  followUpNote: string;
  createdAt: string;
}

// Reminders
export type ReminderType = 'FollowUp' | 'Birthday' | 'Milestone' | 'Outreach' | 'Custom';

export interface Reminder {
  id: string;
  contactId: string | null; // null for general reminders
  type: ReminderType;
  title: string;
  dueDate: string;
  completed: boolean;
  createdAt: string;
}

// Introduction tracking
export interface Introduction {
  id: string;
  fromContactId: string;
  toContactId: string;
  status: 'Pending' | 'Made' | 'Accepted' | 'Declined';
  notes: string;
  requestedAt: string;
  completedAt: string | null;
}

// Email templates
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: 'Introduction' | 'FollowUp' | 'ThankYou' | 'CatchUp' | 'Custom';
}

export type QuestionCategory = 'Behavioral' | 'Technical' | 'System Design';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface PrepQuestion {
  id: string;
  question: string;
  category: QuestionCategory;
  difficulty: Difficulty;
  notes: string;
  hints: string[];
  sampleAnswer: string;
  practiceCount: number;
  lastPracticedAt: string | null;
}

export type CallStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';

export interface TalkingPoint {
  id: string;
  text: string;
  checked: boolean;
}

export interface TranscriptEntry {
  id: string;
  text: string;
  timestamp: string;
  isFinal: boolean;
}

export interface Call {
  id: string;
  title: string;
  contactId: string;
  status: CallStatus;
  scheduledAt: string;
  duration: number | null;
  prepQuestionIds: string[];
  talkingPoints: TalkingPoint[];
  transcript: TranscriptEntry[];
  notes: string;
  createdAt: string;
}

export interface AppState {
  companies: Company[];
  contacts: Contact[];
  prepQuestions: PrepQuestion[];
  calls: Call[];
  interactions: Interaction[];
  reminders: Reminder[];
  introductions: Introduction[];
  emailTemplates: EmailTemplate[];
}

export type Action =
  | { type: 'UPDATE_COMPANY'; payload: Company }
  | { type: 'ADD_COMPANY'; payload: Company }
  | { type: 'DELETE_COMPANY'; payload: string }
  | { type: 'UPDATE_CONTACT'; payload: Contact }
  | { type: 'ADD_CONTACT'; payload: Contact }
  | { type: 'DELETE_CONTACT'; payload: string }
  | { type: 'TOGGLE_STAR_CONTACT'; payload: string }
  | { type: 'UPDATE_QUESTION'; payload: PrepQuestion }
  | { type: 'ADD_QUESTION'; payload: PrepQuestion }
  | { type: 'INCREMENT_PRACTICE'; payload: string }
  | { type: 'ADD_CALL'; payload: Call }
  | { type: 'UPDATE_CALL'; payload: Call }
  | { type: 'DELETE_CALL'; payload: string }
  | { type: 'APPEND_TRANSCRIPT'; payload: { callId: string; entry: TranscriptEntry } }
  | { type: 'TOGGLE_TALKING_POINT'; payload: { callId: string; pointId: string } }
  | { type: 'ADD_INTERACTION'; payload: Interaction }
  | { type: 'UPDATE_INTERACTION'; payload: Interaction }
  | { type: 'DELETE_INTERACTION'; payload: string }
  | { type: 'ADD_REMINDER'; payload: Reminder }
  | { type: 'TOGGLE_REMINDER'; payload: string }
  | { type: 'DELETE_REMINDER'; payload: string }
  | { type: 'ADD_INTRODUCTION'; payload: Introduction }
  | { type: 'UPDATE_INTRODUCTION'; payload: Introduction }
  | { type: 'ADD_EMAIL_TEMPLATE'; payload: EmailTemplate }
  | { type: 'UPDATE_EMAIL_TEMPLATE'; payload: EmailTemplate }
  | { type: 'DELETE_EMAIL_TEMPLATE'; payload: string };
