'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { api } from '@/lib/api';
import { Loader2, Truck, Pencil } from 'lucide-react';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  assigned: 'bg-blue-500/20 text-blue-400',
  picked_up: 'bg-purple-500/20 text-purple-400',
  in_transit: 'bg-cyan-500/20 text-cyan-400',
  out_for_delivery: 'bg-teal-500/20 text-teal-400',
  delivered: 'bg-green-500/20 text-green-400',
  failed: 'bg-red-500/20 text-red-400',
};

const statuses = ['pending', 'assigned', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed'];

export default function DeliveryPage() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const load = async (pageNum = 1) => {
    setLoading(true);
    try {
      const params: any = { page: pageNum, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const response = await api.get('/api/v1/admin/deliveries', { params });
      setDeliveries(response.data.data || []);
      setTotalPages(response.data.meta?.total_pages || 1);
    } catch (error) {
      console.error('Failed to load deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page);
  }, [page, statusFilter]);

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await api.patch(`/api/v1/admin/deliveries/${editing.order_id}`, {
        status: editing.status,
        courier_name: editing.courier_name || null,
        courier_phone: editing.courier_phone || null,
        tracking_number: editing.tracking_number || null,
        delivery_zone: editing.delivery_zone || null,
        notes: editing.notes || null,
        estimated_delivery: editing.estimated_delivery || null,
      });
      setEditing(null);
      load(page);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update delivery');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center gap-3 mb-6">
        <Truck className="w-7 h-7 text-primary-500" />
        <h1 className="font-bold text-3xl">DELIVERY</h1>
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
                <th className="py-3 px-4">Order</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Courier</th>
                <th className="py-3 px-4">Tracking</th>
                <th className="py-3 px-4">Est. Delivery</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((delivery) => (
                <tr key={delivery.id} className="border-b border-dark-800/50 hover:bg-dark-800/30">
                  <td className="py-3 px-4 font-medium text-primary-500">{delivery.order_number}</td>
                  <td className="py-3 px-4">
                    <p className="text-sm">{delivery.customer?.first_name} {delivery.customer?.last_name}</p>
                    <p className="text-xs text-dark-400">{delivery.customer?.email}</p>
                  </td>
                  <td className="py-3 px-4 font-semibold">₦{Number(delivery.order_total).toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${statusColors[delivery.status] || ''}`}>
                      {delivery.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {delivery.courier_name || '-'}
                    {delivery.courier_phone && <p className="text-xs text-dark-400">{delivery.courier_phone}</p>}
                  </td>
                  <td className="py-3 px-4 font-mono text-sm">{delivery.tracking_number || '-'}</td>
                  <td className="py-3 px-4 text-sm text-dark-400">
                    {delivery.estimated_delivery ? new Date(delivery.estimated_delivery).toLocaleDateString() : '-'}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => setEditing(delivery)}
                      className="p-2 rounded-lg border border-dark-700 hover:border-primary-500 transition-colors"
                      aria-label="Edit delivery"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {deliveries.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-dark-400">No deliveries found</td>
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

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setEditing(null)} />
          <div className="relative card w-full max-w-xl max-h-[90vh] overflow-y-auto bg-dark-900">
            <h2 className="font-semibold text-xl mb-1">Update Delivery</h2>
            <p className="text-sm text-dark-400 mb-6">Order {editing.order_number}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-dark-400 mb-1">Status</label>
                <select
                  value={editing.status}
                  onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                  className="input"
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-1">Delivery Zone</label>
                <input
                  value={editing.delivery_zone || ''}
                  onChange={(e) => setEditing({ ...editing, delivery_zone: e.target.value })}
                  className="input"
                  placeholder="Kigali"
                />
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-1">Courier Name</label>
                <input
                  value={editing.courier_name || ''}
                  onChange={(e) => setEditing({ ...editing, courier_name: e.target.value })}
                  className="input"
                  placeholder="FedEx"
                />
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-1">Courier Phone</label>
                <input
                  value={editing.courier_phone || ''}
                  onChange={(e) => setEditing({ ...editing, courier_phone: e.target.value })}
                  className="input"
                  placeholder="+250..."
                />
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-1">Tracking Number</label>
                <input
                  value={editing.tracking_number || ''}
                  onChange={(e) => setEditing({ ...editing, tracking_number: e.target.value })}
                  className="input"
                  placeholder="TRK-12345"
                />
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-1">Estimated Delivery</label>
                <input
                  type="date"
                  value={editing.estimated_delivery ? editing.estimated_delivery.slice(0, 10) : ''}
                  onChange={(e) => setEditing({ ...editing, estimated_delivery: e.target.value })}
                  className="input"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm text-dark-400 mb-1">Notes</label>
              <textarea
                value={editing.notes || ''}
                onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                className="input min-h-[70px]"
              />
            </div>
            <div className="flex gap-4 mt-6 justify-end">
              <button onClick={() => setEditing(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}