import Link from 'next/link';
import { Check, X } from 'lucide-react';
import Navbar from '@/components/Navbar';
import PricingCard from '@/components/PricingCard';

const plans = [
  {
    name: 'Starter',
    price: '$29',
    period: '/mo',
    description: '15 minutes of AI video per month',
    features: [
      '15 min/mo of AI video',
      'YouTube Generator',
      'Video Editor',
      'YouTube Publisher',
      'Email support',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$79',
    period: '/mo',
    description: '50 minutes of AI video per month',
    features: [
      '50 min/mo of AI video',
      'YouTube Generator',
      'E-Commerce Studio',
      'Video Editor',
      'YouTube Publisher + Analytics',
      'Priority support',
    ],
    cta: 'Get Started',
    highlighted: true,
  },
  {
    name: 'Pay As You Go',
    price: '$1.50',
    period: '/min',
    description: 'No monthly commitment',
    features: [
      'Pay per minute generated',
      'YouTube Generator',
      'E-Commerce Studio',
      'Video Editor',
      'YouTube Publisher',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
];

interface ComparisonRow {
  feature: string;
  starter: string | boolean;
  pro: string | boolean;
  payg: string | boolean;
}

const comparisonRows: ComparisonRow[] = [
  { feature: 'Minutes / month', starter: '15 min', pro: '50 min', payg: 'Pay per min' },
  { feature: 'Price per minute', starter: '~$1.93/min', pro: '~$1.58/min', payg: '$1.50/min' },
  { feature: 'YouTube Generator', starter: true, pro: true, payg: true },
  { feature: 'E-Commerce Studio', starter: false, pro: true, payg: true },
  { feature: 'Video Editor', starter: true, pro: true, payg: true },
  { feature: 'YouTube Publisher', starter: true, pro: true, payg: true },
  { feature: 'YouTube Analytics', starter: false, pro: true, payg: false },
  { feature: 'Priority support', starter: false, pro: true, payg: false },
];

function Cell({ value }: { value: string | boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check size={18} className="mx-auto text-purple-400" />
    ) : (
      <X size={18} className="mx-auto text-gray-700" />
    );
  }
  return <span className="text-sm text-gray-300">{value}</span>;
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />

      <section className="pt-32 pb-16 px-4 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl sm:text-5xl font-bold">Simple, transparent pricing</h1>
          <p className="mt-4 text-gray-400 text-lg">
            Cancel anytime. No hidden fees. No per-seat charges.
          </p>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="pb-24 px-4">
        <div className="mx-auto max-w-5xl">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <PricingCard key={plan.name} {...plan} />
            ))}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="pb-24 px-4">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold text-center mb-10">Full feature comparison</h2>
          <div className="rounded-2xl border border-white/10 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-[#111111]">
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Feature</th>
                  <th className="px-6 py-4 text-sm font-semibold text-white text-center">Starter</th>
                  <th className="px-6 py-4 text-sm font-semibold text-purple-400 text-center">Pro</th>
                  <th className="px-6 py-4 text-sm font-semibold text-white text-center">PAYG</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-[#0a0a0a]' : 'bg-[#0d0d0d]'}`}
                  >
                    <td className="px-6 py-4 text-sm text-gray-300">{row.feature}</td>
                    <td className="px-6 py-4 text-center">
                      <Cell value={row.starter} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Cell value={row.pro} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Cell value={row.payg} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="pb-24 px-4">
        <div className="mx-auto max-w-3xl rounded-2xl bg-gradient-to-br from-purple-600/20 to-purple-900/20 border border-purple-500/20 p-12 text-center">
          <h2 className="text-2xl font-bold">Ready to create your first AI video?</h2>
          <p className="mt-3 text-gray-400">
            Download VidRush for free. Pick a plan when you&apos;re ready.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="rounded-xl bg-purple-600 px-8 py-4 text-sm font-semibold text-white hover:bg-purple-700 transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              href="/download"
              className="rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Download App
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-600">
          <Link href="/" className="font-bold text-base text-white">
            Vid<span className="text-purple-400">Rush</span>
          </Link>
          <div className="flex gap-6">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/download" className="hover:text-white transition-colors">Download</Link>
            <Link href="/login" className="hover:text-white transition-colors">Login</Link>
          </div>
          <p>© 2025 VidRush. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
