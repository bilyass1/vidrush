'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/api';

interface AuthFormProps {
  mode: 'login' | 'register';
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await auth.login(email, password);
      } else {
        await auth.register(name, email, password);
      }
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mode === 'register' && (
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full rounded-lg bg-[#1a1a1a] border border-white/10 px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
            />
          </div>
        )}

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@example.com"
            className="w-full rounded-lg bg-[#1a1a1a] border border-white/10 px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg bg-[#1a1a1a] border border-white/10 px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
          />
        </div>

        {error && (
          <div className="flex bg-red-500/10 border border-red-500/20 rounded-xl p-4 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-red-200">
                {mode === 'login' ? 'Sign In Failed' : 'Registration Failed'}
              </span>
              <p className="text-sm text-red-400/90 mt-0.5 leading-relaxed">
                {error}
              </p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-purple-600 px-4 py-3 text-sm font-semibold text-white hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-[#0a0a0a] px-3 text-gray-500">or continue with</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => auth.googleLogin()}
        className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-4 py-3 text-sm font-medium text-white hover:bg-white/5 transition-colors flex items-center justify-center gap-3"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
          <path
            d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
            fill="currentColor"
          />
        </svg>
        Sign {mode === 'login' ? 'in' : 'up'} with Google
      </button>

      <p className="mt-6 text-center text-sm text-gray-500">
        {mode === 'login' ? (
          <>
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-purple-400 hover:text-purple-300 transition-colors">
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <Link href="/login" className="text-purple-400 hover:text-purple-300 transition-colors">
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
