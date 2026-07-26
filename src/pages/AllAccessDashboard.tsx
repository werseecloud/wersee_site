import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PageWrapper } from '../components/PageWrapper';
import { motion } from 'motion/react';
import { Download, Play, Crown, Star, MessageSquare, Zap, Settings, RefreshCw, Key, Bell, Check, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AllAccessDashboardProps {
  business: any;
  user: any;
  accessPass: any;
}

export const AllAccessDashboard: React.FC<AllAccessDashboardProps> = ({ business, user, accessPass }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [community, setCommunity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'library' | 'community' | 'licenses' | 'requests'>('library');
  const [requestTitle, setRequestTitle] = useState('');
  const [requestDetails, setRequestDetails] = useState('');
  const [requestStatus, setRequestStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch products that this pass gives access to
        let query = supabase
          .from('listings')
          .select('*')
          .eq('seller_id', business.user_id)
          .neq('id', accessPass.id) // Exclude the pass itself
          .order('created_at', { ascending: false });

        if (accessPass.metadata?.all_access_category) {
          query = query.eq('category', accessPass.metadata.all_access_category);
        }

        const { data: productsData, error: productsError } = await query;
        if (productsError) throw productsError;
        setProducts(productsData || []);

        // Fetch licenses for this user
        const { data: licensesData, error: licensesError } = await supabase
          .from('licenses')
          .select('*, listings(title)')
          .eq('buyer_id', user.id)
          .eq('seller_id', business.user_id);
          
        if (licensesError) throw licensesError;
        setLicenses(licensesData || []);

        // Fetch community for this business
        const { data: communityData } = await supabase
          .from('communities')
          .select('*')
          .eq('owner_id', business.user_id)
          .limit(1)
          .single();
          
        if (communityData) {
          setCommunity(communityData);
        }

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [business.user_id, accessPass, user.id]);

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestTitle || !requestDetails) return;
    
    setRequestStatus('submitting');
    // Mock submission for now
    setTimeout(() => {
      setRequestStatus('success');
      setRequestTitle('');
      setRequestDetails('');
      setTimeout(() => setRequestStatus('idle'), 3000);
    }, 1000);
  };

  const handleResetHwid = async (licenseId: string) => {
    try {
      const { error } = await supabase
        .from('licenses')
        .update({ hwid: null })
        .eq('id', licenseId)
        .eq('buyer_id', user.id);
        
      if (error) throw error;
      
      // Update local state
      setLicenses(prev => prev.map(l => l.id === licenseId ? { ...l, hwid: null } : l));
    } catch (err) {
      console.error('Error resetting HWID:', err);
    }
  };

  const theme = business.theme_config || {};
  const primaryColor = theme.primaryColor || '#3B82F6';

  return (
    <PageWrapper>
      {/* Header / Subscription Info */}
      <div className="bg-black text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8 border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center text-3xl font-black border border-white/20">
                {business.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">{business.name} Portal</h1>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-bold flex items-center gap-1">
                    <Crown className="w-4 h-4" />
                    {accessPass.title} Member
                  </span>
                  <span className="text-gray-400 text-sm">Active Subscription</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notifications
              </button>
              <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Manage
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-[#0A0A0A] border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8 overflow-x-auto no-scrollbar">
            {[
              { id: 'library', label: 'The Library', icon: Star },
              { id: 'community', label: 'VIP Community', icon: MessageSquare },
              { id: 'licenses', label: 'License Keys', icon: Key },
              { id: 'requests', label: 'Feature Requests', icon: Zap },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 flex items-center gap-2 font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id 
                    ? 'border-white text-white' 
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-screen bg-[#050505] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {activeTab === 'library' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12"
            >
              {/* Newest Releases */}
              {products.length > 0 && (
                <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-500/20 rounded-3xl p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -mr-32 -mt-32" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 text-blue-400 font-bold mb-2">
                      <Zap className="w-5 h-5" />
                      Newest Release
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">{products[0].title}</h2>
                    <p className="text-gray-300 mb-6 max-w-2xl">{products[0].description}</p>
                    <button className="px-6 py-3 bg-white text-black rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2">
                      <Download className="w-5 h-5" />
                      Download Now
                    </button>
                  </div>
                </div>
              )}

              {/* All Products Grid */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">Your Library</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <div key={product.id} className="bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden group hover:border-white/20 transition-colors">
                      <div className="aspect-video bg-gray-800 relative overflow-hidden">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600">
                            <Star className="w-8 h-8" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                            {product.type === 'digital' ? <Download className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                          </button>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{product.type}</span>
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-md font-medium">Included</span>
                        </div>
                        <h4 className="text-lg font-bold text-white mb-2">{product.title}</h4>
                        <p className="text-sm text-gray-400 line-clamp-2 mb-6">{product.description}</p>
                        <button className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                          {product.type === 'digital' ? <Download className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          {product.type === 'digital' ? 'Download' : 'Open'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'community' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto text-center py-20"
            >
              <div className="w-24 h-24 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-8">
                <MessageSquare className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Gated VIP Community</h2>
              <p className="text-gray-400 text-lg mb-8">
                {community 
                  ? `Join the exclusive ${community.name} community to access the VIP Lounge, Direct Support, and network with other members.`
                  : 'Your Wersee account is synced. Join our exclusive Discord server to access the VIP Lounge, Direct Support, and network with other members.'}
              </p>
              
              {community ? (
                <Link 
                  to={`/community/${community.id}`}
                  className="px-8 py-4 bg-indigo-600 text-white rounded-full font-bold text-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-3 mx-auto w-fit"
                >
                  <MessageSquare className="w-6 h-6" />
                  Enter Community
                  <ExternalLink className="w-5 h-5 ml-2" />
                </Link>
              ) : (
                <button className="px-8 py-4 bg-[#5865F2] text-white rounded-full font-bold text-lg hover:bg-[#4752C4] transition-colors flex items-center gap-3 mx-auto">
                  <MessageSquare className="w-6 h-6" />
                  Connect Discord & Join
                </button>
              )}
            </motion.div>
          )}

          {activeTab === 'licenses' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center">
                    <Key className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">License Management</h2>
                    <p className="text-gray-400">Manage your active script licenses and hardware IDs.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {licenses.length > 0 ? (
                    licenses.map((license) => (
                      <div key={license.id} className="flex items-center justify-between p-4 border border-white/5 rounded-2xl bg-white/5">
                        <div>
                          <h4 className="font-bold text-white">{license.listings?.title || 'Unknown Product'}</h4>
                          <p className="text-sm text-gray-400 font-mono mt-1">{license.raw_key_preview || license.key_hash.substring(0, 16)}...</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-sm px-3 py-1 rounded-full ${
                            license.status === 'active' ? 'text-green-400 bg-green-400/10' : 
                            license.status === 'revoked' ? 'text-red-400 bg-red-400/10' : 
                            'text-yellow-400 bg-yellow-400/10'
                          }`}>
                            {license.status.charAt(0).toUpperCase() + license.status.slice(1)}
                          </span>
                          <button 
                            onClick={() => handleResetHwid(license.id)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" 
                            title="Reset HWID"
                          >
                            <RefreshCw className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No licenses found for your account.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'requests' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-yellow-500/20 text-yellow-400 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Request a Feature</h2>
                    <p className="text-gray-400">As a VIP member, your suggestions get priority.</p>
                  </div>
                </div>

                <form onSubmit={handleRequestSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">What should we build next?</label>
                    <input 
                      type="text" 
                      value={requestTitle}
                      onChange={(e) => setRequestTitle(e.target.value)}
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                      placeholder="e.g., A new inventory script"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Details & Use Case</label>
                    <textarea 
                      rows={4}
                      value={requestDetails}
                      onChange={(e) => setRequestDetails(e.target.value)}
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                      placeholder="Explain how this would help you..."
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={requestStatus !== 'idle'}
                    className={`w-full py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 ${
                      requestStatus === 'success' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-white text-black hover:bg-gray-200'
                    }`}
                  >
                    {requestStatus === 'submitting' ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : requestStatus === 'success' ? (
                      <>
                        <Check className="w-5 h-5" />
                        Request Submitted!
                      </>
                    ) : (
                      'Submit Request'
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </PageWrapper>
  );
};
