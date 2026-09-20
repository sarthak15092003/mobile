'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Calendar,
  Filter,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Wrench,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
} from 'lucide-react';

interface ReportSummary {
  total: number;
  pending: number;
  inProcess: number;
  completed: number;
  cancelled: number;
}

interface TechnicianBreakdown {
  technicianId?: string | null;
  name: string;
  count: number;
}

export default function ReportsPage() {
  const [summary, setSummary] = useState<ReportSummary>({
    total: 0,
    pending: 0,
    inProcess: 0,
    completed: 0,
    cancelled: 0,
  });
  const [techniciansBreakdown, setTechniciansBreakdown] = useState<TechnicianBreakdown[]>([]);
  const [techniciansList, setTechniciansList] = useState<{ id: string; name: string }[]>([]);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [status, setStatus] = useState('');
  const [technicianId, setTechnicianId] = useState('');

  const [loading, setLoading] = useState(true);

  // Load technician list
  useEffect(() => {
    async function loadTechs() {
      try {
        const res = await fetch('/api/users?active_only=true');
        if (res.ok) {
          const d = await res.json();
          setTechniciansList(d.users || []);
        }
      } catch (e) {
        console.error('Failed to load technician options:', e);
      }
    }
    loadTechs();
  }, []);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo) params.set('date_to', dateTo);
      if (status) params.set('status', status);
      if (technicianId) params.set('technician_id', technicianId);

      const res = await fetch(`/api/reports?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
        setTechniciansBreakdown(data.technicianBreakdown || []);
      }
    } catch (e) {
      console.error('Failed to fetch report metrics:', e);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, status, technicianId]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleExport = (format: 'csv' | 'xlsx') => {
    const params = new URLSearchParams();
    params.set('format', format);
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    if (status) params.set('status', status);
    if (technicianId) params.set('technician_id', technicianId);

    window.open(`/api/reports/export?${params.toString()}`, '_blank');
  };

  const calculatePct = (count: number) => {
    if (!summary.total || summary.total === 0) return 0;
    return Math.round((count / summary.total) * 100);
  };

  return (
    <div className="space-y-8">
      {/* Header & Export Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Reports & Repair Analytics
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            Aggregated PostgreSQL performance metrics, technician workloads, and exports.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => handleExport('csv')}
            className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => handleExport('xlsx')}
            className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Export Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <Filter className="h-4 w-4" />
          <span>Report Filter Criteria</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Date From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Date To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Status Filter
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROCESS">In Process</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Technician Filter
            </label>
            <select
              value={technicianId}
              onChange={(e) => setTechnicianId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            >
              <option value="">All Technicians</option>
              {techniciansList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 dark:border-blue-900/50 dark:bg-blue-950/30">
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                Total Volume
              </span>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-3">
                {summary.total}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Tickets Analyzed</span>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 dark:border-amber-900/50 dark:bg-amber-950/30">
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                Pending
              </span>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-3">
                {summary.pending}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {calculatePct(summary.pending)}% of total
              </span>
            </div>

            <div className="rounded-2xl border border-cyan-200 bg-cyan-50/50 p-5 dark:border-cyan-900/50 dark:bg-cyan-950/30">
              <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                In Process
              </span>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-3">
                {summary.inProcess}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {calculatePct(summary.inProcess)}% of total
              </span>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/30">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Completed
              </span>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-3">
                {summary.completed}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {calculatePct(summary.completed)}% resolved
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 rounded-2xl border border-rose-200 bg-rose-50/50 p-5 dark:border-rose-900/50 dark:bg-rose-950/30">
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                Cancelled
              </span>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-3">
                {summary.cancelled}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {calculatePct(summary.cancelled)}% rejected
              </span>
            </div>
          </div>

          {/* Breakdown Section: Status Distribution & Technician Workload */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Status Distribution Progress */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                Status Distribution
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      Completed ({summary.completed})
                    </span>
                    <span className="text-slate-500 font-medium">{calculatePct(summary.completed)}%</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${calculatePct(summary.completed)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-semibold text-cyan-700 dark:text-cyan-400">
                      In Process ({summary.inProcess})
                    </span>
                    <span className="text-slate-500 font-medium">{calculatePct(summary.inProcess)}%</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                      style={{ width: `${calculatePct(summary.inProcess)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-semibold text-amber-700 dark:text-amber-400">
                      Pending Inward ({summary.pending})
                    </span>
                    <span className="text-slate-500 font-medium">{calculatePct(summary.pending)}%</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${calculatePct(summary.pending)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-semibold text-rose-700 dark:text-rose-400">
                      Cancelled ({summary.cancelled})
                    </span>
                    <span className="text-slate-500 font-medium">{calculatePct(summary.cancelled)}%</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full transition-all duration-500"
                      style={{ width: `${calculatePct(summary.cancelled)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Technician Workload Distribution */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                Technician Workload Breakdown
              </h2>
              {techniciansBreakdown.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No repairs currently assigned to technicians.
                </div>
              ) : (
                <div className="space-y-3">
                  {techniciansBreakdown.map((item) => (
                    <div
                      key={item.technicianId || 'unassigned'}
                      className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-950 p-3 border border-slate-100 dark:border-slate-800"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold text-xs">
                          {item.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">
                          {item.name}
                        </span>
                      </div>
                      <span className="rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 text-xs font-bold font-mono">
                        {item.count} repairs
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
