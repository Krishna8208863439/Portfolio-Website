'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { PERSONAL_INFO } from '@/lib/constants';
import { ContactFormData } from '@/types/portfolio';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { FaGithub, FaLinkedin, FaInstagram, FaTwitter } from 'react-icons/fa';

export default function ContactSection() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setStatus('error');
      setErrorMessage('Please fill out all required fields (Name, Email, Message).');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const resData = await response.json();

      if (response.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });

        // Trigger confetti celebration
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } else {
        setStatus('error');
        setErrorMessage(resData.message || 'Failed to send message. Please try again.');
      }
    } catch {
      setStatus('error');
      setErrorMessage('Network error occurred. Please try again later.');
    }
  };

  return (
    <section id="contact" className="py-24 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full glass-card border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Mail className="w-3.5 h-3.5" />
            <span>Get In Touch</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Contact <span className="gradient-text">Me</span>
          </h2>
          <p className="mt-4 text-slate-400 text-base sm:text-lg">
            Have a project in mind, need technical consultation, or want to discuss AI integrations? Let&apos;s connect!
          </p>
        </div>

        {/* Contact Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Contact Details & Interactive Map Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 space-y-6"
          >
            <div className="glass-panel rounded-3xl p-8 border border-slate-800 space-y-6">
              <h3 className="text-2xl font-bold text-white">Contact Information</h3>

              <div className="space-y-4">
                <a
                  href={`mailto:${PERSONAL_INFO.email}`}
                  className="flex items-start space-x-4 p-3.5 rounded-2xl glass-card border border-slate-800 hover:border-blue-500/40 transition-colors group"
                >
                  <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-slate-400 font-mono block">Direct Email</span>
                    <span className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                      {PERSONAL_INFO.email}
                    </span>
                  </div>
                </a>

                <a
                  href={`tel:${PERSONAL_INFO.phone.replace(/\s+/g, '')}`}
                  className="flex items-start space-x-4 p-3.5 rounded-2xl glass-card border border-slate-800 hover:border-purple-500/40 transition-colors group"
                >
                  <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-slate-400 font-mono block">Phone / WhatsApp</span>
                    <span className="text-sm font-semibold text-white group-hover:text-purple-400 transition-colors">
                      {PERSONAL_INFO.phone}
                    </span>
                  </div>
                </a>

                <div className="flex items-start space-x-4 p-3.5 rounded-2xl glass-card border border-slate-800">
                  <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-slate-400 font-mono block">Location</span>
                    <span className="text-sm font-semibold text-white">{PERSONAL_INFO.location}</span>
                  </div>
                </div>
              </div>

              {/* Social Channels */}
              <div className="pt-4 border-t border-slate-800">
                <span className="text-xs uppercase tracking-widest text-slate-400 font-mono block mb-3">
                  Follow & Connect:
                </span>
                <div className="flex items-center space-x-3">
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
                        className="p-3 rounded-xl glass-card text-slate-400 hover:text-white hover:bg-blue-600/20 hover:border-blue-500/40 transition-all"
                      >
                        <IconComp className="w-5 h-5" />
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 glass-panel rounded-3xl p-8 border border-slate-800 relative"
          >
            <h3 className="text-2xl font-bold text-white mb-2">Send a Message</h3>
            <p className="text-xs sm:text-sm text-slate-400 mb-6">
              Fill out the form below. I will respond to your inquiry within 24 hours.
            </p>

            {status === 'success' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 text-center space-y-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl"
              >
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-xl font-bold text-white">Message Sent Successfully!</h4>
                <p className="text-sm text-slate-300">
                  Thank you for reaching out. A confirmation email has been logged and I will contact you shortly!
                </p>
                <button
                  onClick={() => setStatus('idle')}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 text-white font-semibold text-xs border border-slate-700 hover:bg-slate-700"
                >
                  Send Another Message
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 font-mono mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="e.g. Alex Morgan"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl glass-card text-sm text-white placeholder-slate-400 border border-slate-700/60 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 font-mono mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="e.g. alex@company.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl glass-card text-sm text-white placeholder-slate-400 border border-slate-700/60 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 font-mono mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="e.g. +1 555 019 2831"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl glass-card text-sm text-white placeholder-slate-400 border border-slate-700/60 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 font-mono mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      name="subject"
                      placeholder="e.g. Project Consultation"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl glass-card text-sm text-white placeholder-slate-400 border border-slate-700/60 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 font-mono mb-1">
                    Project Details / Message *
                  </label>
                  <textarea
                    name="message"
                    required
                    rows={5}
                    placeholder="Tell me about your project scope, goals, or timeline..."
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl glass-card text-sm text-white placeholder-slate-400 border border-slate-700/60 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                {/* Error Banner */}
                {status === 'error' && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center space-x-2 text-xs text-rose-300">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Message...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>

        </div>

      </div>
    </section>
  );
}
