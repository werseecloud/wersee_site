import React, { useState, useEffect } from 'react';
import { Copy, Check, Link as LinkIcon, Loader2, AlertCircle, Calendar, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { BottomSheetModal } from '../ui/BottomSheetModal';
import { hapticFeedback } from '../../lib/haptics';

interface ChatInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  chatName: string;
}

export const ChatInviteModal = ({ isOpen, onClose, chatId, chatName }: ChatInviteModalProps) => {
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState('7'); // days
  const [maxUses, setMaxUses] = useState('0'); // 0 = unlimited

  useEffect(() => {
    if (isOpen) {
      fetchExistingInvite();
    }
  }, [isOpen, chatId]);

  const fetchExistingInvite = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chat_invites')
        .select('token')
        .eq('chat_id', chatId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) {
        setInviteCode(data[0].token);
      } else {
        setInviteCode(null);
      }
    } catch (err) {
      console.error('Error fetching invite:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateInvite = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
      const expiresAt = expiresIn === 'never' ? null : new Date(Date.now() + parseInt(expiresIn) * 24 * 60 * 60 * 1000).toISOString();
      const maxUsesVal = parseInt(maxUses) === 0 ? null : parseInt(maxUses);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('chat_invites')
        .insert({
          chat_id: chatId,
          token,
          created_by: user.id,
          expires_at: expiresAt,
          max_uses: maxUsesVal
        });

      if (error) throw error;
      setInviteCode(token);
    } catch (err: any) {
      console.error('Error generating invite:', err);
      setError(err.message || 'Failed to generate invite link.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!inviteCode) return;
    hapticFeedback('light');
    const url = `${window.location.origin}/chat/invite/${inviteCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <BottomSheetModal 
      isOpen={isOpen} 
      onClose={onClose}
      maxWidth="max-w-md"
    >
      <div className="flex flex-col h-full">
        <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <LinkIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Invite to Chat</h3>
              <p className="text-xs text-gray-500 truncate max-w-[200px]">{chatName}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {!inviteCode ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    Expires In
                  </label>
                  <select 
                    value={expiresIn}
                    onChange={(e) => setExpiresIn(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="1">1 Day</option>
                    <option value="7">7 Days</option>
                    <option value="30">30 Days</option>
                    <option value="never">Never</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-3 h-3" />
                    Max Uses
                  </label>
                  <select 
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="0">Unlimited</option>
                    <option value="1">1 Use</option>
                    <option value="5">5 Uses</option>
                    <option value="25">25 Uses</option>
                    <option value="100">100 Uses</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => {
                  hapticFeedback('medium');
                  generateInvite();
                }}
                disabled={loading}
                className="w-full py-4 bg-white text-black rounded-2xl font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate Invite Link'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Share this link</p>
                <div className="flex items-center gap-2">
                  <input 
                    readOnly
                    value={`${window.location.origin}/chat/invite/${inviteCode}`}
                    className="flex-1 bg-transparent border-none p-0 text-sm text-white focus:ring-0"
                  />
                  <button 
                    onClick={copyToClipboard}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <button
                onClick={() => setInviteCode(null)}
                className="w-full py-3 text-sm text-gray-500 hover:text-white transition-colors"
              >
                Generate a new link
              </button>
            </div>
          )}
        </div>

        <div className="p-6 bg-white/5 text-center shrink-0">
          <p className="text-xs text-gray-500">
            Anyone with this link will be able to join this chat.
          </p>
        </div>
      </div>
    </BottomSheetModal>
  );
};
