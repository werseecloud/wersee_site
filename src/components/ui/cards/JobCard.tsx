import React from 'react';
import { motion } from 'motion/react';
import { Briefcase, MapPin, DollarSign, Clock, ChevronRight, CheckCircle2, Bookmark, MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';

interface JobCardProps {
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    salary: string;
    type: string;
    postedAt: string;
    logo_url?: string;
    description?: string;
    tags?: string[];
    author?: {
      name: string;
      avatar_url?: string;
    };
  };
  variant?: 'default' | 'freelance';
}

export const JobCard: React.FC<JobCardProps> = ({ job, variant = 'default' }) => {
  if (variant === 'freelance') {
    return (
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className="w-full bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0">
              {job.author?.avatar_url ? (
                <img src={job.author.avatar_url} alt={job.author.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
                  {job.author?.name?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">{job.author?.name || 'User'}</h4>
              <p className="text-xs text-gray-500">Posted {job.postedAt || 'recently'}</p>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600 transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {job.tags?.slice(0, 3).map((tag, idx) => (
            <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
              {tag}
            </span>
          )) || (
            <>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">UIUX</span>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">Product Designer</span>
            </>
          )}
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">{job.title}</h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-6 flex-1">
          {job.description || 'Looking for a talented professional to join our team and help build amazing products.'}
        </p>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900">{job.salary || '$199/hr'}</span>
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider rounded-md">
              {job.type || 'Hourly'}
            </span>
          </div>
          <Link 
            to={`/listing/${job.id}`}
            className="px-6 py-2.5 bg-black text-white rounded-full text-sm font-bold hover:bg-gray-800 transition-colors active:scale-95"
          >
            Apply now
          </Link>
        </div>
      </motion.div>
    );
  }

  // Default (Apple-style dark card)
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="w-full bg-[#1C1C1E] p-6 rounded-3xl border border-white/5 shadow-sm hover:border-white/10 transition-all duration-300 flex flex-col"
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-black border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
            {job.logo_url ? (
              <img src={job.logo_url} alt={job.company} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl">
                {job.company?.charAt(0) || 'C'}
              </div>
            )}
          </div>
          <div>
            <h4 className="text-base font-bold text-white">{job.company}</h4>
            <p className="text-xs text-gray-400">{job.postedAt || '30 min ago'}</p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-white transition-colors">
          <Bookmark className="w-5 h-5" />
        </button>
      </div>

      <h3 className="text-xl font-bold text-white mb-3">{job.title}</h3>
      
      <div className="flex flex-wrap gap-2 mb-6">
        <span className="px-3 py-1.5 bg-white/5 text-gray-300 text-xs font-medium rounded-lg border border-white/5">
          {job.tags?.[0] || '+3 Years'}
        </span>
        <span className="px-3 py-1.5 bg-white/5 text-gray-300 text-xs font-medium rounded-lg border border-white/5">
          {job.type || 'Full-time'}
        </span>
      </div>

      <div className="flex items-end justify-between mt-auto pt-4 border-t border-white/5">
        <div>
          <div className="text-xl font-bold text-white mb-1">{job.salary || '$80 - 110K'}</div>
          <div className="text-sm text-gray-400">{job.location || 'Mountain View, CA'}</div>
        </div>
        <Link 
          to={`/listing/${job.id}`}
          className="px-5 py-2.5 bg-[#FFEFE5] text-black rounded-xl text-sm font-bold hover:bg-white transition-colors active:scale-95"
        >
          Apply Now
        </Link>
      </div>
    </motion.div>
  );
};
