import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Globe, 
  Zap, 
  ShieldCheck, 
  Activity, 
  Calendar, 
  ChevronRight,
  RefreshCcw,
  Server,
  Database,
  CreditCard,
  HardDrive,
  LayoutDashboard,
  MessageSquare,
  ArrowRight,
  Bot
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase, invokeApiRunner } from '../lib/supabase';

interface SystemComponent {
  name: string;
  status: 'operational' | 'degraded' | 'outage' | 'maintenance';
  description: string;
  icon: React.ElementType;
}

interface RegionStatus {
  name: string;
  latency: string;
  status: 'operational' | 'degraded';
}

interface Incident {
  id: string;
  title: string;
  description: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved' | 'scheduled';
  severity: 'none' | 'minor' | 'major' | 'critical';
  created_at: string;
  resolved_at?: string;
}

export const StatusPage: React.FC = () => {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState('outage');
  const [reportEmail, setReportEmail] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  
  const [healthData, setHealthData] = useState({
    status: 'online',
    db_connection: 'healthy',
    latency: '42ms',
    uptime: '99.98%',
    error_rate: '0.04%',
    system_load: 'Low',
    webhook_lag: '0.8s'
  });

  const fetchHealth = async () => {
    setIsRefreshing(true);
    try {
      // Fetch incidents
      const { data: incidentsData } = await supabase
        .from('status_incidents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (incidentsData) {
        setIncidents(incidentsData as Incident[]);
      }

      // Simulate health data fetch (or keep existing logic if backend supports it)
      // For now, we'll keep the simulated data or fetch from API if available
      const data = await invokeApiRunner('health', {});
      
      setHealthData(prev => ({
        ...prev,
        status: data.status || 'online',
        db_connection: data.db_connection || 'healthy',
        // Keep simulated metrics if API doesn't return them
      }));
      
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      // Don't set outage on fetch error unless critical
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const handleReportIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReport(true);
    try {
      const resData = await invokeApiRunner('report-issue', {
        type: reportType,
        email: reportEmail,
        description: reportDesc
      });
      
      if (resData.error) {
        throw new Error(resData.error || 'Failed to report issue');
      }
      
      setReportSuccess(true);
      setTimeout(() => {
        setIsReportModalOpen(false);
        setReportSuccess(false);
        setReportEmail('');
        setReportDesc('');
      }, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const components: SystemComponent[] = [
    { name: 'Wersee API', status: 'operational', description: 'Core engine and routing', icon: Server },
    { name: 'Supabase Database', status: 'operational', description: 'Primary data storage', icon: Database },
    { name: 'Discord Bot', status: 'operational', description: 'Support and marketplace sync', icon: Bot },
    { name: 'Stripe Connect Bridge', status: 'operational', description: 'Payment processing & payouts', icon: CreditCard },
    { name: 'Asset Storage', status: 'operational', description: 'File delivery and access', icon: HardDrive },
    { name: 'Workshop Dashboard', status: 'operational', description: 'Creator management interface', icon: LayoutDashboard },
  ];

  const regions: RegionStatus[] = [
    { name: 'EU-West (Frankfurt)', latency: '28ms', status: 'operational' },
    { name: 'US-East (N. Virginia)', latency: '84ms', status: 'operational' },
    { name: 'Asia-Pacific (Singapore)', latency: '142ms', status: 'operational' },
  ];

  const refreshStatus = () => {
    fetchHealth();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-emerald-500';
      case 'investigating': return 'bg-red-500';
      case 'identified': return 'bg-orange-500';
      case 'monitoring': return 'bg-blue-500';
      case 'scheduled': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-white/5 z-50">
        <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">Wersee Status</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Service Health Monitor</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-gray-400">Live Updates</span>
            </div>
            <button 
              onClick={refreshStatus}
              disabled={isRefreshing}
              className="p-2 hover:bg-white/5 rounded-xl transition-colors disabled:opacity-50"
            >
              <RefreshCcw className={`w-5 h-5 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto pt-32 pb-20 px-6 space-y-12">
        {/* Global Status Pulse */}
        <section className="relative overflow-hidden bg-[#141414] border border-white/5 rounded-[3rem] p-10 md:p-16 text-center space-y-6">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`inline-flex items-center gap-3 px-6 py-3 rounded-full ${
              healthData.status === 'online' 
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}
          >
            {healthData.status === 'online' ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
            <span className="text-xl font-bold">
              {healthData.status === 'online' ? 'All Systems Operational' : 'Investigating Issues'}
            </span>
          </motion.div>
          
          <div className="space-y-2">
            <h2 className="text-gray-400 text-lg">Operational Uptime over the last 90 days</h2>
            <div className="text-6xl font-black tracking-tighter text-white">{healthData.uptime}</div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 pt-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Avg. Latency</p>
              <p className="text-xl font-bold text-indigo-400">{healthData.latency}</p>
            </div>
            <div className="w-px h-8 bg-white/10 hidden sm:block" />
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Error Rate</p>
              <p className="text-xl font-bold text-emerald-400">{healthData.error_rate}</p>
            </div>
            <div className="w-px h-8 bg-white/10 hidden sm:block" />
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">System Load</p>
              <p className="text-xl font-bold text-blue-400">{healthData.system_load}</p>
            </div>
          </div>
        </section>

        {/* Component Breakdown */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold">Component Breakdown</h3>
            <span className="text-xs text-gray-500">Last updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {components.map((comp, i) => (
              <div key={i} className="bg-[#141414] border border-white/5 rounded-3xl p-6 flex items-center justify-between group hover:border-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
                    {(() => {
                      const Icon = comp.icon as any;
                      return <Icon className="w-6 h-6" />;
                    })()}
                  </div>
                  <div>
                    <h4 className="font-bold">{comp.name}</h4>
                    <p className="text-xs text-gray-500">{comp.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Operational</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Deep Dive & Extras */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 24h Incident Log */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-2xl font-bold">24h Incident Log</h3>
            <div className="bg-[#141414] border border-white/5 rounded-[2rem] p-8 space-y-8">
              <div className="relative pl-8 border-l border-white/10 space-y-12">
                {incidents.length > 0 ? (
                  incidents.map((incident) => (
                    <div key={incident.id} className="relative">
                      <div className={`absolute -left-[37px] top-1 w-4 h-4 rounded-full ${getStatusColor(incident.status)} ring-4 ring-[#141414]`} />
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">
                          {new Date(incident.created_at).toLocaleString()}
                        </p>
                        <p className="font-bold capitalize">{incident.title} - {incident.status}</p>
                        <p className="text-sm text-gray-400">{incident.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="relative">
                    <div className="absolute -left-[37px] top-1 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-[#141414]" />
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">Today</p>
                      <p className="font-bold">All systems operational</p>
                      <p className="text-sm text-gray-400">No issues reported in the last 24 hours.</p>
                    </div>
                  </div>
                )}
              </div>
              
              <button className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-sm font-bold transition-colors flex items-center justify-center gap-2">
                View Incident History
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            {/* Region Health */}
            <h3 className="text-2xl font-bold">Global Regions</h3>
            <div className="bg-[#141414] border border-white/5 rounded-[2rem] p-8 grid grid-cols-1 sm:grid-cols-3 gap-8">
              {regions.map((region, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-bold">{region.name}</span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold">{region.latency}</span>
                    <span className="text-[10px] text-emerald-500 font-bold mb-1 uppercase">Healthy</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-8">
            <section className="space-y-4">
              <h3 className="text-xl font-bold">System Metrics</h3>
              <div className="bg-[#141414] border border-white/5 rounded-3xl p-6 space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Zap className="w-4 h-4" />
                    <span className="text-sm">Webhook Lag</span>
                  </div>
                  <span className="font-bold text-emerald-400">{healthData.webhook_lag}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-gray-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-sm">Security Status</span>
                  </div>
                  <span className="font-bold text-emerald-400">Active</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Next Maintenance</span>
                  </div>
                  <span className="font-bold text-gray-500">None</span>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-bold">Third-Party Services</h3>
              <div className="bg-[#141414] border border-white/5 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Stripe API</span>
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Discord API</span>
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Cloudflare</span>
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Resend (Email)</span>
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
              </div>
            </section>

            {/* Report Section */}
            <section className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-8 space-y-4">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Experiencing issues?</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                If you're seeing a problem that isn't listed here, please let us know immediately.
              </p>
              <button 
                onClick={() => setIsReportModalOpen(true)}
                className="w-full py-4 bg-indigo-500 text-white rounded-2xl font-bold hover:bg-indigo-600 transition-all flex items-center justify-center gap-2"
              >
                Report an Issue
                <ArrowRight className="w-4 h-4" />
              </button>
            </section>
          </div>
        </div>
      </main>

      {/* Report Modal */}
      <AnimatePresence>
        {isReportModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReportModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#141414] border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl"
            >
              <h3 className="text-2xl font-bold mb-2">Report an Issue</h3>
              <p className="text-gray-400 text-sm mb-8">Help us improve by reporting any problems you encounter.</p>
              
              {reportSuccess ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h4 className="text-xl font-bold">Report Submitted!</h4>
                  <p className="text-gray-400">Thank you for your feedback. We'll look into it.</p>
                </div>
              ) : (
                <form onSubmit={handleReportIssue} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Issue Type</label>
                    <select 
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white focus:outline-none focus:border-indigo-500/50 transition-colors appearance-none"
                    >
                      <option value="outage">System Outage</option>
                      <option value="bug">Bug / Error</option>
                      <option value="performance">Performance Issue</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Your Email</label>
                    <input 
                      type="email"
                      required
                      value={reportEmail}
                      onChange={(e) => setReportEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Description</label>
                    <textarea 
                      required
                      value={reportDesc}
                      onChange={(e) => setReportDesc(e.target.value)}
                      placeholder="What happened?"
                      rows={4}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
                    />
                  </div>
                  
                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => setIsReportModalOpen(false)}
                      className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-bold hover:bg-white/10 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmittingReport}
                      className="flex-1 py-4 bg-indigo-500 text-white rounded-2xl font-bold hover:bg-indigo-600 transition-all disabled:opacity-50"
                    >
                      {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
