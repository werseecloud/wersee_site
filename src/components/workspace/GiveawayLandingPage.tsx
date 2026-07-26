import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Gift, Timer, Users, Trophy, Share2, Twitter, MessageSquare, Mail, Smartphone, CheckCircle2, ArrowRight, Loader2, AlertCircle, Plus } from 'lucide-react';

import { appToast } from '@/lib/feedback';
interface Giveaway {
  id: string;
  title: string;
  prize: string;
  description: string;
  end_date: string;
  status: string;
  is_verified?: boolean;
  entry_actions: any[];
  seo_title?: string;
  seo_description?: string;
  og_image_url?: string;
}

interface Participant {
  id: string;
  name: string;
  email: string;
  username?: string;
  referral_code: string;
  total_entries: number;
}

export const GiveawayLandingPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref');

  const [giveaway, setGiveaway] = useState<Giveaway | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [screen, setScreen] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [joinedCount, setJoinedCount] = useState(0);
  const [isWerseeUser, setIsWerseeUser] = useState(false);
  const [werseeUser, setWerseeUser] = useState<any>(null);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [participant, setParticipant] = useState<Participant | null>(null);

  // Countdown state
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    if (id) {
      fetchGiveaway();
      checkWerseeAuth();
      logAnalytics('click');
    }
  }, [id]);

  const checkWerseeAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsWerseeUser(true);
        setWerseeUser(user);
        // Pre-fill form if not already filled
        setName(user.user_metadata?.full_name || user.email?.split('@')[0] || '');
        setEmail(user.email || '');
      }
    } catch (err) {
      console.error('Error checking Wersee auth:', err);
    }
  };

  useEffect(() => {
    if (giveaway?.end_date) {
      const timer = setInterval(() => {
        const end = new Date(giveaway.end_date).getTime();
        const now = new Date().getTime();
        const distance = end - now;

        if (distance < 0) {
          clearInterval(timer);
          setTimeLeft(null);
        } else {
          setTimeLeft({
            days: Math.floor(distance / (1000 * 60 * 60 * 24)),
            hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((distance % (1000 * 60)) / 1000)
          });
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [giveaway]);

  const fetchGiveaway = async () => {
    try {
      const { data, error } = await supabase
        .from('giveaways')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching giveaway:', error);
        if (error.code === 'PGRST116' || error.code === '406' || (error as any).status === 406) {
          setError('Giveaway not found. Please check the link.');
        } else {
          setError('Failed to load giveaway. Please try again later.');
        }
        return;
      }
      setGiveaway(data);

      // Fetch real participant count
      const { count, error: countError } = await supabase
        .from('giveaway_participants')
        .select('*', { count: 'exact', head: true })
        .eq('giveaway_id', id);
      
      if (!countError) {
        setJoinedCount(count || 0);
      }
    } catch (err: any) {
      console.error('Error fetching giveaway:', err);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const logAnalytics = async (eventType: string, metadata: any = {}) => {
    if (!id) return;
    try {
      await supabase.from('giveaway_analytics').insert([{
        giveaway_id: id,
        event_type: eventType,
        metadata
      }]);
    } catch (err) {
      console.error('Error logging analytics:', err);
    }
  };

  const handleJoin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!id || !name || !email) return;
    setSubmitting(true);
    try {
      // Find referrer if refCode exists
      let referredById = null;
      if (refCode) {
        const { data: refData } = await supabase
          .from('giveaway_participants')
          .select('id')
          .eq('referral_code', refCode)
          .single();
        if (refData) referredById = refData.id;
      }

      const { data, error } = await supabase
        .from('giveaway_participants')
        .insert([{
          giveaway_id: id,
          name,
          email: email.toLowerCase(),
          username,
          referred_by: referredById,
          user_id: werseeUser?.id || null,
          total_entries: 1,
          referral_code: Math.random().toString(36).substring(2, 8).toUpperCase()
        }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          // Already joined, fetch participant
          const { data: existing } = await supabase
            .from('giveaway_participants')
            .select('*')
            .eq('giveaway_id', id)
            .eq('email', email.toLowerCase())
            .single();
          if (existing) {
            setParticipant(existing);
            setScreen(3);
            logAnalytics('screen_3', { email });
          }
        } else {
          throw error;
        }
      } else {
        setParticipant(data);
        setScreen(3);
        setJoinedCount(prev => prev + 1);
        logAnalytics('screen_3', { email });
        
        // If referred, give points to referrer
        if (referredById) {
          await supabase.rpc('increment_participant_entries', { 
            p_id: referredById, 
            p_points: 5 
          });
          await supabase.from('giveaway_entries').insert([{
            participant_id: referredById,
            action_type: 'referral',
            points: 5
          }]);
        }
      }
    } catch (err: any) {
      console.error('Error joining giveaway:', err);
      appToast(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (action: any) => {
    if (!participant) return;
    try {
      // In a real app, you'd verify the action here
      // For now, we'll just simulate success
      const { error } = await supabase
        .from('giveaway_entries')
        .insert([{
          participant_id: participant.id,
          action_type: action.type,
          points: action.points
        }]);

      if (error) throw error;

      // Update local state and DB
      const newTotal = participant.total_entries + action.points;
      await supabase
        .from('giveaway_participants')
        .update({ total_entries: newTotal })
        .eq('id', participant.id);

      setParticipant({ ...participant, total_entries: newTotal });
      appToast(`Success! You earned +${action.points} entries.`);
    } catch (err: any) {
      console.error('Error performing action:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-pink-500 animate-spin" />
      </div>
    );
  }

  if (error || !giveaway) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Giveaway Not Found</h1>
        <p className="text-gray-400">The giveaway you are looking for does not exist or has been removed.</p>
      </div>
    );
  }

  const shareUrl = `${window.location.origin}/g/${id}?ref=${participant?.referral_code}`;
  const displayJoinedCount = joinedCount >= 1000 ? `${(joinedCount / 1000).toFixed(1)}k+` : joinedCount;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-pink-500/30">
      <Helmet>
        <title>{giveaway.seo_title || giveaway.title}</title>
        <meta name="description" content={giveaway.seo_description || giveaway.description} />
        <meta property="og:title" content={giveaway.seo_title || giveaway.title} />
        <meta property="og:description" content={giveaway.seo_description || giveaway.description} />
        <meta property="og:image" content={giveaway.og_image_url || 'https://picsum.photos/seed/giveaway/1200/630'} />
        <meta property="og:type" content="website" />
      </Helmet>
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-pink-500/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-indigo-500/10 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 max-w-2xl mx-auto px-6 py-12 md:py-24">
        <AnimatePresence mode="wait">
          {screen === 1 && (
            <motion.div
              key="screen1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8 text-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500/10 border border-pink-500/20 rounded-full text-pink-400 text-sm font-bold animate-pulse">
                <Gift className="w-4 h-4" />
                ACTIVE GIVEAWAY
              </div>

              <div className="space-y-4">
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none uppercase italic">
                  {giveaway.title}
                </h1>
                <p className="text-xl text-gray-400 max-w-lg mx-auto">
                  {giveaway.description || `Win a ${giveaway.prize}! Join now for a chance to win.`}
                </p>
              </div>

              {timeLeft && (
                <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
                  {[
                    { label: 'Days', value: timeLeft.days },
                    { label: 'Hours', value: timeLeft.hours },
                    { label: 'Mins', value: timeLeft.minutes },
                    { label: 'Secs', value: timeLeft.seconds }
                  ].map((unit) => (
                    <div key={unit.label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <div className="text-3xl font-black text-white">{unit.value.toString().padStart(2, '0')}</div>
                      <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{unit.label}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-8">
                <button
                  onClick={() => {
                    setScreen(2);
                    logAnalytics('screen_2');
                  }}
                  className="group relative inline-flex items-center gap-3 px-12 py-6 bg-pink-500 hover:bg-pink-600 text-white font-black text-xl rounded-full transition-all shadow-2xl shadow-pink-500/40 hover:scale-105 active:scale-95"
                >
                  JOIN GIVEAWAY
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-8 text-gray-500 pt-8">
                <div className="flex flex-col items-center">
                  <Users className="w-5 h-5 mb-1" />
                  <span className="text-xs font-bold uppercase tracking-widest">{displayJoinedCount} Joined</span>
                </div>
                {giveaway.is_verified && (
                  <div className="flex flex-col items-center text-emerald-400">
                    <CheckCircle2 className="w-5 h-5 mb-1" />
                    <span className="text-xs font-bold uppercase tracking-widest">Verified Prize</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {screen === 2 && (
            <motion.div
              key="screen2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-12 shadow-2xl backdrop-blur-xl"
            >
              <div className="text-center mb-10">
                <h2 className="text-3xl font-black uppercase italic mb-2">Join the Squad</h2>
                <p className="text-gray-400">Enter your details to secure your spot.</p>
              </div>

              {isWerseeUser ? (
                <div className="space-y-6">
                  <div className="p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-indigo-500 flex items-center justify-center text-2xl font-black">
                      {email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xl font-black text-white">{name}</p>
                      <p className="text-sm text-gray-500">{email}</p>
                    </div>
                  </div>
                  <button
                    disabled={submitting}
                    onClick={() => handleJoin()}
                    className="w-full py-5 bg-pink-500 text-white font-black text-lg rounded-2xl hover:bg-pink-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-pink-500/20"
                  >
                    {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                      <>
                        JOIN WITH WERSEE ACCOUNT
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => setIsWerseeUser(false)}
                    className="w-full text-xs font-bold text-gray-500 hover:text-white uppercase tracking-widest"
                  >
                    Use a different email
                  </button>
                </div>
              ) : (
                <form onSubmit={handleJoin} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Full Name</label>
                    <input
                      required
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-pink-500/50 transition-all placeholder:text-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Email Address</label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-pink-500/50 transition-all placeholder:text-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Username (Optional)</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="@johndoe"
                      className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-pink-500/50 transition-all placeholder:text-gray-700"
                    />
                  </div>

                  <button
                    disabled={submitting}
                    type="submit"
                    className="w-full py-5 bg-white text-black font-black text-lg rounded-2xl hover:bg-gray-200 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                      <>
                        ENTER NOW
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              )}

              <p className="text-center text-[10px] text-gray-600 mt-8 uppercase font-bold tracking-widest">
                By entering, you agree to our Terms & Privacy Policy.
              </p>
            </motion.div>
          )}

          {screen === 3 && participant && (
            <motion.div
              key="screen3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[40px] p-8 text-center">
                <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/40">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-black uppercase italic mb-2">You're In!</h2>
                <p className="text-emerald-400 font-bold">Good luck, {participant.name.split(' ')[0]}!</p>
                
                <div className="mt-8 p-6 bg-black/40 rounded-3xl border border-white/5 inline-block">
                  <div className="text-4xl font-black text-white">{participant.total_entries}</div>
                  <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Total Entries</div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-black uppercase italic">Boost Your Chances</h3>
                <div className="grid gap-3">
                  {giveaway.entry_actions?.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAction(action)}
                      className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                          {action.type === 'share' && <Share2 className="w-5 h-5 text-blue-400" />}
                          {action.type === 'follow_x' && <Twitter className="w-5 h-5 text-sky-400" />}
                          {action.type === 'join_discord' && <MessageSquare className="w-5 h-5 text-indigo-400" />}
                          {action.type === 'subscribe' && <Mail className="w-5 h-5 text-emerald-400" />}
                          {action.type === 'post_socials' && <Smartphone className="w-5 h-5 text-pink-400" />}
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-white">{action.label}</p>
                          <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">+{action.points} Entries</p>
                        </div>
                      </div>
                      <Plus className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-[40px] p-8">
                <h3 className="text-xl font-black uppercase italic mb-4">Refer Friends</h3>
                <p className="text-gray-400 mb-6">Get <span className="text-white font-bold">+5 entries</span> for every person who joins using your link!</p>
                
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={shareUrl}
                    className="flex-1 px-6 py-4 bg-black/40 border border-white/10 rounded-2xl text-sm text-gray-400 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shareUrl);
                      appToast('Link copied!');
                    }}
                    className="px-6 py-4 bg-white text-black font-black rounded-2xl hover:bg-gray-200 transition-all"
                  >
                    COPY
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="relative z-10 py-12 text-center border-t border-white/5">
        <div className="flex items-center justify-center gap-2 text-gray-500 text-sm font-bold">
          <span>POWERED BY</span>
          <span className="text-white tracking-widest font-black italic">WERSEE</span>
        </div>
      </footer>
    </div>
  );
};
