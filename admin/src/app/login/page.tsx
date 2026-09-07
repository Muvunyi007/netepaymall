'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Loader2, Lock, Mail, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await api.post('/api/v1/auth/login', { email, password });

      const role = (response.data?.user?.role || '').toLowerCase();

      if (
        role !== 'admin' &&
        role !== 'super_admin' &&
        role !== 'staff'
      ) {
        setError('Access denied. Admin credentials required.');
        setIsLoading(false);
        return;
      }

      localStorage.setItem('admin_token', response.data.access_token);
      router.push('/admin');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card p-8 max-w-md w-full">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
            <span className="text-dark-950 font-bold">A</span>
          </div>
          <div>
            <h1 className="font-bold text-xl">ADMIN PANEL</h1>
            <p className="text-xs text-dark-400">Sign in to continue</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-4 text-sm animate-slide-down">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-dark-400 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input pl-9"
                placeholder="admin@store.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-dark-400 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pl-9"
                placeholder="••••••••"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}