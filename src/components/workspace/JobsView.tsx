import React, { useState, useEffect } from 'react';
import { DatabaseService } from '../../services/databaseService';
import { Plus, Trash2, Briefcase, Users, TrendingUp, Search, Filter, MoreVertical, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { JobCard } from '../ui/cards/JobCard';
import { CreateJobModal } from '../modals/CreateJobModal';

import { destructiveAction } from '@/lib/feedback';
export const JobsView = ({ user }: { user: any }) => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalApplicants: 0,
    activeListings: 0
  });

  useEffect(() => {
    fetchJobs();
  }, [user]);

  const fetchJobs = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await DatabaseService.get('listings', {
        eq: { user_id: user.id, type: 'job' },
        order: { column: 'created_at', ascending: false }
      }) as any[];
          
      if (data) {
        setJobs(data);
        // Fetch applicants for these jobs
        const jobIds = data.map(j => j.id);
        if (jobIds.length > 0) {
          const applicants = await DatabaseService.get('orders', {
            in: { column: 'listing_id', values: jobIds }
          }) as any[];
          setStats({
            totalJobs: data.length,
            totalApplicants: applicants?.length || 0,
            activeListings: data.filter(j => j.status === 'active').length || data.length
          });
        } else {
          setStats({
            totalJobs: 0,
            totalApplicants: 0,
            activeListings: 0
          });
        }
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await destructiveAction({ description: 'Are you sure you want to delete this job listing?' }))) return;
    try {
      await DatabaseService.delete('listings', id);
      fetchJobs();
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  };

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-8 pb-32">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="md:hidden space-y-2">
          <h1 className="text-4xl font-black text-white tracking-tighter leading-none">Business & Jobs</h1>
          <p className="text-gray-500 text-sm font-medium">Manage your team and opportunities</p>
        </div>
        <div className="hidden md:block">
          <h1 className="text-4xl font-black text-[#1D1D1F] tracking-tight mb-2">Job Management</h1>
          <p className="text-gray-500 font-medium">Create and manage your business opportunities.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full md:w-auto px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" /> Post New Job
        </motion.button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 md:gap-6">
        {[
          { label: 'Jobs', value: stats.totalJobs, icon: Briefcase, color: 'bg-blue-500' },
          { label: 'Applicants', value: stats.totalApplicants, icon: Users, color: 'bg-purple-500' },
          { label: 'Active', value: stats.activeListings, icon: TrendingUp, color: 'bg-emerald-500' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-3 md:p-6 bg-[#141414] md:bg-white rounded-2xl md:rounded-[2rem] border border-white/5 md:border-black/5 shadow-sm flex flex-col items-center md:items-start text-center md:text-left gap-2 md:gap-4"
          >
            <div className={`w-8 h-8 md:w-14 md:h-14 rounded-xl md:rounded-2xl ${stat.color} flex items-center justify-center text-white shadow-lg shrink-0`}>
              <stat.icon className="w-4 h-4 md:w-7 md:h-7" />
            </div>
            <div>
              <p className="text-[8px] md:text-sm font-black text-gray-500 md:text-gray-400 uppercase tracking-[0.2em]">{stat.label}</p>
              <p className="text-lg md:text-3xl font-black text-white md:text-gray-900">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search listings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-[#141414] md:bg-white text-white md:text-black rounded-2xl border border-white/5 md:border-black/5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
          />
        </div>
        <button className="px-6 py-4 bg-[#141414] md:bg-white rounded-2xl border border-white/5 md:border-black/5 flex items-center justify-center gap-2 font-bold text-gray-400 md:text-gray-600 hover:bg-white/5 md:hover:bg-gray-50 transition-all">
          <Filter className="w-5 h-5" /> Filters
        </button>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        <AnimatePresence mode="popLayout">
          {filteredJobs.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-100"
            >
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Briefcase className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-500 max-w-xs mx-auto">
                Try adjusting your search or create a new job listing to get started.
              </p>
            </motion.div>
          ) : (
            filteredJobs.map((job, i) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="group relative"
              >
                <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <button className="p-2 bg-white/90 backdrop-blur rounded-xl shadow-lg hover:bg-white text-gray-600 transition-all">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(job.id)}
                    className="p-2 bg-white/90 backdrop-blur rounded-xl shadow-lg hover:bg-red-50 text-red-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <JobCard job={{
                  id: job.id,
                  title: job.title,
                  company: job.metadata?.company_name || 'Your Business',
                  location: job.metadata?.location || 'Remote',
                  salary: `€${job.price}`,
                  type: job.category || 'Full-time',
                  postedAt: new Date(job.created_at).toLocaleDateString(),
                  logo_url: job.image_url
                }} />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <CreateJobModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchJobs}
        userId={user.id}
      />
    </div>
  );
};
