'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { PROJECTS_DATA } from '@/lib/constants';
import { Project } from '@/types/portfolio';
import {
  Search,
  ExternalLink,
  Layers,
  CheckCircle2,
  X,
  FileText,
} from 'lucide-react';
import { FaGithub } from 'react-icons/fa';

const categories = ['All', 'Web', 'AI', 'Mobile', 'Full Stack', 'Machine Learning'] as const;

export default function ProjectsSection() {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const filteredProjects = PROJECTS_DATA.filter((project) => {
    const matchesCategory =
      activeCategory === 'All' ? true : project.category === activeCategory;
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.technologies.some((tech) =>
        tech.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesCategory && matchesSearch;
  });

  return (
    <section id="projects" className="py-24 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute bottom-10 left-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full glass-card border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Layers className="w-3.5 h-3.5" />
            <span>Featured Portfolio</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Featured <span className="gradient-text">Projects</span>
          </h2>
          <p className="mt-4 text-slate-400 text-base sm:text-lg">
            Production-ready web apps, artificial intelligence platforms, and high-concurrency microservices.
          </p>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-12">
          {/* Category Tabs */}
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
                  activeCategory === category
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25 border border-blue-400/30'
                    : 'glass-card text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search projects or tech..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl glass-card text-sm text-white placeholder-slate-400 border border-slate-700/60 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Projects Grid */}
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <AnimatePresence>
            {filteredProjects.map((project) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                className="glass-card rounded-3xl border border-slate-800 overflow-hidden flex flex-col group hover:-translate-y-1.5 transition-all duration-300"
              >
                {/* Project Artwork Image */}
                <div className="relative w-full h-52 overflow-hidden bg-slate-900">
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  
                  {/* Category Pill */}
                  <span className="absolute top-4 right-4 px-3 py-1 rounded-full glass-panel text-[11px] font-bold text-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
                    {project.category}
                  </span>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors flex items-center justify-between">
                      <span>{project.title}</span>
                      {project.featured && (
                        <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                          Featured
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-purple-400 font-medium mt-0.5">{project.subtitle}</p>
                    <p className="text-slate-300 text-xs sm:text-sm mt-3 line-clamp-3 leading-relaxed">
                      {project.description}
                    </p>
                  </div>

                  {/* Tech Stack Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {project.technologies.slice(0, 5).map((tech) => (
                      <span
                        key={tech}
                        className="px-2.5 py-0.5 rounded-md bg-slate-900 text-slate-300 text-[11px] font-mono border border-slate-800"
                      >
                        {tech}
                      </span>
                    ))}
                    {project.technologies.length > 5 && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 text-[11px] font-mono">
                        +{project.technologies.length - 5}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedProject(project)}
                      className="px-3.5 py-2 rounded-xl bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 text-xs font-semibold border border-blue-500/30 transition-colors flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" /> Case Study
                    </button>

                    <div className="flex items-center space-x-2">
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="GitHub Repository"
                        className="p-2 rounded-xl glass-card text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        <FaGithub className="w-4 h-4" />
                      </a>
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Live Project Demo"
                        className="p-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 transition-opacity shadow-md"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-400 text-base">No projects match your search criteria.</p>
          </div>
        )}

      </div>

      {/* Case Study Detail Modal */}
      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-3xl glass-panel rounded-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto border border-slate-700/60 shadow-2xl"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-mono border border-blue-500/30 uppercase">
                    {selectedProject.category}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
                    {selectedProject.title}
                  </h3>
                  <p className="text-sm text-purple-400 font-medium">{selectedProject.subtitle}</p>
                </div>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Artwork */}
              <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden my-6 border border-slate-800">
                <Image
                  src={selectedProject.image}
                  alt={selectedProject.title}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Extended Description */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Overview</h4>
                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                    {selectedProject.longDescription}
                  </p>
                </div>

                {/* Key Features */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">Key Features & Innovations</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedProject.features.map((feature, i) => (
                      <div key={i} className="flex items-start space-x-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                        <span className="text-xs sm:text-sm text-slate-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Technologies */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">Tech Stack Used</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.technologies.map((tech) => (
                      <span key={tech} className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs font-mono">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* CTA Footer */}
              <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  onClick={() => setSelectedProject(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium"
                >
                  Close
                </button>
                <a
                  href={selectedProject.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-slate-800 text-white hover:bg-slate-700 text-sm font-medium flex items-center gap-2 border border-slate-700"
                >
                  <FaGithub className="w-4 h-4" /> GitHub Code
                </a>
                <a
                  href={selectedProject.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-blue-500/25"
                >
                  <ExternalLink className="w-4 h-4" /> Live Demo
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
