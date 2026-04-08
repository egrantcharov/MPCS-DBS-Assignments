'use client';

import { useAppContext } from '@/context/AppContext';
import { CompanyStatus } from '@/context/types';
import { getStatusColor, cn } from '@/lib/utils';
import CardShell from './CardShell';
import { Building2, Search, Send, MessageSquare, Award, XCircle } from 'lucide-react';

const statusConfig: { status: CompanyStatus; icon: typeof Building2 }[] = [
  { status: 'Researching', icon: Search },
  { status: 'Applied', icon: Send },
  { status: 'Interviewing', icon: MessageSquare },
  { status: 'Offer', icon: Award },
  { status: 'Rejected', icon: XCircle },
];

export default function PipelineStats() {
  const { state } = useAppContext();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {statusConfig.map(({ status, icon: Icon }) => {
        const count = state.companies.filter((c) => c.status === status).length;
        const colors = getStatusColor(status);
        const textColor = colors.split(' ')[0];

        return (
          <CardShell key={status} className="text-center">
            <div className={cn('inline-flex p-2 rounded-lg mb-2', colors)}>
              <Icon size={18} />
            </div>
            <p className={cn('text-2xl font-bold font-mono', textColor)}>
              {count}
            </p>
            <p className="text-xs text-gray-500 mt-1">{status}</p>
          </CardShell>
        );
      })}
    </div>
  );
}
