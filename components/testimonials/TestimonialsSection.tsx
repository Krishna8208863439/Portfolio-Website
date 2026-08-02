'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { TESTIMONIALS_DATA } from '@/lib/constants';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS_DATA.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? TESTIMONIALS_DATA.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS_DATA.length);
  };

  const currentTestimonial = TESTIMONIALS_DATA[currentIndex];

  return (
    <section id="testimonials" className="py-24 relative overflow-hidden bg-slate-950/40">
      {/* Glow Backdrop */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full glass-card border border-purple-500/30 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Quote className="w-3.5 h-3.5" />
            <span>Client Endorsements</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Client <span className="gradient-text">Testimonials</span>
          </h2>
          <p className="mt-4 text-slate-400 text-base sm:text-lg">
            Feedback from engineering leaders, startup founders, and product directors.
          </p>
        </div>

        {/* Testimonial Carousel */}
        <div className="max-w-4xl mx-auto relative">
          <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-slate-800 relative overflow-hidden shadow-2xl">
            
            <Quote className="absolute top-6 right-8 w-20 h-20 text-slate-800/40 pointer-events-none" />

            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4 }}
                className="relative z-10 flex flex-col items-center text-center space-y-6"
              >
                {/* Star Rating */}
                <div className="flex items-center space-x-1">
                  {[...Array(currentTestimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Review Quote */}
                <p className="text-base sm:text-xl text-slate-200 font-medium leading-relaxed italic max-w-2xl">
                  &quot;{currentTestimonial.review}&quot;
                </p>

                {/* Author Info */}
                <div className="flex flex-col items-center space-y-2 pt-4">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-blue-500/40 shadow-md">
                    <Image
                      src={currentTestimonial.avatar}
                      alt={currentTestimonial.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{currentTestimonial.name}</h3>
                    <p className="text-xs text-purple-400 font-mono">
                      {currentTestimonial.role} at <span className="text-cyan-400">{currentTestimonial.company}</span>
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Controls */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-800/80">
              <div className="flex items-center space-x-2">
                {TESTIMONIALS_DATA.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      currentIndex === idx ? 'w-8 bg-blue-500' : 'w-2 bg-slate-700 hover:bg-slate-500'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrev}
                  aria-label="Previous Testimonial"
                  className="p-2.5 rounded-xl glass-card text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNext}
                  aria-label="Next Testimonial"
                  className="p-2.5 rounded-xl glass-card text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
