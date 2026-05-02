'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">
            Vid<span className="text-purple-500">Rush</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/#features" className="text-sm text-gray-400 hover:text-white transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="text-sm text-gray-400 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/download" className="text-sm text-gray-400 hover:text-white transition-colors">
              Download
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 transition-colors"
            >
              Get Started Free
            </Link>
          </div>

          <button
            className="md:hidden text-gray-400 hover:text-white"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/10 bg-[#0a0a0a] px-4 py-4 flex flex-col gap-4">
          <Link href="/#features" className="text-sm text-gray-400 hover:text-white" onClick={() => setOpen(false)}>
            Features
          </Link>
          <Link href="/pricing" className="text-sm text-gray-400 hover:text-white" onClick={() => setOpen(false)}>
            Pricing
          </Link>
          <Link href="/download" className="text-sm text-gray-400 hover:text-white" onClick={() => setOpen(false)}>
            Download
          </Link>
          <Link href="/login" className="text-sm text-gray-400 hover:text-white" onClick={() => setOpen(false)}>
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white text-center"
            onClick={() => setOpen(false)}
          >
            Get Started Free
          </Link>
        </div>
      )}
    </nav>
  );
}
