'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Smartphone,
  Hash,
  Calendar,
  Clock,
  ArrowRight,
  Loader2,
  FileText,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';

interface SearchResult {
  id: string;
  repair_id: string;
  serial_number: string;
  mobile_name: string;
  problem: string;
  repair_date: string;
  additional_id?: string | null;
  status: string;
  created_at: string;
  assigned_to?: { name: string } | null;
  completed_by?: { name: string } | null;
  created_by: { name: string };
  history: Array<{
    id: string;
    old_status?: string | null;
    new_status: string;
    changed_at: string;
    notes?: string | null;
  }>;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || searchParams.get('serial_number') || '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const performSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/repairs/search?q=${encodeURIComponent(searchTerm.trim())}`);
      if (res.ok) {
        const json = await res.json();
        setResults(json.data || []);
      }
    } catch (e) {
      console.error('Search error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  // Group multiple repairs by serial number if multiple exist
  const serialGroups = results.reduce<Record<string, SearchResult[]>>((acc, item) => {
    acc[item.serial_number] = acc[item.serial_number] || [];
    acc[item.serial_number].push(item);
    return acc;
  }, {});

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Dedicated Repair & Serial Search
        </h1>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
          Direct PostgreSQL lookup by Serial Number, Repair ID, Additional ID, or Mobile Name.
        </p>
      </div>

      {/* Big Search Input */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter Serial Number (e.g. SN123456), Repair ID, or Phone..."
              className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-3 pl-12 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            <span>Search Database</span>
          </button>
        </form>

        {/* Quick Example Pills */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>Try quick lookups:</span>
          <button
            type="button"
            onClick={() => {
              setQuery('SN123456');
              performSearch('SN123456');
            }}
            className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 font-mono text-[11px] hover:bg-blue-100 hover:text-blue-700 transition-colors"
          >
            SN123456 (Multi-repair device)
          </button>
          <button
            type="button"
            onClick={() => {
              setQuery('SN987654');
              performSearch('SN987654');
            }}
            className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 font-mono text-[11px] hover:bg-blue-100 hover:text-blue-700 transition-colors"
          >
            SN987654
          </button>
        </div>
      </div>

      {/* Results Section */}
      {searched && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Found {results.length} matching repair {results.length === 1 ? 'record' : 'records'}
            </h2>
            <span className="text-xs text-slate-400">
              Sorted newest first
            </span>
          </div>

          {results.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <AlertCircle className="mx-auto h-10 w-10 text-slate-400 mb-3" />
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                No matching repair records found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                We couldn&apos;t find any repairs matching &quot;{query}&quot;. Verify the serial number or create a new repair ticket.
              </p>
              <Link
                href="/repairs/new"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-700 transition-colors"
              >
                Create New Repair Ticket
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((r, index) => (
                <div
                  key={r.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-800 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                        <Smartphone className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/repairs/${r.id}`}
                            className="text-base font-bold font-mono text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {r.repair_id}
                          </Link>
                          <StatusBadge status={r.status} size="sm" />
                        </div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5">
                          {r.mobile_name}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{new Date(r.repair_date).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 text-xs">
                    <div>
                      <span className="text-slate-400">Serial / IMEI:</span>
                      <div className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {r.serial_number}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400">Additional Reference ID:</span>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {r.additional_id || 'None'}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400">Technician Assignment:</span>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {r.assigned_to ? r.assigned_to.name : <span className="text-slate-400">Unassigned</span>}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3 text-xs text-slate-700 dark:text-slate-300">
                    <span className="font-semibold text-slate-500 block mb-0.5">Reported Issue:</span>
                    {r.problem}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span className="text-slate-400">
                      Logged by {r.created_by.name} on {new Date(r.created_at).toLocaleDateString()}
                    </span>

                    <Link
                      href={`/repairs/${r.id}`}
                      className="inline-flex items-center gap-1.5 font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      <span>Open Ticket & Audit Trail</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" /></div>}>
      <SearchContent />
    </Suspense>
  );
}
