import { CompanyStatus } from '@/context/types';
import { cn, getStatusColor } from '@/lib/utils';

export default function StatusBadge({ status }: { status: CompanyStatus }) {
  return (
    <span
      className={cn(
        'px-2.5 py-0.5 rounded-full text-xs font-medium',
        getStatusColor(status)
      )}
    >
      {status}
    </span>
  );
}
