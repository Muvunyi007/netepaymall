'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { api } from '@/lib/api';
import { Loader2, Search, Pencil, AlertTriangle } from 'lucide-react';

const statusBadge: Record<string, string> = {
  in_stock: 'bg-green-500/20 text-green-400',
  low_stock: 'bg-yellow-500/20 text-yellow-400',
  out_of_stock: 'bg-red-500/20 text-red-400',
};

export default function InventoryPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const load = async (pageNum = 1) => {
    setLoading(true);
    try {
      const params: any = { page: pageNum, limit: 20 };
      if (search.trim()) params.search = search.trim();
      if (lowStockOnly) params.low_stock_only = true;
      const response = await api.get('/api/v1/admin/inventory', { params });
      setRows(response.data.data || []);
      setTotalPages(response.data.meta?.total_pages || 1);
      setTotal(response.data.meta?.total || 0);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page);
  }, [page, lowStockOnly]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load(1);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await api.patch(`/api/v1/admin/inventory/${editing.product_id}`, {
        quantity: Number(editing.quantity),
        reserved: Number(editing.reserved),
        low_stock_threshold: Number(editing.low_stock_threshold),
        track_inventory: editing.track_inventory,
        allow_backorder: editing.allow_backorder,
      });
      setEditing(null);
      load(page);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update inventory');
    } finally {
      setSaving(false);
    }
  };

  const stockSummary = {
    in_stock: rows.filter((r) => r.status === 'in_stock').length,
    out_of_stock: rows.filter((r) => r.status === 'out_of_stock' && r.quantity === 0).length,
  };

  return (
    <AdminLayout>
      <h1 className="font-bold text-3xl mb-8">INVENTORY</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <p className="text-sm text-dark-400">Total Items</p>
          <p className="text-2xl font-bold">{total}</p>
        </div>
        <div className="card">
          <p className="text-sm text-dark-400">Low on Stock</p>
          <p className="text-2xl font-bold text-yellow-400">{lowStockOnly ? rows.length : '—'}</p>
        </div>
        <div className="card">
          <p className="text-sm text-dark-400">Out of Stock</p>
          <p className="text-2xl font-bold text-red-400">{stockSummary.out_of_stock}</p>
        </div>
      </div>

      <div className="card mb-6 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9"
              placeholder="Search by product, SKU or brand..."
            />
          </form>
          <button
            onClick={() => setLowStockOnly((v) => !v)}
            className={`btn-secondary flex items-center gap-2 whitespace-nowrap ${
              lowStockOnly ? 'bg-yellow-500/10 border-yellow-500 text-yellow-400' : ''
            }`}
          >
            <AlertTriangle className="w-4 h-4" /> Low Stock Only
          </button>
        </div>
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
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Quantity</th>
                <th className="py-3 px-4">Available</th>
                <th className="py-3 px-4">Threshold</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.product_id} className="border-b border-dark-800/50 hover:bg-dark-800/30">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-dark-800 overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <img src={item.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-dark-400">{item.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm">{item.sku || '-'}</td>
                  <td className="py-3 px-4 font-semibold text-primary-500">₦{Number(item.price).toLocaleString()}</td>
                  <td className="py-3 px-4 font-bold">{item.quantity}</td>
                  <td className="py-3 px-4 text-sm">{item.available}</td>
                  <td className="py-3 px-4 text-sm">{item.low_stock_threshold}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${statusBadge[item.status] || ''}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => setEditing(item)}
                      className="p-2 rounded-lg border border-dark-700 hover:border-primary-500 transition-colors"
                      aria-label="Edit stock"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-dark-400">
                    No inventory found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t border-dark-800">
              <p className="text-sm text-dark-400">Total: {total} items</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="btn-secondary disabled:opacity-40">
                  Previous
                </button>
                <span className="px-3 py-2 text-sm text-dark-400">Page {page} of {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="btn-secondary disabled:opacity-40">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setEditing(null)} />
          <div className="relative card w-full max-w-lg bg-dark-900">
            <h2 className="font-semibold text-xl mb-1">Update Stock</h2>
            <p className="text-sm text-dark-400 mb-6">{editing.name}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-dark-400 mb-1">Quantity</label>
                <input
                  type="number"
                  value={editing.quantity}
                  onChange={(e) => setEditing({ ...editing, quantity: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-1">Reserved</label>
                <input
                  type="number"
                  value={editing.reserved}
                  onChange={(e) => setEditing({ ...editing, reserved: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-1">Low Stock Threshold</label>
                <input
                  type="number"
                  value={editing.low_stock_threshold}
                  onChange={(e) => setEditing({ ...editing, low_stock_threshold: e.target.value })}
                  className="input"
                />
              </div>
              <div className="flex items-end gap-4 pb-1">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editing.track_inventory}
                    onChange={(e) => setEditing({ ...editing, track_inventory: e.target.checked })}
                    className="accent-primary-500"
                  />
                  Track
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editing.allow_backorder}
                    onChange={(e) => setEditing({ ...editing, allow_backorder: e.target.checked })}
                    className="accent-primary-500"
                  />
                  Backorder
                </label>
              </div>
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