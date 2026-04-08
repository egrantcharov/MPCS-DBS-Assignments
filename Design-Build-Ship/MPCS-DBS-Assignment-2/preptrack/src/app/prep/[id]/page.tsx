'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';
import CardShell from '@/components/CardShell';
import DifficultyBadge from '@/components/DifficultyBadge';
import CountdownTimer from '@/components/CountdownTimer';
import { cn, formatDate } from '@/lib/utils';
import { ChevronRight, Eye, EyeOff, CheckCircle, Lightbulb } from 'lucide-react';

export default function PracticeViewPage() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch } = useAppContext();
  const [answer, setAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [revealedHints, setRevealedHints] = useState(0);

  const question = state.prepQuestions.find((q) => q.id === id);

  if (!question) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <p className="text-gray-500">Question not found</p>
        <Link
          href="/prep"
          className="text-sm text-indigo-600 hover:text-indigo-700 mt-2 inline-block"
        >
          Back to questions
        </Link>
      </div>
    );
  }

  const handleMarkPracticed = () => {
    dispatch({ type: 'INCREMENT_PRACTICE', payload: question.id });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/prep" className="hover:text-gray-900 transition-colors">
          Prep
        </Link>
        <ChevronRight size={14} />
        <span className="text-gray-700 truncate max-w-[300px]">
          {question.question}
        </span>
      </nav>

      {/* Header + Timer side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Question */}
          <CardShell>
            <div className="flex items-start justify-between gap-3 mb-4">
              <h1 className="text-lg font-semibold text-gray-900 leading-relaxed">
                {question.question}
              </h1>
              <DifficultyBadge difficulty={question.difficulty} />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {question.category}
              </span>
              <span className="text-xs text-gray-500">
                Practiced {question.practiceCount} time{question.practiceCount !== 1 ? 's' : ''}
              </span>
              {question.lastPracticedAt && (
                <span className="text-xs text-gray-500">
                  &middot; Last: {formatDate(question.lastPracticedAt)}
                </span>
              )}
            </div>
          </CardShell>

          {/* Hints */}
          <CardShell>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={14} className="text-amber-600" />
              <h3 className="text-sm font-semibold text-gray-700">Hints</h3>
            </div>
            <div className="space-y-2">
              {question.hints.map((hint, i) => (
                <div key={i}>
                  {i < revealedHints ? (
                    <p className="text-sm text-gray-600 pl-4 border-l-2 border-amber-500/30 animate-fade-in">
                      {hint}
                    </p>
                  ) : i === revealedHints ? (
                    <button
                      onClick={() => setRevealedHints(revealedHints + 1)}
                      className="text-xs text-amber-600 hover:text-amber-700 transition-colors"
                    >
                      Reveal hint {i + 1}
                    </button>
                  ) : null}
                </div>
              ))}
              {revealedHints >= question.hints.length && (
                <p className="text-xs text-gray-500">All hints revealed</p>
              )}
            </div>
          </CardShell>
        </div>

        {/* Timer */}
        <div>
          <CountdownTimer initialMinutes={5} />
        </div>
      </div>

      {/* Your Answer */}
      <CardShell>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Your Answer</h3>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer here..."
          className="w-full bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-900 placeholder:text-gray-400 min-h-[150px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition resize-y"
        />
      </CardShell>

      {/* Sample Answer */}
      <CardShell>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Sample Answer</h3>
          <button
            onClick={() => setShowAnswer(!showAnswer)}
            className={cn(
              'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all',
              showAnswer
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            )}
          >
            {showAnswer ? <EyeOff size={12} /> : <Eye size={12} />}
            {showAnswer ? 'Hide' : 'Reveal'}
          </button>
        </div>
        {showAnswer ? (
          <p className="text-sm text-gray-600 leading-relaxed animate-fade-in">
            {question.sampleAnswer}
          </p>
        ) : (
          <div className="h-20 flex items-center justify-center">
            <p className="text-xs text-gray-400">
              Click reveal to see the sample answer
            </p>
          </div>
        )}
      </CardShell>

      {/* Notes + Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        {question.notes && (
          <CardShell className="flex-1">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
            <p className="text-sm text-gray-500">{question.notes}</p>
          </CardShell>
        )}

        <button
          onClick={handleMarkPracticed}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all text-sm font-medium self-start"
        >
          <CheckCircle size={16} />
          Mark as Practiced
        </button>
      </div>
    </div>
  );
}
