'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
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

interface BookCard {
  ol_key: string;
  title: string;
  author: string;
  cover_url: string;
  saves: number;
  latest: string;
}

function groupByBook(rows: Favorite[]): BookCard[] {
  const byKey = new Map<string, BookCard>();
  for (const row of rows) {
    const existing = byKey.get(row.ol_key);
    if (existing) {
      existing.saves += 1;
      if (row.created_at > existing.latest) existing.latest = row.created_at;
    } else {
      byKey.set(row.ol_key, {
        ol_key: row.ol_key,
        title: row.title,
        author: row.author,
        cover_url: row.cover_url,
        saves: 1,
        latest: row.created_at,
      });
    }
  }
  return [...byKey.values()].sort((a, b) => {
    if (b.saves !== a.saves) return b.saves - a.saves;
    return b.latest.localeCompare(a.latest);
  });
}

export default function HomePage() {
  const [books, setBooks] = useState<BookCard[]>([]);
  const [readerCount, setReaderCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFavorites() {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const favs = data as Favorite[];
        setBooks(groupByBook(favs));
        setReaderCount(new Set(favs.map((f) => f.user_id)).size);
      }
      setLoading(false);
    }
    fetchFavorites();
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900">Class Bookshelf</h1>
        <p className="mt-2 text-lg text-gray-600">
          Books our class loves. Search and add yours.
        </p>
        {!loading && books.length > 0 && (
          <p className="mt-1 text-sm text-gray-500">
            {books.length} {books.length === 1 ? 'book' : 'books'} saved by{' '}
            {readerCount} {readerCount === 1 ? 'classmate' : 'classmates'}
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : books.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <p className="text-lg text-gray-500">
            No books yet. Be the first to add one.
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
              key={book.ol_key}
              className="group relative rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition-all hover:shadow-md hover:scale-[1.02]"
            >
              {book.saves > 1 && (
                <span className="absolute right-2 top-2 z-10 rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-semibold text-white shadow">
                  {book.saves}
                </span>
              )}
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
              <p className="mt-1 text-xs text-indigo-600">
                {book.saves === 1
                  ? 'saved by 1 classmate'
                  : `saved by ${book.saves} classmates`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
