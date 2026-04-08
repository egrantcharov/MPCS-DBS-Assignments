'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';
import { CompanyStatus } from '@/context/types';
import SearchBar from '@/components/SearchBar';
import CompanyCard from '@/components/CompanyCard';
import StatusBadge from '@/components/StatusBadge';
import { LayoutGrid, List } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

const statuses: (CompanyStatus | 'All')[] = [
  'All',
  'Researching',
  'Applied',
  'Interviewing',
  'Offer',
  'Rejected',
];

export default function CompaniesPage() {
  const { state } = useAppContext();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CompanyStatus | 'All'>('All');
  const [industryFilter, setIndustryFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  const industries = useMemo(() => {
    const set = new Set(state.companies.map((c) => c.industry));
    return ['All', ...Array.from(set).sort()];
  }, [state.companies]);

  const filtered = useMemo(() => {
    return state.companies.filter((c) => {
      const matchesSearch = c.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === 'All' || c.status === statusFilter;
      const matchesIndustry =
        industryFilter === 'All' || c.industry === industryFilter;
      return matchesSearch && matchesStatus && matchesIndustry;
    });
  }, [state.companies, search, statusFilter, industryFilter]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Companies</h1>
        <p className="text-sm text-gray-500">
          {state.companies.length} companies in your pipeline
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search companies..."
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as CompanyStatus | 'All')
          }
          className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-indigo-500"
        >
          {statuses.map((s) => (
            <option key={s} value={s} className="bg-white">
              {s === 'All' ? 'All Statuses' : s}
            </option>
          ))}
        </select>

        <select
          value={industryFilter}
          onChange={(e) => setIndustryFilter(e.target.value)}
          className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-indigo-500"
        >
          {industries.map((i) => (
            <option key={i} value={i} className="bg-white">
              {i === 'All' ? 'All Industries' : i}
            </option>
          ))}
        </select>

        <div className="flex border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('card')}
            className={cn(
              'p-2 transition-colors',
              viewMode === 'card'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={cn(
              'p-2 transition-colors',
              viewMode === 'table'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-12">
          No companies match your filters
        </p>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      ) : (
        <div className="card-elevated overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left p-3 text-xs text-gray-500 font-medium">
                  Name
                </th>
                <th className="text-left p-3 text-xs text-gray-500 font-medium">
                  Status
                </th>
                <th className="text-left p-3 text-xs text-gray-500 font-medium hidden sm:table-cell">
                  Industry
                </th>
                <th className="text-left p-3 text-xs text-gray-500 font-medium hidden md:table-cell">
                  Contacts
                </th>
                <th className="text-left p-3 text-xs text-gray-500 font-medium hidden lg:table-cell">
                  Added
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((company) => {
                const contactCount = state.contacts.filter(
                  (c) => c.companyId === company.id
                ).length;
                return (
                  <tr
                    key={company.id}
                    className="border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-3">
                      <Link
                        href={`/companies/${company.slug}`}
                        className="text-gray-900 hover:text-indigo-600 transition-colors font-medium"
                      >
                        {company.name}
                      </Link>
                    </td>
                    <td className="p-3">
                      <StatusBadge status={company.status} />
                    </td>
                    <td className="p-3 text-gray-600 hidden sm:table-cell">
                      {company.industry}
                    </td>
                    <td className="p-3 text-gray-600 hidden md:table-cell">
                      {contactCount}
                    </td>
                    <td className="p-3 text-gray-500 hidden lg:table-cell">
                      {formatDate(company.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
