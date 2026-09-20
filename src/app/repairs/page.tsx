'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';

interface RepairRecord {
  id: string;
  repair_id: string;
  serial_number: string;
  mobile_name: string;
  problem: string;
  repair_date: string;
  additional_id?: string | null;
  status: string;
  created_at: string;
  assigned_to?: { id: string; name: string } | null;
  completed_by?: { id: string; name: string } | null;
  created_by: { id: string; name: string };
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AllRepairsPage() {
  const [repairs, setRepairs] = useState<RepairRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [technicianId, setTechnicianId] = useState('');
  const [loading, setLoading] = useState(true);

  const [techniciansList, setTechniciansList] = useState<{ id: string; name: string }[]>([]);

  // Load technician list for dropdown filter
  useEffect(() => {
    async function loadTechs() {
      try {
        const res = await fetch('/api/users?active_only=true');
        if (res.ok) {
          const d = await res.json();
          setTechniciansList(d.users || []);
        }
      } catch (e) {
        console.error('Failed to load technician filter options:', e);
      }
    }
    loadTechs();
  }, []);

  const fetchRepairs = useCallback(async (pageToLoad = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(pageToLoad));
      params.set('limit', '10');
      if (search.trim()) params.set('search', search.trim());
      if (status) params.set('status', status);
      if (technicianId) params.set('assigned_to', technicianId);
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo) params.set('date_to', dateTo);

      const res = await fetch(`/api/repairs?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setRepairs(json.data || []);
        setPagination(json.pagination);
      }
    } catch (e) {
      console.error('Failed to fetch repairs:', e);
    } finally {
      setLoading(false);
    }
  }, [search, status, technicianId, dateFrom, dateTo]);

  useEffect(() => {
    fetchRepairs(1);
  }, [fetchRepairs]);

  const handleResetFilters = () => {
    setSearch('');
    setStatus('');
    setDateFrom('');
    setDateTo('');
    setTechnicianId('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            All Repair Records
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            Server-side paginated & filtered records from PostgreSQL database.
          </p>
        </div>
        <Link
          href="/repairs/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all cursor-pointer w-full sm:w-auto"
        >
          <PlusCircle className="h-4 w-4" />
          <span>New Repair</span>
        </Link>
      </div>

      {/* Filter and Search Panel */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            <Filter className="h-4 w-4" />
            <span>Search & Filter</span>
          </div>
          {(search || status || technicianId || dateFrom || dateTo) && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {/* Text Search */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Serial, Repair ID, Problem..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROCESS">In Process</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Technician Filter */}
          <div>
            <select
              value={technicianId}
              onChange={(e) => setTechnicianId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            >
              <option value="">All Technicians</option>
              {techniciansList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              aria-label="Filter from date"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[840px]">
            <thead className="border-b border-slate-100 bg-slate-50/75 text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3.5 font-semibold">Repair ID</th>
                <th className="px-4 py-3.5 font-semibold">Serial Number</th>
                <th className="px-4 py-3.5 font-semibold">Mobile Model</th>
                <th className="px-4 py-3.5 font-semibold">Problem</th>
                <th className="px-4 py-3.5 font-semibold">Date</th>
                <th className="px-4 py-3.5 font-semibold">Status</th>
                <th className="px-4 py-3.5 font-semibold">Assigned To</th>
                <th className="px-4 py-3.5 font-semibold">Created By</th>
                <th className="px-6 py-3.5 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-600 mb-2" />
                    <span>Loading repairs...</span>
                  </td>
                </tr>
              ) : repairs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No repair records match your filter criteria.
                  </td>
                </tr>
              ) : (
                repairs.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-3.5 font-bold font-mono text-blue-600 dark:text-blue-400">
                      <Link href={`/repairs/${r.id}`} className="hover:underline">
                        {r.repair_id}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-800 dark:text-slate-200">
                      {r.serial_number}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-white">
                      {r.mobile_name}
                    </td>
                    <td className="px-4 py-3.5 max-w-xs truncate text-slate-600 dark:text-slate-300">
                      {r.problem}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">
                      {new Date(r.repair_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={r.status} size="sm" />
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                      {r.assigned_to ? r.assigned_to.name : <span className="text-slate-400 italic">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">
                      {r.created_by.name}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Link
                        href={`/repairs/${r.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950 dark:hover:text-blue-400 transition-colors"
                      >
                        <span>View</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 px-4 py-3.5 sm:px-6 sm:py-4">
          <div className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-900 dark:text-white">{repairs.length}</span> of{' '}
            <span className="font-semibold text-slate-900 dark:text-white">{pagination.total}</span> total repairs
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchRepairs(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 px-2">
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>

            <button
              onClick={() => fetchRepairs(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
