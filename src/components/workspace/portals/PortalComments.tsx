import React, { useState, useEffect } from 'react';
import { Send, MessageSquare, User, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../../lib/supabase';

interface PortalCommentsProps {
  businessId: string;
  resourceType: 'task' | 'doc' | 'event';
  resourceId: string;
  user: any;
}

export const PortalComments: React.FC<PortalCommentsProps> = ({ businessId, resourceType, resourceId, user }) => {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();

    const channel = supabase
      .channel(`portal-comments-${resourceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'portal_comments',
          filter: `resource_id=eq.${resourceId}`
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [resourceId]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('portal_comments')
        .select('*')
        .eq('resource_id', resourceId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const { error } = await supabase
        .from('portal_comments')
        .insert({
          business_id: businessId,
          resource_type: resourceType,
          resource_id: resourceId,
          user_id: user.id,
          content: newComment.trim()
        });

      if (error) throw error;
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-4 h-4 text-indigo-400" />
        <h4 className="text-sm font-bold text-white uppercase tracking-widest">Comments</h4>
      </div>

      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {comments.map((comment, i) => (
          <motion.div
            key={comment.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-gray-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-gray-400">Team Member</span>
                <span className="text-[10px] text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="p-3 bg-white/5 border border-white/5 rounded-2xl rounded-tl-none">
                <p className="text-xs text-gray-300 leading-relaxed">{comment.content}</p>
              </div>
            </div>
          </motion.div>
        ))}
        {comments.length === 0 && !loading && (
          <div className="py-8 text-center bg-white/[0.01] border border-dashed border-white/5 rounded-2xl">
            <p className="text-xs text-gray-500">No comments yet. Start the conversation!</p>
          </div>
        )}
      </div>

      <div className="relative">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
          placeholder="Write a comment..."
          className="w-full px-5 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-indigo-500/50 transition-all pr-12"
        />
        <button
          onClick={handleAddComment}
          disabled={!newComment.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
