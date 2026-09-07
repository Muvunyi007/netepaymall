'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { api } from '@/lib/api';
import { Loader2, Eye, Wallet } from 'lucide-react';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  processing: 'bg-purple-500/20 text-purple-400',
  successful: 'bg-green-500/20 text-green-400',
  failed: 'bg-red-500/20 text-red-400',
  cancelled: 'bg-dark-700 text-dark-200',
  refunded: 'bg-blue-500/20 text-blue-400',
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<any>(null);

  const load = async (pageNum = 1) => {
    setLoading(true);
    try {
      const params: any = { page: pageNum, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const response = await api.get('/api/v1/admin/payments', { params });
      setPayments(response.data.data || []);
      setTotalPages(response.data.meta?.total_pages || 1);
    } catch (error) {
      console.error('Failed to load payments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page);
  }, [page, statusFilter]);

  const openDetail = async (id: string) => {
    try {
      const response = await api.get(`/api/v1/admin/payments/${id}`);
      setSelected(response.data.data);
    } catch (error) {
      console.error('Failed to load payment:', error);
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center gap-3 mb-6">
        <Wallet className="w-7 h-7 text-primary-500" />
        <h1 className="font-bold text-3xl">PAYMENTS</h1>
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
        {Object.keys(statusColors).map((status) => (
          <button
            key={status}
            onClick={() => { setStatusFilter(status === statusFilter ? '' : status); setPage(1); }}
            className={`px-4 py-2 rounded-lg border whitespace-nowrap transition-colors ${
              statusFilter === status ? 'bg-primary-500 text-dark-950 border-primary-500' : 'border-dark-700'
            }`}
          >
            {status}
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
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Order</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Provider</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b border-dark-800/50 hover:bg-dark-800/30">
                  <td className="py-3 px-4 font-mono text-primary-500 text-sm">{payment.reference}</td>
                  <td className="py-3 px-4 text-sm">{payment.order_number || '-'}</td>
                  <td className="py-3 px-4">
                    <p className="text-sm">{payment.customer?.first_name} {payment.customer?.last_name}</p>
                    <p className="text-xs text-dark-400">{payment.customer?.email}</p>
                  </td>
                  <td className="py-3 px-4 text-sm capitalize">{payment.provider}</td>
                  <td className="py-3 px-4 font-semibold">₦{Number(payment.amount).toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${statusColors[payment.status] || ''}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-dark-400">
                    {new Date(payment.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => openDetail(payment.id)}
                      className="btn-secondary text-xs px-3 py-1 flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> View
                    </button>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-dark-400">No payments found</td>
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

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSelected(null)} />
          <div className="relative card w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-dark-900">
            <h2 className="font-semibold text-xl mb-6">Payment {selected.reference}</h2>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-dark-400">Order</span><span>{selected.order_number}</span></div>
                <div className="flex justify-between"><span className="text-dark-400">Customer</span><span>{selected.customer?.first_name} {selected.customer?.last_name}</span></div>
                <div className="flex justify-between"><span className="text-dark-400">Amount</span><span className="font-bold text-primary-500">₦{Number(selected.amount).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-dark-400">Currency</span><span>{selected.currency}</span></div>
                <div className="flex justify-between"><span className="text-dark-400">Provider</span><span className="capitalize">{selected.provider}</span></div>
                <div className="flex justify-between"><span className="text-dark-400">Date</span><span>{new Date(selected.created_at).toLocaleString()}</span></div>
              </div>
              <div>
                <h3 className="text-sm text-dark-400 mb-3">Transactions</h3>
                <div className="space-y-2">
                  {(selected.transactions || []).length === 0 && (
                    <p className="text-sm text-dark-400">No transactions recorded.</p>
                  )}
                  {(selected.transactions || []).map((t: any) => (
                    <div key={t.id} className="border border-dark-800 rounded-lg p-3 text-sm">
                      <div className="flex justify-between">
                        <span className="capitalize text-primary-500">{t.type}</span>
                        <span className={`text-xs ${t.status === 'success' || t.status === 'successful' ? 'text-green-400' : 'text-dark-400'}`}>{t.status}</span>
                      </div>
                      <p className="text-xs text-dark-400 mt-1">₦{Number(t.amount).toLocaleString()} · {new Date(t.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <span className={`px-3 py-1 rounded-full text-xs ${statusColors[selected.status] || ''}`}>
                {selected.status}
              </span>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}