'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Trophy,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
} from 'lucide-react';
import Image from 'next/image';

// ─── Certificate pages generated from Certificate.pdf ───────────────────────
// Each entry corresponds to one page/image extracted from the PDF.
const TOTAL_PAGES = 100;

const CERT_IMAGES: { page: number; image: string }[] = Array.from(
  { length: TOTAL_PAGES },
  (_, i) => ({
    page: i + 1,
    image: `/images/certificates/certificate_${i + 1}.png`,
  })
);

// ──────────────────────────────────────────────────────────────────────────────

export default function CertificatesSection() {
  const [selectedPage, setSelectedPage] = useState<number | null>(null);
  const [imgError, setImgError] = useState<Record<number, boolean>>({});

  const handlePrev = () => {
    if (selectedPage === null) return;
    setSelectedPage(selectedPage > 1 ? selectedPage - 1 : TOTAL_PAGES);
  };

  const handleNext = () => {
    if (selectedPage === null) return;
    setSelectedPage(selectedPage < TOTAL_PAGES ? selectedPage + 1 : 1);
  };

  const selectedImage =
    selectedPage !== null
      ? `/images/certificates/certificate_${selectedPage}.png`
      : null;

  return (
    <section id="certificates" className="py-24 relative overflow-hidden bg-slate-950/40">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-600/8 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full glass-card border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Trophy className="w-3.5 h-3.5" />
            <span>Verified Credentials</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Certificates &amp; <span className="gradient-text">Achievements</span>
          </h2>
          <p className="mt-4 text-slate-400 text-base sm:text-lg">
            {TOTAL_PAGES} verified credentials — click any certificate to view full size.
          </p>
        </div>

        {/* Certificate Grid */}
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        >
          {CERT_IMAGES.map(({ page, image }) => (
            <motion.div
              key={page}
              layout
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: (page % 12) * 0.04 }}
              onClick={() => setSelectedPage(page)}
              className="group relative glass-card rounded-2xl overflow-hidden border border-slate-800 hover:border-amber-500/50 hover:-translate-y-2 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-amber-500/15"
            >
              {/* Certificate Image — fully contained, no cropping */}
              <div className="relative w-full bg-white" style={{ aspectRatio: '4/3' }}>
                {!imgError[page] ? (
                  <Image
                    src={image}
                    alt={`Certificate ${page}`}
                    fill
                    className="object-contain p-1 group-hover:scale-[1.03] transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    onError={() => setImgError((prev) => ({ ...prev, [page]: true }))}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-xs">
                    Certificate {page}
                  </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 rounded-t-md">
                  <div className="p-3 rounded-full bg-amber-500/25 border border-amber-400/50 text-amber-200 shadow-lg">
                    <ZoomIn className="w-6 h-6" />
                  </div>
                  <span className="text-white font-bold text-sm tracking-wide">View Full Certificate</span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  Certificate {page}/{TOTAL_PAGES}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPage(page);
                  }}
                  className="text-[11px] text-blue-400 font-semibold flex items-center gap-1 hover:text-blue-300 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> View
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* FULL CERTIFICATE MODAL */}
      <AnimatePresence>
        {selectedPage !== null && selectedImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/90 backdrop-blur-md"
            onClick={() => setSelectedPage(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl glass-panel rounded-3xl border border-slate-700/60 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-base">
                      Certificate {selectedPage} of {TOTAL_PAGES}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Krishna Devadkar — Verified Credential
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Download link */}
                  <a
                    href={selectedImage}
                    download={`krishna-certificate-${selectedPage}.png`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                    title="Download this certificate"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => setSelectedPage(null)}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/30 transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Certificate Image */}
              <div className="relative flex-1 overflow-auto bg-slate-950 flex items-center justify-center p-4 min-h-[400px]">
                <div className="relative w-full max-h-[70vh]">
                  <Image
                    src={selectedImage}
                    alt={`Certificate ${selectedPage}`}
                    width={1200}
                    height={900}
                    className="object-contain w-full max-h-[70vh] rounded-xl"
                    priority
                    onError={() => setImgError((prev) => ({ ...prev, [selectedPage]: true }))}
                  />
                </div>
              </div>

              {/* Navigation Footer */}
              <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800 bg-slate-900/80 flex-shrink-0">
                <button
                  onClick={handlePrev}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-semibold border border-slate-700 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                {/* Page indicator dots (show nearby pages) */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1)
                    .filter((p) => Math.abs(p - selectedPage) <= 3)
                    .map((p) => (
                      <button
                        key={p}
                        onClick={() => setSelectedPage(p)}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          p === selectedPage
                            ? 'bg-amber-400 scale-125'
                            : 'bg-slate-600 hover:bg-slate-500'
                        }`}
                        title={`Certificate ${p}`}
                      />
                    ))}
                  {selectedPage < TOTAL_PAGES - 3 && (
                    <span className="text-slate-500 text-xs mx-1">…</span>
                  )}
                </div>

                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-semibold border border-slate-700 transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
