import { AppState, Action } from './types';

export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_COMPANY':
      return { ...state, companies: [...state.companies, action.payload] };
    case 'UPDATE_COMPANY':
      return {
        ...state,
        companies: state.companies.map((c) =>
          c.id === action.payload.id ? action.payload : c
        ),
      };
    case 'DELETE_COMPANY':
      return {
        ...state,
        companies: state.companies.filter((c) => c.id !== action.payload),
      };
    case 'ADD_CONTACT':
      return { ...state, contacts: [...state.contacts, action.payload] };
    case 'UPDATE_CONTACT':
      return {
        ...state,
        contacts: state.contacts.map((c) =>
          c.id === action.payload.id ? action.payload : c
        ),
      };
    case 'DELETE_CONTACT':
      return {
        ...state,
        contacts: state.contacts.filter((c) => c.id !== action.payload),
      };
    case 'TOGGLE_STAR_CONTACT':
      return {
        ...state,
        contacts: state.contacts.map((c) =>
          c.id === action.payload ? { ...c, isStarred: !c.isStarred } : c
        ),
      };
    case 'ADD_QUESTION':
      return { ...state, prepQuestions: [...state.prepQuestions, action.payload] };
    case 'UPDATE_QUESTION':
      return {
        ...state,
        prepQuestions: state.prepQuestions.map((q) =>
          q.id === action.payload.id ? action.payload : q
        ),
      };
    case 'INCREMENT_PRACTICE':
      return {
        ...state,
        prepQuestions: state.prepQuestions.map((q) =>
          q.id === action.payload
            ? {
                ...q,
                practiceCount: q.practiceCount + 1,
                lastPracticedAt: new Date().toISOString(),
              }
            : q
        ),
      };
    case 'ADD_CALL':
      return { ...state, calls: [...state.calls, action.payload] };
    case 'UPDATE_CALL':
      return {
        ...state,
        calls: state.calls.map((c) =>
          c.id === action.payload.id ? action.payload : c
        ),
      };
    case 'DELETE_CALL':
      return {
        ...state,
        calls: state.calls.filter((c) => c.id !== action.payload),
      };
    case 'APPEND_TRANSCRIPT':
      return {
        ...state,
        calls: state.calls.map((c) =>
          c.id === action.payload.callId
            ? { ...c, transcript: [...c.transcript, action.payload.entry] }
            : c
        ),
      };
    case 'TOGGLE_TALKING_POINT':
      return {
        ...state,
        calls: state.calls.map((c) =>
          c.id === action.payload.callId
            ? {
                ...c,
                talkingPoints: c.talkingPoints.map((tp) =>
                  tp.id === action.payload.pointId
                    ? { ...tp, checked: !tp.checked }
                    : tp
                ),
              }
            : c
        ),
      };
    case 'ADD_INTERACTION':
      return { ...state, interactions: [...state.interactions, action.payload] };
    case 'UPDATE_INTERACTION':
      return {
        ...state,
        interactions: state.interactions.map((i) =>
          i.id === action.payload.id ? action.payload : i
        ),
      };
    case 'DELETE_INTERACTION':
      return {
        ...state,
        interactions: state.interactions.filter((i) => i.id !== action.payload),
      };
    case 'ADD_REMINDER':
      return { ...state, reminders: [...state.reminders, action.payload] };
    case 'TOGGLE_REMINDER':
      return {
        ...state,
        reminders: state.reminders.map((r) =>
          r.id === action.payload ? { ...r, completed: !r.completed } : r
        ),
      };
    case 'DELETE_REMINDER':
      return {
        ...state,
        reminders: state.reminders.filter((r) => r.id !== action.payload),
      };
    case 'ADD_INTRODUCTION':
      return { ...state, introductions: [...state.introductions, action.payload] };
    case 'UPDATE_INTRODUCTION':
      return {
        ...state,
        introductions: state.introductions.map((i) =>
          i.id === action.payload.id ? action.payload : i
        ),
      };
    case 'ADD_EMAIL_TEMPLATE':
      return { ...state, emailTemplates: [...state.emailTemplates, action.payload] };
    case 'UPDATE_EMAIL_TEMPLATE':
      return {
        ...state,
        emailTemplates: state.emailTemplates.map((t) =>
          t.id === action.payload.id ? action.payload : t
        ),
      };
    case 'DELETE_EMAIL_TEMPLATE':
      return {
        ...state,
        emailTemplates: state.emailTemplates.filter((t) => t.id !== action.payload),
      };
    default:
      return state;
  }
}
