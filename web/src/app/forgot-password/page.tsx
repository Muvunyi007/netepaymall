'use client';

import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { SupportWidget } from '@/components/SupportWidget';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [mode, setMode] = useState<'request' | 'reset'>('request');

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await api.post('/api/v1/auth/forgot-password', { email });
      setResetToken(response.data?.reset_token || null);
      if (resetToken) {
        setMode('reset');
      }
      toast.success('Reset token generated. Check your email or use the reset form below.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to request password reset');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken) return;
    setIsLoading(true);
    try {
      await api.post('/api/v1/auth/reset-password', {
        token: resetToken,
        new_password: newPassword,
      });
      toast.success('Password reset successfully! Please login.');
      window.location.href = '/login';
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32 pb-16 flex items-center justify-center px-4">
        <div className="card p-8 max-w-md w-full">
          <a href="/login" className="inline-flex items-center gap-2 text-dark-400 hover:text-white text-sm mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to login
          </a>
          <h1 className="font-display font-bold text-3xl mb-2">
            RESET <span className="text-primary-500">PASSWORD</span>
          </h1>
          <p className="text-dark-400 mb-8">
            Enter your email to receive a password reset token
          </p>

          {mode === 'request' ? (
            <form onSubmit={handleRequest} className="space-y-4">
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
                    placeholder="you@email.com"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Request Reset'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-sm text-dark-400 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input"
                  placeholder="Enter new password"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </main>
      <SupportWidget />
    </>
  );
}