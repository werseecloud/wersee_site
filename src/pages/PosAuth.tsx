import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Loader2, CheckCircle, XCircle, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';

export const PosAuth = () => {
  const { systemname, token } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Authenticating session...');

  useEffect(() => {
    const authenticateSession = async () => {
      if (!token || !systemname) {
        setStatus('error');
        setMessage('Invalid login link.');
        return;
      }

      if (!user) {
        // Redirect to auth if not logged in, preserving the return URL
        navigate(`/auth?redirect=/auth/${systemname}/${token}`);
        return;
      }

      try {
        // 1. Verify the session exists and is pending
        const { data: session, error: fetchError } = await supabase
          .from('pos_sessions')
          .select('*')
          .eq('token', token)
          .eq('system_name', systemname)
          .eq('status', 'pending')
          .single();

        if (fetchError || !session) {
          throw new Error('Session not found or already expired.');
        }

        // 2. Update the session with user_id and set status to completed
        const { error: updateError } = await supabase
          .from('pos_sessions')
          .update({
            user_id: user.id,
            status: 'completed'
          })
          .eq('id', session.id);

        if (updateError) throw updateError;

        setStatus('success');
        setMessage('Successfully logged in to POS Terminal.');
        
      } catch (err: any) {
        console.error('POS Auth Error:', err);
        setStatus('error');
        setMessage(err.message || 'Failed to authenticate session.');
      }
    };

    authenticateSession();
  }, [user, token, systemname, navigate]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-[#141414] border border-white/10 rounded-3xl p-8 shadow-2xl"
      >
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
          {status === 'loading' && <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />}
          {status === 'success' && <CheckCircle className="w-10 h-10 text-emerald-500" />}
          {status === 'error' && <XCircle className="w-10 h-10 text-red-500" />}
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">
          {status === 'loading' && 'Connecting...'}
          {status === 'success' && 'Connected!'}
          {status === 'error' && 'Connection Failed'}
        </h1>
        
        <p className="text-gray-400 mb-8">{message}</p>

        {status === 'success' && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Smartphone className="w-5 h-5 text-emerald-500" />
              <span className="text-emerald-500 font-bold">Terminal Active</span>
            </div>
            <p className="text-xs text-gray-400">You can now use the POS terminal on your other device.</p>
          </div>
        )}

        <button 
          onClick={() => navigate('/dashboard')}
          className="w-full py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors"
        >
          Go to Dashboard
        </button>
      </motion.div>
    </div>
  );
};
