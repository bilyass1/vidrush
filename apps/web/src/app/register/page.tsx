import Link from 'next/link';
import Navbar from '@/components/Navbar';
import AuthForm from '@/components/AuthForm';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />

      <div className="flex min-h-screen items-center justify-center px-4 pt-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block text-2xl font-bold mb-6">
              Vid<span className="text-purple-500">Rush</span>
            </Link>
            <h1 className="text-3xl font-bold">Create your account</h1>
            <p className="mt-2 text-gray-400">Start generating AI videos for free</p>
          </div>

          <div className="rounded-2xl bg-[#111111] border border-white/10 p-8">
            <AuthForm mode="register" />
          </div>
        </div>
      </div>
    </div>
  );
}
