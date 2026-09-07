'use client';

import { useEffect, useState, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { SupportWidget } from '@/components/SupportWidget';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'react-hot-toast';
import { Loader2, Plus, Trash2, CheckCircle } from 'lucide-react';

interface Address {
  id: string;
  label: string;
  first_name: string;
  last_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  is_default: boolean;
}

export default function AccountPage() {
  const { user, isAuthenticated, loadUser } = useAuthStore();
  const [tab, setTab] = useState('overview');
  const [orders, setOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '' });
  const [showAddAddress, setShowAddAddress] = useState(false);
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
    is_default: false,
  });
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    try {
      const [ordersRes, addressesRes, notificationsRes] = await Promise.all([
        api.get('/api/v1/orders'),
        api.get('/api/v1/users/me/addresses'),
        api.get('/api/v1/notifications'),
      ]);
      setOrders(ordersRes.data || []);
      setAddresses(addressesRes);
      setNotifications(notificationsRes.data || []);
    } catch (error) {
      console.error('Failed to load account data:', error);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone || '',
      });
    }
  }, [user]);

  if (!isAuthenticated && !isLoading) {
    window.location.href = '/login';
    return null;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'profile', label: 'Profile' },
    { id: 'orders', label: 'Orders' },
    { id: 'addresses', label: 'Addresses' },
    { id: 'notifications', label: 'Notifications' },
  ];

  const handleUpdateProfile = async () => {
    setSaving(true);
    try {
      await api.patch('/api/v1/users/me', profileForm);
      await loadUser();
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setSaving(true);
    try {
      await api.post('/api/v1/auth/change-password', passwordForm);
      toast.success('Password changed successfully');
      setPasswordForm({ current_password: '', new_password: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = async () => {
    setSaving(true);
    try {
      const response = await api.post('/api/v1/users/me/addresses', newAddress);
      setAddresses([...addresses, response]);
      toast.success('Address added');
      setShowAddAddress(false);
      setNewAddress({
        label: 'Home', first_name: '', last_name: '', phone: '',
        address_line1: '', address_line2: '', city: '', state: '',
        postal_code: '', is_default: false,
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add address');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await api.delete(`/api/v1/users/me/addresses/${addressId}`);
      setAddresses(addresses.filter((a) => a.id !== addressId));
      toast.success('Address deleted');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete address');
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await api.post('/api/v1/notifications/read-all');
      setNotifications(notifications.map((n: any) => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    } catch (error: any) {
      toast.error('Failed to update notifications');
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 mt-8">
            <div>
              <h1 className="font-display font-bold text-4xl">
                WELCOME, <span className="text-primary-500">{user.first_name.toUpperCase()}</span>
              </h1>
              <p className="text-dark-400 mt-2">{user.email}</p>
            </div>
            <button
              onClick={() => {
                useAuthStore.getState().logout();
                window.location.href = '/';
              }}
              className="btn-ghost text-red-400 hover:text-red-300"
            >
              Logout
            </button>
          </div>

          <div className="flex gap-2 mb-8 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-lg border transition-colors whitespace-nowrap ${
                  tab === t.id
                    ? 'bg-primary-500 text-dark-950 border-primary-500'
                    : 'border-dark-700 hover:border-primary-500'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <div className="grid md:grid-cols-3 gap-6">
              <a href="/account/orders" className="card p-6">
                <h3 className="font-bold text-2xl text-primary-500 mb-2">{orders.length}</h3>
                <p className="text-dark-300">Total Orders</p>
              </a>
              <div className="card p-6">
                <h3 className="font-bold text-2xl text-primary-500 mb-2">{addresses.length}</h3>
                <p className="text-dark-300">Saved Addresses</p>
              </div>
              <div className="card p-6">
                <h3 className="font-bold text-2xl text-primary-500 mb-2">
                  {notifications.filter((n: any) => !n.is_read).length}
                </h3>
                <p className="text-dark-300">Unread Notifications</p>
              </div>
            </div>
          )}

          {tab === 'profile' && (
            <div className="grid md:grid-cols-2 gap-8">
              <div className="card p-8">
                <h2 className="font-display font-bold text-xl mb-6">Personal Information</h2>
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm text-dark-400 mb-1">First Name</label>
                    <input
                      value={profileForm.first_name}
                      onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-dark-400 mb-1">Last Name</label>
                    <input
                      value={profileForm.last_name}
                      onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-dark-400 mb-1">Phone</label>
                    <input
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-dark-400 mb-1">Email</label>
                    <input value={user.email} disabled className="input opacity-60" />
                    <p className="text-xs text-dark-500 mt-1">
                      {user.is_verified ? (
                        <span className="text-green-400 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        'Email not verified'
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleUpdateProfile}
                  disabled={saving}
                  className="btn-primary mt-6 w-full"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save Changes'}
                </button>
              </div>

              <div className="card p-8">
                <h2 className="font-display font-bold text-xl mb-6">Change Password</h2>
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm text-dark-400 mb-1">Current Password</label>
                    <input
                      type="password"
                      value={passwordForm.current_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-dark-400 mb-1">New Password</label>
                    <input
                      type="password"
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
                <button
                  onClick={handleChangePassword}
                  disabled={saving || !passwordForm.current_password || !passwordForm.new_password}
                  className="btn-secondary mt-6 w-full disabled:opacity-50"
                >
                  Change Password
                </button>
              </div>
            </div>
          )}

          {tab === 'orders' && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="card p-12 text-center">
                  <p className="text-2xl mb-4">No orders yet</p>
                  <p className="text-dark-400 mb-6">Start shopping to see your orders here</p>
                  <a href="/shop" className="btn-primary">Start Shopping</a>
                </div>
              ) : (
                orders.map((order: any) => (
                  <div key={order.id} className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-primary-500">{order.order_number}</h3>
                        <p className="text-sm text-dark-400">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-3 py-1 rounded-full text-sm bg-dark-800 border border-dark-700">
                          {order.status.replace('_', ' ')}
                        </span>
                        <p className="font-bold mt-2 text-primary-500">
                          ₦{Number(order.total).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={`/account/orders/${order.id}`}
                        className="btn-secondary text-sm px-4 py-2"
                      >
                        View Details
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'addresses' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-display font-bold text-xl">Saved Addresses</h2>
                <button
                  onClick={() => setShowAddAddress(!showAddAddress)}
                  className="btn-primary flex items-center gap-2 text-sm px-4 py-2"
                >
                  <Plus className="w-4 h-4" /> Add Address
                </button>
              </div>

              {showAddAddress && (
                <div className="card p-6 mb-6">
                  <h3 className="font-semibold mb-4">New Address</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-dark-400 mb-1">Label</label>
                      <input
                        value={newAddress.label}
                        onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-dark-400 mb-1">First Name</label>
                      <input
                        value={newAddress.first_name}
                        onChange={(e) => setNewAddress({ ...newAddress, first_name: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-dark-400 mb-1">Last Name</label>
                      <input
                        value={newAddress.last_name}
                        onChange={(e) => setNewAddress({ ...newAddress, last_name: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-dark-400 mb-1">Phone</label>
                      <input
                        value={newAddress.phone}
                        onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm text-dark-400 mb-1">Address Line 1</label>
                      <input
                        value={newAddress.address_line1}
                        onChange={(e) => setNewAddress({ ...newAddress, address_line1: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-dark-400 mb-1">City</label>
                      <input
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-dark-400 mb-1">State</label>
                      <input
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-dark-400 mb-1">Postal Code</label>
                      <input
                        value={newAddress.postal_code}
                        onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                        className="input"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAddAddress}
                    disabled={saving}
                    className="btn-secondary mt-4"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Address'}
                  </button>
                </div>
              )}

              {addresses.length === 0 ? (
                <div className="card p-12 text-center">
                  <p className="text-dark-400 text-lg">No saved addresses yet</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div key={addr.id} className="card p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">
                          {addr.label} {addr.is_default && (
                            <span className="text-xs text-primary-500">(Default)</span>
                          )}
                        </h3>
                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="text-dark-400 hover:text-red-400 transition-colors"
                          aria-label="Delete address"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p>{addr.first_name} {addr.last_name}</p>
                      <p className="text-dark-300">{addr.address_line1}</p>
                      <p className="text-dark-300">{addr.city}, {addr.state} {addr.postal_code}</p>
                      <p className="text-dark-400">{addr.phone}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'notifications' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-display font-bold text-xl">Notifications</h2>
                <button onClick={handleMarkAllNotificationsRead} className="btn-ghost text-sm">
                  Mark All as Read
                </button>
              </div>
              <div className="space-y-4">
                {notifications.length === 0 ? (
                  <div className="card p-12 text-center">
                    <p className="text-dark-400 text-lg">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notification: any) => (
                    <div
                      key={notification.id}
                      className={`card p-6 ${!notification.is_read ? 'border-primary-500/40' : ''}`}
                    >
                      <h3 className="font-semibold mb-1">{notification.title}</h3>
                      <p className="text-dark-300">{notification.message}</p>
                      <p className="text-xs text-dark-500 mt-2">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <SupportWidget />
    </>
  );
}