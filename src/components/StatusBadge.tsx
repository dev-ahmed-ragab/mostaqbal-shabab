import React from 'react';
import { ComplaintStatus, STATUS_META } from '@/types/database';

interface StatusBadgeProps {
  status: ComplaintStatus;
  showDot?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showDot = true,
  className = '',
}) => {
  const meta = STATUS_META[status] || STATUS_META.new;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${meta.bgClass} ${meta.textClass} ${meta.borderClass} ${className}`}
    >
      {showDot && (
        <span className={`w-2 h-2 rounded-full animate-pulse ${meta.dotClass}`} />
      )}
      {meta.label}
    </span>
  );
};
