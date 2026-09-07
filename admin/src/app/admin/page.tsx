'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { api } from '@/lib/api';
import { Loader2, DollarSign, ShoppingCart, Users, Package } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await api.get('/api/v1/admin/dashboard');
        setStats(response.data.data);
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    {
      label: 'Total Revenue',
      value: stats ? `₦${Number(stats.total_revenue).toLocaleString()}` : '₦0',
      icon: DollarSign,
      color: 'text-green-400',
    },
    {
      label: "Today's Revenue",
      value: stats ? `₦${Number(stats.today_revenue).toLocaleString()}` : '₦0',
      icon: DollarSign,
      color: 'text-primary-500',
    },
    {
      label: 'Total Orders',
      value: stats?.total_orders || 0,
      icon: ShoppingCart,
      color: 'text-blue-400',
    },
    {
      label: 'Customers',
      value: stats?.total_customers || 0,
      icon: Users,
      color: 'text-purple-400',
    },
    {
      label: 'Products',
      value: stats?.total_products || 0,
      icon: Package,
      color: 'text-pink-400',
    },
    {
      label: 'Pending Orders',
      value: stats?.pending_orders || 0,
      icon: ShoppingCart,
      color: 'text-orange-400',
    },
    {
      label: 'Low Stock Items',
      value: stats?.low_stock || 0,
      icon: Package,
      color: 'text-red-400',
    },
    {
      label: 'Open Support',
      value: stats?.open_support_requests || 0,
      icon: Users,
      color: 'text-yellow-400',
    },
  ];

  const revenueData = stats?.revenue_by_day || [];

  const hasRevenueData = revenueData.length > 0 && revenueData.some((d: any) => d.revenue > 0);

  const paymentData = [
    { name: 'Successful', value: stats?.successful_payments || 0 },
    { name: 'Failed', value: stats?.failed_payments || 0 },
  ];

  const COLORS = ['#FFD600', '#ef4444'];

  return (
    <AdminLayout>
      <h1 className="font-bold text-3xl mb-8">DASHBOARD</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="card">
            <div className="flex items-center gap-4">
              <card.icon className={`w-8 h-8 ${card.color}`} />
              <div>
                <p className="text-sm text-dark-400">{card.label}</p>
                <p className="text-2xl font-bold">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="card lg:col-span-2">
          <h2 className="font-semibold mb-4">Revenue Overview (Last 7 days)</h2>
          <div className="h-80">
            {hasRevenueData ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="day" stroke="#71717a" />
                  <YAxis stroke="#71717a" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      border: '1px solid #27272a',
                      borderRadius: '8px',
                    }}
                    formatter={(value: any) => `₦${Number(value).toLocaleString()}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#FFD600"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#FFD600' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-dark-400 text-center px-6">
                Nta revenue ibonetse mu minsi 7 ishize.
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4">Payment Status</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                >
                  {paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}