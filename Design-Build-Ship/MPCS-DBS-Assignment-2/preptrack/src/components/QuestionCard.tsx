'use client';

import Link from 'next/link';
import { PrepQuestion } from '@/context/types';
import CardShell from './CardShell';
import DifficultyBadge from './DifficultyBadge';
import { BookOpen } from 'lucide-react';

export default function QuestionCard({ question }: { question: PrepQuestion }) {
  return (
    <CardShell>
      <div className="flex items-start justify-between gap-3 mb-3">
        <Link
          href={`/prep/${question.id}`}
          className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors line-clamp-2"
        >
          {question.question}
        </Link>
        <DifficultyBadge difficulty={question.difficulty} />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
          {question.category}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <BookOpen size={12} />
          {question.practiceCount} practice{question.practiceCount !== 1 ? 's' : ''}
        </span>
      </div>
    </CardShell>
  );
}
