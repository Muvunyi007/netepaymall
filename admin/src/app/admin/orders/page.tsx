'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { api } from '@/lib/api';
import { Loader2, Phone, MessageCircle } from 'lucide-react';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  confirmed: 'bg-blue-500/20 text-blue-400',
  processing: 'bg-purple-500/20 text-purple-400',
  packed: 'bg-orange-500/20 text-orange-400',
  shipped: 'bg-cyan-500/20 text-cyan-400',
  out_for_delivery: 'bg-teal-500/20 text-teal-400',
  delivered: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-red-500/20 text-red-400',
};

const nextStatuses: Record<string, string> = {
  pending: 'confirmed',
  confirmed: 'processing',
  processing: 'packed',
  packed: 'shipped',
  shipped: 'out_for_delivery',
  out_for_delivery: 'delivered',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      const response = await api.get('/api/v1/admin/orders', { params });
      setOrders(response.data.data || []);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await api.patch(`/api/v1/admin/orders/${orderId}/status`, { status });
      loadOrders();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update order');
    }
  };

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '250XXXXXXXXX';

  return (
    <AdminLayout>
      <h1 className="font-bold text-3xl mb-8">ORDERS</h1>

      <div className="flex gap-2 mb-8 overflow-x-auto">
        <button
          onClick={() => setStatusFilter('')}
          className={`px-4 py-2 rounded-lg border whitespace-nowrap transition-colors ${
            !statusFilter ? 'bg-primary-500 text-dark-950 border-primary-500' : 'border-dark-700'
          }`}
        >
          All
        </button>
        {Object.keys(statusColors).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status === statusFilter ? '' : status)}
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
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order: any) => (
                <tr key={order.id} className="border-b border-dark-800/50 hover:bg-dark-800/30">
                  <td className="py-3 px-4 font-medium text-primary-500">{order.order_number}</td>
                  <td className="py-3 px-4">
                    <p className="text-sm">{order.user?.first_name} {order.user?.last_name}</p>
                    <p className="text-xs text-dark-400">{order.user?.email}</p>
                  </td>
                  <td className="py-3 px-4 font-semibold">₦{Number(order.total).toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${statusColors[order.status] || ''}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-dark-400">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="btn-secondary text-xs px-3 py-1"
                      >
                        View
                      </button>
                      {nextStatuses[order.status] && (
                        <button
                          onClick={() => updateStatus(order.id, nextStatuses[order.status])}
                          className="btn-primary text-xs px-3 py-1"
                        >
                          Next: {nextStatuses[order.status].replace('_', ' ')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSelectedOrder(null)} />
          <div className="relative card w-full max-w-3xl max-h-[80vh] overflow-y-auto bg-dark-900">
            <h2 className="font-semibold text-xl mb-6">Order {selectedOrder.order_number}</h2>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm text-dark-400 mb-3">Items</h3>
                {selectedOrder.items?.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-dark-800">
                    <div>
                      <p className="font-medium text-sm">{item.product_name}</p>
                      <p className="text-xs text-dark-400">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm">₦{Number(item.total_price).toLocaleString()}</p>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-sm text-dark-400 mb-3">Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-dark-400">Subtotal</span>
                    <span>₦{Number(selectedOrder.subtotal).toLocaleString()}</span>
                  </div>
                  {Number(selectedOrder.discount) > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Discount</span>
                      <span>-₦{Number(selectedOrder.discount).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-dark-400">Delivery</span>
                    <span>₦{Number(selectedOrder.delivery_fee).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-400">Tax</span>
                    <span>₦{Number(selectedOrder.tax).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-2 border-t border-dark-800">
                    <span>Total</span>
                    <span className="text-primary-500">₦{Number(selectedOrder.total).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={`tel:${process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+250XXXXXXXXX'}`}
                className="btn-secondary flex items-center justify-center gap-2 flex-1"
              >
                <Phone className="w-4 h-4" /> Call Customer
              </a>
              <a
                href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hello, regarding your order ${selectedOrder.order_number}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary flex items-center justify-center gap-2 flex-1"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp Customer
              </a>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}