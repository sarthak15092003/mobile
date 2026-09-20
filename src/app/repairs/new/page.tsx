'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Smartphone,
  Calendar,
  Wrench,
  FileText,
  User,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  PlusCircle,
  Loader2,
  Tag,
  Hash,
} from 'lucide-react';
import Modal from '@/components/Modal';

interface TechnicianUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function NewRepairPage() {
  const router = useRouter();
  const [serialNumber, setSerialNumber] = useState('');
  const [mobileName, setMobileName] = useState('');
  const [problem, setProblem] = useState('');
  const [repairDate, setRepairDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [additionalId, setAdditionalId] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [assignedToId, setAssignedToId] = useState('');

  const [technicians, setTechnicians] = useState<TechnicianUser[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Success dialog state
  const [createdRepair, setCreatedRepair] = useState<{
    id: string;
    repair_id: string;
    serial_number: string;
    mobile_name: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadTechnicians() {
      try {
        const res = await fetch('/api/users?active_only=true');
        if (res.ok) {
          const data = await res.json();
          setTechnicians(data.users || []);
        }
      } catch (e) {
        console.error('Failed to load assignees:', e);
      }
    }
    loadTechnicians();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!serialNumber.trim()) {
      setError('Serial Number is required.');
      return;
    }
    if (!mobileName.trim()) {
      setError('Mobile Name is required.');
      return;
    }
    if (!problem.trim()) {
      setError('Problem description is required.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/repairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serial_number: serialNumber.trim(),
          mobile_name: mobileName.trim(),
          problem: problem.trim(),
          repair_date: repairDate,
          additional_id: additionalId.trim() || null,
          notes: notes.trim() || null,
          status,
          assigned_to_id: assignedToId || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create repair ticket.');
        setSubmitting(false);
        return;
      }

      // Success: open confirmation modal
      setCreatedRepair(data.repair);
      setSubmitting(false);
    } catch {
      setError('Network connection error. Please try again.');
      setSubmitting(false);
    }
  };

  const handleCopyId = () => {
    if (createdRepair) {
      navigator.clipboard.writeText(createdRepair.repair_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleResetForm = () => {
    setCreatedRepair(null);
    setSerialNumber('');
    setMobileName('');
    setProblem('');
    setAdditionalId('');
    setNotes('');
    setStatus('PENDING');
    setAssignedToId('');
    setCopied(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Create New Repair Ticket
        </h1>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
          The unique Repair ID (e.g. REP-2026-00001) will be generated automatically by the server.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/50 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Main Form */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Serial Number */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Serial Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="e.g. SN123456789 / IMEI"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Non-unique: devices can be submitted multiple times over time.
              </p>
            </div>

            {/* Mobile Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Mobile Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={mobileName}
                  onChange={(e) => setMobileName(e.target.value)}
                  placeholder="e.g. Samsung Galaxy S24, iPhone 15 Pro"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            {/* Repair Date */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Repair Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  required
                  value={repairDate}
                  onChange={(e) => setRepairDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            {/* Additional ID */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Additional ID <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative mt-1.5">
                <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={additionalId}
                  onChange={(e) => setAdditionalId(e.target.value)}
                  placeholder="e.g. Customer ID, Job Sheet ID"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            {/* Initial Status */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              >
                <option value="PENDING">Pending (Default)</option>
                <option value="IN_PROCESS">In Process</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Assigned To Technician */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Assign Technician <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative mt-1.5">
                <select
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                >
                  <option value="">-- Select Technician (Unassigned) --</option>
                  {technicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name} ({tech.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Problem Description (Textarea) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Problem Description <span className="text-rose-500">*</span>
            </label>
            <div className="mt-1.5">
              <textarea
                required
                rows={3}
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="Describe the issue reported by the customer (e.g. Display broken, touchscreen not responding, water damage)..."
                className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Additional Notes <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="mt-1.5">
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Accessories left with device, physical scratches, customer request..."
                className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Link
              href="/repairs"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors w-full sm:w-auto"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/40 disabled:opacity-50 transition-all cursor-pointer w-full sm:w-auto"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating Repair ID...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4" />
                  <span>Submit Repair Ticket</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Success Modal showing Generated Repair ID with Copy button */}
      <Modal
        isOpen={Boolean(createdRepair)}
        onClose={() => {}}
        title="Repair Created Successfully"
        maxWidth="md"
      >
        {createdRepair && (
          <div className="space-y-6 text-center py-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div>
              <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                Ticket Generated & Saved to PostgreSQL
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                The permanent server-side Repair ID has been created:
              </p>
            </div>

            {/* Big Repair ID Box */}
            <div className="flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900/50 dark:bg-blue-950/40">
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">
                  Repair ID
                </span>
                <div className="text-xl font-mono font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {createdRepair.repair_id}
                </div>
              </div>

              <button
                onClick={handleCopyId}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy ID</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Metadata */}
            <div className="grid grid-cols-2 gap-2 text-left text-xs bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-slate-400">Device:</span>{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {createdRepair.mobile_name}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Serial:</span>{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {createdRepair.serial_number}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={handleResetForm}
                className="w-full sm:flex-1 rounded-xl border border-slate-300 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
              >
                Create Another
              </button>

              <button
                onClick={() => router.push(`/repairs/${createdRepair.id}`)}
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <span>View Details</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
