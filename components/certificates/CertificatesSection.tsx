'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CERTIFICATES_DATA } from '@/lib/constants';
import { CertificateItem } from '@/types/portfolio';
import { ExternalLink, ShieldCheck, Trophy, X, CheckCircle } from 'lucide-react';

export default function CertificatesSection() {
  const [selectedCert, setSelectedCert] = useState<CertificateItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('All');

  const filters = ['All', 'Certification', 'Hackathon', 'Award'] as const;

  const filteredCerts = CERTIFICATES_DATA.filter((cert) =>
    activeFilter === 'All' ? true : cert.type === activeFilter
  );

  return (
    <section id="certificates" className="py-24 relative overflow-hidden bg-slate-950/40">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full glass-card border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Trophy className="w-3.5 h-3.5" />
            <span>Verified Credentials</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Certificates & <span className="gradient-text">Achievements</span>
          </h2>
          <p className="mt-4 text-slate-400 text-base sm:text-lg">
            Industry certifications from AWS, Google, Meta, plus top hackathon victories.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
                activeFilter === filter
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25 border border-blue-400/30'
                  : 'glass-card text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Grid Container */}
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {filteredCerts.map((cert) => (
              <motion.div
                key={cert.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="glass-card rounded-3xl p-6 border border-slate-800 flex flex-col justify-between group hover:border-amber-500/40 hover:-translate-y-1 transition-all duration-300"
              >
                <div>
                  {/* Top Badge & Issuer */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[11px] font-mono border border-amber-500/20 uppercase tracking-wider">
                      {cert.type}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{cert.issueDate}</span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors leading-snug">
                    {cert.title}
                  </h3>
                  <p className="text-xs text-blue-400 font-semibold mt-1">{cert.issuer}</p>

                  {/* Skills Tagged */}
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {cert.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 text-[10px] font-mono border border-slate-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono truncate max-w-[150px]">
                    ID: {cert.credentialId}
                  </span>
                  <button
                    onClick={() => setSelectedCert(cert)}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 text-xs font-semibold border border-blue-500/30 transition-colors flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> Verify Credential
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

      </div>

      {/* Verify Modal */}
      <AnimatePresence>
        {selectedCert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-8 border border-slate-700/60 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedCert.title}</h3>
                    <p className="text-xs text-blue-400 font-mono">{selectedCert.issuer}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCert(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-sm text-slate-300 my-6">
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <p className="text-xs text-slate-400 font-mono">Official Credential ID</p>
                  <p className="text-base font-bold text-emerald-400 font-mono mt-0.5">{selectedCert.credentialId}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> Verified by issuer database
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={() => setSelectedCert(null)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-medium"
                >
                  Close
                </button>
                <a
                  href={selectedCert.credentialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/25"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> View Official Record
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
