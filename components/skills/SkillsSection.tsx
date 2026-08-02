'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SKILLS_DATA } from '@/lib/constants';
import {
  FileCode,
  Palette,
  Zap,
  ShieldCheck,
  Atom,
  Layers,
  Wind,
  Server,
  Workflow,
  Terminal,
  Flame,
  Cpu,
  Database,
  HardDrive,
  Table,
  BrainCircuit,
  Sparkles,
  Eye,
  Activity,
  Network,
  Cloud,
  Triangle,
  Globe,
  Box,
  GitBranch,
  Code2,
  Send,
  Star,
} from 'lucide-react';
import { FaGithub, FaFigma } from 'react-icons/fa';

const iconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
  FileCode,
  Palette,
  Zap,
  ShieldCheck,
  Atom,
  Layers,
  Wind,
  Server,
  Workflow,
  Terminal,
  Flame,
  Cpu,
  Database,
  HardDrive,
  Table,
  BrainCircuit,
  Sparkles,
  Eye,
  Activity,
  Network,
  Cloud,
  Triangle,
  Globe,
  Box,
  GitBranch,
  Github: FaGithub,
  Code2,
  Send,
  Figma: FaFigma,
};

const categories = ['All', 'Frontend', 'Backend', 'Database', 'AI', 'Cloud', 'Tools'] as const;

export default function SkillsSection() {
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const filteredSkills = SKILLS_DATA.filter((skill) =>
    activeCategory === 'All' ? true : skill.category === activeCategory
  );

  return (
    <section id="skills" className="py-24 relative overflow-hidden bg-slate-950/40">
      {/* Glow Backdrop */}
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full glass-card border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Cpu className="w-3.5 h-3.5" />
            <span>Technical Mastery</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Skills & <span className="gradient-text">Technologies</span>
          </h2>
          <p className="mt-4 text-slate-400 text-base sm:text-lg">
            Comprehensive toolkit spanning full-stack frameworks, machine learning systems, databases, and DevOps tools.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-12">
          {categories.map((category) => {
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25 border border-blue-400/30'
                    : 'glass-card text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        {/* Skills Grid */}
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <AnimatePresence>
            {filteredSkills.map((skill) => {
              const IconComp = iconComponents[skill.iconName] || Cpu;
              const radius = 24;
              const circumference = 2 * Math.PI * radius;
              const strokeDashoffset = circumference - (skill.level / 100) * circumference;

              return (
                <motion.div
                  key={skill.name}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="glass-card rounded-2xl p-5 border border-slate-800 relative group overflow-hidden"
                >
                  {/* Popular Badge */}
                  {skill.popular && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>Core</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-4 mb-4">
                    {/* Icon Container */}
                    <div className="p-3 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/60 text-blue-400 group-hover:text-cyan-400 group-hover:scale-110 transition-all duration-300 shadow-inner">
                      <IconComp className="w-6 h-6" />
                    </div>

                    {/* Skill Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-white truncate">{skill.name}</h3>
                      <span className="text-xs text-slate-400 font-mono">{skill.category}</span>
                    </div>

                    {/* Circular Percentage Ring */}
                    <div className="relative w-14 h-14 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="28"
                          cy="28"
                          r={radius}
                          stroke="currentColor"
                          strokeWidth="4"
                          className="text-slate-800"
                          fill="transparent"
                        />
                        <circle
                          cx="28"
                          cy="28"
                          r={radius}
                          stroke="url(#gradient)"
                          strokeWidth="4"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          className="transition-all duration-1000 ease-out"
                          fill="transparent"
                        />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#2563eb" />
                            <stop offset="100%" stopColor="#06b6d4" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <span className="absolute text-[11px] font-extrabold text-white font-mono">
                        {skill.level}%
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Progress Bar */}
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${skill.level}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-400 rounded-full"
                    />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

      </div>
    </section>
  );
}
