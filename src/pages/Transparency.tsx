import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Eye, Database, Zap, Lock, Info, Activity, Fingerprint } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getSessionId } from '../services/algorithmService';
import { Helmet } from 'react-helmet-async';

export const Transparency = () => {
  const [interactions, setInteractions] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const sessionId = getSessionId();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        // Fetch interactions for this session or user
        const { data: interactionData } = await supabase
          .from('wersee_interactions')
          .select('*, listings(title)')
          .or(`session_id.eq.${sessionId}${user ? `,user_id.eq.${user.id}` : ''}`)
          .order('created_at', { ascending: false })
          .limit(50);

        // Fetch shadow profile
        const { data: profileData } = await supabase
          .from('wersee_shadow_profiles')
          .select('*')
          .or(`session_id.eq.${sessionId}${user ? `,user_id.eq.${user.id}` : ''}`)
          .single();

        setInteractions(interactionData || []);
        setProfile(profileData);
      } catch (error) {
        console.error('Error fetching transparency data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionId]);

  const stats = [
    { label: 'Total Interactions', value: interactions.length, icon: Activity, color: 'text-blue-400' },
    { label: 'Interests Tracked', value: profile ? Object.keys(profile.category_affinities || {}).length : 0, icon: Fingerprint, color: 'text-[#C9A84C]' },
    { label: 'Session ID', value: sessionId.substring(0, 12) + '...', icon: Lock, color: 'text-purple-400' },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-32 pb-20 font-outfit">
      <Helmet>
        <title>Data Transparency | Wersee Ecosystem</title>
        <meta name="description" content="See exactly what data Wersee tracks and how it powers your personalized experience." />
      </Helmet>

      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#C9A84C]/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[#C9A84C] text-xs font-bold uppercase tracking-widest mb-6">
            <Shield className="w-3 h-3" />
            Transparency First
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-6">
            Your Data, <span className="text-[#C9A84C]">Your Control</span>
          </h1>
          <p className="text-gray-400 text-xl font-light max-w-2xl mx-auto leading-relaxed">
            At Wersee, we believe in radical transparency. See exactly what our algorithm tracks to build your personalized "Shadow Profile".
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {stats.map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md"
            >
              <stat.icon className={`w-8 h-8 ${stat.color} mb-4`} />
              <div className="text-3xl font-black mb-1">{stat.value}</div>
              <div className="text-gray-500 text-xs font-bold uppercase tracking-widest">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column: Explanation */}
          <div className="lg:col-span-1 space-y-12">
            <section>
              <h2 className="text-2xl font-black uppercase italic mb-6 flex items-center gap-3">
                <Database className="w-6 h-6 text-blue-400" />
                What we track
              </h2>
              <div className="space-y-6">
                {[
                  { title: 'Micro-Interactions', desc: 'Every click, hover, and scroll depth helps us understand what you find interesting.' },
                  { title: 'Dwell Time', desc: 'We measure how long you stay on a listing to predict your future interests.' },
                  { title: 'Shadow Profile', desc: 'A temporary profile built on your behavior, even if you are not logged in.' }
                ].map((item, i) => (
                  <div key={i} className="group">
                    <h3 className="text-white font-bold mb-2 group-hover:text-[#C9A84C] transition-colors">{item.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="p-8 rounded-3xl bg-[#C9A84C]/5 border border-[#C9A84C]/20">
              <h3 className="text-[#C9A84C] font-bold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Why we do it
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed font-light">
                Our algorithm is designed to save you time. By understanding your behavior, we can show you the most relevant opportunities, tools, and creators without you having to search for them.
              </p>
            </section>
          </div>

          {/* Right Column: Live Data */}
          <div className="lg:col-span-2 space-y-8">
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
              <h2 className="text-2xl font-black uppercase italic mb-8 flex items-center gap-3">
                <Activity className="w-6 h-6 text-[#C9A84C]" />
                Live Interaction Feed
              </h2>
              
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : interactions.length > 0 ? (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                  {interactions.map((event, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          event.event_type === 'purchase' ? 'bg-green-500/20 text-green-400' :
                          event.event_type === 'click' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          <Eye className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white group-hover:text-[#C9A84C] transition-colors">
                            {event.event_type.toUpperCase()} on {event.listings?.title || 'Unknown Listing'}
                          </div>
                          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                            {new Date(event.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      {event.duration_seconds > 0 && (
                        <div className="text-xs font-mono text-gray-600">
                          {event.duration_seconds}s dwell
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white/[0.02] rounded-3xl border border-dashed border-white/10">
                  <Info className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500">No interactions recorded for this session yet.</p>
                </div>
              )}
            </div>

            {profile && (
              <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
                <h2 className="text-xl font-black uppercase italic mb-6">Your Interest Clusters</h2>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(profile.category_affinities || {}).map(([cat, score]: [string, any], i) => (
                    <div key={i} className="px-4 py-2 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center gap-3">
                      <span className="text-xs font-bold uppercase tracking-widest text-[#C9A84C]">{cat}</span>
                      <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((score / 50) * 100, 100)}%` }}
                          className="h-full bg-[#C9A84C]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-20 pt-12 border-t border-white/5 text-center">
          <p className="text-gray-600 text-sm font-light max-w-2xl mx-auto">
            This data is stored securely and used exclusively to improve your experience. We never sell your personal behavior data to third parties. You can clear your session data by clearing your browser's local storage.
          </p>
        </div>
      </div>
    </div>
  );
};
