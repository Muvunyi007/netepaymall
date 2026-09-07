'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { api } from '@/lib/api';
import { Loader2, ShieldAlert } from 'lucide-react';

const resultColors: Record<string, string> = {
  success: 'bg-green-500/20 text-green-400',
  failure: 'bg-red-500/20 text-red-400',
  denied: 'bg-yellow-500/20 text-yellow-400',
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const loadLogs = async (pageNum = 1) => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/admin/audit-logs', { params: { page: pageNum, limit: 20 } });
      setLogs(response.data.data || []);
      setTotalPages(response.data.meta?.total_pages || 1);
      setTotal(response.data.meta?.total || 0);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(page);
  }, [page]);

  return (
    <AdminLayout>
      <div className="flex items-center gap-3 mb-8">
        <ShieldAlert className="w-7 h-7 text-primary-500" />
        <h1 className="font-bold text-3xl">AUDIT LOGS</h1>
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
                <th className="py-3 px-4">Admin</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Result</th>
                <th className="py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log: any) => (
                <tr key={log.id} className="border-b border-dark-800/50 hover:bg-dark-800/30">
                  <td className="py-3 px-4 text-sm font-medium">{log.admin_id?.slice(0, 8) || '—'}...</td>
                  <td className="py-3 px-4">
                    <span className="text-primary-500">{log.action}</span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {log.entity}
                    {log.entity_id && <span className="text-dark-400"> · {String(log.entity_id).slice(0, 8)}...</span>}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${resultColors[log.result] || 'bg-dark-700 text-dark-200'}`}>
                      {log.result}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-dark-400">
                    {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-dark-400">
                    No audit logs yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t border-dark-800">
              <p className="text-sm text-dark-400">Total: {total} entries</p>
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