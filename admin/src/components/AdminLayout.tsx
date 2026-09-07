'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Boxes,
  ShoppingCart,
  CreditCard,
  Users,
  Truck,
  Ticket,
  Star,
  Bell,
  LifeBuoy,
  BarChart3,
  Settings,
  ShieldCheck,
  FileText,
  Menu,
  X,
  LogOut,
} from 'lucide-react';

const navGroups = [
  {
    label: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { href: '/admin/products', label: 'Products', icon: Package },
      { href: '/admin/categories', label: 'Categories', icon: FolderTree },
      { href: '/admin/inventory', label: 'Inventory', icon: Boxes },
    ],
  },
  {
    label: 'Sales',
    items: [
      { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
      { href: '/admin/payments', label: 'Payments', icon: CreditCard },
      { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
      { href: '/admin/delivery', label: 'Delivery', icon: Truck },
    ],
  },
  {
    label: 'Customers',
    items: [
      { href: '/admin/customers', label: 'Customers', icon: Users },
      { href: '/admin/reviews', label: 'Reviews', icon: Star },
      { href: '/admin/support', label: 'Support', icon: LifeBuoy },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/notifications', label: 'Notifications', icon: Bell },
      { href: '/admin/settings', label: 'Settings', icon: Settings },
      { href: '/admin/administrators', label: 'Administrators', icon: ShieldCheck },
      { href: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
    ],
  },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 glass lg:block border-r border-dark-800 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-6 border-b border-dark-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-dark-950 font-bold">A</span>
            </div>
            <span className="font-bold">ADMIN PANEL</span>
          </div>
          <button
            className="lg:hidden text-dark-400"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-6">
              <p className="px-3 text-xs text-dark-500 uppercase tracking-wider mb-2">
                {group.label}
              </p>
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                      isActive
                        ? 'bg-primary-500/10 text-primary-500 border border-primary-500/30'
                        : 'hover:bg-dark-800'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-dark-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-red-400 hover:text-red-300 text-sm w-full px-3 py-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 glass border-b border-dark-800 px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-dark-400"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden sm:block text-sm text-dark-400">
            Admin Dashboard
          </div>
          <div className="flex items-center gap-4">
            <Bell className="w-5 h-5 text-dark-400" />
            <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center">
              <span className="text-dark-950 font-bold text-sm">A</span>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}