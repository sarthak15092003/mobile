'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Smartphone, Lock, Mail, ArrowRight, Loader2, ShieldCheck, Wrench, UserCheck, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed. Please check credentials.');
        setLoading(false);
        return;
      }

      // Successful login
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Connection error. Please try again.');
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Column: Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                FixFlow Pro
              </h1>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Mobile Repair Management System
              </p>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Access the multi-user repair management database.
            </p>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/50 dark:text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@mobilerepair.com"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-600/40 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Buttons for Testing */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
              One-Click Demo Credentials
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@mobilerepair.com', 'admin123')}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-300 transition-colors text-center group cursor-pointer"
              >
                <ShieldCheck className="h-4 w-4 text-indigo-600 mb-1" />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Admin</span>
                <span className="text-[10px] text-slate-500">Full Access</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('tech@mobilerepair.com', 'tech123')}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-300 transition-colors text-center group cursor-pointer"
              >
                <Wrench className="h-4 w-4 text-emerald-600 mb-1" />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Technician</span>
                <span className="text-[10px] text-slate-500">Status Updates</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('user@mobilerepair.com', 'user123')}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-300 transition-colors text-center group cursor-pointer"
              >
                <UserCheck className="h-4 w-4 text-blue-600 mb-1" />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">User</span>
                <span className="text-[10px] text-slate-500">Front Desk</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Hero Banner */}
      <div className="relative hidden w-0 flex-1 lg:block bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.15),transparent_50%)]" />
        <div className="flex h-full flex-col justify-between p-16 text-white relative z-10">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-blue-400">
            <span className="h-2 w-2 rounded-full bg-blue-400 animate-ping" />
            Multi-User Shared PostgreSQL Database
          </div>

          <div className="max-w-md space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight">
              Centralized Mobile Service & Repair Architecture
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Every repair ticket, serial number history, and technician status update is saved directly to PostgreSQL. Built for local development and direct production deployment on Vercel.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-2xl bg-white/5 p-4 backdrop-blur-md border border-white/10 text-xs">
            <div>
              <div className="text-slate-400 font-medium">Auto Sequential ID</div>
              <div className="text-sm font-bold text-white mt-0.5">REP-2026-XXXXX</div>
            </div>
            <div>
              <div className="text-slate-400 font-medium">Audit Trail</div>
              <div className="text-sm font-bold text-emerald-400 mt-0.5">Full History Logged</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
