'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CERTIFICATES_DATA } from '@/lib/constants';
import { CertificateItem } from '@/types/portfolio';
import {
  ExternalLink,
  ShieldCheck,
  Trophy,
  X,
  CheckCircle,
  Award,
  Download,
  Printer,
  Copy,
  Check,
  Eye,
  Sparkles,
  Building2,
  Calendar,
  Key,
} from 'lucide-react';

export default function CertificatesSection() {
  const [selectedCert, setSelectedCert] = useState<CertificateItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const certRef = useRef<HTMLDivElement>(null);

  const filters = ['All', 'Certification', 'Hackathon', 'Internship'] as const;

  const filteredCerts = CERTIFICATES_DATA.filter((cert) =>
    activeFilter === 'All' ? true : cert.type === activeFilter
  );

  const handleCopyId = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const getIssuerBadgeColor = (issuer: string) => {
    const lower = issuer.toLowerCase();
    if (lower.includes('ibm')) return 'from-blue-600 to-indigo-700 text-blue-200 border-blue-400/40';
    if (lower.includes('microsoft')) return 'from-cyan-600 to-blue-600 text-cyan-200 border-cyan-400/40';
    if (lower.includes('skill india') || lower.includes('n.s.d.c')) return 'from-amber-600 to-orange-600 text-amber-200 border-amber-400/40';
    if (lower.includes('cisco')) return 'from-sky-600 to-teal-600 text-sky-200 border-sky-400/40';
    if (lower.includes('hackathon') || lower.includes('hack') || lower.includes('competition')) return 'from-purple-600 to-pink-600 text-purple-200 border-purple-400/40';
    return 'from-emerald-600 to-teal-700 text-emerald-200 border-emerald-400/40';
  };

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
            Verified credentials from IBM, Microsoft, Skill India, Cisco, plus competitive hackathon honors.
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
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredCerts.map((cert) => (
              <motion.div
                key={cert.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                onClick={() => setSelectedCert(cert)}
                className="group relative glass-card rounded-3xl overflow-hidden border border-slate-800 hover:border-amber-500/40 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between cursor-pointer shadow-xl hover:shadow-amber-500/10"
              >
                <div>
                  {/* Decorative Certificate Header Banner */}
                  <div className="relative h-28 w-full bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 p-4 border-b border-slate-800 overflow-hidden flex flex-col justify-between">
                    {/* Watermark Pattern */}
                    <div className="absolute -right-6 -bottom-6 w-32 h-32 opacity-10 pointer-events-none">
                      <Award className="w-full h-full text-white" />
                    </div>

                    <div className="flex items-center justify-between z-10">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-900/90 text-amber-300 text-[10px] font-mono border border-amber-500/30 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        {cert.type}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-800">
                        {cert.issueDate}
                      </span>
                    </div>

                    <div className="z-10 flex items-center justify-between">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-gradient-to-r border ${getIssuerBadgeColor(cert.issuer)}`}>
                        {cert.issuer}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle className="w-3 h-3" /> Verified
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors leading-snug">
                      {cert.title}
                    </h3>
                    <p className="text-xs text-blue-400 font-semibold mt-1 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" /> {cert.issuer}
                    </p>

                    {/* Skills Tagged */}
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {cert.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-0.5 rounded-md bg-slate-900/90 text-slate-300 text-[10px] font-mono border border-slate-800"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-6 pt-0">
                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono truncate max-w-[140px]" title={cert.credentialId}>
                      ID: {cert.credentialId}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCert(cert);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 text-blue-300 hover:text-white text-xs font-semibold border border-blue-500/30 transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" /> Open Certificate
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* FULL CERTIFICATE MODAL */}
      <AnimatePresence>
        {selectedCert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="relative w-full max-w-3xl glass-panel rounded-3xl p-5 sm:p-7 border border-slate-700/60 shadow-2xl max-h-[95vh] overflow-y-auto"
            >
              {/* Top Modal Bar */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 flex-wrap">
                      <span>{selectedCert.title}</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                        Verified
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-2">
                      <span>Issued by <strong className="text-slate-200">{selectedCert.issuer}</strong></span>
                      <span>•</span>
                      <span>{selectedCert.issueDate}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCert(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* RENDERED AUTHENTIC CERTIFICATE DOCUMENT */}
              <div
                ref={certRef}
                className="relative my-4 p-6 sm:p-10 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-4 border-double border-amber-500/40 text-center shadow-2xl overflow-hidden"
              >
                {/* Guilloche Corner Accents */}
                <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-amber-400/80 pointer-events-none" />
                <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-amber-400/80 pointer-events-none" />
                <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-amber-400/80 pointer-events-none" />
                <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-amber-400/80 pointer-events-none" />

                {/* Background Watermark Crest */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                  <Award className="w-80 h-80 text-white" />
                </div>

                {/* Certificate Header */}
                <div className="mb-6 space-y-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono uppercase tracking-widest mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Official Certificate of {selectedCert.type === 'Hackathon' ? 'Achievement' : selectedCert.type === 'Internship' ? 'Completion' : 'Certification'}
                  </div>
                  <h4 className="text-xl sm:text-2xl font-serif tracking-widest text-slate-200 uppercase font-semibold">
                    Certificate of Excellence
                  </h4>
                  <p className="text-[11px] font-mono text-slate-400 tracking-wider">
                    RECOGNIZING PROFESSIONAL MERIT &amp; TECHNICAL EXCELLENCE
                  </p>
                </div>

                {/* Recipient Statement */}
                <p className="text-xs text-slate-400 italic">This is officially presented to</p>
                <div className="my-3">
                  <h2 className="text-2xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-200 to-yellow-400 tracking-wide font-sans">
                    Krishna Devadkar
                  </h2>
                  <div className="w-48 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mt-2" />
                </div>

                {/* Citation */}
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed my-4">
                  for successfully demonstrating professional competency, completing comprehensive curriculum requirements, and earning the official qualification in
                </p>

                {/* Award Title & Issuer */}
                <div className="p-3 sm:p-4 rounded-xl bg-slate-900/80 border border-amber-500/30 max-w-lg mx-auto mb-6">
                  <h3 className="text-lg sm:text-xl font-bold text-amber-300">{selectedCert.title}</h3>
                  <p className="text-xs font-semibold text-blue-400 mt-0.5">Issued by {selectedCert.issuer}</p>
                </div>

                {/* Verified Skills */}
                <div className="mb-6">
                  <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2">Verified Competencies</p>
                  <div className="flex flex-wrap justify-center gap-1.5 max-w-md mx-auto">
                    {selectedCert.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2.5 py-0.5 rounded-md bg-slate-850 text-slate-200 text-xs font-mono border border-slate-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Certificate Footer with Signatures & Seal */}
                <div className="pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  {/* Left: Issue Date & Credential ID */}
                  <div className="text-center sm:text-left space-y-1">
                    <p className="text-[11px] font-mono text-slate-400 flex items-center justify-center sm:justify-start gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>Issue Date: <strong className="text-white">{selectedCert.issueDate}</strong></span>
                    </p>
                    <p className="text-[11px] font-mono text-slate-400 flex items-center justify-center sm:justify-start gap-1">
                      <Key className="w-3 h-3 text-slate-500" />
                      <span>ID: <strong className="text-emerald-400">{selectedCert.credentialId}</strong></span>
                    </p>
                  </div>

                  {/* Center: Official Seal */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-full border-2 border-amber-400/60 bg-gradient-to-br from-amber-500/20 to-yellow-600/20 flex items-center justify-center shadow-lg shadow-amber-500/10 p-2">
                      <div className="w-full h-full rounded-full border border-dashed border-amber-300/80 flex flex-col items-center justify-center text-[8px] font-mono font-bold text-amber-200 tracking-tighter">
                        <ShieldCheck className="w-4 h-4 text-amber-300 mb-0.5" />
                        <span>VERIFIED</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono text-amber-300/80 mt-1 uppercase tracking-widest">
                      AUTHENTIC SEAL
                    </span>
                  </div>

                  {/* Right: Signature */}
                  <div className="text-center sm:text-right space-y-1">
                    <div className="inline-block border-b border-slate-600 pb-1 px-4">
                      <span className="font-serif italic text-amber-200 text-sm tracking-wider">
                        {selectedCert.issuer}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                      Authorized Issuing Authority
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyId(selectedCert.credentialId || '')}
                    className="px-3 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
                    title="Copy Credential ID"
                  >
                    {copiedId === selectedCert.credentialId ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy Credential ID</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handlePrint}
                    className="px-3 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
                    title="Print Certificate"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-400" />
                    <span>Print / Save PDF</span>
                  </button>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setSelectedCert(null)}
                    className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-medium"
                  >
                    Close
                  </button>
                  {selectedCert.credentialUrl && (
                    <a
                      href={selectedCert.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open Issuer Portal
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
