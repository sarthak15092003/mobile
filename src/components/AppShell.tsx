'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import { Loader2 } from 'lucide-react';

interface UserData {
  userId: string;
  name: string;
  email: string;
  role: string;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthPage = pathname === '/login';

  useEffect(() => {
    if (isAuthPage) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        if (isMounted) {
          setUser(data.user);
          setLoading(false);
        }
      } catch {
        router.push('/login');
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [pathname, isAuthPage, router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (isAuthPage) {
    return <main className="min-h-screen bg-slate-50 dark:bg-slate-950">{children}</main>;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium text-slate-500">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar
        userRole={user?.role}
        userName={user?.name}
        userEmail={user?.email}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:pl-72 flex flex-col min-h-screen">
        <Header
          user={user}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
