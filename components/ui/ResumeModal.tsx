'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, CheckCircle, ExternalLink } from 'lucide-react';

interface ResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ResumeModal({ isOpen, onClose }: ResumeModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-3xl glass-panel rounded-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-700/50"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Krishna Devadkar</h3>
                <p className="text-sm text-slate-400">Full Stack & AI Engineer Resume</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Summary Highlights */}
          <div className="space-y-6 text-slate-300 text-sm sm:text-base">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> Professional Overview
              </h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                4+ years of building web applications, machine learning architectures, and scalable cloud APIs.
                Proficient in React 19, Next.js 15, TypeScript, Python, TensorFlow, PyTorch, Node.js, and Docker.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <h5 className="font-medium text-white mb-1">Education</h5>
                <p className="text-xs text-blue-400">B.Tech in CSE (AI & ML)</p>
                <p className="text-xs text-slate-400">SJCEM | CGPA: 9.4 / 10</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <h5 className="font-medium text-white mb-1">Latest Role</h5>
                <p className="text-xs text-purple-400">Senior Full Stack & AI Engineer</p>
                <p className="text-xs text-slate-400">TechCorp Innovations (2024 - Present)</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <h4 className="font-semibold text-white mb-2">Key Competencies</h4>
              <div className="flex flex-wrap gap-2">
                {['Next.js 15', 'React 19', 'TypeScript', 'Python', 'FastAPI', 'PyTorch', 'Tailwind CSS', 'AWS', 'MongoDB', 'Docker'].map((tech) => (
                  <span key={tech} className="px-2.5 py-1 text-xs rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* CTA Footer */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors font-medium text-sm"
            >
              Close
            </button>
            <a
              href="#contact"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-colors font-medium text-sm flex items-center justify-center gap-2 border border-slate-700"
            >
              <ExternalLink className="w-4 h-4" /> Contact Directly
            </a>
            <a
              href="mailto:krishna.devadkar.dev@gmail.com?subject=Resume%20Request%20-%20Krishna%20Devadkar"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 text-white hover:opacity-95 transition-opacity font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
            >
              <Download className="w-4 h-4" /> Download PDF Resume
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
