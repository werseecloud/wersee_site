import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { MessageCircle, Check, X, Loader2, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

export const LinkAccount = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discordId, setDiscordId] = useState<string | null>(null);
  
  const token = searchParams.get('token');
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      // Store current path to redirect back after login
      const currentPath = window.location.pathname + window.location.search;
      navigate(`/auth?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    if (!token) {
      setError('No validation token found.');
      setLoading(false);
      return;
    }

    validateToken();
  }, [user, authLoading, token]);

  const validateToken = async () => {
    try {
      const { data, error } = await supabase
        .from('discord_link_codes')
        .select('*')
        .eq('code', token)
        .single();

      if (error || !data) {
        setError('This token is invalid or expired.');
      } else {
        const expiresAt = new Date(data.expires_at);
        if (expiresAt < new Date()) {
          setError('This token has expired.');
        } else {
          setDiscordId(data.discord_id);
        }
      }
    } catch (err) {
      setError('An error occurred while validating your link.');
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async () => {
    if (!user || !discordId || !token) return;
    
    setLinking(true);
    try {
      // 1. Link the account
      const { error: linkError } = await supabase
        .from('discord_links')
        .upsert({
          user_id: user.id,
          discord_id: discordId,
          updated_at: new Date().toISOString()
        });

      if (linkError) throw linkError;

      // 2. Delete the temporary code
      await supabase
        .from('discord_link_codes')
        .delete()
        .eq('code', token);

      toast.success('Discord account linked successfully!');
      
      // Redirect to profile or dashboard after 2 seconds
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
      
    } catch (err: any) {
      console.error(err);
      toast.error('Linking failed: ' + (err.message || 'Unknown error'));
      setLinking(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-white">
        <Loader2 className="w-12 h-12 animate-spin text-[#10B981] mb-4" />
        <p className="text-[#86868B]">Validating your link...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#1C1C1E] border border-white/5 rounded-3xl p-8 text-center"
      >
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-16 h-16 bg-[#5865F2] rounded-2xl flex items-center justify-center shadow-lg shadow-[#5865F2]/20">
              <MessageCircle className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#10B981] rounded-full border-4 border-[#1C1C1E] flex items-center justify-center">
              <LinkIcon className="w-3 h-3 text-white" />
            </div>
          </div>
        </div>

        {error ? (
          <>
            <h1 className="text-2xl font-bold text-white mb-2">Oops!</h1>
            <p className="text-[#86868B] mb-8">{error}</p>
            <button 
              onClick={() => navigate('/')}
              className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-colors font-medium"
            >
              Back to Home
            </button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-white mb-2">Link Wersee & Discord</h1>
            <p className="text-[#86868B] mb-8">
              You are about to link your Wersee account to your Discord ID.
              This gives you access to exclusive bot features.
            </p>

            <div className="bg-white/5 rounded-2xl p-4 mb-8 text-left border border-white/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span className="text-sm text-[#86868B]">Logged in as:</span>
                <span className="text-sm text-white font-medium">{user?.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#5865F2]" />
                <span className="text-sm text-[#86868B]">Discord ID:</span>
                <span className="text-sm text-white font-medium">{discordId}</span>
              </div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={handleLink}
                disabled={linking}
                className="w-full py-4 bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 text-white rounded-2xl transition-all font-bold shadow-lg shadow-[#10B981]/20 flex items-center justify-center gap-2"
              >
                {linking ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Linking...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Confirm Link
                  </>
                )}
              </button>
              
              <button 
                onClick={() => navigate('/')}
                disabled={linking}
                className="w-full py-4 bg-transparent hover:bg-white/5 text-[#86868B] rounded-2xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};
