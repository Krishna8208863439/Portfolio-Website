'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Camera, Image as ImageIcon } from 'lucide-react';

const GALLERY_ITEMS = [
  {
    title: 'Hackathon Innovation Award Presentation',
    category: 'Events & Awards',
    src: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
    aspect: 'aspect-video',
  },
  {
    title: 'Nexus AI System Dashboard Interface',
    category: 'Project Screenshots',
    src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    aspect: 'aspect-square',
  },
  {
    title: 'Tech Tech-Talk & Workshop Keynote',
    category: 'Public Speaking',
    src: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80',
    aspect: 'aspect-square',
  },
  {
    title: 'DevPulse Telemetry Aggregation System',
    category: 'Architecture Diagrams',
    src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
    aspect: 'aspect-video',
  },
  {
    title: 'CloudVault Distributed Storage Portal',
    category: 'Project Screenshots',
    src: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
    aspect: 'aspect-video',
  },
  {
    title: 'Engineering Team Sprint Collaboration',
    category: 'Team Work',
    src: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
    aspect: 'aspect-square',
  },
];

export default function GallerySection() {
  return (
    <section id="gallery" className="py-20 bg-slate-950/60 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Camera className="w-4 h-4" />
            Visual Portfolio
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Gallery &amp; Screenshots
          </h2>
          <p className="mt-3 text-slate-400 text-base">
            Highlights from hackathons, public tech talks, and interface screenshots.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {GALLERY_ITEMS.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/60 shadow-lg hover:border-blue-500/40 transition-all duration-300"
            >
              <div className={`relative w-full ${item.aspect} overflow-hidden`}>
                <Image
                  src={item.src}
                  alt={item.title}
                  fill
                  loading="lazy"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
              </div>
              <div className="absolute bottom-0 inset-x-0 p-5">
                <span className="inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-blue-600/30 border border-blue-400/30 text-blue-300 rounded-md mb-1.5">
                  {item.category}
                </span>
                <h4 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                  {item.title}
                </h4>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
