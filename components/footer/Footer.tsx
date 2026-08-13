'use client';

import { NAV_ITEMS, PERSONAL_INFO } from '@/lib/constants';
import { Code2, ArrowUp, ShieldCheck } from 'lucide-react';
import { FaGithub, FaLinkedin } from 'react-icons/fa';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-slate-950 border-t border-slate-800/80 pt-16 pb-12 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pb-12 border-b border-slate-800/80">
          
          {/* Brand Col */}
          <div className="space-y-4">
            <a href="#home" className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 text-white shadow-lg">
                <Code2 className="w-5 h-5" />
              </div>
              <span className="font-bold text-xl text-white">
                Krishna
              </span>
            </a>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm">
              Crafting high-performance Next.js applications, AI vision systems, and robust cloud APIs. Dedicated to exceptional UX and production-grade engineering.
            </p>
            <div className="flex items-center space-x-3 pt-2">
              {[
                { icon: FaGithub, href: PERSONAL_INFO.github, label: 'GitHub' },
                { icon: FaLinkedin, href: PERSONAL_INFO.linkedin, label: 'LinkedIn' },
              ].map((social) => {
                const IconComp = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="p-2 rounded-lg glass-card text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <IconComp className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 gap-8 md:justify-items-end">
            <div>
              <h4 className="text-xs uppercase tracking-widest font-mono text-slate-300 font-bold mb-4">
                Navigation
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
                {NAV_ITEMS.slice(0, 3).map((item) => (
                  <li key={item.name}>
                    <a href={item.href} className="hover:text-blue-400 transition-colors">
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-widest font-mono text-slate-300 font-bold mb-4">
                Portfolio
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
                {NAV_ITEMS.slice(3).map((item) => (
                  <li key={item.name}>
                    <a href={item.href} className="hover:text-purple-400 transition-colors">
                      {item.name}
                    </a>
                  </li>
                ))}
                <li>
                  <a href="/admin" className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 font-semibold pt-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Admin Portal
                  </a>
                </li>
              </ul>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-3 font-mono">
            <span>© {new Date().getFullYear()} Krishna Devadkar. All rights reserved.</span>
            <a
              href="/admin"
              className="inline-flex items-center gap-1 text-slate-400 hover:text-blue-400 transition-colors"
              title="Admin Login"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Admin Portal
            </a>
          </div>

          <button
            onClick={scrollToTop}
            className="flex items-center space-x-2 p-2.5 rounded-xl glass-card text-slate-300 hover:text-white hover:bg-slate-800 transition-colors border border-slate-800"
            aria-label="Back to top"
          >
            <span className="font-mono text-[11px]">Back to top</span>
            <ArrowUp className="w-4 h-4 text-blue-400" />
          </button>
        </div>

      </div>
    </footer>
  );
}
