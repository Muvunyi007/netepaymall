'use client';

import { AdminLayout } from '@/components/AdminLayout';
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
import { DollarSign, TrendingUp, ShoppingCart, Users } from 'lucide-react';

export default function AnalyticsPage() {
  const revenueByMonth = [
    { month: 'Jan', revenue: 45000 },
    { month: 'Feb', revenue: 52000 },
    { month: 'Mar', revenue: 68000 },
    { month: 'Apr', revenue: 54000 },
    { month: 'May', revenue: 73000 },
    { month: 'Jun', revenue: 89000 },
    { month: 'Jul', revenue: 81000 },
    { month: 'Aug', revenue: 96000 },
    { month: 'Sep', revenue: 112000 },
    { month: 'Oct', revenue: 126000 },
    { month: 'Nov', revenue: 158000 },
    { month: 'Dec', revenue: 189000 },
  ];

  const topProducts = [
    { name: 'Product A', sales: 320 },
    { name: 'Product B', sales: 280 },
    { name: 'Product C', sales: 250 },
    { name: 'Product D', sales: 210 },
    { name: 'Product E', sales: 180 },
  ];

  const categorySales = [
    { name: 'Electronics', value: 35 },
    { name: 'Fashion', value: 28 },
    { name: 'Home & Living', value: 20 },
    { name: 'Beauty', value: 17 },
  ];

  const COLORS = ['#FFD600', '#60a5fa', '#34d399', '#f472b6'];

  const customerGrowth = [
    { month: 'Jan', customers: 120 },
    { month: 'Feb', customers: 185 },
    { month: 'Mar', customers: 210 },
    { month: 'Apr', customers: 280 },
    { month: 'May', customers: 350 },
    { month: 'Jun', customers: 410 },
    { month: 'Jul', customers: 490 },
    { month: 'Aug', customers: 560 },
    { month: 'Sep', customers: 650 },
    { month: 'Oct', customers: 720 },
    { month: 'Nov', customers: 850 },
    { month: 'Dec', customers: 980 },
  ];

  return (
    <AdminLayout>
      <h1 className="font-bold text-3xl mb-8">ANALYTICS</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-primary-500" />
            <div>
              <p className="text-sm text-dark-400">Total Revenue</p>
              <p className="text-xl font-bold">₦1,242,000</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-6 h-6 text-blue-400" />
            <div>
              <p className="text-sm text-dark-400">Total Orders</p>
              <p className="text-xl font-bold">3,847</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-purple-400" />
            <div>
              <p className="text-sm text-dark-400">Customers</p>
              <p className="text-xl font-bold">1,578</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-green-400" />
            <div>
              <p className="text-sm text-dark-400">Conversion Rate</p>
              <p className="text-xl font-bold">3.2%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        <div className="card">
          <h2 className="font-semibold mb-4">Revenue by Month</h2>
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
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#FFD600" fill="url(#revenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4">Top Products</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" stroke="#71717a" />
                <YAxis stroke="#71717a" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
                />
                <Bar dataKey="sales" fill="#FFD600" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="card">
          <h2 className="font-semibold mb-4">Sales by Category</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categorySales} dataKey="value" cx="50%" cy="50%" outerRadius={100} label>
                  {categorySales.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
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
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
                />
                <Line type="monotone" dataKey="customers" stroke="#60a5fa" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}