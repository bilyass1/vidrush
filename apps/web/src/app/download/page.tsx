'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

type DetectedOS = 'windows' | 'macos' | 'unknown';

function detectOS(): DetectedOS {
  if (typeof window === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  if (ua.includes('Win')) return 'windows';
  if (ua.includes('Mac')) return 'macos';
  return 'unknown';
}

const APP_VERSION = '1.0.0';

const downloads = {
  windows: {
    os: 'Windows',
    icon: '🪟',
    ext: '.msi',
    size: '45.2 MB',
    label: 'Download for Windows',
    sha256: 'a1b2c3d4e5f6789abcdef0123456789abcdef0123456789abcdef0123456789ab',
  },
  macos: {
    os: 'macOS',
    icon: '🍎',
    ext: '.dmg',
    size: '62.8 MB',
    label: 'Download for macOS',
    sha256: 'b2c3d4e5f6789abcdef0123456789abcdef0123456789abcdef0123456789abc1',
  },
} as const;

export default function DownloadPage() {
  const [detectedOS, setDetectedOS] = useState<DetectedOS>('unknown');

  useEffect(() => {
    setDetectedOS(detectOS());
  }, []);

  const primary = detectedOS === 'macos' ? downloads.macos : downloads.windows;
  const secondary = detectedOS === 'macos' ? downloads.windows : downloads.macos;
  const showDetected = detectedOS !== 'unknown';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />

      <section className="pt-32 pb-24 px-4">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold">Download VidRush</h1>
            <p className="mt-4 text-gray-400">
              Version {APP_VERSION} · Free to download · No subscription required to install
            </p>
            {showDetected && (
              <p className="mt-2 text-sm text-purple-400">
                Detected: {primary.os}
              </p>
            )}
          </div>

          {/* Primary download card */}
          <div className="rounded-2xl bg-[#111111] border border-white/10 p-10 text-center">
            <div className="text-6xl mb-4">{showDetected ? primary.icon : '💻'}</div>
            <h2 className="text-2xl font-semibold">
              {showDetected ? `${primary.os} Ready` : 'VidRush Desktop'}
            </h2>
            <p className="mt-2 text-gray-400">
              {showDetected
                ? `${primary.ext.toUpperCase()} installer · ${primary.size}`
                : 'Choose your platform below'}
            </p>

            {showDetected ? (
              <div className="mt-8">
                <a
                  href="#"
                  className="inline-flex items-center gap-3 rounded-xl bg-purple-600 px-8 py-4 text-base font-semibold text-white hover:bg-purple-700 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {primary.label} ({primary.ext})
                </a>
                <div className="mt-4 text-xs text-gray-600 font-mono break-all px-4">
                  SHA256: {primary.sha256}
                </div>
              </div>
            ) : (
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                {Object.values(downloads).map((dl) => (
                  <a
                    key={dl.os}
                    href="#"
                    className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-4 text-sm font-semibold text-white hover:bg-purple-700 transition-colors"
                  >
                    <span>{dl.icon}</span>
                    {dl.label} ({dl.ext})
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Secondary / alternate OS */}
          {showDetected && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                Also available for {secondary.os}:{' '}
                <a
                  href="#"
                  className="text-purple-400 hover:text-purple-300 underline underline-offset-2"
                >
                  {secondary.label} ({secondary.ext}) · {secondary.size}
                </a>
              </p>
            </div>
          )}

          {/* System requirements */}
          <div className="mt-12 rounded-2xl bg-[#111111] border border-white/10 p-8">
            <h3 className="text-lg font-semibold mb-6">System Requirements</h3>
            <div className="grid sm:grid-cols-2 gap-8">
              <div>
                <p className="text-sm font-semibold text-purple-400 mb-3 flex items-center gap-2">
                  🪟 Windows
                </p>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>Windows 10 / 11 (64-bit)</li>
                  <li>8 GB RAM minimum</li>
                  <li>4 GB available disk space</li>
                  <li>Internet connection required</li>
                  <li>FFmpeg (auto-installed on first launch)</li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold text-purple-400 mb-3 flex items-center gap-2">
                  🍎 macOS
                </p>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>macOS 12 Monterey or later</li>
                  <li>Apple Silicon (M1+) or Intel</li>
                  <li>8 GB RAM minimum</li>
                  <li>4 GB available disk space</li>
                  <li>FFmpeg (auto-installed on first launch)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Trust signals */}
          <div className="mt-8 flex flex-wrap gap-6 justify-center text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <span className="text-green-400">✓</span> Free to download
            </span>
            <span className="flex items-center gap-2">
              <span className="text-green-400">✓</span> No account required to install
            </span>
            <span className="flex items-center gap-2">
              <span className="text-green-400">✓</span> Auto-updates included
            </span>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 px-4 text-center text-sm text-gray-600">
        <p>
          © 2025 VidRush ·{' '}
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>{' '}
          ·{' '}
          <Link href="/login" className="hover:text-white transition-colors">
            Sign in
          </Link>
        </p>
      </footer>
    </div>
  );
}
