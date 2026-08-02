import Link from 'next/link';
import { Home, AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-center">
      <div className="max-w-md glass-panel rounded-3xl p-8 border border-slate-800 space-y-6 shadow-2xl">
        <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-400 w-fit mx-auto border border-rose-500/20">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-extrabold text-white font-poppins">404</h1>
        <h2 className="text-xl font-semibold text-slate-200">Page Not Found</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          The requested page or resource could not be found. Let&apos;s get you back on track!
        </p>
        <Link
          href="/"
          className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 hover:opacity-90 transition-opacity"
        >
          <Home className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
}
