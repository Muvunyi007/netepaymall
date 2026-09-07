'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { api } from '@/lib/api';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { DollarSign, TrendingUp, ShoppingCart, Users, Loader2 } from 'lucide-react';

const COLORS = ['#FFD600', '#60a5fa', '#34d399', '#f472b6'];

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/api/v1/admin/analytics');
        setData(response.data.data);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-32">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  const kpis = data?.kpis || {};
  const revenueByMonth = data?.revenue_by_month || [];
  const topProducts = data?.top_products || [];
  const categorySales = data?.category_sales || [];
  const customerGrowth = data?.customer_growth || [];

  const tooltipStyle = { backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' };

  return (
    <AdminLayout>
      <h1 className="font-bold text-3xl mb-8">ANALYTICS</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-primary-500" />
            <div>
              <p className="text-sm text-dark-400">Total Revenue</p>
              <p className="text-xl font-bold">₦{Number(kpis.total_revenue || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-6 h-6 text-blue-400" />
            <div>
              <p className="text-sm text-dark-400">Total Orders</p>
              <p className="text-xl font-bold">{Number(kpis.total_orders || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-purple-400" />
            <div>
              <p className="text-sm text-dark-400">Customers</p>
              <p className="text-xl font-bold">{Number(kpis.total_customers || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-green-400" />
            <div>
              <p className="text-sm text-dark-400">Conversion Rate</p>
              <p className="text-xl font-bold">{kpis.conversion_rate ?? 0}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        <div className="card">
          <h2 className="font-semibold mb-4">Revenue by Month (12 months)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueByMonth}>
                <defs>
                  <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFD600" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#FFD600" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="month" stroke="#71717a" />
                <YAxis stroke="#71717a" />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="revenue" stroke="#FFD600" fill="url(#revenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4">Top Products by Sales</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" stroke="#71717a" tick={{ fontSize: 11 }} />
                <YAxis stroke="#71717a" />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="sales" fill="#FFD600" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="card">
          <h2 className="font-semibold mb-4">Sales by Category</h2>
          <div className="h-80">
            {categorySales.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categorySales} dataKey="value" cx="50%" cy="50%" outerRadius={100} label>
                    {categorySales.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-dark-500 text-sm">No category sales data yet.</div>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4">Customer Growth</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={customerGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="month" stroke="#71717a" />
                <YAxis stroke="#71717a" />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="customers" stroke="#60a5fa" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}