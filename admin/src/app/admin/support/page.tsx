'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { api } from '@/lib/api';
import { Loader2, LifeBuoy, Eye, Send } from 'lucide-react';

const statusColors: Record<string, string> = {
  open: 'bg-yellow-500/20 text-yellow-400',
  in_progress: 'bg-blue-500/20 text-blue-400',
  on_hold: 'bg-orange-500/20 text-orange-400',
  resolved: 'bg-green-500/20 text-green-400',
  closed: 'bg-dark-700 text-dark-200',
};

const priorityColors: Record<string, string> = {
  low: 'bg-dark-700 text-dark-200',
  medium: 'bg-yellow-500/20 text-yellow-400',
  high: 'bg-orange-500/20 text-orange-400',
  urgent: 'bg-red-500/20 text-red-400',
};

const statuses = ['open', 'in_progress', 'on_hold', 'resolved', 'closed'];
const priorities = ['low', 'medium', 'high', 'urgent'];

export default function SupportPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [reply, setReply] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async (pageNum = 1) => {
    setLoading(true);
    try {
      const params: any = { page: pageNum, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const response = await api.get('/api/v1/admin/support-requests', { params });
      setRequests(response.data.data || []);
      setTotalPages(response.data.meta?.total_pages || 1);
    } catch (error) {
      console.error('Failed to load support requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page);
  }, [page, statusFilter]);

  const openDetail = async (id: string) => {
    setLoadingDetail(true);
    setSelected(null);
    try {
      const response = await api.get(`/api/v1/admin/support-requests/${id}`);
      setSelected(response.data.data);
      setReply('');
    } catch (error) {
      console.error('Failed to load support request:', error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const updateRequest = async (body: any) => {
    try {
      await api.patch(`/api/v1/admin/support-requests/${selected.request.id}`, body);
      openDetail(selected.request.id);
      load(page);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update request');
    }
  };

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSaving(true);
    try {
      await api.post(`/api/v1/admin/support-requests/${selected.request.id}/messages`, {
        message: reply.trim(),
        is_internal: isInternal,
      });
      setReply('');
      setIsInternal(false);
      openDetail(selected.request.id);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to send message');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center gap-3 mb-6">
        <LifeBuoy className="w-7 h-7 text-primary-500" />
        <h1 className="font-bold text-3xl">SUPPORT</h1>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto">
        <button
          onClick={() => { setStatusFilter(''); setPage(1); }}
          className={`px-4 py-2 rounded-lg border whitespace-nowrap transition-colors ${
            !statusFilter ? 'bg-primary-500 text-dark-950 border-primary-500' : 'border-dark-700'
          }`}
        >
          All
        </button>
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => { setStatusFilter(status === statusFilter ? '' : status); setPage(1); }}
            className={`px-4 py-2 rounded-lg border whitespace-nowrap transition-colors ${
              statusFilter === status ? 'bg-primary-500 text-dark-950 border-primary-500' : 'border-dark-700'
            }`}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-dark-800 text-left text-sm text-dark-400">
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Messages</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id} className="border-b border-dark-800/50 hover:bg-dark-800/30">
                  <td className="py-3 px-4 font-medium">{req.subject}</td>
                  <td className="py-3 px-4">
                    <p className="text-sm">{req.customer?.first_name} {req.customer?.last_name}</p>
                    <p className="text-xs text-dark-400">{req.customer?.email}</p>
                  </td>
                  <td className="py-3 px-4 text-sm">{req.category}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${priorityColors[req.priority] || ''}`}>
                      {req.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${statusColors[req.status] || ''}`}>
                      {req.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">{req.messages_count}</td>
                  <td className="py-3 px-4 text-sm text-dark-400">
                    {new Date(req.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => openDetail(req.id)}
                      className="btn-secondary text-xs px-3 py-1 flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> View
                    </button>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-dark-400">No support requests found</td>
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

      {loadingDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" />
          <Loader2 className="relative w-8 h-8 text-primary-500 animate-spin" />
        </div>
      )}

      {selected && !loadingDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSelected(null)} />
          <div className="relative card w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-dark-900">
            <h2 className="font-semibold text-xl mb-1">{selected.request.subject}</h2>
            <p className="text-sm text-dark-400 mb-4">
              {selected.request.customer?.first_name} {selected.request.customer?.last_name} · {selected.request.category}
            </p>

            <div className="flex flex-wrap gap-3 mb-6">
              <select
                value={selected.request.status}
                onChange={(e) => updateRequest({ status: e.target.value })}
                className="input w-auto"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
              <select
                value={selected.request.priority}
                onChange={(e) => updateRequest({ priority: e.target.value })}
                className="input w-auto"
              >
                {priorities.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <span className={`px-3 py-2 rounded-full text-xs self-center ${statusColors[selected.request.status] || ''}`}>
                {selected.request.status.replace('_', ' ')}
              </span>
            </div>

            <div className="space-y-3 mb-6 max-h-72 overflow-y-auto pr-1">
              {(selected.messages || []).map((msg: any) => (
                <div
                  key={msg.id}
                  className={`border rounded-lg p-3 ${
                    msg.is_internal
                      ? 'border-yellow-500/40 bg-yellow-500/10'
                      : msg.is_admin
                      ? 'border-primary-500/40 bg-primary-500/10'
                      : 'border-dark-800'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold">{msg.sender_name}</span>
                    {msg.is_admin && <span className="text-xs text-primary-500">Admin</span>}
                    {msg.is_internal && <span className="text-xs text-yellow-400">Internal</span>}
                    <span className="text-xs text-dark-400 ml-auto">{new Date(msg.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm">{msg.message}</p>
                </div>
              ))}
              {(selected.messages || []).length === 0 && (
                <p className="text-sm text-dark-400">No messages yet.</p>
              )}
            </div>

            <div className="flex gap-2 items-start">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                className="input flex-1 min-h-[70px]"
                placeholder="Type a reply..."
              />
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-xs text-dark-400 mr-auto">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="accent-primary-500"
                  />
                  Internal note
                </label>
                <button
                  onClick={sendReply}
                  disabled={saving || !reply.trim()}
                  className="btn-primary flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Send className="w-4 h-4" /> Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}