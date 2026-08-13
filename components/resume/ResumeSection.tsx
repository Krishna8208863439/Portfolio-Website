'use client';

import { motion } from 'framer-motion';
import { FileText, Download, ExternalLink } from 'lucide-react';

export default function ResumeSection() {
  return (
    <section id="resume" className="py-20 bg-slate-900/40 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <FileText className="w-4 h-4" />
            Curriculum Vitae
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Official Resume &amp; Credentials
          </h2>
          <p className="mt-3 text-slate-400 text-base">
            Review my professional background, technical proficiencies, and work history.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <a
              href="/api/resume"
              download="Final_Resume.pdf"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-105"
            >
              <Download className="w-4 h-4" />
              Download PDF Resume
            </a>
            <a
              href="/api/resume"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-xl border border-slate-700 transition-all hover:scale-105"
            >
              <ExternalLink className="w-4 h-4" />
              Open in New Tab
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
