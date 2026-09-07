'use client';

import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { SupportWidget } from '@/components/SupportWidget';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { Loader2, Mail, Lock, User, Phone } from 'lucide-react';

export default function LoginPage() {
  const { login, register } = useAuthStore();
  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isRegister) {
        await register({
          email: form.email,
          password: form.password,
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone || undefined,
        });
      } else {
        await login(form.email, form.password);
      }
      window.location.href = '/account';
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32 pb-16 flex items-center justify-center px-4">
        <div className="card p-8 max-w-md w-full">
          <h1 className="font-display font-bold text-3xl mb-2">
            {isRegister ? 'CREATE' : 'WELCOME'} <span className="text-primary-500">BACK</span>
          </h1>
          <p className="text-dark-400 mb-8">
            {isRegister ? 'Join us and start shopping' : 'Login to your account'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm text-dark-400 mb-1">First Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-500" />
                      <input
                        type="text"
                        required
                        value={form.first_name}
                        onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                        className="input pl-9"
                        placeholder="John"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-dark-400 mb-1">Last Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-500" />
                      <input
                        type="text"
                        required
                        value={form.last_name}
                        onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                        className="input pl-9"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-1">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-500" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="input pl-9"
                      placeholder="+250..."
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm text-dark-400 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-500" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input pl-9"
                  placeholder="you@email.com"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm text-dark-400">Password</label>
                {!isRegister && (
                  <a href="/forgot-password" className="text-xs text-primary-500 hover:text-primary-400">
                    Forgot password?
                  </a>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-500" />
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
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
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isRegister ? (
                'Create Account'
              ) : (
                'Login'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-primary-500 hover:text-primary-400"
            >
              {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
            </button>
          </div>
        </div>
      </main>
      <SupportWidget />
    </>
  );
}