'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { api } from '@/lib/api';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';

const emptyForm = {
  code: '',
  discount_type: 'percentage',
  discount_value: '',
  minimum_order_amount: '',
  maximum_discount_amount: '',
  usage_limit: '',
  user_usage_limit: '',
  description: '',
  end_date: '',
  is_active: true,
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const loadCoupons = async () => {
    try {
      const response = await api.get('/api/v1/admin/coupons');
      setCoupons(response.data.data || []);
    } catch (error) {
      console.error('Failed to load coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setShowForm(true);
  };

  const openEdit = (coupon: any) => {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: String(coupon.discount_value ?? ''),
      minimum_order_amount: coupon.minimum_order_amount ? String(coupon.minimum_order_amount) : '',
      maximum_discount_amount: coupon.maximum_discount_amount ? String(coupon.maximum_discount_amount) : '',
      usage_limit: coupon.usage_limit ? String(coupon.usage_limit) : '',
      user_usage_limit: coupon.user_usage_limit ? String(coupon.user_usage_limit) : '',
      description: coupon.description || '',
      end_date: coupon.end_date ? coupon.end_date.slice(0, 10) : '',
      is_active: coupon.is_active,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      code: form.code,
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value) || 0,
      is_active: form.is_active,
    };
    if (form.minimum_order_amount) payload.minimum_order_amount = parseFloat(form.minimum_order_amount);
    if (form.maximum_discount_amount) payload.maximum_discount_amount = parseFloat(form.maximum_discount_amount);
    if (form.usage_limit) payload.usage_limit = parseInt(form.usage_limit);
    if (form.user_usage_limit) payload.user_usage_limit = parseInt(form.user_usage_limit);
    if (form.description) payload.description = form.description;
    if (form.end_date) payload.end_date = new Date(form.end_date).toISOString();
    try {
      if (editing) {
        await api.patch(`/api/v1/admin/coupons/${editing.id}`, payload);
      } else {
        await api.post('/api/v1/admin/coupons', payload);
      }
      setShowForm(false);
      loadCoupons();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save coupon');
    }
  };

  const handleDelete = async (coupon: any) => {
    if (!confirm(`Delete coupon "${coupon.code}"?`)) return;
    try {
      await api.delete(`/api/v1/admin/coupons/${coupon.id}`);
      loadCoupons();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete coupon');
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-bold text-3xl">COUPONS</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Coupon
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
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Discount</th>
                <th className="py-3 px-4">Usage</th>
                <th className="py-3 px-4">Expires</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon: any) => (
                <tr key={coupon.id} className="border-b border-dark-800/50 hover:bg-dark-800/30">
                  <td className="py-3 px-4 font-semibold text-primary-500">{coupon.code}</td>
                  <td className="py-3 px-4">
                    {coupon.discount_type === 'percentage'
                      ? `${coupon.discount_value}%`
                      : `₦${Number(coupon.discount_value).toLocaleString()}`}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {coupon.usage_count}
                    {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ''}
                  </td>
                  <td className="py-3 px-4 text-sm text-dark-400">
                    {coupon.end_date ? new Date(coupon.end_date).toLocaleDateString() : 'No expiry'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      coupon.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {coupon.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(coupon)}
                        className="p-2 rounded-lg border border-dark-700 hover:border-primary-500 transition-colors"
                        aria-label="Edit coupon"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(coupon)}
                        className="p-2 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors"
                        aria-label="Delete coupon"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-dark-400">
                    No coupons yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowForm(false)} />
          <div className="relative card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="font-bold text-xl mb-4">
              {editing ? 'Edit Coupon' : 'Add Coupon'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-dark-400 mb-1">Coupon Code</label>
                  <input
                    type="text"
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="input"
                    placeholder="SAVE20"
                  />
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-1">Discount Type</label>
                  <select
                    value={form.discount_type}
                    onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
                    className="input"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-dark-400 mb-1">Discount Value</label>
                  <input
                    type="number"
                    required
                    value={form.discount_value}
                    onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                    className="input"
                    placeholder={form.discount_type === 'percentage' ? '20' : '500'}
                  />
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-1">Min Order Amount</label>
                  <input
                    type="number"
                    value={form.minimum_order_amount}
                    onChange={(e) => setForm({ ...form, minimum_order_amount: e.target.value })}
                    className="input"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-dark-400 mb-1">Max Discount Amount</label>
                  <input
                    type="number"
                    value={form.maximum_discount_amount}
                    onChange={(e) => setForm({ ...form, maximum_discount_amount: e.target.value })}
                    className="input"
                    placeholder="10000"
                  />
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-1">Usage Limit</label>
                  <input
                    type="number"
                    value={form.usage_limit}
                    onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
                    className="input"
                    placeholder="100"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-dark-400 mb-1">Per-User Limit</label>
                  <input
                    type="number"
                    value={form.user_usage_limit}
                    onChange={(e) => setForm({ ...form, user_usage_limit: e.target.value })}
                    className="input"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-1">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input"
                  placeholder="Coupon description"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="accent-primary-500"
                />
                Active
              </label>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
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