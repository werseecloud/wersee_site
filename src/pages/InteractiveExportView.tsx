import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Shield, 
  Lock, 
  User, 
  Activity, 
  CreditCard, 
  ShoppingBag, 
  MessageSquare, 
  Globe, 
  Clock, 
  Download,
  AlertTriangle,
  ChevronRight,
  BarChart3,
  Database,
  Eye,
  FileText,
  Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ExportData } from '../services/dataExportService';

export const InteractiveExportView = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportData, setExportData] = useState<ExportData | null>(null);
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [userIp, setUserIp] = useState<string>('');

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  const fetchSession = async () => {
    setLoading(true);
    try {
      // Get current IP
      let currentIp = 'unknown';
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          currentIp = ipData.ip;
          setUserIp(currentIp);
        }
      } catch (e) {
        console.warn('Could not fetch current IP - security check may be limited');
      }

      const { data, error } = await supabase
        .from('interactive_data_exports')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Session not found');

      // Security Check: IP and User ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || user.id !== data.user_id) {
        setError('Unauthorized access. This data belongs to another account.');
        return;
      }

      if (data.allowed_ip && data.allowed_ip !== 'unknown' && data.allowed_ip !== currentIp) {
        setError(`Access restricted to the original IP address (${data.allowed_ip}). Your current IP is ${currentIp}.`);
        return;
      }

      // Check expiration
      if (new Date(data.expires_at) < new Date()) {
        setError('This interactive session has expired (6 months limit).');
        return;
      }

      setSession(data);
      setExportData(data.data as ExportData);
    } catch (err: any) {
      console.error('Error fetching interactive session:', err);
      setError(err.message || 'Failed to load interactive data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mb-4"
        />
        <p className="text-gray-400 font-mono animate-pulse">DECRYPTING SECURE ARCHIVE...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-gray-400 max-w-md mb-8">{error}</p>
        <button 
          onClick={() => navigate('/workspace')}
          className="px-8 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors"
        >
          Return to Workspace
        </button>
      </div>
    );
  }

  if (!exportData) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Globe },
    { id: 'identity', label: 'Identity', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'financial', label: 'Financial', icon: CreditCard },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
    { id: 'content', label: 'Content', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-xl">W</div>
            <div>
              <h1 className="font-bold tracking-tight">WERSEE <span className="text-blue-500">DATA EXPLORER</span></h1>
              <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Secure Interactive Archive • v1.1</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] text-gray-500 font-mono uppercase">Authorized IP</span>
              <span className="text-xs font-mono text-emerald-400">{userIp}</span>
            </div>
            <div className="h-8 w-px bg-white/10 mx-2" />
            <button 
              onClick={() => window.print()}
              className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
              title="Print to PDF"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 p-6">
        {/* Sidebar Navigation */}
        <aside className="md:w-64 shrink-0">
          <nav className="space-y-1 sticky top-24">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="mt-8 p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl">
            <div className="flex items-center gap-2 text-yellow-500 mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Session Expiry</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              This interactive view will expire on {format(new Date(session.expires_at), 'PPP')}.
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Security Events" value={exportData.security.length} icon={Shield} color="blue" />
                    <StatCard title="Active Sessions" value={exportData.sessions.length} icon={Lock} color="emerald" />
                    <StatCard title="Total Orders" value={exportData.payments.orders_as_buyer.length + exportData.payments.orders_as_seller.length} icon={ShoppingBag} color="purple" />
                    <StatCard title="Trust Score" value={exportData.system.trust_score} icon={BarChart3} color="gold" />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                      <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <Database className="w-5 h-5 text-blue-400" />
                        Data Distribution
                      </h3>
                      <div className="space-y-4">
                        <DistributionBar label="Security Logs" value={exportData.security.length} max={100} color="bg-blue-500" />
                        <DistributionBar label="Activity Logs" value={exportData.activity.length} max={500} color="bg-emerald-500" />
                        <DistributionBar label="Marketplace" value={exportData.marketplace.products.length} max={50} color="bg-purple-500" />
                        <DistributionBar label="Social Graph" value={exportData.social.followers.length + exportData.social.following.length} max={200} color="bg-pink-500" />
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                      <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <Eye className="w-5 h-5 text-emerald-400" />
                        Recent Access
                      </h3>
                      <div className="space-y-3">
                        {exportData.security.slice(0, 5).map((log, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span className="text-xs font-medium uppercase tracking-wider">{log.event_type.replace(/_/g, ' ')}</span>
                            </div>
                            <span className="text-[10px] text-gray-500 font-mono">{format(new Date(log.created_at), 'HH:mm:ss')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'identity' && (
                <div className="space-y-8">
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                    <div className="flex items-center gap-6 mb-8">
                      <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-3xl font-bold">
                        {exportData.account.email[0].toUpperCase()}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{exportData.account.email}</h2>
                        <p className="text-gray-500 font-mono text-sm">UID: {exportData.account.id}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InfoItem label="Member Since" value={format(new Date(exportData.account.created_at), 'PPP')} icon={Clock} />
                      <InfoItem label="Last Sign In" value={format(new Date(exportData.account.last_sign_in_at), 'PPP p')} icon={Lock} />
                      <InfoItem label="Email Status" value={exportData.account.email_confirmed_at ? 'Verified' : 'Unverified'} icon={Mail} />
                      <InfoItem label="Phone" value={exportData.account.phone || 'Not provided'} icon={Globe} />
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                    <h3 className="text-lg font-bold mb-6">Profile Details</h3>
                    <pre className="bg-black/40 rounded-2xl p-6 text-xs font-mono text-gray-400 overflow-x-auto">
                      {JSON.stringify(exportData.profile, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white/5">
                          <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Event</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">IP Address</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Timestamp</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {exportData.security.map((log, i) => (
                          <tr key={i} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4">
                              <span className="text-xs font-bold uppercase tracking-wider">{log.event_type.replace(/_/g, ' ')}</span>
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-gray-400">{log.ip_address}</td>
                            <td className="px-6 py-4 text-xs text-gray-400">{format(new Date(log.created_at), 'PPP p')}</td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded text-[10px] font-bold uppercase">Success</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Add other tabs as needed... */}
              {['financial', 'activity', 'marketplace', 'content'].includes(activeTab) && (
                <div className="flex flex-col items-center justify-center py-20 bg-white/5 border border-white/10 rounded-3xl">
                  <FileText className="w-12 h-12 text-gray-600 mb-4" />
                  <h3 className="text-xl font-bold mb-2">Detailed Data View</h3>
                  <p className="text-gray-400 text-center max-w-md px-6">
                    This section contains granular records. For the best experience, please refer to the generated PDF or JSON files in your export archive.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }: any) => {
  const colors: any = {
    blue: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    emerald: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    purple: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    gold: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  };

  return (
    <div className={`p-6 rounded-3xl border ${colors[color]} flex flex-col gap-4`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{title}</span>
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-3xl font-bold tracking-tight">{value}</span>
    </div>
  );
};

const DistributionBar = ({ label, value, max, color }: any) => (
  <div>
    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-2">
      <span className="text-gray-400">{label}</span>
      <span className="text-white">{value}</span>
    </div>
    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${Math.min((value / max) * 100, 100)}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
        className={`h-full ${color}`}
      />
    </div>
  </div>
);

const InfoItem = ({ label, value, icon: Icon }: any) => (
  <div className="flex items-start gap-4 p-4 bg-black/40 rounded-2xl border border-white/5">
    <div className="p-2 bg-white/5 rounded-lg">
      <Icon className="w-4 h-4 text-gray-400" />
    </div>
    <div>
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-sm font-medium text-white">{value}</p>
    </div>
  </div>
);
