'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { api } from '@/lib/api';
import { Loader2, Bell, Plus, Megaphone } from 'lucide-react';

const typeColors: Record<string, string> = {
  order: 'bg-blue-500/20 text-blue-400',
  payment: 'bg-green-500/20 text-green-400',
  delivery: 'bg-cyan-500/20 text-cyan-400',
  promotion: 'bg-yellow-500/20 text-yellow-400',
  system: 'bg-purple-500/20 text-purple-400',
};

const types = ['order', 'payment', 'delivery', 'promotion', 'system'];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCompose, setShowCompose] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ type: 'promotion', title: '', message: '' });

  const load = async (pageNum = 1) => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/admin/notifications', { params: { page: pageNum, limit: 20 } });
      setNotifications(response.data.data || []);
      setTotalPages(response.data.meta?.total_pages || 1);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page);
  }, [page]);

  const broadcast = async () => {
    if (!form.title.trim() || !form.message.trim()) return;
    setSaving(true);
    try {
      const response = await api.post('/api/v1/admin/notifications/broadcast', form);
      alert(response.data.message || 'Notification sent');
      setShowCompose(false);
      setForm({ type: 'promotion', title: '', message: '' });
      load(1);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to send notification');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Bell className="w-7 h-7 text-primary-500" />
          <h1 className="font-bold text-3xl">NOTIFICATIONS</h1>
        </div>
        <button onClick={() => setShowCompose(true)} className="btn-primary flex items-center gap-2">
          <Megaphone className="w-4 h-4" /> Send Broadcast
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-dark-800 text-left text-sm text-dark-400">
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Message</th>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((notification) => (
                <tr key={notification.id} className="border-b border-dark-800/50 hover:bg-dark-800/30">
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${typeColors[notification.type] || ''}`}>
                      {notification.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium">{notification.title}</td>
                  <td className="py-3 px-4 text-sm text-dark-300 max-w-[300px] truncate">{notification.message}</td>
                  <td className="py-3 px-4">
                    <p className="text-sm">{notification.customer?.first_name} {notification.customer?.last_name}</p>
                    <p className="text-xs text-dark-400">{notification.customer?.email}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      notification.is_read ? 'bg-dark-700 text-dark-200' : 'bg-green-500/20 text-green-400'
                    }`}>
                      {notification.is_read ? 'Read' : 'Unread'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-dark-400">
                    {new Date(notification.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
              {notifications.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-dark-400">No notifications yet</td>
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

      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowCompose(false)} />
          <div className="relative card w-full max-w-lg bg-dark-900">
            <h2 className="font-semibold text-xl mb-6">Send Broadcast Notification</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-dark-400 mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="input"
                >
                  {types.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-1">Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="input"
                  placeholder="Flash Sale"
                />
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-1">Message</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="input min-h-[90px]"
                  placeholder="Up to 50% off this weekend!"
                />
              </div>
              <p className="text-xs text-dark-500">This will be delivered to all active customers.</p>
            </div>
            <div className="flex gap-4 mt-6 justify-end">
              <button onClick={() => setShowCompose(false)} className="btn-secondary">Cancel</button>
              <button onClick={broadcast} disabled={saving || !form.title.trim() || !form.message.trim()} className="btn-primary flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Broadcast
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}