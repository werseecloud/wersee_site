import React, { useState } from 'react';
import { 
  Plus, Mail, Link as LinkIcon, Loader2, Copy, Trash2, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';

import { appToast } from '@/lib/feedback';
interface InviteMemberModalProps {
  teamId: string;
  isOwner: boolean;
  onClose: () => void;
  onInvite: (email: string, role: string) => Promise<void>;
}

export const InviteMemberModal = ({ teamId, isOwner, onClose, onInvite }: InviteMemberModalProps) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);

  const [copied, setCopied] = useState(false);

  const handleSubmit = async () => {
    if (!email) return;
    setLoading(true);
    await onInvite(email, role);
    setLoading(false);
  };

  const handleGenerateLink = async () => {
    setGeneratingLink(true);
    try {
      const { data: existingLinks } = await supabase
        .from('team_invites')
        .select('*')
        .eq('team_id', teamId)
        .eq('role', role)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (existingLinks && existingLinks.length > 0) {
        const link = `${window.location.origin}/invite/${existingLinks[0].token}`;
        setInviteLink(link);
        setGeneratingLink(false);
        return;
      }

      const expiry = isOwner 
        ? new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('team_invites')
        .insert({ 
          team_id: teamId, 
          role: role,
          expires_at: expiry,
          max_uses: isOwner ? null : 1
        })
        .select()
        .single();
      
      if (error) throw error;
      
      const link = `${window.location.origin}/invite/${data.token}`;
      setInviteLink(link);
    } catch (error) {
      console.error('Error generating link:', error);
      appToast('Failed to generate invite link');
    } finally {
      setGeneratingLink(false);
    }
  };

  const copyLink = async () => {
    if (inviteLink) {
      try {
        await navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#141414] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-white">Invite Team Member</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <Plus className="w-6 h-6 rotate-45" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Role</label>
            <select 
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors appearance-none"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
              <option value="developer">Developer</option>
              <option value="designer">Designer</option>
            </select>
          </div>

          <button 
            onClick={handleSubmit}
            disabled={loading || !email}
            className="w-full py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            Send Invitation
          </button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#141414] px-2 text-gray-500">Or share link</span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-4">Share Invite Link</h4>
            
            {inviteLink ? (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-gray-400 truncate text-sm flex items-center">
                    {inviteLink}
                  </div>
                  <button 
                    onClick={copyLink}
                    className="px-4 py-2 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition-colors flex items-center gap-2"
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={handleGenerateLink}
                disabled={generatingLink}
                className="w-full py-3 bg-white/5 text-white rounded-xl font-bold hover:bg-white/10 transition-colors flex items-center justify-center gap-2 border border-white/10"
              >
                {generatingLink ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
                Generate Invite Link
              </button>
            )}
            <p className="text-xs text-gray-500 mt-4 text-center">
              Anyone with this link can join as a <span className="text-white font-bold">{role}</span>.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
