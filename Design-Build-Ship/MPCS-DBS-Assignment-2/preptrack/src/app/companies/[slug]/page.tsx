'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';
import CardShell from '@/components/CardShell';
import StatusBadge from '@/components/StatusBadge';
import ContactRow from '@/components/ContactRow';
import { ExternalLink, ChevronRight, BookOpen } from 'lucide-react';

export default function CompanyDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { state } = useAppContext();

  const company = state.companies.find((c) => c.slug === slug);

  if (!company) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <p className="text-gray-500">Company not found</p>
        <Link
          href="/companies"
          className="text-sm text-indigo-600 hover:text-indigo-700 mt-2 inline-block"
        >
          Back to companies
        </Link>
      </div>
    );
  }

  const contacts = state.contacts.filter((c) => c.companyId === company.id);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/companies" className="hover:text-gray-900 transition-colors">
          Companies
        </Link>
        <ChevronRight size={14} />
        <span className="text-gray-700">{company.name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
            <StatusBadge status={company.status} />
          </div>
          <p className="text-sm text-gray-500">{company.industry}</p>
        </div>
        <a
          href={company.website}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-sm text-gray-600 hover:text-indigo-600 hover:bg-gray-200 transition-all self-start"
        >
          <ExternalLink size={14} />
          Visit Website
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notes */}
        <CardShell>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Notes</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            {company.notes || 'No notes yet.'}
          </p>
        </CardShell>

        {/* Prep Links */}
        <CardShell>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Interview Prep
          </h3>
          <div className="space-y-2">
            <Link
              href="/prep?category=Technical"
              className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 text-sm text-gray-600 hover:text-indigo-600 hover:bg-gray-100 transition-all"
            >
              <BookOpen size={14} />
              Technical Questions
            </Link>
            <Link
              href="/prep?category=Behavioral"
              className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 text-sm text-gray-600 hover:text-indigo-600 hover:bg-gray-100 transition-all"
            >
              <BookOpen size={14} />
              Behavioral Questions
            </Link>
            <Link
              href="/prep?category=System Design"
              className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 text-sm text-gray-600 hover:text-indigo-600 hover:bg-gray-100 transition-all"
            >
              <BookOpen size={14} />
              System Design Questions
            </Link>
          </div>
        </CardShell>
      </div>

      {/* Contacts */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Contacts ({contacts.length})
        </h3>
        {contacts.length === 0 ? (
          <p className="text-sm text-gray-500">No contacts for this company</p>
        ) : (
          <div className="space-y-2">
            {contacts.map((contact) => (
              <ContactRow
                key={contact.id}
                contact={contact}
                companyName={company.name}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
