import React from 'react';
import { motion } from 'framer-motion';
import { 
  Compass, Map, Code, Layout, TrendingUp, 
  ArrowRight, Clock, Star, Users, Zap, 
  ChevronRight, Sparkles
} from 'lucide-react';

export const LearningPaths: React.FC = () => {
  const paths = [
    {
      id: 'full-stack',
      title: 'Full-Stack Mastery',
      desc: 'Master modern web development from frontend to backend with hands-on projects.',
      icon: Code,
      color: 'bg-indigo-500/20 text-indigo-400',
      duration: '12 Weeks',
      rating: 4.9,
      students: '12.4k',
      difficulty: 'Intermediate',
      modules: 24
    },
    {
      id: 'product-design',
      title: 'Product Design & UX',
      desc: 'Learn to build beautiful, user-centric interfaces that solve real-world problems.',
      icon: Layout,
      color: 'bg-purple-500/20 text-purple-400',
      duration: '8 Weeks',
      rating: 4.8,
      students: '8.2k',
      difficulty: 'Beginner',
      modules: 16
    },
    {
      id: 'growth-marketing',
      title: 'Growth & Analytics',
      desc: 'Scale your business with data-driven marketing strategies and growth hacking.',
      icon: TrendingUp,
      color: 'bg-emerald-500/20 text-emerald-400',
      duration: '10 Weeks',
      rating: 4.7,
      students: '15.1k',
      difficulty: 'Advanced',
      modules: 20
    },
    {
      id: 'ai-engineering',
      title: 'AI & Machine Learning',
      desc: 'Integrate advanced AI models into your applications and build smart systems.',
      icon: Zap,
      color: 'bg-amber-500/20 text-amber-400',
      duration: '14 Weeks',
      rating: 4.9,
      students: '5.6k',
      difficulty: 'Advanced',
      modules: 28
    }
  ];

  return (
    <div className="max-w-7xl mx-auto py-16 px-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-20">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-6">
            <Compass className="w-4 h-4 text-indigo-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Your Journey Starts Here</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-black text-white leading-[0.9] tracking-tighter mb-6">
            Curated <br />
            <span className="text-indigo-400">Learning Paths.</span>
          </h1>
          <p className="text-xl text-gray-400 leading-relaxed">
            Expertly designed roadmaps to help you master new skills and build the future. Choose your path and start learning today.
          </p>
        </div>
        <div className="flex items-center gap-4 pb-2">
          <div className="text-right">
            <p className="text-2xl font-black text-white">40k+</p>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Active Learners</p>
          </div>
          <div className="w-px h-10 bg-white/10" />
          <div className="text-right">
            <p className="text-2xl font-black text-white">98%</p>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Success Rate</p>
          </div>
        </div>
      </div>

      {/* Paths Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
        {paths.map((path, i) => (
          <motion.div 
            key={path.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group relative p-10 bg-[#141414] border border-white/10 rounded-[3.5rem] hover:border-white/20 transition-all overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-125 transition-transform duration-500">
              <path.icon className="w-48 h-48 text-white" />
            </div>

            <div className="relative z-10">
              <div className={`w-14 h-14 ${path.color} rounded-2xl flex items-center justify-center mb-8 shadow-lg`}>
                <path.icon className="w-7 h-7" />
              </div>

              <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{path.difficulty}</span>
                <div className="w-1 h-1 rounded-full bg-gray-700" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{path.modules} Modules</span>
              </div>

              <h3 className="text-3xl font-black text-white mb-4 tracking-tight">{path.title}</h3>
              <p className="text-gray-400 leading-relaxed mb-10 max-w-sm">{path.desc}</p>

              <div className="grid grid-cols-3 gap-4 mb-10">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Duration</span>
                  </div>
                  <p className="text-sm font-black text-white">{path.duration}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <Star className="w-3.5 h-3.5 text-yellow-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Rating</span>
                  </div>
                  <p className="text-sm font-black text-white">{path.rating}/5.0</p>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Students</span>
                  </div>
                  <p className="text-sm font-black text-white">{path.students}</p>
                </div>
              </div>

              <button className="w-full py-5 bg-white/5 border border-white/10 rounded-[2rem] text-white font-black uppercase tracking-widest text-xs hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3 active:scale-95">
                Explore Path <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Featured Section */}
      <div className="p-12 md:p-20 bg-[#0F0F0F] border border-white/5 rounded-[4rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-20 opacity-10">
          <Sparkles className="w-64 h-64 text-indigo-400" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">New Feature</span>
            </div>
            <h2 className="text-5xl font-black text-white mb-6 leading-tight tracking-tighter">AI-Powered Roadmaps</h2>
            <p className="text-xl text-gray-400 mb-10 leading-relaxed">
              Let our AI analyze your goals and create a personalized learning path just for you. No more guessing what to learn next.
            </p>
            <button className="px-10 py-5 bg-indigo-500 text-white rounded-[2rem] font-black uppercase tracking-widest text-sm hover:bg-indigo-400 transition-all active:scale-95 shadow-2xl shadow-indigo-500/20">
              Generate My Path
            </button>
          </div>
          <div className="w-full md:w-1/3 aspect-square bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-[3rem] border border-white/10 flex items-center justify-center">
            <Map className="w-32 h-32 text-indigo-400 opacity-50" />
          </div>
        </div>
      </div>
    </div>
  );
};
