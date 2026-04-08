'use client';

import { useState } from 'react';
import { Contact } from '@/context/types';
import { formatDate, cn } from '@/lib/utils';
import { ChevronRight, Mail, ExternalLink } from 'lucide-react';

interface ContactRowProps {
  contact: Contact;
  companyName: string;
}

export default function ContactRow({ contact, companyName }: ContactRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card-elevated overflow-hidden animate-fade-in">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <ChevronRight
          size={14}
          className={cn(
            'text-gray-400 transition-transform duration-200 shrink-0',
            expanded && 'rotate-90'
          )}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{contact.name}</p>
          <p className="text-xs text-gray-500">
            {contact.role} at {companyName}
          </p>
        </div>
        <span className="text-xs text-gray-500 shrink-0">
          {formatDate(contact.lastContactedAt)}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pl-10 space-y-2 text-sm animate-fade-in">
          <div className="flex items-center gap-2 text-gray-600">
            <Mail size={13} />
            <a
              href={`mailto:${contact.email}`}
              className="hover:text-indigo-600 transition-colors"
            >
              {contact.email}
            </a>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <ExternalLink size={13} />
            <a
              href={contact.linkedIn}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-indigo-600 transition-colors"
            >
              LinkedIn Profile
            </a>
          </div>
          {contact.notes && (
            <p className="text-gray-500 text-xs mt-2">{contact.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}
