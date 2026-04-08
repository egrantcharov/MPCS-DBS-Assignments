'use client';

import Link from 'next/link';
import { Company } from '@/context/types';
import { useAppContext } from '@/context/AppContext';
import CardShell from './CardShell';
import StatusBadge from './StatusBadge';
import { ExternalLink, Users } from 'lucide-react';

export default function CompanyCard({ company }: { company: Company }) {
  const { state } = useAppContext();
  const contactCount = state.contacts.filter(
    (c) => c.companyId === company.id
  ).length;

  return (
    <CardShell>
      <div className="flex items-start justify-between mb-3">
        <Link
          href={`/companies/${company.slug}`}
          className="text-base font-semibold text-gray-900 hover:text-indigo-600 transition-colors"
        >
          {company.name}
        </Link>
        <StatusBadge status={company.status} />
      </div>

      <p className="text-xs text-gray-500 mb-3">{company.industry}</p>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <Users size={12} />
          {contactCount} contact{contactCount !== 1 ? 's' : ''}
        </span>
        <a
          href={company.website}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink size={12} />
          Website
        </a>
      </div>
    </CardShell>
  );
}
