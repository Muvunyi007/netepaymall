'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { api } from '@/lib/api';
import { Loader2, Search, Mail, Phone } from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const loadCustomers = async (pageNum = 1, query = '') => {
    setLoading(true);
    try {
      const params: any = { page: pageNum, limit: 20 };
      if (query) params.search = query;
      const response = await api.get('/api/v1/admin/users', { params });
      setCustomers(response.data.data || []);
      setTotalPages(response.data.meta?.total_pages || 1);
      setTotal(response.data.meta?.total || 0);
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers(page, search);
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadCustomers(1, search);
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="font-bold text-3xl">CUSTOMERS</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 w-64"
              placeholder="Search customers..."
            />
          </div>
          <button type="submit" className="btn-primary">Search</button>
        </form>
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
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Orders</th>
                <th className="py-3 px-4">Total Spent</th>
                <th className="py-3 px-4">Joined</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer: any) => (
                <tr key={customer.id} className="border-b border-dark-800/50 hover:bg-dark-800/30">
                  <td className="py-3 px-4">
                    <p className="font-medium text-primary-500">
                      {customer.first_name} {customer.last_name}
                    </p>
                    <p className="text-xs text-dark-400">{customer.email}</p>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {customer.phone && (
                      <span className="flex items-center gap-2 text-dark-400">
                        <Phone className="w-3 h-3" /> {customer.phone}
                      </span>
                    )}
                    <span className={`flex items-center gap-1 text-xs mt-1 ${
                      customer.is_verified ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      <Mail className="w-3 h-3" />
                      {customer.is_verified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td className="py-3 px-4">{customer.total_orders}</td>
                  <td className="py-3 px-4 font-semibold">₦{Number(customer.total_spent).toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm text-dark-400">
                    {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-dark-400">
                    No customers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t border-dark-800">
              <p className="text-sm text-dark-400">Total: {total} customers</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="btn-secondary disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="px-3 py-2 text-sm text-dark-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="btn-secondary disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}