'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, Sparkles } from 'lucide-react';

const ROLES = [
  'Recruiter / Talent Acquisition',
  'Founder / Hiring Manager',
  'Fellow Developer',
  'Student',
  'Just Browsing',
];

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [roleError, setRoleError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Session check: trigger once per session
    const hasVisited = sessionStorage.getItem('portfolio_visited');
    if (!hasVisited) {
      // Short delay for smooth slide-in
      const timer = setTimeout(() => setIsOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!role) {
      setRoleError('Please select your role before entering the site.');
      return;
    }
    setRoleError('');
    setSubmitting(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
      await fetch(`${API_URL}/api/visitors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'identified',
          name: name.trim() || 'Anonymous',
          role: role,
        }),
      });
    } catch (err) {
      console.error('Error submitting visitor profile:', err);
    } finally {
      sessionStorage.setItem('portfolio_visited', 'true');
      setSubmitting(false);
      setIsOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md p-6 bg-slate-900/90 border border-blue-500/30 rounded-2xl shadow-2xl backdrop-blur-xl text-white"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-600/20 border border-blue-500/40 rounded-xl text-blue-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-100">Welcome 👋</h3>
              <p className="text-xs text-slate-400">A quick intro helps me understand who&apos;s visiting.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Your Name <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah Connor"
                className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                You are <span className="text-rose-400">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  if (e.target.value) setRoleError('');
                }}
                className={`w-full px-4 py-2.5 bg-slate-800/80 border ${
                  roleError ? 'border-rose-500 focus:border-rose-500' : 'border-slate-700 focus:border-blue-500'
                } rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              >
                <option value="" disabled className="bg-slate-900 text-slate-400">
                  Select your role
                </option>
                {ROLES.map((r) => (
                  <option key={r} value={r} className="bg-slate-900 text-white">
                    {r}
                  </option>
                ))}
              </select>
              {roleError && (
                <p className="mt-1.5 text-xs text-rose-400 font-medium">{roleError}</p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <UserCheck className="w-4 h-4" />
                {submitting ? 'Entering...' : 'Enter Site'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
