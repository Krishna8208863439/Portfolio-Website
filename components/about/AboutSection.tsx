'use client';

import { motion } from 'framer-motion';
import { PERSONAL_INFO, HIGHLIGHT_STATS } from '@/lib/constants';
import { Code, FolderCheck, Cpu, Award, Sparkles, Target, Compass, CheckCircle2 } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  Code,
  FolderCheck,
  Cpu,
  Award,
};

export default function AboutSection() {
  return (
    <section id="about" className="py-24 relative overflow-hidden">
      {/* Background Subtle Glow */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full glass-card border border-purple-500/30 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Discover My Journey</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            About <span className="gradient-text">Me</span>
          </h2>
          <p className="mt-4 text-slate-400 text-base sm:text-lg">
            Engineering robust web systems, intelligent AI pipelines, and intuitive user experiences.
          </p>
        </div>

        {/* Highlight Cards Grid (Animated Stats) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {HIGHLIGHT_STATS.map((stat, idx) => {
            const IconComponent = iconMap[stat.iconName] || Code;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="glass-card rounded-2xl p-6 relative overflow-hidden group border border-slate-800"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <span className="text-3xl sm:text-4xl font-extrabold text-white font-poppins">
                    {stat.value}{stat.suffix}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-white mb-1">{stat.label}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{stat.description}</p>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </motion.div>
            );
          })}
        </div>

        {/* Detailed Bio & Career Goals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Detailed Bio */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 glass-panel rounded-3xl p-8 border border-slate-800 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                  <Compass className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-white">Full Stack & AI Specialist</h3>
              </div>
              
              <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed">
                <p>{PERSONAL_INFO.longBio}</p>
                <p>
                  I specialize in building full-stack applications leveraging modern stacks like <strong className="text-white">Next.js 15, React 19, TypeScript</strong>, combined with high-performance backends written in <strong className="text-white">Node.js, Python, FastAPI</strong>, and cloud databases (<strong className="text-white">MongoDB, PostgreSQL</strong>).
                </p>
                <p>
                  My goal is to create products that feel instantaneous, highly accessible, visually memorable, and backed by production-grade automated testing and cloud microservice deployment.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800 grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-400 block font-mono">Location</span>
                <span className="text-sm font-semibold text-white">{PERSONAL_INFO.location}</span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-400 block font-mono">Status</span>
                <span className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Available for Hire
                </span>
              </div>
            </div>
          </motion.div>

          {/* Career Goals & Focus */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 glass-panel rounded-3xl p-8 border border-slate-800 flex flex-col justify-between bg-gradient-to-b from-slate-900/80 to-slate-950/80"
          >
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-white">Career Focus & Goals</h3>
              </div>

              <div className="space-y-4">
                {[
                  {
                    title: 'Next-Gen Web Architecture',
                    desc: 'Pushing boundaries with Next.js App Router, Server Components, and zero-bundle-size optimizations.',
                  },
                  {
                    title: 'Generative AI & Computer Vision',
                    desc: 'Fine-tuning multimodal ML models and embedding intelligence into everyday software workflows.',
                  },
                  {
                    title: 'Scalable Microservices',
                    desc: 'Architecting resilient Docker microservices with caching layers for ultra-fast response times.',
                  },
                  {
                    title: 'Delightful UX & Micro-interactions',
                    desc: 'Creating high-craft interfaces inspired by Stripe, Linear, Apple, and Vercel.',
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start space-x-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800/80">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
