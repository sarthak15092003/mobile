'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  PlusCircle,
  Search,
  Wrench,
  BarChart3,
  Users,
  LogOut,
  Smartphone,
  Shield,
  UserCheck,
  X,
} from 'lucide-react';

interface SidebarProps {
  userRole?: string;
  userName?: string;
  userEmail?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({
  userRole = 'USER',
  userName = 'User',
  userEmail = '',
  isOpen = true,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    }
  };

  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'USER', 'TECHNICIAN'],
    },
    {
      name: 'New Repair',
      href: '/repairs/new',
      icon: PlusCircle,
      roles: ['ADMIN', 'USER'],
    },
    {
      name: 'Search Repair',
      href: '/search',
      icon: Search,
      roles: ['ADMIN', 'USER', 'TECHNICIAN'],
    },
    {
      name: 'All Repairs',
      href: '/repairs',
      icon: Wrench,
      roles: ['ADMIN', 'USER', 'TECHNICIAN'],
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: BarChart3,
      roles: ['ADMIN', 'USER'],
    },
    {
      name: 'Users',
      href: '/users',
      icon: Users,
      roles: ['ADMIN'],
    },
  ];

  const filteredNav = navItems.filter((item) =>
    item.roles.includes(userRole.toUpperCase())
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out dark:border-slate-800 dark:bg-slate-950 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Logo & Header */}
        <div className="flex h-18 items-center justify-between border-b border-slate-200 px-6 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <Smartphone className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 dark:text-white tracking-tight">
                FixFlow Pro
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Mobile Repair Suite
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden dark:hover:bg-slate-900 dark:hover:text-slate-200"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Navigation
          </div>
          <nav className="space-y-1">
            {filteredNav.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 shrink-0 transition-transform group-hover:scale-105 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                    }`}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-semibold text-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                {userName}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {userRole === 'ADMIN' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                    <Shield className="h-3 w-3" /> Admin
                  </span>
                ) : userRole === 'TECHNICIAN' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <Wrench className="h-3 w-3" /> Technician
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                    <UserCheck className="h-3 w-3" /> Service Desk
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
