import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Briefcase, DollarSign, Clock, Share2, Bookmark, CheckCircle, Building2, ChevronRight, Star, X, Send, Sparkles } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { DatabaseService } from '../../../services/databaseService';

interface JobDetailProps {
  listing: any;
  onShare: () => void;
}

export const JobDetail: React.FC<JobDetailProps> = ({ listing, onShare }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [isApplying, setIsApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  
  const meta = listing.metadata || {};
  const isRemote = meta.locationType === 'remote';
  const location = isRemote ? 'Remote' : meta.locationAddress || 'Location not specified';
  const salary = meta.salaryRange ? `${meta.currency || '€'}${meta.salaryRange}` : 'Competitive Salary';
  const jobType = meta.jobType || 'Full-time';
  
  // Calculate a fake match score for the "Wersee differentiator"
  const matchScore = Math.floor(Math.random() * 20) + 75; // 75-95%

  const handleApplyClick = () => {
    if (meta.applyType === 'external' && meta.externalUrl) {
      window.open(meta.externalUrl, '_blank');
      return;
    }
    
    if (!user) {
      navigate('/auth');
      return;
    }
    
    navigate(`/jobs/${listing.id}/apply`);
  };

  return (
    <div className={`min-h-screen pt-24 pb-20 ${isDark ? 'bg-[#0A0A0A] text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="mb-12 relative p-8 rounded-[2rem] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 backdrop-blur-3xl" />
          <div className="relative z-10 flex items-center gap-6">
            <div className={`w-20 h-20 rounded-3xl overflow-hidden flex items-center justify-center shrink-0 shadow-2xl border ${isDark ? 'bg-[#1A1A1A] border-white/10' : 'bg-white border-gray-200'}`}>
              {meta.logoUrl || listing.creator_avatar ? (
                <img src={meta.logoUrl || listing.creator_avatar} alt="Company Logo" className="w-full h-full object-cover" />
              ) : (
                <Building2 className={`w-10 h-10 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              )}
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl font-black italic uppercase tracking-tighter leading-none mb-3 text-white">{listing.title}</h1>
              <div className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-indigo-300">
                <Building2 className="w-4 h-4" />
                {meta.company || listing.creator_name || 'Company Name'}
              </div>
            </div>
          </div>
          
          <div className="relative z-10 flex flex-wrap items-center gap-4 mt-8">
            <div className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest ${isDark ? 'bg-white/10 text-white' : 'bg-white text-gray-900 shadow-sm'}`}>
              <MapPin className="w-4 h-4" /> {location}
            </div>
            <div className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest ${isDark ? 'bg-white/10 text-white' : 'bg-white text-gray-900 shadow-sm'}`}>
              <Briefcase className="w-4 h-4" /> <span className="capitalize">{jobType}</span>
            </div>
            <div className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest ${isDark ? 'bg-white/10 text-white' : 'bg-white text-gray-900 shadow-sm'}`}>
              <DollarSign className="w-4 h-4" /> {salary}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* AI Insights */}
            <section className={`p-8 rounded-[2rem] border relative overflow-hidden ${isDark ? 'bg-indigo-950/20 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'}`}>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-2xl bg-indigo-500 text-white">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black italic uppercase tracking-tighter">Wersee AI Insights</h2>
                  <p className="text-xs font-bold uppercase tracking-widest text-indigo-500">Why this role matches your profile</p>
                </div>
              </div>
              <div className={`space-y-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <p>Based on your experience with <strong>{meta.skills?.[0] || 'modern frameworks'}</strong>, you are a strong candidate for this role.</p>
                <p>The company culture at {meta.company || 'this company'} aligns with your preference for {isRemote ? 'remote' : 'on-site'} work and {jobType} positions.</p>
              </div>
            </section>

            {/* About the role */}
            <section className={`p-8 rounded-[2rem] border ${isDark ? 'bg-[#141414] border-white/5' : 'bg-white border-gray-100 shadow-sm'}`}>
              <h2 className="text-xl font-black italic uppercase tracking-tighter mb-6">About the role</h2>
              <div className={`prose prose-lg max-w-none ${isDark ? 'prose-invert prose-p:text-gray-400' : 'prose-p:text-gray-600'}`}>
                <p>{listing.description || 'No detailed description provided.'}</p>
              </div>
            </section>

            {/* Responsibilities */}
            {meta.responsibilities && meta.responsibilities.length > 0 && meta.responsibilities[0] !== '' && (
              <section className={`p-8 rounded-3xl border ${isDark ? 'bg-[#141414] border-white/5' : 'bg-white border-gray-100 shadow-sm'}`}>
                <h2 className="text-xl font-black italic uppercase tracking-tighter mb-6">Responsibilities</h2>
                <ul className="space-y-4">
                  {meta.responsibilities.map((item: string, idx: number) => (
                    item && <li key={idx} className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" />
                      <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Requirements */}
            {meta.requirements && meta.requirements.length > 0 && meta.requirements[0] !== '' && (
              <section className={`p-8 rounded-3xl border ${isDark ? 'bg-[#141414] border-white/5' : 'bg-white border-gray-100 shadow-sm'}`}>
                <h2 className="text-xl font-black italic uppercase tracking-tighter mb-6">Requirements</h2>
                <ul className="space-y-4">
                  {meta.requirements.map((item: string, idx: number) => (
                    item && <li key={idx} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0" />
                      <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Benefits */}
            {meta.benefits && meta.benefits.length > 0 && meta.benefits[0] !== '' && (
              <section className={`p-8 rounded-3xl border ${isDark ? 'bg-[#141414] border-white/5' : 'bg-white border-gray-100 shadow-sm'}`}>
                <h2 className="text-xl font-black italic uppercase tracking-tighter mb-6">Benefits</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {meta.benefits.map((item: string, idx: number) => (
                    item && <div key={idx} className={`p-4 rounded-2xl flex items-center gap-3 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                      <Star className="w-5 h-5 text-amber-500 shrink-0" />
                      <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{item}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* RIGHT COLUMN: Sticky Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              
              {/* Action Card */}
              <div className={`p-8 rounded-[2rem] border ${isDark ? 'bg-[#141414] border-white/5' : 'bg-white border-gray-100 shadow-xl shadow-black/5'}`}>
                
                {/* Match Score */}
                <div className={`mb-8 p-6 rounded-[1.5rem] flex items-center justify-between ${isDark ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-indigo-50 border border-indigo-100'}`}>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">Wersee Match</div>
                    <div className={`font-black italic uppercase tracking-tighter text-xl ${isDark ? 'text-white' : 'text-indigo-900'}`}>You match {matchScore}%</div>
                  </div>
                  <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-indigo-600/30">
                    {matchScore}
                  </div>
                </div>

                <div className="space-y-4">
                  {hasApplied ? (
                    <div className="w-full py-5 bg-green-500/20 text-green-500 rounded-[1.5rem] font-black uppercase tracking-widest text-center flex items-center justify-center gap-2">
                      <CheckCircle className="w-5 h-5" /> Application Sent
                    </div>
                  ) : (
                    <button 
                      onClick={handleApplyClick}
                      disabled={isApplying}
                      className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {meta.applyType === 'external' ? 'Apply Externally' : 'Quick Apply'}
                      {!isApplying && <ChevronRight className="w-5 h-5" />}
                    </button>
                  )}
                  
                  <div className="flex gap-3">
                    <button className={`flex-1 py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-colors ${isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}>
                      <Bookmark className="w-4 h-4" /> Save
                    </button>
                    <button onClick={onShare} className={`flex-1 py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-colors ${isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}>
                      <Share2 className="w-4 h-4" /> Share
                    </button>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-white/10 text-center">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Posted {new Date(listing.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Skills Card */}
              {meta.skills && meta.skills.length > 0 && (
                <div className={`p-8 rounded-[2rem] border ${isDark ? 'bg-[#141414] border-white/5' : 'bg-white border-gray-100 shadow-xl shadow-black/5'}`}>
                  <h3 className="text-sm font-black uppercase tracking-widest mb-6">Required Skills</h3>
                  <div className="flex flex-wrap gap-3">
                    {meta.skills.map((skill: string, idx: number) => (
                      <span key={idx} className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest ${isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
