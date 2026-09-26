'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ExternalLink,
  Layers,
  CheckCircle2,
  X,
} from 'lucide-react';
import { FaGithub, FaLinkedin } from 'react-icons/fa';

import { PROJECTS_DATA } from '@/lib/constants';

interface ProjectItem {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  longDescription?: string;
  category: string;
  image: string;
  tags?: string[];
  technologies?: string[];
  liveUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  featured?: boolean;
}

const categories = ['All', 'Web', 'AI & ML', 'Full Stack', 'Backend & Cloud'] as const;

export default function ProjectsSection() {
  const [projects, setProjects] = useState<ProjectItem[]>(PROJECTS_DATA as ProjectItem[]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(12);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
    fetch(`${API_URL}/api/projects`)
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.projects || []);
        if (list.length > 0) {
          setProjects(list);
        }
      })
      .catch((err) => console.error('Failed to load projects:', err));
  }, []);

  // Reset pagination when category or search changes
  useEffect(() => {
    setVisibleCount(12);
  }, [activeCategory, searchQuery]);

  const filteredProjects = projects.filter((project) => {
    const pCat = project.category ? project.category.trim() : '';
    const matchesCategory =
      activeCategory === 'All'
        ? true
        : activeCategory === 'AI & ML'
        ? pCat === 'AI & ML' || pCat === 'AI' || pCat === 'Machine Learning'
        : activeCategory === 'Backend & Cloud'
        ? pCat === 'Backend & Cloud' || pCat === 'Backend' || pCat === 'Cloud'
        : pCat === activeCategory;

    const projectTags = project.tags || project.technologies || [];
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      projectTags.some((tech) => tech.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const displayedProjects = filteredProjects.slice(0, visibleCount);

  return (
    <section id="projects" className="py-24 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute bottom-10 left-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full glass-card border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Layers className="w-3.5 h-3.5" />
            <span>My Work &amp; Creations</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Featured <span className="gradient-text">Projects</span>
          </h2>
          <p className="mt-4 text-slate-400 text-base sm:text-lg">
            A comprehensive showcase of 100+ production web applications, intelligent AI models, and cloud microservices.
          </p>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          {/* Category Tabs */}
          <div className="flex overflow-x-auto no-scrollbar sm:flex-wrap gap-2 w-full md:w-auto pb-2 px-1">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-all duration-300 ${
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
              placeholder="Search 100 projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-card text-sm text-white placeholder-slate-400 border border-slate-700/60 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Project Counter Subtitle */}
        <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-6 px-1">
          <span>
            Showing <strong className="text-white">{displayedProjects.length}</strong> of{' '}
            <strong className="text-white">{filteredProjects.length}</strong> projects
          </span>
          {visibleCount < filteredProjects.length && (
            <button
              onClick={() => setVisibleCount(filteredProjects.length)}
              className="text-blue-400 hover:text-blue-300 transition-colors font-semibold"
            >
              Show all {filteredProjects.length} →
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-500 text-sm">
            Loading projects from database...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-sm border border-dashed border-slate-800 rounded-2xl">
            No projects match your filter.
          </div>
        ) : (
          <>
            {/* Projects Grid */}
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              <AnimatePresence>
                {displayedProjects.map((project) => (
                  <ProjectCard
                    key={project._id || project.id || project.title}
                    project={project}
                    onSelect={(p) => setSelectedProject(p)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Load More & Show All Controls */}
            {visibleCount < filteredProjects.length && (
              <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => setVisibleCount((prev) => Math.min(prev + 12, filteredProjects.length))}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
                >
                  Load More ({filteredProjects.length - visibleCount} more)
                </button>
                <button
                  onClick={() => setVisibleCount(filteredProjects.length)}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl glass-card text-slate-300 hover:text-white hover:bg-slate-800/80 font-semibold text-sm border border-slate-700/60 transition-all duration-300"
                >
                  View All {filteredProjects.length} Projects
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-white shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setSelectedProject(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors z-10"
              aria-label="Close project modal"
            >
              <X className="w-5 h-5" />
            </button>
            {selectedProject.image && (
              <div className="relative h-48 sm:h-60 w-full rounded-2xl overflow-hidden mb-4 border border-slate-800 bg-slate-950">
                <img
                  src={selectedProject.image}
                  alt={selectedProject.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
              </div>
            )}
            <h3 className="text-xl sm:text-2xl font-bold pr-8">{selectedProject.title}</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {selectedProject.longDescription || selectedProject.description}
            </p>

            <div className="pt-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Technologies Used</h4>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {(selectedProject.tags || selectedProject.technologies || []).map((t) => (
                  <span key={t} className="px-2.5 sm:px-3 py-1 bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-medium rounded-lg flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 pt-4 border-t border-slate-800">
              {selectedProject.liveUrl && (
                <a
                  href={selectedProject.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                >
                  <ExternalLink className="w-4 h-4" /> Live Preview
                </a>
              )}
              <a
                href={selectedProject.githubUrl || 'https://github.com/Krishna8208863439'}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 border border-slate-700"
              >
                <FaGithub className="w-4 h-4" /> GitHub Repository
              </a>
              <a
                href={selectedProject.linkedinUrl || 'https://www.linkedin.com/in/krishna-d-9489b632a'}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 bg-blue-700/80 hover:bg-blue-600 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 border border-blue-600/50"
              >
                <FaLinkedin className="w-4 h-4" /> LinkedIn Profile
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function ProjectCard({
  project,
  onSelect,
}: {
  project: ProjectItem;
  onSelect: (p: ProjectItem) => void;
}) {
  const projectTags = project.tags || project.technologies || [];
  const githubLink = project.githubUrl || 'https://github.com/Krishna8208863439';
  const linkedinLink = project.linkedinUrl || 'https://www.linkedin.com/in/krishna-d-9489b632a';
  const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80';

  const [imgSrc, setImgSrc] = useState(project.image || FALLBACK_IMAGE);

  useEffect(() => {
    if (project.image) {
      setImgSrc(project.image);
    }
  }, [project.image]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4 }}
      className="group relative glass-card rounded-2xl overflow-hidden border border-slate-800 hover:border-blue-500/40 transition-all duration-300 flex flex-col justify-between"
    >
      <div>
        {/* Project Image */}
        <div className="relative h-48 w-full overflow-hidden bg-slate-900">
          <Image
            src={imgSrc}
            alt={project.title}
            fill
            unoptimized={imgSrc.startsWith('http')}
            referrerPolicy="no-referrer"
            onError={() => setImgSrc(FALLBACK_IMAGE)}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/10 pointer-events-none" />
          <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-600/60 border border-blue-400/50 text-blue-200 backdrop-blur-md z-10">
            {project.category}
          </span>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
            {project.title}
          </h3>
          <p className="mt-2 text-slate-400 text-sm line-clamp-3 leading-relaxed">
            {project.description}
          </p>

          {/* Tech Tag Pills */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {projectTags.map((tech) => (
              <span
                key={tech}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700/50"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Card Footer Links */}
      <div className="p-6 pt-0 flex items-center justify-between border-t border-slate-800/60 mt-4">
        <button
          onClick={() => onSelect(project)}
          className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
        >
          View Details
        </button>

        <div className="flex items-center space-x-2">
          <a
            href={githubLink}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="GitHub Repository"
          >
            <FaGithub className="w-4 h-4" />
          </a>
          <a
            href={linkedinLink}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 transition-colors"
            title="LinkedIn Profile"
          >
            <FaLinkedin className="w-4 h-4" />
          </a>
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 transition-colors"
              title="Live Demo"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
