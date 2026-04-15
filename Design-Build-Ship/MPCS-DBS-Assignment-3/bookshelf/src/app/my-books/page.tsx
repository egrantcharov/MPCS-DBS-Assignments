'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';

interface Favorite {
  id: number;
  user_id: string;
  title: string;
  author: string;
  cover_url: string;
  ol_key: string;
  created_at: string;
}

export default function MyBooksPage() {
  const { userId } = useAuth();
  const [books, setBooks] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) return;

    async function fetchMyBooks() {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setBooks(data);
      }
      setLoading(false);
    }
    fetchMyBooks();
  }, [userId]);

  async function handleRemove(id: number) {
    if (!userId) return;
    setRemovingId(id);

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (!error) {
      setBooks((prev) => prev.filter((b) => b.id !== id));
    }
    setRemovingId(null);
  }

  if (!userId) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">My Books</h1>
        <p className="mt-4 text-gray-500">Sign in to see your saved books.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">My Books</h1>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : books.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <p className="text-lg text-gray-500">
            You haven&apos;t saved any books yet.
          </p>
          <a
            href="/search"
            className="mt-4 inline-block rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            Search for Books
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {books.map((book) => (
            <div
              key={book.id}
              className="group relative rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition-all hover:shadow-md"
            >
              <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-gray-100">
                {book.cover_url ? (
                  <Image
                    src={book.cover_url}
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
              <p className="text-xs text-gray-500 line-clamp-1">{book.author}</p>
              <button
                onClick={() => handleRemove(book.id)}
                disabled={removingId === book.id}
                className="mt-2 w-full rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
              >
                {removingId === book.id ? 'Removing...' : 'Remove'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
