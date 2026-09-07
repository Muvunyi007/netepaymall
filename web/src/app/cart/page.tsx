'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { SupportWidget } from '@/components/SupportWidget';
import { api } from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import { Loader2, Tag, Trash2, Minus, Plus, ShoppingCart } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function CartPage() {
  const {
    items,
    subtotal,
    discount,
    deliveryFee,
    tax,
    total,
    isLoading,
    updateItem,
    removeItem,
    clearCart,
    loadCart,
  } = useCartStore();

  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setApplyingCoupon(true);
    try {
      await api.post('/api/v1/cart/apply-coupon', { code: couponCode });
      await loadCart();
      toast.success('Coupon applied!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid coupon code');
    } finally {
      setApplyingCoupon(false);
    }
  };

  if (isLoading && items.length === 0) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center pt-20">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
        <SupportWidget />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-display font-bold text-4xl mb-8 mt-8">
            YOUR <span className="text-primary-500">CART</span>
          </h1>

          {items.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingCart className="w-16 h-16 text-primary-500 mx-auto mb-4" />
              <h2 className="font-display font-bold text-2xl mb-2">Your cart is empty</h2>
              <p className="text-dark-400 mb-8">Discover our amazing products</p>
              <a href="/shop" className="btn-primary">Start Shopping</a>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="card p-4 flex gap-4">
                    <div className="w-24 h-24 rounded-lg bg-dark-800 overflow-hidden flex-shrink-0">
                      {item.product.images?.[0]?.url ? (
                        <img
                          src={item.product.images[0].url}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-dark-600">
                          <span className="text-2xl">🛍️</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{item.product.name}</h3>
                      {item.variant && (
                        <p className="text-sm text-dark-400 mb-1">Variant: {item.variant.name}</p>
                      )}
                      <p className="text-primary-500 font-bold mb-2">
                        ₦{Number(item.product.price).toLocaleString()}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 border border-dark-700 rounded-lg px-2 py-1">
                          <button
                            onClick={() => updateItem(item.id, Math.max(1, item.quantity - 1))}
                            disabled={isLoading}
                            className="text-dark-400 hover:text-white disabled:opacity-50"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateItem(item.id, item.quantity + 1)}
                            disabled={isLoading}
                            className="text-dark-400 hover:text-white disabled:opacity-50"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          disabled={isLoading}
                          className="text-red-400 hover:text-red-300 disabled:opacity-50"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex justify-between pt-6">
                  <button
                    onClick={clearCart}
                    disabled={isLoading}
                    className="btn-ghost text-red-400 hover:text-red-300"
                  >
                    Clear Cart
                  </button>
                </div>
              </div>

              <div className="card p-6 h-fit sticky top-24">
                <h2 className="font-display font-bold text-2xl mb-6">Order Summary</h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-dark-300">
                    <span>Subtotal</span>
                    <span>₦{subtotal.toLocaleString()}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Discount</span>
                      <span>-₦{discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-dark-300">
                    <span>Delivery</span>
                    <span>₦{deliveryFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-dark-300">
                    <span>Tax</span>
                    <span>₦{tax.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-dark-800 pt-3 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary-500">₦{total.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex gap-2 mb-6">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Coupon code"
                    className="input"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={applyingCoupon}
                    className="btn-secondary whitespace-nowrap"
                  >
                    {applyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />} Apply
                  </button>
                </div>

                <a href="/checkout" className="btn-primary w-full flex items-center justify-center gap-2">
                  Proceed to Checkout
                </a>
              </div>
            </div>
          )}
        </div>
      </main>
      <SupportWidget />
    </>
  );
}