'use client';

import { motion } from 'framer-motion';
import { EDUCATION_DATA } from '@/lib/constants';
import { GraduationCap, CheckCircle2 } from 'lucide-react';

export default function EducationSection() {
  return (
    <section id="education" className="py-24 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/3 right-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full glass-card border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Academic Background</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Education & <span className="gradient-text">Qualifications</span>
          </h2>
          <p className="mt-4 text-slate-400 text-base sm:text-lg">
            Strong foundation in Computer Science and Software Engineering.
          </p>
        </div>

        {/* Centered Cards Container */}
        <div className="flex justify-center max-w-3xl mx-auto">
          {EDUCATION_DATA.map((edu, idx) => (
            <motion.div
              key={edu.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              className="glass-card rounded-3xl p-8 sm:p-10 border border-slate-800 relative group text-center flex flex-col items-center justify-center w-full hover:border-purple-500/40 transition-all duration-300 shadow-2xl"
            >
              <div>
                {/* Score Badge Centered */}
                {edu.score && (
                  <div className="mb-4 inline-block">
                    <span className="px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs sm:text-sm font-bold border border-emerald-500/20 font-mono">
                      {edu.score}
                    </span>
                  </div>
                )}

                {/* Degree & Field */}
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white group-hover:text-purple-300 transition-colors">
                  {edu.degree}
                </h3>
                {edu.field && (
                  <p className="text-base font-semibold text-blue-400 mt-2">{edu.field}</p>
                )}

                {/* Institution */}
                {edu.institution && (
                  <p className="font-semibold text-slate-200 text-lg mt-3 font-mono">
                    {edu.institution}
                  </p>
                )}

                {/* Period & Location */}
                {(edu.period || edu.location) && (
                  <div className="mt-3 flex items-center justify-center gap-4 text-xs text-slate-400 font-mono">
                    {edu.period && <span>{edu.period}</span>}
                    {edu.location && <span>{edu.location}</span>}
                  </div>
                )}

                {/* Academic Highlights */}
                {edu.achievements && edu.achievements.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-slate-800/80 space-y-2.5 max-w-lg mx-auto">
                    <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400 font-mono mb-3">
                      Honors & Accomplishments:
                    </h4>
                    {edu.achievements.map((ach, i) => (
                      <div key={i} className="flex items-center justify-center space-x-2 text-xs sm:text-sm text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>{ach}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
