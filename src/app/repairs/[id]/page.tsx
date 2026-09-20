'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Smartphone,
  Hash,
  Tag,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Edit3,
  Loader2,
  Wrench,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';

interface RepairDetails {
  id: string;
  repair_id: string;
  serial_number: string;
  mobile_name: string;
  problem: string;
  repair_date: string;
  additional_id?: string | null;
  status: string;
  notes?: string | null;
  completion_date?: string | null;
  created_at: string;
  updated_at: string;
  assigned_to?: { id: string; name: string; email: string } | null;
  completed_by?: { id: string; name: string; email: string } | null;
  created_by: { id: string; name: string; email: string };
  history: Array<{
    id: string;
    old_status?: string | null;
    new_status: string;
    changed_at: string;
    notes?: string | null;
    changed_by: { id: string; name: string; role: string };
  }>;
}

interface UserOption {
  id: string;
  name: string;
  role: string;
}

export default function RepairDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [repair, setRepair] = useState<RepairDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Status update modal state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [completedById, setCompletedById] = useState('');
  const [statusModalError, setStatusModalError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editMobileName, setEditMobileName] = useState('');
  const [editProblem, setEditProblem] = useState('');
  const [editAdditionalId, setEditAdditionalId] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editAssignedToId, setEditAssignedToId] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Technicians list for assignment and completion
  const [technicians, setTechnicians] = useState<UserOption[]>([]);

  const loadRepairDetails = async () => {
    try {
      const res = await fetch(`/api/repairs/${resolvedParams.id}`);
      if (!res.ok) {
        setError('Repair record not found.');
        setLoading(false);
        return;
      }
      const data = await res.json();
      setRepair(data.repair);
      setNewStatus(data.repair.status);
      setCompletedById(data.repair.completed_by?.id || data.repair.assigned_to?.id || '');

      // Pre-fill edit fields
      setEditMobileName(data.repair.mobile_name);
      setEditProblem(data.repair.problem);
      setEditAdditionalId(data.repair.additional_id || '');
      setEditNotes(data.repair.notes || '');
      setEditAssignedToId(data.repair.assigned_to?.id || '');
    } catch {
      setError('Failed to fetch repair details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRepairDetails();

    async function loadUsers() {
      try {
        const res = await fetch('/api/users?active_only=true');
        if (res.ok) {
          const d = await res.json();
          setTechnicians(d.users || []);
        }
      } catch (e) {
        console.error('Failed to load users:', e);
      }
    }
    loadUsers();
  }, [resolvedParams.id]);

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingStatus(true);
    setStatusModalError('');
    try {
      const res = await fetch(`/api/repairs/${resolvedParams.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          notes: statusNotes,
          completed_by_id: newStatus === 'COMPLETED' ? completedById : undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatusModalOpen(false);
        setStatusNotes('');
        setStatusModalError('');
        await loadRepairDetails();
      } else {
        setStatusModalError(data.error || 'Failed to update status');
      }
    } catch {
      setStatusModalError('Error updating status. Please try again.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/repairs/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile_name: editMobileName,
          problem: editProblem,
          additional_id: editAdditionalId,
          notes: editNotes,
          assigned_to_id: editAssignedToId || null,
        }),
      });

      if (res.ok) {
        setEditModalOpen(false);
        await loadRepairDetails();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update repair');
      }
    } catch {
      alert('Error updating repair');
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !repair) {
    return (
      <div className="text-center py-16 space-y-4">
        <ShieldAlert className="mx-auto h-12 w-12 text-rose-500" />
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
          {error || 'Repair not found'}
        </h2>
        <Link
          href="/repairs"
          className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Repairs</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/repairs"
            className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
                {repair.repair_id}
              </h1>
              <StatusBadge status={repair.status} size="md" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Created on {new Date(repair.created_at).toLocaleString()} by{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {repair.created_by.name}
              </span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setEditModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Edit3 className="h-4 w-4" />
            <span>Edit Details</span>
          </button>

          <button
            onClick={() => {
              setNewStatus(repair.status);
              setStatusModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all cursor-pointer"
          >
            <Wrench className="h-4 w-4" />
            <span>Update Status</span>
          </button>
        </div>
      </div>

      {/* Grid: 2 Column Layout (Left: Device & Problem Cards, Right: History Audit Trail) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Details Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Device Information */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
              Device Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
                <span className="text-slate-400 flex items-center gap-1">
                  <Smartphone className="h-3.5 w-3.5" /> Mobile Name / Model
                </span>
                <span className="mt-1 block text-sm font-bold text-slate-900 dark:text-white">
                  {repair.mobile_name}
                </span>
              </div>

              <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
                <span className="text-slate-400 flex items-center gap-1">
                  <Hash className="h-3.5 w-3.5" /> Serial Number / IMEI
                </span>
                <span className="mt-1 block text-sm font-mono font-bold text-blue-600 dark:text-blue-400">
                  {repair.serial_number}
                </span>
                <Link
                  href={`/search?serial_number=${encodeURIComponent(repair.serial_number)}`}
                  className="mt-1 inline-block text-[10px] text-blue-500 hover:underline"
                >
                  View all services for this serial →
                </Link>
              </div>

              <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
                <span className="text-slate-400 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Service Inward Date
                </span>
                <span className="mt-1 block font-semibold text-slate-800 dark:text-slate-200">
                  {new Date(repair.repair_date).toLocaleDateString()}
                </span>
              </div>

              <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
                <span className="text-slate-400 flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" /> Additional Reference ID
                </span>
                <span className="mt-1 block font-semibold text-slate-800 dark:text-slate-200">
                  {repair.additional_id || <span className="text-slate-400 font-normal">None</span>}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Problem and Technicians */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Problem & Diagnostics
            </h2>

            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Reported Problem:
              </span>
              <p className="mt-1 text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                {repair.problem}
              </p>
            </div>

            {repair.notes && (
              <div className="rounded-xl bg-amber-50/50 p-4 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/40">
                <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                  Notes & Special Instructions:
                </span>
                <p className="mt-1 text-sm text-amber-900 dark:text-amber-200">
                  {repair.notes}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400">Assigned Technician:</span>
                <div className="mt-1 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-blue-500" />
                  <span>{repair.assigned_to ? repair.assigned_to.name : 'Unassigned'}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400">Completed By & Date:</span>
                <div className="mt-1 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>
                    {repair.completed_by
                      ? `${repair.completed_by.name} (${new Date(repair.completion_date || '').toLocaleDateString()})`
                      : 'Not completed yet'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Audit Trail / History Timeline */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Repair History & Audit Trail
              </h2>
              <p className="text-[11px] text-slate-500">
                All changes are permanently logged to PostgreSQL.
              </p>
            </div>
            <Clock className="h-4 w-4 text-slate-400" />
          </div>

          <div className="mt-6 flex-1 space-y-6">
            {repair.history.map((h, idx) => (
              <div key={h.id} className="relative pl-6">
                {/* Vertical connecting line */}
                {idx !== repair.history.length - 1 && (
                  <div className="absolute left-2.5 top-3 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800 -translate-x-1/2" />
                )}

                {/* Timeline node icon */}
                <div className="absolute left-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                  <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                </div>

                {/* Content */}
                <div className="text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {h.old_status ? (
                        <>
                          <span className="text-slate-400">{h.old_status}</span>
                          <span className="mx-1.5 text-slate-400">→</span>
                          <span className="text-blue-600 dark:text-blue-400 font-bold">
                            {h.new_status}
                          </span>
                        </>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          Repair Created ({h.new_status})
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    {new Date(h.changed_at).toLocaleString()}
                  </div>

                  <div className="text-[11px] text-slate-500">
                    By: <span className="font-medium text-slate-700 dark:text-slate-300">{h.changed_by.name}</span>{' '}
                    <span className="text-[10px] text-slate-400">({h.changed_by.role})</span>
                  </div>

                  {h.notes && (
                    <div className="mt-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 p-2 text-[11px] text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-850">
                      {h.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Update Repair Status"
        maxWidth="md"
      >
        <form onSubmit={handleStatusUpdate} className="space-y-4">
          {statusModalError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400">
              {statusModalError}
            </div>
          )}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              New Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            >
              <option value="PENDING">Pending</option>
              <option value="IN_PROCESS">In Process</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {newStatus === 'COMPLETED' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Completed By
              </label>
              <select
                value={completedById}
                onChange={(e) => setCompletedById(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              >
                <option value="">-- Select Technician / User --</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.role})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-slate-500">
                Will automatically stamp completion timestamp and technician attribution.
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Change Note / Work Summary
            </label>
            <textarea
              rows={3}
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              placeholder="e.g. Screen replaced and tested; parts arrived from vendor; customer notified..."
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setStatusModalOpen(false)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updatingStatus}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
            >
              {updatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <span>Apply Status Change</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Details Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Repair Record"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Mobile Device Model
            </label>
            <input
              type="text"
              required
              value={editMobileName}
              onChange={(e) => setEditMobileName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Additional Reference ID
            </label>
            <input
              type="text"
              value={editAdditionalId}
              onChange={(e) => setEditAdditionalId(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Assigned Technician
            </label>
            <select
              value={editAssignedToId}
              onChange={(e) => setEditAssignedToId(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            >
              <option value="">-- Unassigned --</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Problem Description
            </label>
            <textarea
              rows={3}
              required
              value={editProblem}
              onChange={(e) => setEditProblem(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Notes
            </label>
            <textarea
              rows={2}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingEdit}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
            >
              {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
