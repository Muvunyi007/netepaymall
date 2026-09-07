'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { SupportWidget } from '@/components/SupportWidget';
import { api } from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'react-hot-toast';
import { Loader2, MapPin, Truck, CreditCard, CheckCircle, Phone, MessageCircle } from 'lucide-react';

export default function CheckoutPage() {
  const { items, subtotal, discount, tax, clearCart } = useCartStore();
  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [selectedDeliveryFee, setSelectedDeliveryFee] = useState(1500);
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState('standard');
  const [newAddress, setNewAddress] = useState({
    label: 'Home',
    first_name: '',
    last_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    is_default: true,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState<any>(null);

  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const response = await api.get('/api/v1/users/me/addresses');
        setAddresses(response);
        if (response.length > 0) {
          setSelectedAddress(response[0].id);
        }
      } catch (error) {
        console.error('Failed to load addresses:', error);
      }
    };

    loadAddresses();
  }, []);

  const handleSaveAddress = async () => {
    setIsProcessing(true);
    try {
      const response = await api.post('/api/v1/users/me/addresses', newAddress);
      setAddresses([...addresses, response]);
      setSelectedAddress(response.id);
      toast.success('Address saved successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save address');
    } finally {
      setIsProcessing(false);
    }
  };

  const deliveryTotal = subtotal - discount + selectedDeliveryFee + tax;

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error('Please select a delivery address');
      return;
    }

    setIsProcessing(true);
    try {
      const order = await api.post('/api/v1/orders', {
        delivery_address_id: selectedAddress,
        coupon_code: null,
        delivery_fee: selectedDeliveryFee,
        delivery_method: selectedDeliveryMethod,
      });

      const payment = await api.post('/api/v1/payments/create', {
        order_id: order.data.id,
        provider: paymentMethod,
        idempotency_key: `order-${order.data.id}`,
      });

      await api.post(`/api/v1/payments/${payment.data.id}/verify`);

      await clearCart();
      setOrderComplete(order.data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.success('Order placed successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setIsProcessing(false);
    }
  };

  if (orderComplete) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-32 pb-16 bg-black">
          <div className="mx-auto max-w-2xl px-4 text-center">
            <div className="card p-12">
              <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6" />
              <h1 className="font-display font-bold text-4xl mb-4">
                ORDER <span className="text-primary-500">CONFIRMED!</span>
              </h1>
              <p className="text-xl text-dark-300 mb-8">
                Thank you for your purchase!
              </p>
              <div className="bg-dark-800 rounded-lg p-4 mb-8">
                <p className="text-sm text-dark-400 mb-1">Order Number</p>
                <p className="text-2xl font-bold text-primary-500">{orderComplete.order_number}</p>
                <p className="text-sm text-dark-400 mt-2">Total: ₦{Number(orderComplete.total).toLocaleString()}</p>
              </div>
              <p className="text-dark-300 mb-8">
                You will receive a confirmation notification shortly.
                Track your order to see delivery status.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/account/orders" className="btn-primary">Track Order</a>
                <a href="/shop" className="btn-secondary">Continue Shopping</a>
              </div>
            </div>
          </div>
        </main>
        <SupportWidget />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-display font-bold text-4xl mb-8 mt-8">
            CHECK<span className="text-primary-500">OUT</span>
          </h1>

          <div className="flex items-center gap-2 mb-8">
            {[
              { num: 1, label: 'Address', icon: MapPin },
              { num: 2, label: 'Delivery', icon: Truck },
              { num: 3, label: 'Payment', icon: CreditCard },
              { num: 4, label: 'Review', icon: CheckCircle },
            ].map((s, index) => (
              <div key={s.num} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-2 ${
                    step >= s.num ? 'text-primary-500' : 'text-dark-500'
                  }`}
                >
                  <s.icon className="w-4 h-4" />
                  <span className="text-sm hidden sm:block">{s.label}</span>
                </div>
                {index < 3 && <div className="w-8 h-px bg-dark-700" />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="card p-8">
              <h2 className="font-display font-bold text-2xl mb-6">Delivery Address</h2>

              {addresses.length > 0 && (
                <div className="grid md:grid-cols-2 gap-4 mb-8">
                  {addresses.map((addr: any) => (
                    <button
                      key={addr.id}
                      onClick={() => setSelectedAddress(addr.id)}
                      className={`text-left p-4 rounded-lg border transition-colors ${
                        selectedAddress === addr.id
                          ? 'border-primary-500 bg-primary-500/10'
                          : 'border-dark-700 hover:border-dark-500'
                      }`}
                    >
                      <p className="font-semibold mb-1">{addr.label}</p>
                      <p className="text-sm text-dark-300">{addr.first_name} {addr.last_name}</p>
                      <p className="text-sm text-dark-400">{addr.address_line1}</p>
                      <p className="text-sm text-dark-400">{addr.city}, {addr.state}</p>
                      <p className="text-sm text-dark-400">{addr.phone}</p>
                    </button>
                  ))}
                </div>
              )}

              <h3 className="font-semibold mb-4">Or Add a New Address</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-dark-400 mb-1">First Name</label>
                  <input
                    type="text"
                    value={newAddress.first_name}
                    onChange={(e) => setNewAddress({ ...newAddress, first_name: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={newAddress.last_name}
                    onChange={(e) => setNewAddress({ ...newAddress, last_name: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-1">Address Line 1</label>
                  <input
                    type="text"
                    value={newAddress.address_line1}
                    onChange={(e) => setNewAddress({ ...newAddress, address_line1: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-1">Address Line 2 (Optional)</label>
                  <input
                    type="text"
                    value={newAddress.address_line2}
                    onChange={(e) => setNewAddress({ ...newAddress, address_line2: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-1">City</label>
                  <input
                    type="text"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-1">State</label>
                  <input
                    type="text"
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-1">Postal Code</label>
                  <input
                    type="text"
                    value={newAddress.postal_code}
                    onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={handleSaveAddress}
                  disabled={isProcessing}
                  className="btn-secondary"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Address'}
                </button>
                <button
                  onClick={() => {
                    if (selectedAddress) {
                      setStep(2);
                    } else {
                      toast.error('Please add a delivery address');
                    }
                  }}
                  className="btn-primary flex-1"
                >
                  Continue to Delivery
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="card p-8">
              <h2 className="font-display font-bold text-2xl mb-6">Delivery Options</h2>
              {[
                {
                  id: 'standard',
                  name: 'Standard Delivery',
                  fee: 1500,
                  eta: '3-5 business days',
                },
                {
                  id: 'express',
                  name: 'Express Delivery',
                  fee: 3500,
                  eta: '1-2 business days',
                },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    setSelectedDeliveryFee(option.fee);
                    setSelectedDeliveryMethod(option.id);
                  }}
                  className="w-full p-4 rounded-lg border mb-4 text-left transition-colors"
                  style={{ borderColor: selectedDeliveryFee === option.fee ? '#FFD600' : '#27272a' }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{option.name}</p>
                      <p className="text-sm text-dark-400">{option.eta}</p>
                    </div>
                    <p className="font-bold">₦{option.fee.toLocaleString()}</p>
                  </div>
                </button>
              ))}
              <div className="flex gap-4 mt-8">
                <button onClick={() => setStep(1)} className="btn-secondary">Back</button>
                <button onClick={() => setStep(3)} className="btn-primary flex-1">Continue to Payment</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="card p-8">
              <h2 className="font-display font-bold text-2xl mb-6">Payment Method</h2>

              <div className="grid gap-4 mb-8">
                {[
                  { id: 'card', name: 'Card Payment', desc: 'Visa, Mastercard, Verve' },
                  { id: 'mobile_money', name: 'Mobile Money', desc: 'MTN MoMo, Airtel Money' },
                  { id: 'bank', name: 'Bank Transfer', desc: 'Direct bank transfer' },
                  { id: 'wallet', name: 'Wallet', desc: 'Store credit' },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-4 rounded-lg border transition-colors ${
                      paymentMethod === method.id
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-dark-700 hover:border-dark-500'
                    }`}
                  >
                    <b className="font-semibold">{method.name}</b>
                    <p className="text-sm text-dark-400">{method.desc}</p>
                  </button>
                ))}
              </div>

              {paymentMethod === 'card' && (
                <div className="grid md:grid-cols-2 gap-4 mb-8">
                  <div className="md:col-span-2">
                    <label className="block text-sm text-dark-400 mb-1">Card Number</label>
                    <input type="text" className="input" placeholder="4242 4242 4242 4242" />
                  </div>
                  <div>
                    <label className="block text-sm text-dark-400 mb-1">Expiry</label>
                    <input type="text" className="input" placeholder="MM/YY" />
                  </div>
                  <div>
                    <label className="block text-sm text-dark-400 mb-1">CVV</label>
                    <input type="password" className="input" placeholder="•••" />
                  </div>
                </div>
              )}

              <div className="card p-4 mb-6 bg-dark-950">
                <h3 className="font-semibold mb-3">Order Summary</h3>
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm mb-2">
                    <span className="text-dark-300">{item.product.name} × {item.quantity}</span>
                    <span>₦{Number(item.product.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t border-dark-800 mt-3 pt-3 space-y-2">
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
                    <span>₦{selectedDeliveryFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-dark-300">
                    <span>Tax</span>
                    <span>₦{tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary-500">₦{deliveryTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setStep(2)} className="btn-secondary">Back</button>
                <button
                  onClick={() => setStep(4)}
                  className="btn-primary flex-1"
                >
                  Review Order
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="card p-8">
              <h2 className="font-display font-bold text-2xl mb-6">Review Your Order</h2>

              <div className="card p-4 mb-6 bg-dark-950">
                <h3 className="font-semibold mb-2">Delivery Address</h3>
                {(() => {
                  const addr = addresses.find((a: any) => a.id === selectedAddress);
                  return addr ? (
                    <p className="text-sm text-dark-300">
                      {addr.first_name} {addr.last_name} · {addr.phone}<br />
                      {addr.address_line1}
                      {addr.address_line2 ? `, ${addr.address_line2}` : ''}<br />
                      {addr.city}, {addr.state} {addr.postal_code}
                    </p>
                  ) : (
                    <p className="text-sm text-dark-500">No address selected</p>
                  );
                })()}
              </div>

              <div className="card p-4 mb-6 bg-dark-950">
                <h3 className="font-semibold mb-3">Items</h3>
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm mb-2">
                    <span className="text-dark-300">{item.product.name} × {item.quantity}</span>
                    <span>₦{Number(item.product.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="card p-4 mb-6 bg-dark-950">
                <h3 className="font-semibold mb-3">Payment</h3>
                <p className="text-sm text-dark-300 capitalize">{paymentMethod.replace('_', ' ')}</p>
              </div>

              <div className="border-t border-dark-800 pt-4 space-y-2 mb-8">
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
                  <span>₦{selectedDeliveryFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-dark-300">
                  <span>Tax</span>
                  <span>₦{tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary-500">₦{deliveryTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setStep(3)} className="btn-secondary">Back</button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                  className="btn-primary flex-1"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                    </span>
                  ) : (
                    `Pay ₦${deliveryTotal.toLocaleString()}`
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <SupportWidget />
    </>
  );
}