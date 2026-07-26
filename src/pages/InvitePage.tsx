import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Loader2, AlertCircle, CheckCircle, Users, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const InvitePage = () => {
  const params = useParams();
  const token = params.token;
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteDetails, setInviteDetails] = useState<{ name: string, type: string, role?: string, is_group?: boolean } | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!token) return;

      try {
        const { data, error } = await supabase.rpc('get_invite_details_v2', { token_input: token });

        if (error) throw error;

        if (!data.valid) {
          console.error('Invite is invalid:', data.error);
          throw new Error(data.error);
        }
        
        setInviteDetails(data);
      } catch (err: any) {
        console.error('Error in fetchDetails:', err);
        setError(err.message || 'Invalid or expired invite link.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [token]);

  const handleJoin = async () => {
    if (!token || !inviteDetails) return;
    
    // If not logged in, redirect to auth
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setJoining(true);
    try {
      if (inviteDetails.type === 'team') {
        const { data, error } = await supabase.rpc('accept_invite', { token_input: token });
        if (error) throw error;
        if (!data.success) throw new Error(data.error);
        navigate('/dashboard?tab=overview&view=money-splits');
      } else {
        const { data, error } = await supabase.rpc('accept_chat_invite', { token_input: token });
        if (error) throw error;
        if (!data.success) throw new Error(data.error);
        navigate('/chat');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to join.');
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-white animate-spin mb-4" />
        <p className="text-gray-400">Loading invite details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#141414] p-8 rounded-3xl border border-white/10 max-w-md w-full text-center shadow-2xl"
        >
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Invite Error</h1>
          <p className="text-gray-400 mb-8">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="w-full py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors"
          >
            Go Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#141414]/80 backdrop-blur-xl p-8 rounded-3xl border border-white/10 max-w-md w-full text-center shadow-2xl relative z-10"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/20 rotate-3">
          <Users className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-2">You're invited!</h1>
        <p className="text-gray-400 mb-8">
          {inviteDetails?.type === 'team' ? (
            <>You've been invited to join <span className="text-white font-bold">{inviteDetails?.name}</span> as a <span className="text-white font-bold capitalize">{inviteDetails?.role}</span>.</>
          ) : (
            <>You've been invited to join the chat <span className="text-white font-bold">{inviteDetails?.name}</span>.</>
          )}
        </p>

        <div className="space-y-4">
          <button 
            onClick={handleJoin}
            disabled={joining}
            className="w-full py-4 bg-white text-black rounded-xl font-bold text-lg hover:bg-gray-200 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-white/10"
          >
            {joining ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {user ? (inviteDetails?.type === 'team' ? 'Join Team' : 'Join Chat') : 'Log in & Join'}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
          
          {!user && (
            <p className="text-xs text-gray-500">
              You'll be redirected to log in or create an account first.
            </p>
          )}
        </div>
      </motion.div>
      
      <div className="mt-8 text-center text-gray-600 text-sm relative z-10">
        <p>Powered by Wersee</p>
      </div>
    </div>
  );
};
