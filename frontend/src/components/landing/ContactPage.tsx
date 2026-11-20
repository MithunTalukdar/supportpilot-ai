import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, Sparkles } from 'lucide-react';
import { PaperPlaneIllustration } from '../common/IllustrationGraphics.js';
import { Button } from '../ui/Button.js';

interface ContactPageProps {
  onBackToHome: () => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onBackToHome }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    }, 600);
  };

  return (
    <div className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 font-sans">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-400">
        <button onClick={onBackToHome} className="hover:text-violet-400 transition-colors cursor-pointer">
          Home
        </button>
        <span>&gt;</span>
        <span className="text-white font-semibold">Contact</span>
      </nav>

      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-600/15 border border-violet-500/30 text-xs font-semibold text-violet-300 shadow-glow">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span>We&apos;re Here to Help Your Team Scale</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Get in <span className="gradient-text-violet">Touch</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          We&apos;d love to hear from you. Send us a message and our enterprise support solutions team will respond promptly.
        </p>
      </div>

      {/* Contact Grid: Left Contact Info + Paper Plane, Right Form (From Reference Mockup) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start max-w-5xl mx-auto">
        {/* Left Column: Details + 3D Paper Plane */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-4">
            {/* Email Card */}
            <div className="p-4 rounded-2xl glass-card border border-white/5 flex items-center gap-4 hover:border-violet-500/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-violet-600/15 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-medium">Email</div>
                <a
                  href="mailto:hello@supportpilot.com"
                  className="text-xs sm:text-sm font-semibold text-white hover:text-violet-300 transition-colors"
                >
                  hello@supportpilot.com
                </a>
              </div>
            </div>

            {/* Phone Card */}
            <div className="p-4 rounded-2xl glass-card border border-white/5 flex items-center gap-4 hover:border-violet-500/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-violet-600/15 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-medium">Phone</div>
                <a
                  href="tel:+919876543210"
                  className="text-xs sm:text-sm font-semibold text-white hover:text-violet-300 transition-colors"
                >
                  +91 98765 43210
                </a>
              </div>
            </div>

            {/* Location Card */}
            <div className="p-4 rounded-2xl glass-card border border-white/5 flex items-center gap-4 hover:border-violet-500/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-violet-600/15 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-medium">Location</div>
                <div className="text-xs sm:text-sm font-semibold text-white">
                  Kolkata, India
                </div>
              </div>
            </div>
          </div>

          {/* 3D Paper Plane Illustration */}
          <div className="pt-2 flex justify-center">
            <PaperPlaneIllustration />
          </div>
        </div>

        {/* Right Column: Contact Form */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl glass-card-interactive border border-violet-500/25 shadow-glow-card relative">
          {submitted ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-glow-emerald">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">Message Sent Successfully!</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Thank you for reaching out to SupportPilot. Our team has received your message and will get back to you shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Your Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Mithun Talukdar"
                  required
                  className="w-full bg-navy-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Your Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. name@company.com"
                  required
                  className="w-full bg-navy-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Your Message
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  placeholder="How can we assist your support automation operations?..."
                  required
                  className="w-full bg-navy-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors resize-none"
                />
              </div>

              <Button
                type="submit"
                size="md"
                variant="primary"
                className="w-full shadow-glow-violet"
                isLoading={loading}
                rightIcon={<Send className="w-4 h-4" />}
              >
                Send Message &rarr;
              </Button>

              <p className="text-[10px] text-slate-500 text-center mt-2">
                We value your privacy. Your inquiry is cryptographically protected and never shared.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
