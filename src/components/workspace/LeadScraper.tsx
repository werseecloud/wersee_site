import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Globe, Briefcase, Loader2, Sparkles, AlertCircle, CheckCircle2, Download, ExternalLink, Mail, Phone } from 'lucide-react';
import { invokeApiRunner } from '../../lib/supabase';
import { toast } from 'sonner';

export const LeadScraper = () => {
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingLeads, setLoadingLeads] = useState(false);

  const fetchJobs = async () => {
    try {
      const res = await invokeApiRunner('get-lead-scraping-jobs', {});
      if (res.error) throw new Error(res.error);
      setJobs(res.jobs || []);
      setCreditsUsed(res.creditsUsedToday || 0);
    } catch (err: any) {
      toast.error('Failed to load scraping history: ' + err.message);
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchLeads = async (jobId: string) => {
    setLoadingLeads(true);
    setSelectedJob(jobId);
    try {
      const res = await invokeApiRunner('get-scraped-leads', { jobId });
      if (res.error) throw new Error(res.error);
      setLeads(res.leads || []);
    } catch (err: any) {
      toast.error('Failed to load leads: ' + err.message);
    } finally {
      setLoadingLeads(false);
    }
  };

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !category) return;
    if (creditsUsed >= 3) {
      toast.error('You have reached your daily limit of 3 lead scraping jobs.');
      return;
    }

    setIsScraping(true);
    const loadingToast = toast.loading('AI is analyzing the website and finding leads. This may take up to 3 minutes...');

    try {
      const res = await invokeApiRunner('start-lead-scraping', { url, category });
      if (res.error) throw new Error(res.error);
      
      toast.success(`Successfully found ${res.leadsCount} leads!`, { id: loadingToast });
      setUrl('');
      setCategory('');
      await fetchJobs();
      if (res.jobId) {
        fetchLeads(res.jobId);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to scrape leads', { id: loadingToast });
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">AI Lead Scraper</h1>
          <p className="text-gray-400">Find high-quality B2B leads instantly using Groq AI.</p>
        </div>
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Daily Credits</p>
            <p className="text-white font-bold">{3 - creditsUsed} / 3 remaining</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Scraper Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Search className="w-5 h-5 text-indigo-400" />
              New Search
            </h2>
            
            <form onSubmit={handleScrape} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Target Website URL</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full pl-12 pr-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Target Category</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Marketing Agencies, SaaS"
                    className="w-full pl-12 pr-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isScraping || creditsUsed >= 3}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isScraping ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Scraping...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Start Scraping
                  </>
                )}
              </button>
              
              {creditsUsed >= 3 && (
                <p className="text-xs text-red-400 text-center mt-2 flex items-center justify-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Daily limit reached. Come back tomorrow.
                </p>
              )}
            </form>
          </div>

          {/* History */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">History</h2>
            {loadingJobs ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
              </div>
            ) : jobs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No scraping jobs yet.</p>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => fetchLeads(job.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedJob === job.id 
                        ? 'bg-indigo-500/10 border-indigo-500/50' 
                        : 'bg-black/50 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-white truncate pr-2">{job.category}</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    </div>
                    <p className="text-xs text-gray-500 truncate">{job.url}</p>
                    <p className="text-[10px] text-gray-600 mt-2">
                      {new Date(job.created_at).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 min-h-[600px]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Scraped Leads</h2>
              {leads.length > 0 && (
                <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors">
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              )}
            </div>

            {loadingLeads ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
                <p>Loading leads...</p>
              </div>
            ) : !selectedJob ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-gray-500 border-2 border-dashed border-white/10 rounded-2xl">
                <Search className="w-12 h-12 mb-4 opacity-20" />
                <p>Select a job from history or start a new scrape.</p>
              </div>
            ) : leads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-gray-500 border-2 border-dashed border-white/10 rounded-2xl">
                <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
                <p>No leads found for this job.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {leads.map((lead) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={lead.id}
                    className="bg-black/50 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-white">{lead.company_name}</h3>
                        <span className="inline-block px-2 py-1 bg-white/10 rounded text-xs text-gray-300 mt-1">
                          {lead.category}
                        </span>
                      </div>
                      {lead.website && (
                        <a 
                          href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                      {lead.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-4">
                      {lead.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Mail className="w-4 h-4 text-indigo-400" />
                          <a href={`mailto:${lead.email}`} className="hover:text-white transition-colors">{lead.email}</a>
                        </div>
                      )}
                      {lead.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Phone className="w-4 h-4 text-emerald-400" />
                          <a href={`tel:${lead.phone}`} className="hover:text-white transition-colors">{lead.phone}</a>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
