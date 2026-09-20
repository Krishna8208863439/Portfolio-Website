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
        <div className="flex overflow-x-auto no-scrollbar sm:flex-wrap sm:justify-center gap-2 sm:gap-3 mb-12 pb-2 px-1">
          {categories.map((category) => {
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-300 shrink-0 ${
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

              return (
                <motion.div
                  key={skill.name}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.25 }}
                  whileHover={{ y: -3 }}
                  className="glass-card rounded-2xl p-4 border border-slate-800 hover:border-blue-500/40 hover:bg-slate-900/70 transition-all duration-300 relative group overflow-hidden flex items-center justify-between gap-3 shadow-sm hover:shadow-blue-500/10"
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    {/* Icon Container */}
                    <div className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/60 text-blue-400 group-hover:text-cyan-400 group-hover:scale-110 transition-all duration-300 shadow-inner shrink-0">
                      <IconComp className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>

                    {/* Skill Info */}
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-blue-300 transition-colors truncate">
                        {skill.name}
                      </h3>
                      <span className="text-xs text-slate-400 font-mono">
                        {skill.category}
                      </span>
                    </div>
                  </div>

                  {/* Subtle accent indicator */}
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-cyan-400 transition-colors shrink-0" />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

      </div>
    </section>
  );
}
