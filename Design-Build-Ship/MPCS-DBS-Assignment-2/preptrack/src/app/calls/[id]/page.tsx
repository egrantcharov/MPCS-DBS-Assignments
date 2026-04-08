'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';
import { TranscriptEntry } from '@/context/types';
import CardShell from '@/components/CardShell';
import DifficultyBadge from '@/components/DifficultyBadge';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { generateGoogleCalendarUrl } from '@/lib/calendar';
import { cn } from '@/lib/utils';
import {
  ChevronRight,
  Mic,
  MicOff,
  Square,
  Calendar,
  Clock,
  ExternalLink,
  CheckSquare,
  MessageSquare,
  BookOpen,
  AlertCircle,
} from 'lucide-react';

export default function CallDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch } = useAppContext();
  const speech = useSpeechRecognition();
  const [showPrepAnswer, setShowPrepAnswer] = useState<Record<string, boolean>>({});

  const call = state.calls.find((c) => c.id === id);
  const contact = call
    ? state.contacts.find((c) => c.id === call.contactId)
    : null;
  const company = contact
    ? state.companies.find((co) => co.id === contact.companyId)
    : null;

  // Wire up final transcript callback to dispatch
  const handleFinalTranscript = useCallback(
    (text: string) => {
      if (!call) return;
      const entry: TranscriptEntry = {
        id: `tr-${Date.now()}`,
        text,
        timestamp: new Date().toISOString(),
        isFinal: true,
      };
      dispatch({ type: 'APPEND_TRANSCRIPT', payload: { callId: call.id, entry } });
    },
    [call, dispatch]
  );

  useEffect(() => {
    speech.onFinalTranscript.current = handleFinalTranscript;
  }, [handleFinalTranscript, speech.onFinalTranscript]);

  if (!call) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <p className="text-gray-500">Call not found</p>
        <Link
          href="/calls"
          className="text-sm text-indigo-600 hover:text-indigo-700 mt-2 inline-block"
        >
          Back to calls
        </Link>
      </div>
    );
  }

  const linkedQuestions = state.prepQuestions.filter((q) =>
    call.prepQuestionIds.includes(q.id)
  );

  const handleToggleTalkingPoint = (pointId: string) => {
    dispatch({
      type: 'TOGGLE_TALKING_POINT',
      payload: { callId: call.id, pointId },
    });
  };

  const handleStartCall = () => {
    dispatch({
      type: 'UPDATE_CALL',
      payload: { ...call, status: 'In Progress' },
    });
    speech.start();
  };

  const handleEndCall = () => {
    speech.stop();
    dispatch({
      type: 'UPDATE_CALL',
      payload: { ...call, status: 'Completed' },
    });
  };

  const handleToggleRecording = () => {
    if (speech.isListening) {
      speech.stop();
    } else {
      speech.start();
    }
  };

  const calendarUrl = generateGoogleCalendarUrl({
    title: call.title,
    description: `Call with ${contact?.name || 'Contact'}${company ? ` (${company.name})` : ''}\n\n${call.notes}`,
    startTime: call.scheduledAt,
    durationMinutes: call.duration || 30,
  });

  const statusColor: Record<string, string> = {
    Scheduled: 'text-blue-700 bg-blue-50',
    'In Progress': 'text-amber-700 bg-amber-50',
    Completed: 'text-emerald-700 bg-emerald-50',
    Cancelled: 'text-red-700 bg-red-50',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/calls" className="hover:text-gray-900 transition-colors">
          Calls
        </Link>
        <ChevronRight size={14} />
        <span className="text-gray-700 truncate max-w-[300px]">
          {call.title}
        </span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{call.title}</h1>
            <span
              className={cn(
                'px-2.5 py-0.5 rounded-full text-xs font-medium',
                statusColor[call.status]
              )}
            >
              {call.status}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {contact && (
              <span>
                {contact.name} &middot; {contact.role}
                {company && ` at ${company.name}`}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {new Date(call.scheduledAt).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {new Date(call.scheduledAt).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
            {call.duration && <span>{call.duration} min</span>}
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-all"
          >
            <ExternalLink size={12} />
            Google Calendar
          </a>
        </div>
      </div>

      {/* Call controls + Recording */}
      <CardShell
        className={cn(
          speech.isListening && 'border-red-300 shadow-lg shadow-red-500/5'
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {speech.isListening && (
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm text-red-600 font-medium">
                  Recording
                </span>
              </div>
            )}
            {!speech.isListening && call.status !== 'Completed' && (
              <span className="text-sm text-gray-500">
                {call.status === 'Scheduled'
                  ? 'Ready to start'
                  : 'Recording paused'}
              </span>
            )}
            {call.status === 'Completed' && (
              <span className="text-sm text-emerald-600">Call completed</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {call.status === 'Scheduled' && (
              <button
                onClick={handleStartCall}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition text-sm font-medium"
              >
                <Mic size={14} />
                Start Call & Record
              </button>
            )}
            {(call.status === 'In Progress' || call.status === 'Scheduled') &&
              call.status !== 'Scheduled' && (
                <>
                  <button
                    onClick={handleToggleRecording}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm font-medium',
                      speech.isListening
                        ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    )}
                  >
                    {speech.isListening ? (
                      <>
                        <MicOff size={14} />
                        Pause
                      </>
                    ) : (
                      <>
                        <Mic size={14} />
                        Resume
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleEndCall}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition text-sm font-medium"
                  >
                    <Square size={14} />
                    End Call
                  </button>
                </>
              )}
          </div>
        </div>

        {!speech.isSupported && (
          <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-amber-50 text-xs text-amber-600">
            <AlertCircle size={12} />
            Voice transcription is not supported in this browser. Use Chrome or
            Edge.
          </div>
        )}

        {speech.error && (
          <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-red-50 text-xs text-red-600">
            <AlertCircle size={12} />
            {speech.error}
          </div>
        )}

        {/* Live interim transcript */}
        {speech.interimTranscript && (
          <div className="mt-3 p-3 rounded-lg bg-gray-50 text-sm text-gray-600 italic">
            {speech.interimTranscript}
          </div>
        )}
      </CardShell>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Talking points + Prep Questions */}
        <div className="space-y-6">
          {/* Talking Points */}
          <CardShell>
            <div className="flex items-center gap-2 mb-3">
              <CheckSquare size={14} className="text-indigo-600" />
              <h3 className="text-sm font-semibold text-gray-700">
                Talking Points
              </h3>
            </div>
            {call.talkingPoints.length === 0 ? (
              <p className="text-sm text-gray-500">No talking points</p>
            ) : (
              <div className="space-y-2">
                {call.talkingPoints.map((tp) => (
                  <button
                    key={tp.id}
                    onClick={() => handleToggleTalkingPoint(tp.id)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <div
                      className={cn(
                        'w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors',
                        tp.checked
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-gray-300'
                      )}
                    >
                      {tp.checked && (
                        <span className="text-white text-xs">&#10003;</span>
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-sm transition-colors',
                        tp.checked
                          ? 'text-gray-500 line-through'
                          : 'text-gray-700'
                      )}
                    >
                      {tp.text}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </CardShell>

          {/* Linked Prep Questions */}
          {linkedQuestions.length > 0 && (
            <CardShell>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={14} className="text-amber-600" />
                <h3 className="text-sm font-semibold text-gray-700">
                  Prep Questions
                </h3>
              </div>
              <div className="space-y-3">
                {linkedQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="p-3 rounded-lg bg-gray-50 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-gray-900 font-medium">
                        {q.question}
                      </p>
                      <DifficultyBadge difficulty={q.difficulty} />
                    </div>
                    <button
                      onClick={() =>
                        setShowPrepAnswer((prev) => ({
                          ...prev,
                          [q.id]: !prev[q.id],
                        }))
                      }
                      className="text-xs text-indigo-600 hover:text-indigo-700"
                    >
                      {showPrepAnswer[q.id] ? 'Hide Answer' : 'Show Answer'}
                    </button>
                    {showPrepAnswer[q.id] && (
                      <p className="text-xs text-gray-600 leading-relaxed animate-fade-in">
                        {q.sampleAnswer}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardShell>
          )}

          {/* Notes */}
          {call.notes && (
            <CardShell>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Notes
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {call.notes}
              </p>
            </CardShell>
          )}
        </div>

        {/* Right column: Transcript */}
        <div>
          <CardShell className="sticky top-6">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={14} className="text-emerald-600" />
              <h3 className="text-sm font-semibold text-gray-700">
                Transcript
              </h3>
              {call.transcript.length > 0 && (
                <span className="text-xs text-gray-500">
                  ({call.transcript.length} entries)
                </span>
              )}
            </div>
            {call.transcript.length === 0 && !speech.isListening ? (
              <div className="text-center py-8">
                <Mic size={24} className="text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  {call.status === 'Completed'
                    ? 'No transcript recorded'
                    : 'Start recording to capture the conversation'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {call.transcript.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-2.5 rounded-lg bg-gray-50 animate-fade-in"
                  >
                    <p className="text-sm text-gray-700">{entry.text}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(entry.timestamp).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </p>
                  </div>
                ))}
                {speech.interimTranscript && (
                  <div className="p-2.5 rounded-lg bg-gray-50 border border-dashed border-gray-200">
                    <p className="text-sm text-gray-500 italic">
                      {speech.interimTranscript}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardShell>
        </div>
      </div>
    </div>
  );
}
