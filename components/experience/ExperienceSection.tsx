'use client';

import { motion } from 'framer-motion';
import { EXPERIENCE_DATA } from '@/lib/constants';
import { Briefcase, Calendar, MapPin, CheckCircle2, Award } from 'lucide-react';

export default function ExperienceSection() {
  return (
    <section id="experience" className="py-24 relative overflow-hidden bg-slate-950/40">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full glass-card border border-purple-500/30 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Career Progression</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Work <span className="gradient-text">Experience</span>
          </h2>
          <p className="mt-4 text-slate-400 text-base sm:text-lg">
            Track record of building enterprise web products, leading dev teams, and engineering AI microservices.
          </p>
        </div>

        {/* Timeline Container */}
        <div className="relative max-w-4xl mx-auto">
          {/* Vertical Center/Left Timeline Line */}
          <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-600 via-purple-600 to-cyan-500 transform sm:-translate-x-1/2" />

          <div className="space-y-12">
            {EXPERIENCE_DATA.map((exp, idx) => {
              const isEven = idx % 2 === 0;
              return (
                <motion.div
                  key={exp.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.15 }}
                  className={`relative flex flex-col sm:flex-row items-start ${
                    isEven ? 'sm:flex-row-reverse' : ''
                  }`}
                >
                  {/* Glowing Node Marker */}
                  <div className="absolute left-4 sm:left-1/2 top-6 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-900 border-2 border-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/40 z-10">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                  </div>

                  {/* Card Content Container */}
                  <div className="ml-12 sm:ml-0 sm:w-1/2 sm:px-8 w-full">
                    <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 relative group hover:border-blue-500/40 transition-all duration-300">
                      
                      {/* Header Row */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                            {exp.logoText}
                          </div>
                          <div>
                            <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                              {exp.role}
                            </h3>
                            <span className="text-sm font-semibold text-purple-400">
                              {exp.company}
                            </span>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 text-xs font-mono border border-blue-500/20">
                          {exp.type}
                        </span>
                      </div>

                      {/* Date & Location */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mb-4 font-mono">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-400" />
                          {exp.period}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-purple-400" />
                          {exp.location}
                        </span>
                      </div>

                      <p className="text-slate-300 text-xs sm:text-sm mb-4 leading-relaxed">
                        {exp.description}
                      </p>

                      {/* Responsibilities */}
                      <div className="space-y-2 mb-4">
                        <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400 font-mono">
                          Key Contributions:
                        </h4>
                        {exp.responsibilities.map((resp, i) => (
                          <div key={i} className="flex items-start space-x-2 text-xs text-slate-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{resp}</span>
                          </div>
                        ))}
                      </div>

                      {/* Achievements */}
                      <div className="pt-3 border-t border-slate-800/80 mb-4">
                        {exp.achievements.map((ach, i) => (
                          <div key={i} className="flex items-center space-x-2 text-xs text-amber-300 font-medium">
                            <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{ach}</span>
                          </div>
                        ))}
                      </div>

                      {/* Skills Tags */}
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {exp.skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 text-[11px] font-mono border border-slate-800"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>

                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
