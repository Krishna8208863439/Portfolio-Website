'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, CheckCircle, ExternalLink, Award, Briefcase, GraduationCap, Code, Trophy } from 'lucide-react';

interface ResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ResumeModal({ isOpen, onClose }: ResumeModalProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'overview'>('preview');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-4xl glass-panel rounded-2xl p-5 sm:p-7 max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-700/60 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Krishna Devadkar</h3>
                <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-2 flex-wrap">
                  <span>krishnadevadkar@gmail.com</span>
                  <span>•</span>
                  <span>+91-8208863439</span>
                  <span>•</span>
                  <span className="text-blue-400 font-medium">B.Tech Computer Science</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center space-x-2 mb-5">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'preview'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 border border-blue-400/30'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60'
              }`}
            >
              Document Preview (PDF)
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 border border-blue-400/30'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60'
              }`}
            >
              Curriculum Vitae Overview
            </button>
          </div>

          {/* Content */}
          {activeTab === 'preview' ? (
            <div className="w-full flex-1 min-h-[480px] rounded-xl overflow-hidden border border-slate-800 bg-slate-900 flex flex-col">
              <iframe
                src="/api/resume#toolbar=1"
                className="w-full h-[520px] rounded-xl"
                title="Krishna Devadkar Official Resume"
              />
            </div>
          ) : (
            <div className="space-y-5 text-slate-300 text-xs sm:text-sm">
              {/* Summary */}
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                <h4 className="font-semibold text-white mb-1.5 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> Summary
                </h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Fresher with hands-on experience in frontend and web development. Passionate about building real-world
                  applications, learning new technologies, and delivering clean, user-focused solutions. Also fundamentals and
                  cloud-based development.
                </p>
              </div>

              {/* Education & Experience */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                  <h5 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-blue-400" /> Education
                  </h5>
                  <p className="text-xs font-semibold text-blue-300">Bachelor of Technology (Computer Science)</p>
                  <p className="text-xs text-slate-400 mt-1">Sanjay Ghodawat Institute</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                  <h5 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-purple-400" /> Experience (Internships)
                  </h5>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-semibold text-purple-300">Python AI & ML — Internship</p>
                      <p className="text-[11px] text-slate-400">Practical exposure to Python-based ML models, data preprocessing & evaluation techniques.</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-purple-300">Data Analytics — Internship</p>
                      <p className="text-[11px] text-slate-400">Data analytics with Python & SQL, data cleaning, analysis, and interactive dashboards.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Skills & Projects */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                  <h5 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <Code className="w-4 h-4 text-cyan-400" /> Technical Skills
                  </h5>
                  <div className="space-y-1.5 text-xs text-slate-400">
                    <p><strong className="text-slate-200">Languages:</strong> Python, JavaScript</p>
                    <p><strong className="text-slate-200">Web Technologies:</strong> HTML5, CSS3, Responsive Design</p>
                    <p><strong className="text-slate-200">Frameworks:</strong> Flask, React</p>
                    <p><strong className="text-slate-200">Databases:</strong> SQL, MongoDB compass</p>
                    <p><strong className="text-slate-200">Developer Tools:</strong> Git, GitHub, VS Code, Antigravity</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                  <h5 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" /> Key Projects
                  </h5>
                  <div className="space-y-2 text-xs">
                    <div>
                      <p className="font-semibold text-blue-300">Smart Kisan: Agricultural Platform</p>
                      <p className="text-[11px] text-slate-400">Data-driven agricultural guidance for farmers and rural youth with real-time processing.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-emerald-300">Health OPD: AI-Powered Virtual Assistant</p>
                      <p className="text-[11px] text-slate-400">Virtual assistant using NLP for real-time patient query resolution & dynamic conversational flows.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Certifications & Hackathons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                  <h5 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-400" /> Certifications
                  </h5>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-400">
                    <li>Python Programming – Skill India</li>
                    <li>Generative AI – Microsoft</li>
                    <li>JavaScript – Cisco Networking Academy</li>
                    <li>Prompt Engineering – IBM</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                  <h5 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-400" /> Hackathons
                  </h5>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-400">
                    <li>CodeRush 2.0 – Yeshwantrao Chavan College Of Engg, Nagpur</li>
                    <li>Inceptia Hackathon – Pimpri Chinchwad College of Engg, Pune</li>
                    <li>Hacknovate 2026 – Karmaveer Bhaurao Patil College of Engg, Satara</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* CTA Footer */}
          <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors font-medium text-xs sm:text-sm text-center"
            >
              Close
            </button>
            <a
              href="#contact"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-colors font-medium text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-700"
            >
              <ExternalLink className="w-4 h-4" /> Contact Directly
            </a>
            <a
              href="/api/resume"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-colors font-medium text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-700"
            >
              <ExternalLink className="w-4 h-4" /> Open PDF in New Tab
            </a>
            <a
              href="/api/resume"
              download="Krishna_Resume.pdf"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 text-white hover:opacity-95 transition-opacity font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
            >
              <Download className="w-4 h-4" /> Download Krishna_Resume.pdf
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
