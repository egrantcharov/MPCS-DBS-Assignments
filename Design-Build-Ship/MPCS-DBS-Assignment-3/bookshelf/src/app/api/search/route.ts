import { NextResponse } from 'next/server';

const OPEN_LIBRARY = 'https://openlibrary.org/search.json';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? '';

  if (!q) {
    return NextResponse.json({ docs: [] });
  }

  const url = `${OPEN_LIBRARY}?q=${encodeURIComponent(q)}&limit=12&fields=key,title,author_name,cover_i,first_publish_year`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'bookshelf-mpcs-dbs (class project)' },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: 'open library request failed', status: res.status },
      { status: 502 },
    );
  }

  const data = await res.json();
  return NextResponse.json({ docs: data.docs ?? [] });
}
