import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Search, Filter, Sparkles, Star, ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageWrapper } from '../components/PageWrapper';
import { SEO } from '../components/SEO';
import { WERSEE_COURSES } from '../data/wersee-courses';

export const Learn = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  return (
    <PageWrapper>
      <SEO title="Wersee Learn - Student Education" description="Free world-class education for students." />
      
      <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#050505] pt-24 pb-32">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 text-xs font-bold uppercase tracking-widest mb-4">
                Student Portal
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tight text-gray-900 dark:text-white mb-4">
                Wersee Learn
              </h1>
              <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl">
                Access your free courses and continue your learning journey.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-6 py-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl w-full sm:w-80 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              <button className="p-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/10 transition-all">
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Categories */}
          <div className="flex gap-3 overflow-x-auto pb-8 no-scrollbar">
            {['All', 'Business', 'Marketing', 'Product', 'Sales', 'Growth'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-3 rounded-full font-bold text-sm whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-black text-white dark:bg-white dark:text-black shadow-lg' : 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Course Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {WERSEE_COURSES.map((course, idx) => {
              const Icon = course.icon;
              return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => navigate(`/dashboard?view=course-player_${course.id}`)}
                className="group bg-white dark:bg-[#0A0A0A] rounded-[2.5rem] overflow-hidden border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img src={course.image} alt={course.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                  <div className="absolute top-4 right-4">
                    <div className={`w-10 h-10 rounded-xl ${course.color} flex items-center justify-center text-white shadow-lg`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <div className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest">
                      {course.duration}
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-[#0A0A0A] bg-gray-200 overflow-hidden">
                          <img src={`https://i.pravatar.cc/150?u=${course.id}${i}`} alt="Student" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500 font-bold">+{course.students.toLocaleString()} students</span>
                  </div>

                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight group-hover:text-blue-600 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 line-clamp-2">
                    {course.description}
                  </p>

                  <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-white/10">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm font-bold">{course.rating}</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-600 font-bold text-sm uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                      Start <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )})}
          </div>

          {/* Empty State / More Coming Soon */}
          <div className="mt-24 p-12 rounded-[3rem] bg-white dark:bg-[#0A0A0A] border border-dashed border-gray-200 dark:border-white/20 text-center">
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white mb-2">More Courses Coming Soon</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              We're working with top educators to bring you even more free learning resources. Stay tuned!
            </p>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};
