'use client';

import React, { useState, useEffect } from 'react';
import {
  Users as UsersIcon,
  PlusCircle,
  Shield,
  Wrench,
  UserCheck,
  Edit2,
  KeyRound,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import Modal from '@/components/Modal';

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  created_at: string;
  _count?: {
    repairs_assigned: number;
    repairs_created: number;
    repairs_completed: number;
  };
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create User Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [newRole, setNewRole] = useState('USER');
  const [creating, setCreating] = useState(false);

  // Edit User Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('USER');
  const [savingEdit, setSavingEdit] = useState(false);

  // Reset Password Modal
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState('');
  const [resetUserName, setResetUserName] = useState('');
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetting, setResetting] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const d = await res.json();
        setUsers(d.users || []);
      } else if (res.status === 403) {
        setError('Access denied. Administrator privileges required.');
      } else {
        setError('Failed to fetch user accounts.');
      }
    } catch {
      setError('Connection error while fetching users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
          role: newRole,
        }),
      });

      if (res.ok) {
        setCreateModalOpen(false);
        setNewName('');
        setNewEmail('');
        setNewPassword('');
        setNewRole('USER');
        await fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create user');
      }
    } catch {
      alert('Error creating user');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (user: ManagedUser) => {
    const action = user.active ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} user ${user.name}?`)) return;

    try {
      const res = await fetch(`/api/users/${user.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !user.active }),
      });

      if (res.ok) {
        await fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update user status');
      }
    } catch {
      alert('Error toggling status');
    }
  };

  const handleEditUser = (user: ManagedUser) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditModalOpen(true);
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          role: editRole,
        }),
      });

      if (res.ok) {
        setEditModalOpen(false);
        await fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update user');
      }
    } catch {
      alert('Error saving user');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetting(true);
    try {
      const res = await fetch(`/api/users/${resetUserId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: resetPasswordVal }),
      });

      if (res.ok) {
        setResetModalOpen(false);
        setResetPasswordVal('');
        alert('Password reset successfully.');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to reset password');
      }
    } catch {
      alert('Error resetting password');
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center dark:border-rose-900/50 dark:bg-rose-950/50">
        <AlertCircle className="mx-auto h-10 w-10 text-rose-600 mb-2" />
        <h2 className="text-base font-bold text-rose-800 dark:text-rose-200">{error}</h2>
        <p className="text-xs text-rose-600 mt-1">
          Only administrators have permission to manage accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            User Management
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            Create, manage roles, and control access permissions for team members.
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all cursor-pointer w-full sm:w-auto"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Add New User</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[760px]">
            <thead className="border-b border-slate-100 bg-slate-50/75 text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3.5 font-semibold">User Name</th>
                <th className="px-4 py-3.5 font-semibold">Email</th>
                <th className="px-4 py-3.5 font-semibold">Role</th>
                <th className="px-4 py-3.5 font-semibold">Status</th>
                <th className="px-4 py-3.5 font-semibold">Assigned / Handled</th>
                <th className="px-4 py-3.5 font-semibold">Joined Date</th>
                <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white">
                    {u.name}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-300">
                    {u.email}
                  </td>
                  <td className="px-4 py-3.5">
                    {u.role === 'ADMIN' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 text-[11px] font-semibold">
                        <Shield className="h-3 w-3" /> Admin
                      </span>
                    ) : u.role === 'TECHNICIAN' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 text-[11px] font-semibold">
                        <Wrench className="h-3 w-3" /> Technician
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 text-[11px] font-semibold">
                        <UserCheck className="h-3 w-3" /> Service Desk
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {u.active ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-400 font-medium">
                        <XCircle className="h-3.5 w-3.5" /> Disabled
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-slate-500">
                    {u._count ? (
                      <span>
                        {u._count.repairs_assigned} assigned / {u._count.repairs_completed} completed
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-slate-500">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3.5 text-right space-x-2">
                    <button
                      onClick={() => handleEditUser(u)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Edit User"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => {
                        setResetUserId(u.id);
                        setResetUserName(u.name);
                        setResetModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Reset Password"
                    >
                      <KeyRound className="h-3 w-3" />
                      <span>Password</span>
                    </button>

                    <button
                      onClick={() => handleToggleActive(u)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                        u.active
                          ? 'border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-950 dark:hover:bg-rose-950/30'
                          : 'border border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-950 dark:hover:bg-emerald-950/30'
                      }`}
                    >
                      {u.active ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Team Member Account"
        maxWidth="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Full Name
            </label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Email Address
            </label>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="rahul@mobilerepair.com"
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Role
            </label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            >
              <option value="USER">User (Service Desk / Front Counter)</option>
              <option value="TECHNICIAN">Technician (Repairs & Status Updates)</option>
              <option value="ADMIN">Admin (Full System Access)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Initial Password
            </label>
            <div className="relative mt-1.5">
              <input
                type={showCreatePassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-3 pr-10 text-sm text-slate-900 focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowCreatePassword(!showCreatePassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                aria-label={showCreatePassword ? 'Hide password' : 'Show password'}
              >
                {showCreatePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <span>Create Account</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Team Member"
        maxWidth="md"
      >
        <form onSubmit={handleSaveEditUser} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Full Name
            </label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Email Address
            </label>
            <input
              type="email"
              required
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Role
            </label>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            >
              <option value="USER">User (Service Desk)</option>
              <option value="TECHNICIAN">Technician</option>
              <option value="ADMIN">Admin</option>
            </select>
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

      {/* Reset Password Modal */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title={`Reset Password for ${resetUserName}`}
        maxWidth="md"
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              New Password
            </label>
            <div className="relative mt-1.5">
              <input
                type={showResetPassword ? 'text' : 'password'}
                required
                value={resetPasswordVal}
                onChange={(e) => setResetPasswordVal(e.target.value)}
                placeholder="Enter at least 6 characters"
                className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-3 pr-10 text-sm text-slate-900 focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowResetPassword(!showResetPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                aria-label={showResetPassword ? 'Hide password' : 'Show password'}
              >
                {showResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setResetModalOpen(false)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={resetting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
            >
              {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <span>Reset Password</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
