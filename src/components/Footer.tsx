import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Instagram, Github, Linkedin, ArrowRight, Sparkles, ChevronDown, GraduationCap, Globe, Shield, Zap, Heart, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Footer = () => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (id: string) => {
    setOpenDropdown(openDropdown === id ? null : id);
  };

  const footerSections = [
    {
      id: 'marketplace',
      title: 'Marketplace',
      icon: Zap,
      links: [
        { label: 'Courses', to: '/search?category=Education' },
        { label: 'Digital Assets', to: '/search?category=Digital' },
        { label: 'Physical Products', to: '/search?category=Physical' },
        { label: 'Services', to: '/search?category=Services' },
        { label: 'Earn with Wersee', to: '/earn', highlight: true }
      ]
    },
    {
      id: 'school',
      title: 'Wersee for School',
      icon: GraduationCap,
      links: [
        { label: 'Next Gen Creator', to: '/next-gen', highlight: true },
        { label: 'Student Discount', to: '/edu/student' },
        { label: 'Campus Program', to: '/edu/campus' },
        { label: 'Learning Paths', to: '/edu/paths' },
        { label: 'Edu Resources', to: '/edu/resources' }
      ]
    },
    {
      id: 'services',
      title: 'Services',
      icon: Shield,
      links: [
        { label: 'Wersee Sovereign', to: '/sovereign', highlight: true },
        { label: 'Custom App Build', to: '/custom-app-build' },
        { label: 'Enterprise Solutions', to: '/enterprise' },
        { label: '📱 Download App', to: '/download', highlight: true }
      ]
    },
    {
      id: 'kids',
      title: 'Wersee Kids',
      icon: Sparkles,
      links: [
        { label: 'Next Gen Creator', to: '/next-gen', highlight: true },
        { label: 'Kids Mode (0-12)', to: '/next-gen' },
        { label: 'Safety Controls', to: '/safety-controls' },
        { label: 'Educational Games', to: '/edu-games' },
        { label: 'Guardian Portal', to: '/guardian-portal' }
      ]
    },
    {
      id: 'resources',
      title: 'Resources',
      icon: Globe,
      links: [
        { label: 'Join Discord', href: 'https://discord.gg/GVCkJ4m8fK', external: true },
        { label: 'Creators', to: '/creators' },
        { label: 'Treasure', to: '/treasure' },
        { label: 'Bot Guide', to: '/bot-guide', highlight: true },
        { label: 'System Status', to: '/status' },
        { label: 'About Us', to: '/about', highlight: true },
        { label: 'Roadmap', to: '/roadmap' },
        { label: 'Invoices', to: '/invoices' },
        { label: 'Payout Info', to: '/payout-info' },
        { label: 'Fees & Plans', to: '/fees-plans' },
        { label: 'Help Center', to: '/support' },
        { label: 'Developers', to: '/community/docs' }
      ]
    }
  ];

  return (
    <footer className="bg-[#050505] text-white pt-24 pb-12 border-t border-white/5 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Section: Brand & Newsletter */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
          <div className="space-y-8">
            <Link to="/" className="flex items-center gap-4 group inline-flex">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 blur-xl rounded-full group-hover:bg-white/40 transition-colors" />
                <div className="w-14 h-14 bg-white rounded-[1.25rem] flex items-center justify-center relative z-10 group-hover:rotate-6 transition-transform duration-500">
                  <img 
                    src="https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/business_logos/a1e58d3a96480df827eafe98567353d2-removebg-preview.png" 
                    alt="Wersee Logo" 
                    className="w-9 h-9 object-contain invert"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-4xl font-black tracking-tighter uppercase italic">WERSEE</span>
                <span className="text-[10px] font-black tracking-[0.4em] text-white/30 uppercase -mt-1">Premium Digital Ecosystem</span>
              </div>
            </Link>
            <p className="text-gray-400 leading-relaxed font-medium text-lg max-w-md">
              The premium marketplace for digital creators, professionals, and visionaries. Build your future today.
            </p>
            <div className="flex gap-3">
              {[
                { icon: Twitter, href: "https://x.com/wersee" },
                { icon: Instagram, href: "https://instagram.com/wersee" },
                { icon: Github, href: "https://github.com/wersee" },
                { icon: Linkedin, href: "https://linkedin.com/company/wersee" }
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white hover:text-black hover:scale-110 transition-all duration-300"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-sm">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-4">Stay in the loop</h3>
            <p className="text-gray-400 font-medium mb-6">Get the latest drops, feature updates, and creator spotlights directly to your inbox.</p>
            <form className="relative group">
              <input 
                type="email" 
                placeholder="Enter your email address" 
                className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-300 text-sm font-medium"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-white text-black rounded-xl flex items-center justify-center hover:bg-gray-200 hover:scale-105 active:scale-95 transition-all duration-300 shadow-xl shadow-white/5">
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>

        {/* Middle Section: Streamlined Dropdown Navigation */}
        <div className="py-12 border-y border-white/5 mb-12" ref={dropdownRef}>
          <div className="flex flex-col md:flex-row flex-wrap gap-4 justify-center">
            {footerSections.map((section) => {
              const isOpen = openDropdown === section.id;
              return (
                <div key={section.id} className="relative">
                  <button
                    onClick={() => toggleDropdown(section.id)}
                    className={`w-full md:w-auto flex items-center justify-between gap-3 px-6 py-4 rounded-2xl border transition-all duration-300 ${
                      isOpen 
                        ? 'bg-white/10 border-white/20 text-white' 
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <section.icon className={`w-5 h-5 ${isOpen ? 'text-blue-400' : ''}`} />
                      <span className="font-bold tracking-wide">{section.title}</span>
                    </div>
                    <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown className="w-4 h-4 opacity-50" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-full left-0 md:left-1/2 md:-translate-x-1/2 mb-4 w-full md:w-64 bg-[#0A0A0B] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                      >
                        <div className="p-2">
                          {section.links.map((link, i) => (
                            <div key={i}>
                              {link.external ? (
                                <a
                                  href={link.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                                >
                                  {link.label}
                                </a>
                              ) : (
                                <Link
                                  to={link.to || '#'}
                                  onClick={() => setOpenDropdown(null)}
                                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                                    link.highlight 
                                      ? 'text-blue-400 hover:bg-blue-500/10' 
                                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                                  }`}
                                >
                                  {link.label}
                                  {link.highlight && <Sparkles className="w-3 h-3" />}
                                </Link>
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {/* All Pages Button */}
            <Link
              to="/pages"
              className="w-full md:w-auto flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-white/10 text-white font-bold tracking-wide hover:bg-white/10 transition-all duration-300"
            >
              <LayoutGrid className="w-5 h-5 text-blue-400" />
              Platform Directory
            </Link>
          </div>
        </div>

        {/* Bottom Section: Legal */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 opacity-40">
              <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-[10px] font-black text-black">W</div>
              <span className="text-[10px] font-black tracking-[0.3em] uppercase">Wersee</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">
              &copy; {new Date().getFullYear()} All rights reserved
            </span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
            {[
              { label: 'Terms', to: '/terms' },
              { label: 'Privacy', to: '/privacy' },
              { label: 'Transparency', to: '/transparency' },
              { label: 'Cookies', to: '/cookies' },
              { label: 'Imprint', to: '/imprint' },
              { label: 'Disclaimer', to: '/disclaimer' }
            ].map((link, i) => (
              <Link 
                key={i}
                to={link.to} 
                className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-white transition-all duration-300"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-700">
            Made with <Heart className="w-3 h-3 text-red-500/50" /> for creators
          </div>
        </div>
      </div>
    </footer>
  );
};
