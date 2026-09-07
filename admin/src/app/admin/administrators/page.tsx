'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { api } from '@/lib/api';
import { Loader2, Plus, Pencil, ShieldCheck, Trash2, KeyRound } from 'lucide-react';

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-500/20 text-purple-400',
  ADMIN: 'bg-yellow-500/20 text-yellow-400',
  STAFF: 'bg-blue-500/20 text-blue-400',
};

const roles = ['STAFF', 'ADMIN', 'SUPER_ADMIN'];

export default function AdministratorsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    password: '',
    role: 'STAFF',
  });

  const load = async (pageNum = 1) => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/admin/administrators', { params: { page: pageNum, limit: 20 } });
      setUsers(response.data.data || []);
      setTotalPages(response.data.meta?.total_pages || 1);
    } catch (error) {
      console.error('Failed to load administrators:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page);
  }, [page]);

  const openCreate = () => {
    setEditing(null);
    setForm({ email: '', first_name: '', last_name: '', phone: '', password: '', role: 'STAFF' });
    setShowForm(true);
  };

  const openEdit = (user: any) => {
    setEditing(user);
    setForm({
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone || '',
      password: '',
      role: user.role,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const payload: any = {
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone || null,
          role: form.role,
          is_active: true,
        };
        if (form.password) payload.password = form.password;
        await api.patch(`/api/v1/admin/administrators/${editing.id}`, payload);
      } else {
        await api.post('/api/v1/admin/administrators', { ...form, phone: form.phone || null });
      }
      setShowForm(false);
      load(page);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save administrator');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (user: any) => {
    if (!confirm(`Deactivate ${user.first_name} ${user.last_name}?`)) return;
    try {
      await api.delete(`/api/v1/admin/administrators/${user.id}`);
      load(page);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to deactivate administrator');
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-7 h-7 text-primary-500" />
          <h1 className="font-bold text-3xl">ADMINISTRATORS</h1>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Administrator
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-dark-800 text-left text-sm text-dark-400">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Joined</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-dark-800/50 hover:bg-dark-800/30">
                  <td className="py-3 px-4">
                    <p className="font-medium">{user.first_name} {user.last_name}</p>
                  </td>
                  <td className="py-3 px-4 text-sm">{user.email}</td>
                  <td className="py-3 px-4 text-sm text-dark-400">{user.phone || '-'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${roleColors[user.role] || ''}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-dark-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(user)}
                        className="p-2 rounded-lg border border-dark-700 hover:border-primary-500 transition-colors"
                        aria-label="Edit administrator"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeactivate(user)}
                        className="p-2 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors"
                        aria-label="Deactivate administrator"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-dark-400">No administrators found</td>
                </tr>
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-end px-4 py-4 border-t border-dark-800 gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="btn-secondary disabled:opacity-40">
                Previous
              </button>
              <span className="px-3 py-2 text-sm text-dark-400">Page {page} of {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="btn-secondary disabled:opacity-40">
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowForm(false)} />
          <div className="relative card w-full max-w-lg max-h-[90vh] overflow-y-auto bg-dark-900">
            <h2 className="font-semibold text-xl mb-6">
              {editing ? 'Edit Administrator' : 'Add Administrator'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-dark-400 mb-1">First Name</label>
                  <input required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-1">Last Name</label>
                  <input required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="input" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-1">Email</label>
                <input type="email" required disabled={!!editing} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input disabled:opacity-50" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-dark-400 mb-1">Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" placeholder="+250..." />
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-1">Role</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input">
                    {roles.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-1">
                  {editing ? 'New Password (leave blank to keep)' : 'Password'}
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-500" />
                  <input
                    type="password"
                    required={!editing}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="input pl-9"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-2 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editing ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}