'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Show, SignInButton, UserButton } from '@clerk/nextjs';

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Scoreboard' },
    { href: '/dashboard', label: 'My Dashboard' },
    { href: '/settings', label: 'Settings' },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-white">⚾</span>
          <span className="text-indigo-600">Clutch Index</span>
        </Link>
        <div className="flex items-center gap-6">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  active
                    ? 'text-indigo-600'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Show when="signed-in">
            <UserButton />
          </Show>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700">
                Sign In
              </button>
            </SignInButton>
          </Show>
        </div>
      </div>
    </nav>
  );
}
