'use client';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <h1 className="text-3xl font-bold text-slate-800 mb-4">TaskFlow</h1>
      <p className="text-slate-500 mb-8">Landing page coming soon.</p>
      
      <Link href="/login" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
        Go to Login
      </Link>
    </div>
  );
}
