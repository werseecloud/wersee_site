import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Briefcase, Users, Zap, Search, Filter, Plus, ChevronRight, Clock, MapPin, Building2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Skeleton } from '../ui/Skeleton';
import { useListingWizard } from '../../context/ListingWizardContext';

export const BusinessJobsView = ({ user, onNavigate }: { user: any, onNavigate?: (view: string) => void }) => {
  const { openWizard } = useListingWizard();
  const [activeTab, setActiveTab] = useState<'listings' | 'applications' | 'team'>('listings');
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch Businesses
      const { data: bizData } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', user.id);
      setBusinesses(bizData || []);

      // Fetch Job Listings
      const { data: jobsData } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', user.id)
        .eq('type', 'job')
        .order('created_at', { ascending: false });
      setJobs(jobsData || []);

      // Fetch Applications
      const jobIds = (jobsData || []).map(job => job.id);
      if (jobIds.length > 0) {
        const { data: appsData } = await supabase
          .from('job_applications')
          .select('*, listings(title), profiles!job_applications_user_id_fkey(full_name)')
          .in('job_id', jobIds)
          .order('created_at', { ascending: false });
        setApplications(appsData || []);
      } else {
        setApplications([]);
      }

      // Fetch Team Members
      if (bizData && bizData.length > 0) {
        const { data: membersData } = await supabase
          .from('team_members')
          .select('*')
          .in('team_id', bizData.map(b => b.id));
        setTeamMembers(membersData || []);
      }
    } catch (error) {
      console.error('Error fetching business & jobs data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">Business & Jobs</h1>
          <p className="text-gray-500 text-sm font-medium">Manage your company, hire talent, and lead your team with precision.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-sm font-bold text-white transition-all backdrop-blur-xl">
            <Search className="w-4 h-4" />
            Search
          </button>
          <button
            type="button"
            onClick={() => openWizard('job')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 rounded-2xl text-sm font-bold text-white transition-all shadow-xl shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            Post a Job
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-[#111] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group shadow-2xl"
        >
          <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
            <Briefcase className="w-32 h-32 text-indigo-400" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-2">Active Jobs</p>
            <h3 className="text-5xl font-black text-white mb-3 tracking-tighter">{jobs.length}</h3>
            <div className="flex items-center gap-2 text-xs text-indigo-400 font-bold bg-indigo-500/10 w-fit px-3 py-1 rounded-full border border-indigo-500/20">
              <Zap className="w-3 h-3" />
              <span>{applications.filter(a => a.status === 'pending').length} New Applications</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-[#111] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group shadow-2xl"
        >
          <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity -rotate-12">
            <Users className="w-32 h-32 text-emerald-400" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-2">Team Members</p>
            <h3 className="text-5xl font-black text-white mb-3 tracking-tighter">{teamMembers.length}</h3>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold bg-emerald-500/10 w-fit px-3 py-1 rounded-full border border-emerald-500/20">
              <Building2 className="w-3 h-3" />
              <span>{businesses.length} Businesses</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-[#111] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group shadow-2xl"
        >
          <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity rotate-45">
            <Clock className="w-32 h-32 text-orange-400" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-2">Pending Tasks</p>
            <h3 className="text-5xl font-black text-white mb-3 tracking-tighter">12</h3>
            <div className="flex items-center gap-2 text-xs text-orange-400 font-bold bg-orange-500/10 w-fit px-3 py-1 rounded-full border border-orange-500/20">
              <Clock className="w-3 h-3" />
              <span>3 Overdue</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Tabs */}
      <div className="bg-[#0D0D0D] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
        <div className="px-8 pt-8 pb-2 border-b border-white/5 flex items-center gap-10 overflow-x-auto no-scrollbar scrollbar-hide">
          <button 
            onClick={() => setActiveTab('listings')}
            className={`pb-6 text-sm font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${
              activeTab === 'listings' ? 'text-white' : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            Job Listings
            {activeTab === 'listings' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 rounded-t-full shadow-[0_-4px_10px_rgba(99,102,241,0.5)]" />}
          </button>
          <button 
            onClick={() => setActiveTab('applications')}
            className={`pb-6 text-sm font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${
              activeTab === 'applications' ? 'text-white' : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            Applications
            {activeTab === 'applications' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 rounded-t-full shadow-[0_-4px_10px_rgba(99,102,241,0.5)]" />}
          </button>
          <button 
            onClick={() => setActiveTab('team')}
            className={`pb-6 text-sm font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${
              activeTab === 'team' ? 'text-white' : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            Team Management
            {activeTab === 'team' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 rounded-t-full shadow-[0_-4px_10px_rgba(99,102,241,0.5)]" />}
          </button>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full rounded-3xl" />
                <Skeleton className="h-24 w-full rounded-3xl" />
                <Skeleton className="h-24 w-full rounded-3xl" />
              </div>
            ) : activeTab === 'listings' ? (
              <motion.div 
                key="listings"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {jobs.map(job => (
                  <div key={job.id} className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between group hover:border-indigo-500/30 hover:bg-indigo-500/[0.02] transition-all duration-500 gap-4">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform duration-500 border border-indigo-500/20">
                        <Briefcase className="w-7 h-7" />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-white group-hover:text-indigo-400 transition-colors tracking-tight">{job.title}</h4>
                        <div className="flex flex-wrap items-center gap-4 mt-1.5">
                          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-indigo-500" /> {job.location || 'Remote'}
                          </span>
                          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-indigo-500" /> €{job.price}/hr
                          </span>
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                            job.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {job.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button 
                        onClick={() => onNavigate ? onNavigate(`apply-flow_${job.id}`) : window.location.href = `/workspace/jobs/${job.id}/apply-flow`}
                        className="flex-1 sm:flex-none px-6 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl text-xs font-black uppercase tracking-widest text-indigo-400 transition-all border border-indigo-500/20"
                      >
                        Flow Builder
                      </button>
                      <button className="flex-1 sm:flex-none px-6 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all border border-white/5">
                        Edit
                      </button>
                      <button className="p-2.5 bg-white/5 hover:bg-indigo-500/20 rounded-xl text-gray-500 hover:text-indigo-400 transition-all border border-white/5 hover:border-indigo-500/30">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {jobs.length === 0 && (
                  <div className="py-20 text-center bg-white/[0.01] rounded-[2rem] border border-dashed border-white/10">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Briefcase className="w-10 h-10 text-gray-700" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No active job listings</h3>
                    <p className="text-gray-500 max-w-xs mx-auto text-sm">Start building your team by posting your first job opportunity.</p>
                    <button
                      type="button"
                      onClick={() => openWizard('job')}
                      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-600"
                    >
                      <Plus className="h-4 w-4" /> Post your first job
                    </button>
                  </div>
                )}
              </motion.div>
            ) : activeTab === 'applications' ? (
              <motion.div 
                key="applications"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {applications.map(app => (
                  <div key={app.id} className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between group hover:border-orange-500/30 hover:bg-orange-500/[0.02] transition-all duration-500 gap-4">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-400 font-black text-2xl border border-orange-500/20 group-hover:scale-110 transition-transform duration-500">
                        {app.profiles?.full_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-white group-hover:text-orange-400 transition-colors tracking-tight">{app.profiles?.full_name || 'Anonymous Applicant'}</h4>
                        <p className="text-xs text-gray-500 mt-1.5 font-medium">Applied for: <span className="text-gray-300 font-bold">{app.listings?.title}</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border ${
                          app.status === 'in_progress' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {app.status === 'in_progress' ? 'In Progress' : 'Completed'}
                        </span>
                        {app.scores?.fit && (
                          <span className="text-xs text-gray-400 font-bold">Fit: {app.scores.fit}%</span>
                        )}
                      </div>
                      <button 
                        onClick={() => onNavigate ? onNavigate(`application_${app.id}`) : null}
                        className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all border border-white/5"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
                {applications.length === 0 && (
                  <div className="py-20 text-center bg-white/[0.01] rounded-[2rem] border border-dashed border-white/10">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Users className="w-10 h-10 text-gray-700" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No applications yet</h3>
                    <p className="text-gray-500 max-w-xs mx-auto text-sm">When people apply for your jobs, they will appear here for review.</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="team"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {businesses.map(biz => (
                    <div key={biz.id} className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] space-y-6 hover:border-indigo-500/30 transition-all duration-500 group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 font-black text-xl border border-indigo-500/20 group-hover:scale-110 transition-transform duration-500">
                            {biz.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-xl font-black text-white tracking-tight">{biz.name}</h4>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mt-0.5">Primary Business</p>
                          </div>
                        </div>
                        <button className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-indigo-500/20">
                          Manage
                        </button>
                      </div>
                      <div className="flex items-center justify-between pt-6 border-t border-white/5">
                        <div className="flex -space-x-3">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-[#111] flex items-center justify-center text-[10px] font-black text-gray-400 shadow-xl">
                              {String.fromCharCode(64 + i)}
                            </div>
                          ))}
                          <div className="w-10 h-10 rounded-full bg-white/5 border-2 border-[#111] flex items-center justify-center text-[10px] font-black text-gray-500 backdrop-blur-xl">
                            +{Math.max(0, teamMembers.filter(m => m.team_id === biz.id).length - 3)}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="block text-lg font-black text-white leading-none">{teamMembers.filter(m => m.team_id === biz.id).length}</span>
                          <span className="text-[9px] text-gray-500 uppercase tracking-widest font-black">Members</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {businesses.length === 0 && (
                  <div className="py-20 text-center bg-white/[0.01] rounded-[2rem] border border-dashed border-white/10">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Building2 className="w-10 h-10 text-gray-700" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No businesses found</h3>
                    <p className="text-gray-500 max-w-xs mx-auto text-sm">Create a business profile to start managing your team and operations.</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
