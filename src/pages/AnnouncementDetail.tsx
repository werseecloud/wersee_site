import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Megaphone, 
  Heart, 
  Share2, 
  MessageCircle, 
  ExternalLink, 
  Calendar, 
  User,
  Clock,
  Send,
  MoreHorizontal
} from 'lucide-react';
import { AnnouncementCard } from '../components/ui/cards/AnnouncementCard';

import { appToast } from '@/lib/feedback';
export const AnnouncementDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [announcement, setAnnouncement] = useState<any>(null);
  const [otherAnnouncements, setOtherAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      if (!id) return;
      setLoading(true);
      try {
        // Fetch the main announcement
        const { data: listingData, error } = await supabase
          .from('listings')
          .select('*, profiles!listings_seller_id_fkey(username, full_name, avatar_url)')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (listingData) {
          const processed = {
            ...listingData,
            creator_name: listingData.profiles?.full_name || listingData.profiles?.username,
            creator_avatar: listingData.profiles?.avatar_url,
          };
          setAnnouncement(processed);
          setLikesCount(listingData.likes_count || 0);

          // Check if user liked it
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: likeData } = await supabase
              .from('listing_likes')
              .select('id')
              .eq('listing_id', id)
              .eq('user_id', user.id)
              .single();
            
            if (likeData) setLiked(true);
          }

          // Fetch comments
          const { data: commentsData } = await supabase
            .from('listing_comments')
            .select('*, profiles(username, full_name, avatar_url)')
            .eq('listing_id', id)
            .order('created_at', { ascending: true });
          
          if (commentsData) {
            setComments(commentsData.map(c => ({
              ...c,
              user_name: c.profiles?.full_name || c.profiles?.username,
              user_avatar: c.profiles?.avatar_url
            })));
          }

          // Fetch other announcements from the same creator
          const { data: othersData } = await supabase
            .from('listings')
            .select('*, profiles!listings_seller_id_fkey(username, full_name, avatar_url)')
            .eq('seller_id', listingData.seller_id)
            .eq('type', 'announcement')
            .neq('id', id)
            .order('created_at', { ascending: false })
            .limit(3);

          if (othersData) {
            setOtherAnnouncements(othersData.map(l => ({
              ...l,
              creator_name: l.profiles?.full_name || l.profiles?.username,
              creator_avatar: l.profiles?.avatar_url
            })));
          }
        }
      } catch (error) {
        console.error('Error fetching announcement:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncement();
  }, [id]);

  const handleLike = async () => {
    if (!announcement) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      appToast('Please log in to like announcements');
      return;
    }

    const newLikedState = !liked;
    setLiked(newLikedState);
    setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);

    try {
      if (newLikedState) {
        await supabase
          .from('listing_likes')
          .insert({ listing_id: id, user_id: user.id });
      } else {
        await supabase
          .from('listing_likes')
          .delete()
          .eq('listing_id', id)
          .eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Error updating like:', error);
      setLiked(!newLikedState);
      setLikesCount(prev => !newLikedState ? prev + 1 : prev - 1);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !announcement) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      appToast('Please log in to comment');
      return;
    }

    setIsSubmittingComment(true);
    try {
      const { data: commentData, error } = await supabase
        .from('listing_comments')
        .insert({
          listing_id: id,
          user_id: user.id,
          content: newComment.trim()
        })
        .select('*, profiles(username, full_name, avatar_url)')
        .single();

      if (error) throw error;

      if (commentData) {
        const newCommentObj = {
          ...commentData,
          user_name: commentData.profiles?.full_name || commentData.profiles?.username,
          user_avatar: commentData.profiles?.avatar_url
        };
        setComments(prev => [...prev, newCommentObj]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      appToast('Failed to post comment. Please try again.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: announcement?.title,
        text: announcement?.description,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      appToast('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Megaphone className="w-8 h-8 text-indigo-500 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center text-white p-6">
        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <Megaphone className="w-12 h-12 text-red-500" />
        </div>
        <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-4">Announcement not found</h2>
        <p className="text-gray-400 mb-8 text-center max-w-md">The announcement you're looking for might have been removed or is no longer available.</p>
        <Link to="/" className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-indigo-500/20">
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pb-20">
      {/* Hero Header */}
      <div className="relative h-[50vh] sm:h-[60vh] w-full overflow-hidden">
        {announcement.metadata?.imageUrl ? (
          <img 
            src={announcement.metadata.imageUrl} 
            alt={announcement.title} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-[#0A0A0A] to-purple-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-transparent" />
        
        {/* Navigation */}
        <div className="absolute top-8 left-8 z-20">
          <Link to="/" className="flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold text-sm">Back</span>
          </Link>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 w-full p-8 sm:p-12 z-10">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <span className="px-4 py-1.5 bg-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20">
                  Announcement
                </span>
                <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest">
                  <Calendar className="w-4 h-4" />
                  {new Date(announcement.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black italic uppercase tracking-tighter leading-[0.9] mb-8">
                {announcement.title}
              </h1>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-10 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#141414] border border-white/5 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl"
            >
              <div className="prose prose-invert max-w-none">
                <p className="text-xl leading-relaxed text-gray-300 whitespace-pre-wrap font-medium">
                  {announcement.description}
                </p>
              </div>

              {announcement.metadata?.linkUrl && (
                <div className="mt-12">
                  <a 
                    href={announcement.metadata.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 px-8 py-5 bg-white text-black hover:bg-indigo-500 hover:text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all group"
                  >
                    Explore More
                    <ExternalLink className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </a>
                </div>
              )}

              {/* Interaction Bar */}
              <div className="flex items-center gap-4 mt-12 pt-8 border-t border-white/5">
                <button 
                  onClick={handleLike}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all active:scale-95 ${liked ? 'bg-pink-500 text-white shadow-xl shadow-pink-500/20' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                >
                  <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                  {likesCount}
                </button>
                <button 
                  onClick={() => setShowComments(!showComments)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all active:scale-95 ${showComments ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                >
                  <MessageCircle className="w-5 h-5" />
                  {comments.length}
                </button>
                <button 
                  onClick={handleShare}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all ml-auto active:scale-95"
                >
                  <Share2 className="w-5 h-5" />
                  Share
                </button>
              </div>
            </motion.div>

            {/* Comments Section */}
            <AnimatePresence>
              {showComments && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="bg-[#141414] border border-white/5 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl"
                >
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter">Discussion</h3>
                    <span className="text-gray-500 font-bold text-sm uppercase tracking-widest">{comments.length} Comments</span>
                  </div>
                  
                  {/* Comment Form */}
                  <form onSubmit={handleComment} className="mb-12">
                    <div className="relative group">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Join the discussion..."
                        className="w-full bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 transition-all resize-none h-32 text-lg font-medium"
                      />
                      <button
                        type="submit"
                        disabled={isSubmittingComment || !newComment.trim()}
                        className="absolute bottom-4 right-4 p-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
                      >
                        {isSubmittingComment ? (
                          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Comments List */}
                  <div className="space-y-8">
                    {comments.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                          <MessageCircle className="w-8 h-8 text-gray-600" />
                        </div>
                        <p className="text-gray-500 italic font-medium">No comments yet. Start the conversation!</p>
                      </div>
                    ) : (
                      comments.map((comment, idx) => (
                        <motion.div 
                          key={comment.id} 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex gap-5 group"
                        >
                          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-indigo-500/10 border border-white/5 shrink-0 shadow-lg">
                            {comment.user_avatar ? (
                              <img src={comment.user_avatar} alt={comment.user_name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-indigo-400 font-black italic">
                                {comment.user_name?.charAt(0) || 'U'}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="font-black uppercase tracking-widest text-[10px] text-indigo-400">{comment.user_name}</span>
                                <div className="w-1 h-1 rounded-full bg-gray-700" />
                                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                                  {new Date(comment.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <button className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-white">
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl rounded-tl-none p-5">
                              <p className="text-gray-300 text-sm leading-relaxed font-medium">
                                {comment.content}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            {/* Creator Card */}
            <div className="bg-[#141414] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl sticky top-24">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-6">Published By</h4>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-indigo-500/10 border border-indigo-500/20 shrink-0 shadow-xl">
                  {announcement.creator_avatar ? (
                    <img src={announcement.creator_avatar} alt={announcement.creator_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-indigo-400 font-black text-2xl italic tracking-tighter">
                      {announcement.creator_name?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-black italic uppercase tracking-tighter text-white leading-none mb-1">{announcement.creator_name || 'User'}</h3>
                  <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Verified Creator</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#0A0A0A] rounded-2xl border border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Total Likes</span>
                  <span className="font-black italic text-indigo-400">{likesCount}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-[#0A0A0A] rounded-2xl border border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Comments</span>
                  <span className="font-black italic text-indigo-400">{comments.length}</span>
                </div>
              </div>

              <button className="w-full mt-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-indigo-500/20 active:scale-95">
                Follow Creator
              </button>
            </div>
          </div>
        </div>

        {/* Other Announcements */}
        {otherAnnouncements.length > 0 && (
          <div className="mt-24">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-3xl font-black italic uppercase tracking-tighter">More from this Creator</h3>
              <div className="h-px flex-1 bg-white/5 mx-8" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {otherAnnouncements.map((item) => (
                <AnnouncementCard key={item.id} announcement={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
