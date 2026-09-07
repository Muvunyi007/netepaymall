'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { SupportWidget } from '@/components/SupportWidget';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { Loader2, Phone, MessageCircle, CheckCircle, Clock, Truck, Package, Check, XCircle } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  delivery_fee: number;
  tax: number;
  discount: number;
  total: number;
  created_at: string;
  confirmed_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  items: {
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    product_image?: string;
  }[];
}

const statusSteps = [
  { status: 'pending', label: 'Order Placed', icon: Package },
  { status: 'confirmed', label: 'Payment Confirmed', icon: CheckCircle },
  { status: 'processing', label: 'Processing', icon: Clock },
  { status: 'packed', label: 'Packed', icon: Package },
  { status: 'shipped', label: 'Shipped', icon: Truck },
  { status: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
  { status: 'delivered', label: 'Delivered', icon: CheckCircle },
];

export default function OrderDetailPage() {
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  const loadOrder = async () => {
    try {
      const response = await api.get(`/api/v1/orders/${params.id}`);
      setOrder(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load order');
    }
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await loadOrder();
      setIsLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleCancelOrder = async () => {
    if (!window.confirm(`Are you sure you want to cancel order ${order?.order_number}?`)) {
      return;
    }

    setIsCancelling(true);
    try {
      await api.post(`/api/v1/orders/${params.id}/cancel`);
      toast.success('Order cancelled successfully');
      await loadOrder();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setIsCancelling(false);
    }
  };

  const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+250XXXXXXXXX';
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '250XXXXXXXXX';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (!order) return null;

  const currentStepIndex = statusSteps.findIndex((s) => s.status === order.status);

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8 mt-8">
            <div>
              <h1 className="font-display font-bold text-3xl">
                ORDER <span className="text-primary-500">{order.order_number}</span>
              </h1>
              <p className="text-dark-400 mt-1">
                Placed on {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>
            <span className="inline-block px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500 text-primary-500 font-semibold">
              {order.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          {(order.status === 'pending' || order.status === 'confirmed') && (
            <button
              onClick={handleCancelOrder}
              disabled={isCancelling}
              className="btn-ghost border border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-lg px-4 py-2 mb-8 flex items-center gap-2 disabled:opacity-50"
            >
              {isCancelling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              Cancel Order
            </button>
          )}

          <div className="card p-8 mb-8">
            <h2 className="font-display font-bold text-xl mb-6">Order Progress</h2>
            <div className="flex flex-wrap items-center gap-0">
              {statusSteps.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                return (
                  <div key={step.status} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                          isCompleted
                            ? 'bg-primary-500 text-dark-950'
                            : 'bg-dark-800 text-dark-400'
                        } ${isCurrent ? 'glow' : ''}`}
                      >
                        {isCompleted && index < currentStepIndex ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <step.icon className="w-5 h-5" />
                        )}
                      </div>
                      <span className={`text-xs text-center max-w-[80px] ${isCompleted ? 'text-primary-500' : 'text-dark-400'}`}>
                        {step.label}
                      </span>
                    </div>
                    {index < statusSteps.length - 1 && (
                      <div
                        className={`w-12 h-0.5 mx-2 mb-7 ${
                          index < currentStepIndex ? 'bg-primary-500' : 'bg-dark-800'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="card p-6">
              <h3 className="font-semibold mb-4">Items</h3>
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 py-3 border-b border-dark-800 last:border-0">
                  <div className="w-16 h-16 rounded-lg bg-dark-800 overflow-hidden flex-shrink-0">
                    {item.product_image ? (
                      <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🛍️</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.product_name}</p>
                    <p className="text-sm text-dark-400">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold">₦{Number(item.total_price).toLocaleString()}</p>
                </div>
              ))}
            </div>

            <div className="card p-6">
              <h3 className="font-semibold mb-4">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-dark-300">
                  <span>Subtotal</span>
                  <span>₦{Number(order.subtotal).toLocaleString()}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount</span>
                    <span>-₦{Number(order.discount).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-dark-300">
                  <span>Delivery</span>
                  <span>₦{Number(order.delivery_fee).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-dark-300">
                  <span>Tax</span>
                  <span>₦{Number(order.tax).toLocaleString()}</span>
                </div>
                <div className="border-t border-dark-800 pt-2 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary-500">₦{Number(order.total).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6 mb-8">
            <h3 className="font-semibold mb-4">Need Help With This Order?</h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={`tel:${supportPhone}`}
                className="btn-secondary flex items-center justify-center gap-2 flex-1"
              >
                <Phone className="w-5 h-5" /> Call Support
              </a>
              <a
                href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                  `Hello, I need help with my order ${order.order_number}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary flex items-center justify-center gap-2 flex-1"
              >
                <MessageCircle className="w-5 h-5" /> WhatsApp Support
              </a>
            </div>
          </div>
        </div>
      </main>
      <SupportWidget />
    </>
  );
}