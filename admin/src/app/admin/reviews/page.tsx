'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { api } from '@/lib/api';
import { Loader2, Star, Trash2, ShieldCheck, ShieldX } from 'lucide-react';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState<number | ''>('');
  const [verified, setVerified] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = async (pageNum = 1) => {
    setLoading(true);
    try {
      const params: any = { page: pageNum, limit: 20 };
      if (rating !== '') params.rating = rating;
      if (verified !== '') params.verified = verified === 'true';
      const response = await api.get('/api/v1/admin/reviews', { params });
      setReviews(response.data.data || []);
      setTotalPages(response.data.meta?.total_pages || 1);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page);
  }, [page, rating, verified]);

  const toggleVerified = async (review: any) => {
    try {
      await api.patch(`/api/v1/admin/reviews/${review.id}`, { is_verified: !review.is_verified });
      load(page);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update review');
    }
  };

  const handleDelete = async (review: any) => {
    if (!confirm(`Delete review by ${review.customer?.first_name}?`)) return;
    try {
      await api.delete(`/api/v1/admin/reviews/${review.id}`);
      load(page);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete review');
    }
  };

  const Stars = ({ value }: { value: number }) => (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`w-3 h-3 ${n <= value ? 'fill-primary-500 text-primary-500' : 'text-dark-700'}`} />
      ))}
    </div>
  );

  return (
    <AdminLayout>
      <h1 className="font-bold text-3xl mb-8">REVIEWS</h1>

      <div className="card mb-6 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <span className="text-sm text-dark-400 mr-2">Rating:</span>
            {['', '1', '2', '3', '4', '5'].map((r) => (
              <button
                key={r}
                onClick={() => { setRating(r === '' ? '' : Number(r)); setPage(1); }}
                className={`px-3 py-1 rounded-lg border text-sm mr-1 transition-colors ${
                  (rating === '' && r === '') || rating === Number(r)
                    ? 'bg-primary-500 text-dark-950 border-primary-500'
                    : 'border-dark-700'
                }`}
              >
                {r === '' ? 'All' : r}
              </button>
            ))}
          </div>
          <div>
            <span className="text-sm text-dark-400 mr-2">Verified:</span>
            {[
              { label: 'All', value: '' },
              { label: 'Verified', value: 'true' },
              { label: 'Unverified', value: 'false' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setVerified(opt.value); setPage(1); }}
                className={`px-3 py-1 rounded-lg border text-sm mr-1 transition-colors ${
                  verified === opt.value ? 'bg-primary-500 text-dark-950 border-primary-500' : 'border-dark-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
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
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4">Comment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.id} className="border-b border-dark-800/50 hover:bg-dark-800/30">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-dark-800 overflow-hidden flex-shrink-0">
                        {review.product_image ? (
                          <img src={review.product_image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">🛍️</div>
                        )}
                      </div>
                      <p className="font-medium text-sm max-w-[180px] truncate">{review.product_name}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm">{review.customer?.first_name} {review.customer?.last_name}</p>
                    <p className="text-xs text-dark-400">{review.customer?.email}</p>
                  </td>
                  <td className="py-3 px-4"><Stars value={review.rating} /></td>
                  <td className="py-3 px-4">
                    <p className="text-sm font-medium">{review.title}</p>
                    <p className="text-xs text-dark-400 max-w-[240px] truncate">{review.comment}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      review.is_verified ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {review.is_verified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-dark-400">
                    {new Date(review.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleVerified(review)}
                        className="p-2 rounded-lg border border-dark-700 hover:border-primary-500 transition-colors"
                        aria-label="Toggle verified"
                        title={review.is_verified ? 'Unverify' : 'Verify'}
                      >
                        {review.is_verified ? <ShieldX className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(review)}
                        className="p-2 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors"
                        aria-label="Delete review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {reviews.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-dark-400">No reviews found</td>
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
    </AdminLayout>
  );
}