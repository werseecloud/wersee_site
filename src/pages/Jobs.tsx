import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Briefcase, MapPin, DollarSign, Clock, Filter, ChevronRight, CheckCircle2, ArrowLeft, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { motion, AnimatePresence } from 'motion/react';

export const Jobs = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('listings')
          .select('*, profiles!listings_seller_id_fkey(username, full_name, avatar_url)')
          .eq('type', 'job')
          .order('created_at', { ascending: false });

        if (searchQuery) {
          query = query.ilike('title', `%${searchQuery}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        
        if (data) {
          setJobs(data);
        }
      } catch (error) {
        console.error('Error fetching jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-indigo-500/30">
      <SEO 
        title="Jobs - Wersee" 
        description="Find your next opportunity on Wersee. Browse job listings from top creators and businesses."
      />

      {/* Background Accents */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        {/* Header Section */}
        <div className="mb-12">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back</span>
          </motion.button>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                  <Briefcase className="w-6 h-6 text-indigo-400" />
                </div>
                <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black uppercase tracking-widest text-indigo-400">
                  Opportunities
                </span>
              </div>
              <h1 className="text-5xl sm:text-6xl font-black tracking-tighter text-white mb-4 leading-none">
                Jobs on <span className="text-indigo-400">Wersee</span>
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl font-medium">
                Discover your next big career move. Work with the world's most innovative creators and businesses.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto"
            >
              <div className="relative flex-1 sm:w-80 w-full group">
                <div className="absolute inset-0 bg-indigo-500/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                <input 
                  type="text"
                  placeholder="Search roles, skills, or companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-[#141414]/80 backdrop-blur-xl border border-white/10 rounded-2xl outline-none focus:border-indigo-500/50 transition-all text-white placeholder:text-gray-500"
                />
              </div>
              <button className="p-4 bg-[#141414]/80 backdrop-blur-xl border border-white/10 rounded-2xl hover:border-white/20 transition-all group">
                <Filter className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
              </button>
            </motion.div>
          </div>
        </div>

        {/* Content Section */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32"
            >
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-500 font-medium animate-pulse">Finding the best opportunities...</p>
            </motion.div>
          ) : jobs.length > 0 ? (
            <motion.div 
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 gap-6"
            >
              {jobs.map((job, i) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link 
                    to={`/jobs/${job.id}/apply`}
                    className="group relative block p-8 bg-[#141414]/60 backdrop-blur-xl border border-white/5 rounded-[2.5rem] hover:border-indigo-500/30 transition-all duration-500 overflow-hidden"
                  >
                    {/* Hover Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-8">
                      {/* Logo/Icon */}
                      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gray-800 to-gray-900 shrink-0 overflow-hidden flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform duration-500 shadow-2xl">
                        {job.images?.[0] ? (
                          <img src={job.images[0]} alt={job.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full bg-indigo-500/10 flex items-center justify-center">
                            <Briefcase className="w-10 h-10 text-indigo-500/50" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <h3 className="text-2xl sm:text-3xl font-bold text-white group-hover:text-indigo-400 transition-colors truncate">
                            {job.title}
                          </h3>
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                            <CheckCircle2 className="w-3 h-3" />
                            Verified
                          </div>
                          {i === 0 && (
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                              <Sparkles className="w-3 h-3" />
                              Featured
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm sm:text-base text-gray-400 font-medium">
                          <div className="flex items-center gap-2 group/creator">
                            <div className="w-6 h-6 rounded-full bg-gray-800 overflow-hidden border border-white/10">
                              <img src={job.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${job.seller_id}`} alt="Creator" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <span className="text-gray-300">{job.profiles?.full_name || job.profiles?.username}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span>{job.metadata?.location || 'Remote'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-emerald-500" />
                            <span className="text-emerald-400 font-bold">{job.price > 0 ? `€${job.price}/hr` : 'Competitive'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span>{new Date(job.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action */}
                      <div className="shrink-0 flex items-center gap-4">
                        <div className="hidden sm:block text-right">
                          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Apply by</p>
                          <p className="text-sm text-white font-bold">Next Week</p>
                        </div>
                        <div className="px-8 py-4 bg-white text-black rounded-2xl font-black text-lg group-hover:bg-indigo-500 group-hover:text-white group-hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all duration-500 flex items-center gap-2">
                          Apply Now
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-32 bg-[#141414]/40 backdrop-blur-xl rounded-[3rem] border border-white/5"
            >
              <div className="w-24 h-24 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/5">
                <Briefcase className="w-12 h-12 text-gray-600" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4 tracking-tight">No jobs found</h3>
              <p className="text-gray-400 text-lg max-w-md mx-auto leading-relaxed">
                We couldn't find any jobs matching your search. Try adjusting your filters or check back later.
              </p>
              <button 
                onClick={() => setSearchQuery('')}
                className="mt-8 px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all"
              >
                Clear Search
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
