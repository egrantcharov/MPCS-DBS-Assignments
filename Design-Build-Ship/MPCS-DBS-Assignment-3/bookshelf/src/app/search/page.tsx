'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@clerk/nextjs';
import { createSupabaseClient } from '@/lib/supabase';

interface BookResult {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
}

export default function SearchPage() {
  const { userId, getToken } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BookResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const [savingKey, setSavingKey] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.docs || []);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }

  async function handleSave(book: BookResult) {
    if (!userId) return;
    setSavingKey(book.key);

    try {
      const token = await getToken();
      const supabase = createSupabaseClient(token ?? undefined);

      const coverUrl = book.cover_i
        ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
        : '';

      const { error } = await supabase.from('favorites').insert({
        user_id: userId,
        title: book.title,
        author: book.author_name?.[0] || 'Unknown',
        cover_url: coverUrl,
        ol_key: book.key,
      });

      if (!error) {
        setSavedKeys((prev) => new Set(prev).add(book.key));
      }
    } catch {
      // silently fail
    }
    setSavingKey(null);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Search Books</h1>

      <form onSubmit={handleSearch} className="mb-8 flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, author, or keyword..."
          className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {results.map((book) => {
            const isSaved = savedKeys.has(book.key);
            const isSaving = savingKey === book.key;

            return (
              <div
                key={book.key}
                className="group rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition-all hover:shadow-md"
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-gray-100">
                  {book.cover_i ? (
                    <Image
                      src={`https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`}
                      alt={book.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 16vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-400">
                      <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  )}
                </div>
                <h3 className="mt-2 text-sm font-semibold text-gray-900 line-clamp-2">
                  {book.title}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-1">
                  {book.author_name?.[0] || 'Unknown'}
                </p>
                {book.first_publish_year && (
                  <p className="text-xs text-gray-400">{book.first_publish_year}</p>
                )}
                {userId && (
                  <button
                    onClick={() => handleSave(book)}
                    disabled={isSaved || isSaving}
                    className={`mt-2 w-full rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      isSaved
                        ? 'bg-green-100 text-green-700'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
                    }`}
                  >
                    {isSaved ? 'Saved!' : isSaving ? 'Saving...' : 'Add to Favorites'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : query && !loading ? (
        <p className="py-12 text-center text-gray-500">
          No results found. Try a different search.
        </p>
      ) : null}
    </div>
  );
}
