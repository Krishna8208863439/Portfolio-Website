'use client';

import { motion } from 'framer-motion';
import { SERVICES_DATA } from '@/lib/constants';
import { Layout, Brain, Server, Cloud, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { FaFigma } from 'react-icons/fa';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Layout,
  Brain,
  Server,
  Figma: FaFigma,
  Cloud,
  CheckCircle2,
};

export default function ServicesSection() {
  return (
    <section id="services" className="py-24 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full glass-card border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Specialized Capabilities</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Services & <span className="gradient-text">Solutions</span>
          </h2>
          <p className="mt-4 text-slate-400 text-base sm:text-lg">
            High-impact software engineering services tailored for startups, enterprise products, and founders.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SERVICES_DATA.map((srv, idx) => {
            const IconComp = iconMap[srv.iconName] || Layout;
            return (
              <motion.div
                key={srv.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="glass-card rounded-3xl p-8 border border-slate-800 flex flex-col justify-between group hover:border-blue-500/40 hover:-translate-y-1.5 transition-all duration-300"
              >
                <div>
                  {/* Icon */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 text-blue-400 w-fit mb-6 group-hover:scale-110 transition-transform">
                    <IconComp className="w-7 h-7" />
                  </div>

                  <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors mb-3">
                    {srv.title}
                  </h3>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
                    {srv.description}
                  </p>

                  {/* Feature Checklist */}
                  <div className="space-y-2 mb-6">
                    {srv.features.map((feat, i) => (
                      <div key={i} className="flex items-center space-x-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action CTA */}
                <div className="pt-4 border-t border-slate-800/80">
                  <a
                    href="#contact"
                    className="inline-flex items-center space-x-2 text-xs font-semibold text-blue-400 hover:text-white transition-colors group/link"
                  >
                    <span>Request This Service</span>
                    <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
