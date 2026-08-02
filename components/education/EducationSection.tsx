'use client';

import { motion } from 'framer-motion';
import { EDUCATION_DATA } from '@/lib/constants';
import { GraduationCap, Calendar, MapPin, Award, CheckCircle2 } from 'lucide-react';

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
            Strong foundation in Computer Science, Artificial Intelligence, and Machine Learning algorithms.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {EDUCATION_DATA.map((edu, idx) => (
            <motion.div
              key={edu.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 relative group flex flex-col justify-between hover:border-purple-500/40 transition-all duration-300"
            >
              <div>
                {/* Top Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 font-mono">
                    {edu.score}
                  </span>
                </div>

                {/* Degree & Field */}
                <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                  {edu.degree}
                </h3>
                <p className="text-sm font-semibold text-blue-400 mt-1">{edu.field}</p>

                {/* Institution & Location */}
                <div className="mt-3 space-y-1 text-xs text-slate-400 font-mono">
                  <p className="font-semibold text-slate-300 text-sm">{edu.institution}</p>
                  <div className="flex items-center gap-4 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-purple-400" />
                      {edu.period}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      {edu.location}
                    </span>
                  </div>
                </div>

                {/* Academic Highlights */}
                <div className="mt-6 pt-4 border-t border-slate-800 space-y-2">
                  <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400 font-mono">
                    Honors & Accomplishments:
                  </h4>
                  {edu.achievements.map((ach, i) => (
                    <div key={i} className="flex items-start space-x-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <span>{ach}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1 font-mono">
                  <Award className="w-4 h-4 text-amber-400" /> First Class Distinction
                </span>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
