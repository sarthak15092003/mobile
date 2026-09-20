'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Search,
  PlusCircle,
  ArrowRight,
  Loader2,
  Calendar,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';

interface DashboardData {
  summary: {
    total: number;
    pending: number;
    inProcess: number;
    completed: number;
    cancelled: number;
  };
  recentRepairs: Array<{
    id: string;
    repair_id: string;
    serial_number: string;
    mobile_name: string;
    problem: string;
    status: string;
    repair_date: string;
    created_at: string;
    assigned_to?: { name: string } | null;
    completed_by?: { name: string } | null;
    created_by?: { name: string } | null;
  }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/reports');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Failed to load dashboard metrics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium text-slate-500">Loading live repair dashboard...</p>
        </div>
      </div>
    );
  }

  const summary = data?.summary || {
    total: 0,
    pending: 0,
    inProcess: 0,
    completed: 0,
    cancelled: 0,
  };

  const statCards = [
    {
      title: 'Total Repairs',
      count: summary.total,
      icon: Wrench,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      border: 'border-blue-200 dark:border-blue-900/50',
      link: '/repairs',
    },
    {
      title: 'Pending',
      count: summary.pending,
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      border: 'border-amber-200 dark:border-amber-900/50',
      link: '/repairs?status=PENDING',
    },
    {
      title: 'In Process',
      count: summary.inProcess,
      icon: AlertCircle,
      color: 'text-cyan-600 dark:text-cyan-400',
      bg: 'bg-cyan-50 dark:bg-cyan-950/40',
      border: 'border-cyan-200 dark:border-cyan-900/50',
      link: '/repairs?status=IN_PROCESS',
    },
    {
      title: 'Completed',
      count: summary.completed,
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      border: 'border-emerald-200 dark:border-emerald-900/50',
      link: '/repairs?status=COMPLETED',
    },
    {
      title: 'Cancelled',
      count: summary.cancelled,
      icon: XCircle,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      border: 'border-rose-200 dark:border-rose-900/50',
      link: '/repairs?status=CANCELLED',
    },
  ];

  const recentRepairs = data?.recentRepairs || [];
  const completedRepairs = recentRepairs.filter((r) => r.status === 'COMPLETED');

  return (
    <div className="space-y-8">
      {/* Top Welcome Bar & Action Buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Repair Service Overview
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Real-time multi-user PostgreSQL records and repair statuses.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/repairs/new"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Add New Repair</span>
          </Link>
        </div>
      </div>

      {/* Dashboard Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Instant Search by Serial Number (e.g. SN123456), Repair ID, or Phone Model..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* 5 Metric Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          const isLastOnMobile = index === statCards.length - 1;
          return (
            <Link
              key={card.title}
              href={card.link}
              className={`flex flex-col justify-between rounded-2xl border ${card.border} ${card.bg} p-4 sm:p-5 transition-all hover:scale-[1.02] hover:shadow-md ${
                isLastOnMobile ? 'col-span-2 sm:col-span-1' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {card.title}
                </span>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div className="mt-4">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {card.count}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main Grid: Recent Repairs Table & Recently Completed Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Recent Repairs Table (2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3.5 sm:px-6 sm:py-4 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Recent Repairs
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Latest service tickets submitted across all users.
              </p>
            </div>
            <Link
              href="/repairs"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              <span>View all</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[620px]">
              <thead className="border-b border-slate-100 bg-slate-50/75 text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-3 font-semibold">Repair ID</th>
                  <th className="px-4 py-3 font-semibold">Serial / Device</th>
                  <th className="px-4 py-3 font-semibold">Problem</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentRepairs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No repair records found. Click &quot;Add New Repair&quot; to create one.
                    </td>
                  </tr>
                ) : (
                  recentRepairs.slice(0, 6).map((repair) => (
                    <tr
                      key={repair.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-6 py-3.5 font-bold text-blue-600 dark:text-blue-400">
                        <Link href={`/repairs/${repair.id}`} className="hover:underline">
                          {repair.repair_id}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {repair.mobile_name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          SN: {repair.serial_number}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 max-w-xs truncate text-slate-600 dark:text-slate-300">
                        {repair.problem}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={repair.status} size="sm" />
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <Link
                          href={`/repairs/${repair.id}`}
                          className="inline-flex items-center gap-1 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 font-medium"
                        >
                          <span>Details</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recently Completed Repairs Feed (1 Col) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Recently Completed
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Repairs verified and signed off by technicians.
            </p>

            <div className="mt-4 space-y-3">
              {completedRepairs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No completed repairs in recent history.
                </div>
              ) : (
                completedRepairs.slice(0, 4).map((r) => (
                  <Link
                    key={r.id}
                    href={`/repairs/${r.id}`}
                    className="block rounded-xl border border-emerald-100 bg-emerald-50/30 p-3 hover:bg-emerald-50/70 dark:border-emerald-950/50 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {r.repair_id}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 mt-1">
                      {r.mobile_name}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      Completed by: {r.completed_by?.name || 'Technician'}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
            <Link
              href="/repairs/new"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-800 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Smartphone className="h-4 w-4" />
              <span>Log a New Device Service</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
