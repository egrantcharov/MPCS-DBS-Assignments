'use client';

import { cn } from '@/lib/utils';

interface CardShellProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function CardShell({ children, className, onClick }: CardShellProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'card-elevated p-5 transition-all duration-200 hover:shadow-md hover:scale-[1.01] animate-fade-in',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}
