'use client';

import { useState, useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { QuestionCategory, Difficulty } from '@/context/types';
import SearchBar from '@/components/SearchBar';
import QuestionCard from '@/components/QuestionCard';
import CardShell from '@/components/CardShell';
import { cn } from '@/lib/utils';

const categories: (QuestionCategory | 'All')[] = [
  'All',
  'Behavioral',
  'Technical',
  'System Design',
];

const difficulties: (Difficulty | 'All')[] = ['All', 'Easy', 'Medium', 'Hard'];

export default function PrepPage() {
  const { state } = useAppContext();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<QuestionCategory | 'All'>('All');
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'All'>('All');

  const filtered = useMemo(() => {
    return state.prepQuestions.filter((q) => {
      const matchesSearch = q.question.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || q.category === categoryFilter;
      const matchesDifficulty = difficultyFilter === 'All' || q.difficulty === difficultyFilter;
      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  }, [state.prepQuestions, search, categoryFilter, difficultyFilter]);

  const practiced = state.prepQuestions.filter((q) => q.practiceCount > 0).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Interview Prep</h1>
        <p className="text-sm text-gray-500">
          {state.prepQuestions.length} questions &middot; {practiced} practiced
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {(['Behavioral', 'Technical', 'System Design'] as QuestionCategory[]).map((cat) => {
          const count = state.prepQuestions.filter((q) => q.category === cat).length;
          return (
            <CardShell key={cat} className="text-center">
              <p className="text-lg font-bold font-mono text-gray-900">{count}</p>
              <p className="text-xs text-gray-500">{cat}</p>
            </CardShell>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search questions..."
          />
        </div>

        {/* Category pills */}
        <div className="flex gap-1 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                categoryFilter === cat
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'bg-gray-100 text-gray-600 hover:text-gray-700'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value as Difficulty | 'All')}
          className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-indigo-500"
        >
          {difficulties.map((d) => (
            <option key={d} value={d} className="bg-white">
              {d === 'All' ? 'All Difficulties' : d}
            </option>
          ))}
        </select>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-12">
          No questions match your filters
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((question) => (
            <QuestionCard key={question.id} question={question} />
          ))}
        </div>
      )}
    </div>
  );
}
