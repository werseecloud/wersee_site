import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  ShieldCheck,
  FileText, 
  Scale, 
  Lock, 
  Globe, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  ExternalLink,
  Download,
  Plus,
  Search,
  ChevronRight,
  Building2,
  UserCheck,
  History,
  Trash2,
  Zap,
  Globe2,
  Check
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { TermsCreatorView } from './TermsCreatorView';
import { formatDistanceToNow } from 'date-fns';

export const ComplianceView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'terms' | 'privacy' | 'business' | 'guidelines'>('overview');
  const [businessInfo, setBusinessInfo] = useState<any>(null);
  const [auditActivity, setAuditActivity] = useState<any[]>([]);
  const [auditError, setAuditError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBusinessInfo();
  }, []);

  const fetchBusinessInfo = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [businessResult, auditResult] = await Promise.all([
        supabase
          .from('businesses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('compliance_audit_events')
          .select('id, action, actor_type, target_type, reason, source, created_at')
          .eq('actor_id', user.id)
          .eq('visibility', 'user')
          .order('created_at', { ascending: false })
          .limit(8),
      ]);

      if (businessResult.data) {
        setBusinessInfo(businessResult.data);
      }
      setAuditActivity(auditResult.data || []);
      setAuditError(auditResult.error ? 'Compliance activity could not be loaded.' : '');
    } catch (error) {
      console.error('Error fetching business info:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'business', label: 'Business Info', icon: Building2 },
    { id: 'terms', label: 'Terms & Conditions', icon: FileText },
    { id: 'privacy', label: 'Privacy & Data', icon: Lock },
    { id: 'guidelines', label: 'Seller Guidelines', icon: Scale },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] overflow-hidden">
      {/* Header */}
      <div className="p-6 md:p-8 border-b border-white/5 bg-[#0A0A0A]/50 backdrop-blur-xl shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Shield className="w-8 h-8 text-indigo-400" />
              Legal & Compliance
            </h1>
            <p className="text-gray-500 text-sm mt-1">Manage your business legal documents and platform compliance.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-all border border-white/5">
              <Download className="w-4 h-4" />
              Export Legal Pack
            </button>
            <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Fully Compliant
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl w-fit overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-white text-black shadow-lg' 
                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-hide">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Compliance Score Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 rounded-[2.5rem] p-8 relative overflow-hidden">
                  <div className="relative z-10">
                    <h2 className="text-2xl font-black text-white mb-2">Compliance Health Score</h2>
                    <p className="text-indigo-200/60 text-sm mb-6 max-w-md">Your business is currently meeting all platform legal requirements. Keep your documents updated to maintain this status.</p>
                    
                    <div className="flex items-end gap-4">
                      <div className="text-6xl font-black text-white">100<span className="text-2xl text-indigo-400/60">%</span></div>
                      <div className="mb-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest">Perfect</div>
                    </div>
                  </div>
                  
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
                  <Shield className="absolute bottom-[-20px] right-[-20px] w-48 h-48 text-white/5 -rotate-12" />
                </div>

                <div className="bg-[#141414] border border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">Quick Actions</h3>
                    <p className="text-gray-500 text-xs">Essential legal tasks for your business.</p>
                  </div>
                  
                  <div className="space-y-3 mt-6">
                    <button onClick={() => setActiveTab('terms')} className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group">
                      <span className="text-sm font-bold text-gray-300 group-hover:text-white">Update Terms</span>
                      <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white" />
                    </button>
                    <button onClick={() => setActiveTab('business')} className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group">
                      <span className="text-sm font-bold text-gray-300 group-hover:text-white">Verify Identity</span>
                      <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Compliance Checklist */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-gray-500 uppercase tracking-[0.3em] px-2">Compliance Checklist</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Business Verification', status: 'completed', desc: 'Identity and address verified' },
                    { label: 'Terms of Service', status: 'completed', desc: 'Active terms for all listings' },
                    { label: 'Privacy Policy', status: 'completed', desc: 'GDPR & CCPA compliant policy' },
                    { label: 'Tax Information', status: 'completed', desc: 'VAT/Tax ID registered' },
                    { label: 'Refund Policy', status: 'completed', desc: 'Clear refund terms set' },
                    { label: 'Seller Guidelines', status: 'completed', desc: 'Platform rules accepted' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-5 bg-[#141414] border border-white/5 rounded-3xl group hover:border-white/10 transition-all">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">{item.label}</h4>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Legal Activity */}
              <div className="bg-[#141414] border border-white/5 rounded-[2.5rem] overflow-hidden">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <History className="w-5 h-5 text-indigo-400" />
                    Recent Activity
                  </h3>
                  <button className="text-xs font-bold text-gray-500 hover:text-white transition-colors">View All</button>
                </div>
                <div className="divide-y divide-white/5">
                  {auditActivity.map((log) => (
                    <div key={log.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                        <div>
                          <div className="text-sm font-bold text-white capitalize">{String(log.action).replaceAll('_', ' ')}</div>
                          <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                            {log.actor_type === 'user' ? 'You' : log.actor_type} · {String(log.target_type).replaceAll('_', ' ')}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-gray-600">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  ))}
                  {auditActivity.length === 0 && (
                    <div className="p-8 text-center">
                      <History className="mx-auto mb-3 h-5 w-5 text-gray-600" />
                      <p className={`text-sm ${auditError ? 'text-red-400' : 'text-gray-500'}`}>
                        {auditError || 'Compliance changes recorded in your database will appear here.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'business' && (
            <motion.div
              key="business"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-3xl space-y-8"
            >
              <div className="bg-[#141414] border border-white/5 rounded-[2.5rem] p-8">
                <h2 className="text-xl font-bold text-white mb-6">Business Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Business Name</label>
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold">
                      {businessInfo?.name || 'Not Set'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Tax ID / VAT Number</label>
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold">
                      {businessInfo?.tax_id || 'NL 123456789 B01'}
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Registered Address</label>
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold leading-relaxed">
                      {businessInfo?.address || 'Damrak 1, 1012 LG Amsterdam, Netherlands'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Legal Representative</label>
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold">
                      {businessInfo?.representative || 'John Doe'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Contact Email</label>
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold">
                      {businessInfo?.email || 'legal@business.com'}
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 pt-8 border-t border-white/5 flex justify-end">
                  <button className="px-6 py-3 bg-white text-black rounded-2xl font-bold hover:bg-gray-200 transition-all active:scale-95">
                    Edit Information
                  </button>
                </div>
              </div>

              <div className="bg-amber-500/5 border border-amber-500/10 rounded-[2rem] p-6 flex gap-4">
                <AlertCircle className="w-6 h-6 text-amber-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-amber-400 text-sm">Verification Required</h4>
                  <p className="text-xs text-amber-400/60 mt-1 leading-relaxed">
                    To process payouts exceeding €2,500 per month, you must provide a valid Chamber of Commerce (KVK) extract and a copy of your ID.
                  </p>
                  <button className="mt-4 text-xs font-black text-amber-400 uppercase tracking-widest hover:underline">
                    Start Verification
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'terms' && (
            <motion.div
              key="terms"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <TermsCreatorView />
            </motion.div>
          )}

          {activeTab === 'privacy' && (
            <motion.div
              key="privacy"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl space-y-8"
            >
              {/* GDPR Status Header */}
              <div className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/20 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-emerald-500/20 rounded-2xl">
                      <ShieldCheck className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white">GDPR Compliance Hub</h2>
                      <p className="text-emerald-200/60 text-sm">Manage your data protection obligations and user rights.</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
                      <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Status</div>
                      <div className="text-lg font-bold text-white">Fully Compliant</div>
                    </div>
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
                      <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">DPA Version</div>
                      <div className="text-lg font-bold text-white">v2.4 (Active)</div>
                    </div>
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
                      <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Last Audit</div>
                      <div className="text-lg font-bold text-white">March 15, 2026</div>
                    </div>
                  </div>
                </div>
                <Globe className="absolute top-[-20px] right-[-20px] w-64 h-64 text-white/5 -rotate-12" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Data Processing Agreement */}
                <div className="bg-[#141414] border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-500/10 rounded-xl">
                        <FileText className="w-5 h-5 text-indigo-400" />
                      </div>
                      <h3 className="font-bold text-white">Data Processing (DPA)</h3>
                    </div>
                    <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                      <Download className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                  
                  <p className="text-sm text-gray-500 leading-relaxed">
                    The Data Processing Agreement (DPA) outlines the roles and responsibilities of Wersee as a data processor for your customer information.
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm text-gray-300">Standard Contractual Clauses</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm text-gray-300">Sub-processor List</span>
                      </div>
                      <button className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:underline">View</button>
                    </div>
                  </div>

                  <button className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-sm font-bold text-white transition-all">
                    Update DPA Settings
                  </button>
                </div>

                {/* Data Subject Rights (DSAR) */}
                <div className="bg-[#141414] border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-xl">
                      <UserCheck className="w-5 h-5 text-purple-400" />
                    </div>
                    <h3 className="font-bold text-white">Data Subject Rights</h3>
                  </div>
                  
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Automate and manage requests from your customers regarding their personal data under GDPR.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <button className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-white/10 transition-all text-left group">
                      <div className="p-2 bg-white/5 rounded-lg w-fit mb-3 group-hover:bg-indigo-500/20 transition-colors">
                        <Download className="w-4 h-4 text-gray-400 group-hover:text-indigo-400" />
                      </div>
                      <div className="text-xs font-bold text-white">Data Export</div>
                      <div className="text-[10px] text-gray-500 mt-1">Right to Portability</div>
                    </button>
                    <button className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-white/10 transition-all text-left group">
                      <div className="p-2 bg-white/5 rounded-lg w-fit mb-3 group-hover:bg-red-500/20 transition-colors">
                        <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-400" />
                      </div>
                      <div className="text-xs font-bold text-white">Data Erasure</div>
                      <div className="text-[10px] text-gray-500 mt-1">Right to be Forgotten</div>
                    </button>
                  </div>

                  <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-indigo-300">Active Requests</span>
                      <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-full text-[10px] font-black">0</span>
                    </div>
                    <p className="text-[10px] text-indigo-300/60">All DSAR requests must be fulfilled within 30 days.</p>
                  </div>
                </div>

                {/* Privacy Policy Generator */}
                <div className="bg-[#141414] border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-500/10 rounded-xl">
                        <Lock className="w-5 h-5 text-amber-400" />
                      </div>
                      <h3 className="font-bold text-white">Privacy Policy</h3>
                    </div>
                    <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest">Published</div>
                  </div>
                  
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Your privacy policy must clearly explain how you collect, use, and protect customer data.
                  </p>

                  <div className="p-4 bg-black/20 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Last Updated</span>
                      <span className="text-xs font-bold text-white">March 10, 2026</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Public URL</span>
                      <button className="text-xs font-bold text-indigo-400 hover:underline flex items-center gap-1">
                        wersee.com/p/legal
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button className="flex-1 py-3 bg-white text-black rounded-xl text-xs font-black hover:bg-gray-200 transition-all">
                      Edit Policy
                    </button>
                    <button className="flex-1 py-3 bg-white/5 border border-white/10 text-white rounded-xl text-xs font-black hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                      <Zap className="w-3 h-3 text-amber-400" />
                      AI Regenerate
                    </button>
                  </div>
                </div>

                {/* Cookie Consent & Tracking */}
                <div className="bg-[#141414] border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-xl">
                      <Globe2 className="w-5 h-5 text-blue-400" />
                    </div>
                    <h3 className="font-bold text-white">Cookies & Tracking</h3>
                  </div>
                  
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Configure how cookies and tracking pixels are handled for your storefront visitors.
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                      <div>
                        <div className="text-sm font-bold text-white">Cookie Consent Banner</div>
                        <div className="text-[10px] text-gray-500">Enable GDPR-compliant banner</div>
                      </div>
                      <div className="w-10 h-6 bg-emerald-500 rounded-full p-1 flex justify-end">
                        <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                      <div>
                        <div className="text-sm font-bold text-white">Anonymize IP Addresses</div>
                        <div className="text-[10px] text-gray-500">For Google Analytics & Pixels</div>
                      </div>
                      <div className="w-10 h-6 bg-emerald-500 rounded-full p-1 flex justify-end">
                        <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                      </div>
                    </div>
                  </div>

                  <button className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black text-gray-400 transition-all">
                    Advanced Tracking Settings
                  </button>
                </div>
              </div>

              {/* GDPR Checklist */}
              <div className="bg-[#141414] border border-white/5 rounded-[2.5rem] p-8 md:p-12">
                <h3 className="text-xl font-bold text-white mb-8">GDPR Compliance Checklist</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    "Appoint a Data Protection Officer (DPO)",
                    "Maintain a Record of Processing Activities (ROPA)",
                    "Implement Privacy by Design & Default",
                    "Conduct Data Protection Impact Assessments (DPIA)",
                    "Ensure secure data transfers outside EEA",
                    "Establish a data breach notification process"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <span className="text-sm text-gray-400">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'guidelines' && (
            <motion.div
              key="guidelines"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl space-y-8"
            >
              <div className="bg-[#141414] border border-white/5 rounded-[2.5rem] p-8 md:p-12">
                <div className="flex items-center justify-between mb-12">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/10 rounded-2xl">
                      <Scale className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white">Platform Seller Guidelines</h2>
                      <p className="text-gray-500 text-sm">The official rules and standards for selling on Wersee.</p>
                    </div>
                  </div>
                  <div className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold flex items-center gap-2 border border-emerald-500/20">
                    <ShieldCheck className="w-3.5 h-3.5" /> Guidelines Accepted
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <section className="space-y-6">
                    <div className="flex items-center gap-3 text-white">
                      <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <Shield className="w-5 h-5 text-indigo-400" />
                      </div>
                      <h3 className="font-bold text-lg">1. Integrity & Trust</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-white/10 transition-colors">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">No Fraud or Scams</h4>
                        <p className="text-sm text-gray-500 leading-relaxed">Zero tolerance for fraudulent activity. Any attempt to scam buyers or manipulate platform systems results in an immediate and permanent ban. This includes fake reviews, misleading prices, or non-delivery of goods.</p>
                      </div>
                      <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-white/10 transition-colors">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Accuracy is Key</h4>
                        <p className="text-sm text-gray-500 leading-relaxed">Product descriptions, preview images, and metadata must 100% reflect the actual file the buyer receives. Misleading marketing is strictly prohibited.</p>
                      </div>
                      <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-white/10 transition-colors">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Communication</h4>
                        <p className="text-sm text-gray-500 leading-relaxed">Maintain professional and respectful communication with buyers. Harassment or abusive language will lead to account suspension.</p>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <div className="flex items-center gap-3 text-white">
                      <div className="p-2 bg-purple-500/10 rounded-lg">
                        <Lock className="w-5 h-5 text-purple-400" />
                      </div>
                      <h3 className="font-bold text-lg">2. Intellectual Property</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-white/10 transition-colors">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Ownership Rights</h4>
                        <p className="text-sm text-gray-500 leading-relaxed">You must legally own or have the explicit right to sell every item you list. No copyrighted material, trademarks, or trade secrets of others without authorization.</p>
                      </div>
                      <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-white/10 transition-colors">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Original Creation</h4>
                        <p className="text-sm text-gray-500 leading-relaxed">We encourage original work. Reselling "PLR" or low-quality scraped content is prohibited. AI-generated content must be clearly labeled as such.</p>
                      </div>
                      <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-white/10 transition-colors">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">DMCA Compliance</h4>
                        <p className="text-sm text-gray-500 leading-relaxed">Wersee complies with the DMCA. We will remove infringing content upon receiving a valid notice and may terminate repeat infringers.</p>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <div className="flex items-center gap-3 text-white">
                      <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      </div>
                      <h3 className="font-bold text-lg">3. Quality & Support</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-white/10 transition-colors">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Functional Files</h4>
                        <p className="text-sm text-gray-500 leading-relaxed">All digital goods must be functional and as described. Broken links or corrupted files must be fixed within 24 hours of report.</p>
                      </div>
                      <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-white/10 transition-colors">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Customer Support</h4>
                        <p className="text-sm text-gray-500 leading-relaxed">Sellers are expected to provide reasonable support for their products. High refund rates due to lack of support may lead to account review.</p>
                      </div>
                      <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-white/10 transition-colors">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Updates</h4>
                        <p className="text-sm text-gray-500 leading-relaxed">Keep your products updated to ensure compatibility with the latest software versions and security standards.</p>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <div className="flex items-center gap-3 text-white">
                      <div className="p-2 bg-red-500/10 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-red-400" />
                      </div>
                      <h3 className="font-bold text-lg">4. Prohibited Content</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-white/10 transition-colors">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Malicious Software</h4>
                        <p className="text-sm text-gray-500 leading-relaxed">No malware, viruses, spyware, or any code designed to harm or exploit users or systems. This is a permanent ban offense.</p>
                      </div>
                      <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-white/10 transition-colors">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Illegal Goods</h4>
                        <p className="text-sm text-gray-500 leading-relaxed">No drugs, weapons, stolen data, or illegal services. We cooperate with law enforcement regarding illegal marketplace activity.</p>
                      </div>
                      <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-white/10 transition-colors">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Adult Content</h4>
                        <p className="text-sm text-gray-500 leading-relaxed">Wersee is a professional marketplace. No pornographic or sexually explicit content is allowed.</p>
                      </div>
                    </div>
                  </section>
                </div>

                <div className="mt-16 p-8 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10">
                  <h3 className="text-xl font-bold text-white mb-4">Compliance & Enforcement</h3>
                  <p className="text-sm text-gray-400 leading-relaxed mb-8">
                    Wersee reserves the right to remove any content or suspend any account that violates these guidelines. We use a combination of automated scanning and manual review to ensure the integrity of our marketplace.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-sm text-gray-300 font-medium">Warning System</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      <span className="text-sm text-gray-300 font-medium">3-Strike Policy</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-sm text-gray-300 font-medium">Immediate Termination</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/5 rounded-xl">
                      <FileText className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white">Full Seller Agreement</h4>
                      <p className="text-xs text-gray-500">Last updated: March 2024</p>
                    </div>
                  </div>
                  <button className="px-6 py-2.5 bg-white text-black rounded-xl text-sm font-black hover:bg-gray-200 transition-colors">
                    Download PDF
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
