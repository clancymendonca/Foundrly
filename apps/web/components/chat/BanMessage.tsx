import React from 'react';
import { Ban, Clock } from 'lucide-react';

interface ChatBanMessageProps {
  description: string;
  isPermanent?: boolean;
}

export function ChatBanMessage({ description, isPermanent = false }: ChatBanMessageProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 mx-4">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {isPermanent ? (
            <Ban className="h-5 w-5 text-red-600" />
          ) : (
            <Clock className="h-5 w-5 text-red-600" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">
            Account Suspended
          </h3>
          <p className="mt-1 text-sm text-red-700">
            {description}
          </p>
          <p className="mt-2 text-xs text-red-600">
            You cannot send messages while your account is suspended.
          </p>
        </div>
      </div>
    </div>
  );
} 