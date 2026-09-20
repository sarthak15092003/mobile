import React from 'react';

export type RepairStatusType = 'PENDING' | 'IN_PROCESS' | 'COMPLETED' | 'CANCELLED';

interface StatusBadgeProps {
  status: RepairStatusType | string;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<
  string,
  { label: string; bg: string; text: string; dot: string; border: string }
> = {
  PENDING: {
    label: 'Pending',
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
    border: 'border-amber-500/20',
  },
  IN_PROCESS: {
    label: 'In Process',
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    text: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500 animate-pulse',
    border: 'border-blue-500/20',
  },
  COMPLETED: {
    label: 'Completed',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    border: 'border-emerald-500/20',
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: 'bg-rose-500/10 dark:bg-rose-500/20',
    text: 'text-rose-700 dark:text-rose-300',
    dot: 'bg-rose-500',
    border: 'border-rose-500/20',
  },
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const normalized = status ? status.toUpperCase().replace(/\s+/g, '_') : 'PENDING';
  const config = statusConfig[normalized] || {
    label: status,
    bg: 'bg-slate-500/10',
    text: 'text-slate-700',
    dot: 'bg-slate-400',
    border: 'border-slate-500/20',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-medium',
    lg: 'px-3 py-1.5 text-sm font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]} transition-colors`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
