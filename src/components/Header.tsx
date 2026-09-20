'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Menu, Search, PlusCircle, Shield, Wrench, UserCheck } from 'lucide-react';

interface HeaderProps {
  onMenuToggle?: () => void;
  user?: {
    name?: string;
    email?: string;
    role?: string;
  } | null;
}

export default function Header({ onMenuToggle, user }: HeaderProps) {
  const router = useRouter();
  const [quickSearch, setQuickSearch] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      router.push(`/search?q=${encodeURIComponent(quickSearch.trim())}`);
      setQuickSearch('');
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-18 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-4 sm:px-8 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden dark:text-slate-400 dark:hover:bg-slate-900"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Global Quick Search */}
        <form onSubmit={handleSearchSubmit} className="relative hidden sm:block w-72 md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
            placeholder="Search Serial, Repair ID, Phone..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900/50 dark:text-white dark:focus:bg-slate-900"
          />
        </form>
      </div>

      <div className="flex items-center gap-3">
        {user?.role !== 'TECHNICIAN' && (
          <Link
            href="/repairs/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-500/30 hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">New Repair</span>
          </Link>
        )}

        {user && (
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="hidden text-right md:block">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {user.name}
              </div>
              <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                {user.role}
              </div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 text-xs font-bold shadow-xs">
              {user.role === 'ADMIN' ? (
                <Shield className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              ) : user.role === 'TECHNICIAN' ? (
                <Wrench className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <UserCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
