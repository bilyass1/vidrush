import Link from 'next/link';
import Navbar from '@/components/Navbar';
import PricingCard from '@/components/PricingCard';

const features = [
  {
    icon: '🎬',
    title: 'YouTube Generator',
    tagline: '60-min docs from a single topic',
    detail:
      'Type your idea, AI writes the script, synthesises the voice, generates video clips, and renders a full documentary — automatically.',
  },
  {
    icon: '🛍️',
    title: 'E-Commerce Studio',
    tagline: 'Product ads in 3 markets, 3 languages',
    detail:
      'Upload product photos and get studio-quality ads in US English, French, and Tunisian Darija Arabic with one click.',
  },
  {
    icon: '✂️',
    title: 'Video Editor',
    tagline: 'Trim, stickers, text — export instantly',
    detail:
      'Frame-accurate timeline editor with 50+ stickers, text overlays, and FFmpeg-powered exports. No cloud needed.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Type your topic',
    description:
      'Enter a subject, upload product photos, or paste a URL. VidRush handles the rest.',
  },
  {
    number: '02',
    title: 'AI generates script, voice, and video',
    description:
      'Watch real-time progress as the pipeline runs: Script → Voice → Clips → Render.',
  },
  {
    number: '03',
    title: 'Edit and publish to YouTube',
    description:
      'Trim, add stickers, and push directly to your YouTube channel — all in one place.',
  },
];

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

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-24 px-4 text-center">
        <div className="mx-auto max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm text-purple-400 mb-8">
            <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
            Now in early access
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
            Generate Full YouTube
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">
              Documentaries with AI
            </span>
          </h1>

          <p className="mt-6 text-xl text-gray-400 max-w-2xl mx-auto">
            Script → Voice → Video → Published in minutes
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/download"
              className="rounded-xl bg-purple-600 px-8 py-4 text-base font-semibold text-white hover:bg-purple-700 transition-colors"
            >
              Download for Free
            </Link>
            <button className="rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-base font-semibold text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs pl-0.5">
                ▶
              </span>
              Watch Demo
            </button>
          </div>

          {/* Simulated app UI */}
          <div className="mt-20 rounded-2xl border border-white/10 bg-gradient-to-br from-purple-950/30 to-[#111111] p-8 text-left relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-transparent pointer-events-none" />
            <p className="text-xs text-gray-500 mb-4 font-mono">VidRush — YouTube Generator</p>
            <div className="relative flex flex-col gap-3">
              {[
                { label: 'Scripting…', done: true },
                { label: 'Generating voice…', done: true },
                { label: 'Creating video clips…', done: false, progress: 60 },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      step.done ? 'bg-green-400' : 'bg-purple-400 animate-pulse'
                    }`}
                  />
                  <span className="text-sm text-gray-300 font-mono">
                    {step.label}
                    {step.done ? ' done ✓' : ` ${step.progress}%`}
                  </span>
                </div>
              ))}
              <div className="mt-2 h-1.5 w-full rounded-full bg-white/10">
                <div className="h-1.5 w-[60%] rounded-full bg-gradient-to-r from-purple-600 to-purple-400" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Everything you need to create</h2>
            <p className="mt-4 text-gray-400">One app. Three powerful studios.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl bg-[#111111] border border-white/10 p-8 hover:border-purple-500/40 transition-colors"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                <p className="text-sm text-purple-400 mt-1">{feature.tagline}</p>
                <p className="mt-3 text-sm text-gray-400 leading-relaxed">{feature.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4 bg-gradient-to-b from-transparent via-purple-950/10 to-transparent">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">How it works</h2>
            <p className="mt-4 text-gray-400">From idea to published video in three steps.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-10">
            {steps.map((step, i) => (
              <div key={step.number} className="flex flex-col items-center text-center">
                <div className="relative">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-600/20 border border-purple-500/30 text-xl font-bold text-purple-400 mb-6">
                    {step.number}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="hidden sm:block absolute top-8 left-16 w-[calc(100%+2.5rem)] border-t border-dashed border-white/10" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm text-gray-400 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Simple, transparent pricing</h2>
            <p className="mt-4 text-gray-400">
              Cancel anytime. No hidden fees.{' '}
              <Link href="/pricing" className="text-purple-400 hover:text-purple-300 underline underline-offset-2">
                See full comparison →
              </Link>
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <PricingCard key={plan.name} {...plan} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-4">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/" className="text-lg font-bold">
            Vid<span className="text-purple-400">Rush</span>
          </Link>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/#features" className="hover:text-white transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/download" className="hover:text-white transition-colors">
              Download
            </Link>
            <Link href="/login" className="hover:text-white transition-colors">
              Login
            </Link>
          </div>
          <p className="text-sm text-gray-600">© 2025 VidRush. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
