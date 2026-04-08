'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Building2, Users, BookOpen, Phone, Calendar, Mail, Menu, X, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const navGroups = [
  [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/companies', label: 'Companies', icon: Building2 },
    { href: '/contacts', label: 'Contacts', icon: Users },
    { href: '/calls', label: 'Calls', icon: Phone },
  ],
  [
    { href: '/calendar', label: 'Calendar', icon: Calendar },
    { href: '/email', label: 'Email', icon: Mail },
  ],
  [
    { href: '/prep', label: 'Prep', icon: BookOpen },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  ],
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const nav = (
    <nav className="flex flex-col px-3">
      {navGroups.map((group, groupIndex) => (
        <div key={groupIndex}>
          {groupIndex > 0 && (
            <div className="border-t border-gray-100 my-2" />
          )}
          <div className="flex flex-col gap-1">
            {group.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive(href)
                    ? 'bg-indigo-50 text-indigo-700 border-l-2 border-indigo-600'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-white shadow-sm border border-gray-200 text-gray-500 hover:text-gray-900"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300',
          'md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex items-center justify-between p-5 mb-2">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <BookOpen size={16} className="text-indigo-600" />
            </div>
            <span className="text-lg font-semibold text-gray-900 tracking-tight">
              PrepTrack
            </span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-gray-400 hover:text-gray-900"
          >
            <X size={18} />
          </button>
        </div>

        {nav}

        <div className="mt-auto p-5 border-t border-gray-100">
          <p className="text-xs text-gray-400">Career Prep Tracker</p>
        </div>
      </aside>
    </>
  );
}
