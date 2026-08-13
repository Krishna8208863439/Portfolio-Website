'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { PERSONAL_INFO } from '@/lib/constants';
import ResumeModal from '@/components/ui/ResumeModal';
import {
  Mail,
  FileText,
  FolderDot,
  Send,
  ChevronDown,
  Sparkles,
  Zap,
} from 'lucide-react';
import { FaGithub, FaLinkedin, FaInstagram } from 'react-icons/fa';

export default function HeroSection() {
  const [currentRoleIndex, setCurrentRoleIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [availableForHire, setAvailableForHire] = useState<boolean>(true);
  const [projectCount, setProjectCount] = useState<number>(3);

  // Fetch status badge and dynamic project count from DB
  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.availableForHire === 'boolean') {
          setAvailableForHire(data.availableForHire);
        }
      })
      .catch(() => setAvailableForHire(true));

    fetch('/api/projects')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProjectCount(data.length);
        }
      })
      .catch(() => setProjectCount(3));
  }, []);

  // Typing animation effect
  useEffect(() => {
    const roles = PERSONAL_INFO.roles;
    const targetText = roles[currentRoleIndex];
    let typingSpeed = isDeleting ? 40 : 80;

    if (!isDeleting && displayedText === targetText) {
      typingSpeed = 2000;
      const timeout = setTimeout(() => setIsDeleting(true), typingSpeed);
      return () => clearTimeout(timeout);
    } else if (isDeleting && displayedText === '') {
      const timeout = setTimeout(() => {
        setIsDeleting(false);
        setCurrentRoleIndex((prev) => (prev + 1) % roles.length);
      }, 200);
      return () => clearTimeout(timeout);
    }

    const timeout = setTimeout(() => {
      setDisplayedText((prev) =>
        isDeleting
          ? targetText.substring(0, prev.length - 1)
          : targetText.substring(0, prev.length + 1)
      );
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, currentRoleIndex]);

  return (
    <section
      id="home"
      className="relative min-h-screen pt-28 pb-16 flex items-center justify-center overflow-hidden"
    >
      {/* Background Animated Blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none animate-blob -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none animate-blob animation-delay-2000 -z-10" />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none animate-blob animation-delay-4000 -z-10" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headline & Bio */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6"
          >
            {/* Greeting Badge with Dynamic Status */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full glass-card border border-blue-500/30 text-blue-400 text-xs sm:text-sm font-medium shadow-inner">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
              <span>
                {availableForHire ? 'Open to opportunities 👋' : 'Hi 👋 Welcome to my portfolio'}
              </span>
            </div>

            {/* Main Title */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight">
              I&apos;m{' '}
              <span className="gradient-text font-poppins">
                {PERSONAL_INFO.name}
              </span>
            </h1>

            {/* Rotating Typing Animation */}
            <div className="h-12 sm:h-16 flex items-center justify-center lg:justify-start">
              <span className="text-xl sm:text-3xl font-bold text-slate-300 font-mono">
                {displayedText}
                <span className="typing-cursor" />
              </span>
            </div>

            {/* Brief Bio */}
            <p className="text-slate-300 text-base sm:text-lg max-w-2xl leading-relaxed">
              {PERSONAL_INFO.bio}
            </p>

            {/* CTA Buttons */}
            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 w-full sm:w-auto">
              <a
                href="/api/resume"
                download="Final_Resume.pdf"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 flex items-center justify-center gap-2 group"
              >
                <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>Download Resume</span>
              </a>

              <a
                href="#projects"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl glass-card text-white hover:bg-slate-800/80 font-semibold text-sm border border-slate-700/60 transition-all duration-300 flex items-center justify-center gap-2 group"
              >
                <FolderDot className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                <span>View Projects ({projectCount})</span>
              </a>

              <a
                href="#contact"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl glass-card text-slate-300 hover:text-white hover:bg-blue-600/20 font-semibold text-sm border border-blue-500/30 transition-all duration-300 flex items-center justify-center gap-2 group"
              >
                <Send className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                <span>Contact Me</span>
              </a>
            </div>

            {/* Social Links */}
            <div className="pt-6 flex items-center space-x-4">
              <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Connect:</span>
              <div className="flex items-center space-x-3">
                {[
                  { icon: FaGithub, href: PERSONAL_INFO.github, label: 'GitHub' },
                  { icon: FaLinkedin, href: PERSONAL_INFO.linkedin, label: 'LinkedIn' },
                ].map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="p-2.5 rounded-xl glass-card text-slate-400 hover:text-white hover:bg-blue-600/20 hover:border-blue-500/40 transition-all duration-300"
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Right Column: Avatar Photo with Overlay Stat Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="lg:col-span-5 flex justify-center relative"
          >
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96">
              {/* Outer Glowing Rings */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-600 via-purple-600 to-cyan-400 animate-spin opacity-40 blur-xl" style={{ animationDuration: '12s' }} />
              <div className="absolute -inset-2 rounded-full border border-blue-500/30 animate-pulse" />

              {/* Profile Image Container */}
              <div className="relative w-full h-full rounded-full p-2.5 glass-panel overflow-hidden border-2 border-blue-500/40 shadow-2xl shadow-blue-500/20">
                <div className="relative w-full h-full rounded-full overflow-hidden bg-slate-900">
                  <Image
                    src="/images/user_profile.png"
                    alt={PERSONAL_INFO.name}
                    fill
                    sizes="(max-width: 768px) 256px, 384px"
                    priority
                    className="object-cover object-top scale-105 hover:scale-110 transition-transform duration-700"
                  />
                </div>
              </div>

              {/* Floating Badge 1: Dynamic Status */}
              <motion.div
                animate={{ y: [-8, 8, -8] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-4 -right-4 px-4 py-2 rounded-2xl glass-panel border border-blue-500/40 shadow-xl flex items-center space-x-2 text-xs font-semibold text-white"
              >
                <div className={`w-2.5 h-2.5 rounded-full ${availableForHire ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                <span>{availableForHire ? 'Open to Opportunities' : 'Currently Employed'}</span>
              </motion.div>

              {/* Floating Badge 2: Computed Projects Count */}
              <motion.div
                animate={{ y: [8, -8, 8] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-4 -left-4 px-4 py-2.5 rounded-2xl glass-panel border border-purple-500/40 shadow-xl flex items-center space-x-2.5 text-xs font-semibold text-white"
              >
                <Zap className="w-4 h-4 text-cyan-400" />
                <div>
                  <span className="block text-[10px] text-slate-400">Live Projects</span>
                  <span className="text-purple-300 font-bold">{projectCount}+ Projects Done</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator Down */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mt-16 sm:mt-24 flex justify-center"
        >
          <a
            href="#about"
            className="flex flex-col items-center space-y-2 text-slate-400 hover:text-white transition-colors"
          >
            <span className="text-xs uppercase tracking-widest font-mono">Scroll Down</span>
            <div className="p-2 rounded-full glass-card border border-slate-700">
              <ChevronDown className="w-4 h-4 text-blue-400" />
            </div>
          </a>
        </motion.div>
      </div>

      {/* Resume Modal */}
      <ResumeModal isOpen={resumeOpen} onClose={() => setResumeOpen(false)} />
    </section>
  );
}
