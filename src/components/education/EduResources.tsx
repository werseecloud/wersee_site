import React from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, FileText, Video, Download, 
  Search, ArrowRight, Bookmark, Share2, 
  Filter, Sparkles, Zap, ShieldCheck
} from 'lucide-react';

export const EduResources: React.FC = () => {
  const resources = [
    {
      id: 'guide-1',
      title: 'The Ultimate Guide to AI Workspaces',
      type: 'Guide',
      desc: 'Learn how to optimize your workflow with AI-powered tools and automation.',
      icon: BookOpen,
      color: 'bg-indigo-500/20 text-indigo-400',
      tag: 'Featured'
    },
    {
      id: 'template-1',
      title: 'Business Growth Template Pack',
      type: 'Template',
      desc: 'A complete set of workspace templates to scale your business operations.',
      icon: FileText,
      color: 'bg-purple-500/20 text-purple-400',
      tag: 'New'
    },
    {
      id: 'video-1',
      title: 'Mastering Wersee: Advanced Tips',
      type: 'Video',
      desc: 'A deep dive into the most powerful features of the Wersee platform.',
      icon: Video,
      color: 'bg-emerald-500/20 text-emerald-400',
      tag: 'Popular'
    },
    {
      id: 'whitepaper-1',
      title: 'The Future of Collaborative Learning',
      type: 'Whitepaper',
      desc: 'Research and insights on how technology is changing the way we learn.',
      icon: Download,
      color: 'bg-amber-500/20 text-amber-400',
      tag: 'Research'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto py-16 px-6">
      {/* Search & Header */}
      <div className="flex flex-col items-center text-center mb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-8">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Knowledge Hub</span>
          </div>
          <h1 className="text-7xl md:text-8xl font-black text-white leading-[0.85] tracking-tighter mb-10">
            Educational <br />
            <span className="text-indigo-400">Resources.</span>
          </h1>
          <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto mb-12">
            Access a vast library of guides, templates, and videos to help you succeed. Everything you need to master Wersee and beyond.
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto w-full group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
            <input 
              type="text"
              placeholder="Search resources, guides, templates..."
              className="w-full bg-[#141414] border border-white/10 rounded-[2.5rem] py-6 pl-16 pr-8 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-lg shadow-2xl"
            />
          </div>
        </motion.div>
      </div>

      {/* Categories */}
      <div className="flex items-center justify-center gap-4 mb-16 overflow-x-auto no-scrollbar pb-4">
        {['All Resources', 'Guides', 'Templates', 'Videos', 'Whitepapers', 'Case Studies'].map((cat, i) => (
          <button 
            key={i}
            className={`px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              i === 0 ? 'bg-white text-black' : 'bg-white/5 text-gray-500 hover:text-white border border-white/5'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
        {resources.map((res, i) => (
          <motion.div 
            key={res.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="group p-10 bg-[#141414] border border-white/10 rounded-[3.5rem] hover:border-white/20 transition-all flex flex-col md:flex-row gap-8 items-start"
          >
            <div className={`w-20 h-20 shrink-0 ${res.color} rounded-[2rem] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500`}>
              <res.icon className="w-10 h-10" />
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{res.type}</span>
                  <div className="w-1 h-1 rounded-full bg-gray-700" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{res.tag}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-600 hover:text-white transition-colors"><Bookmark className="w-4 h-4" /></button>
                  <button className="p-2 text-gray-600 hover:text-white transition-colors"><Share2 className="w-4 h-4" /></button>
                </div>
              </div>

              <h3 className="text-2xl font-black text-white mb-4 tracking-tight group-hover:text-indigo-400 transition-colors">{res.title}</h3>
              <p className="text-gray-400 leading-relaxed mb-8">{res.desc}</p>

              <button className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white group-hover:gap-4 transition-all">
                Access Resource <ArrowRight className="w-4 h-4 text-indigo-400" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Newsletter Section */}
      <div className="p-12 md:p-20 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 rounded-[4rem] text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 p-20 opacity-5">
          <Zap className="w-64 h-64 text-indigo-400" />
        </div>
        <div className="relative z-10 max-w-xl mx-auto">
          <h2 className="text-4xl font-black text-white mb-6 tracking-tight">Stay ahead of the curve.</h2>
          <p className="text-lg text-gray-400 mb-10 leading-relaxed">Get the latest resources, guides, and tips delivered straight to your inbox every week.</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <input 
              type="email"
              placeholder="Enter your email"
              className="flex-1 bg-black/40 border border-white/10 rounded-[2rem] py-5 px-8 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
            <button className="px-10 py-5 bg-white text-black rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all active:scale-95 shadow-2xl">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
