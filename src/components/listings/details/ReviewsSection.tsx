import React, { useState } from 'react';
import { User, Send, MessageSquare, Star } from 'lucide-react';
import { format } from 'date-fns';
import { StarRating } from '../../ui/StarRating';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles: {
    name: string;
    avatar_url: string | null;
  };
}

interface ReviewsSectionProps {
  listingId: string;
  reviews: Review[];
  onReviewAdded?: () => void;
}

export const ReviewsSection = ({ listingId, reviews, onReviewAdded }: ReviewsSectionProps) => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSubmitting(true);
    setError('');

    try {
      const { error: submitError } = await supabase
        .from('reviews')
        .upsert({
          listing_id: listingId,
          user_id: user.id,
          rating,
          comment,
          updated_at: new Date().toISOString()
        }, { onConflict: 'listing_id,user_id' });

      if (submitError) throw submitError;

      setComment('');
      setShowForm(false);
      if (onReviewAdded) onReviewAdded();
    } catch (err: any) {
      console.error('Error submitting review:', err);
      setError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length 
    : 0;

  const ratingCounts = [5, 4, 3, 2, 1].map(r => ({
    rating: r,
    count: reviews.filter(rev => Math.round(rev.rating) === r).length
  }));

  const userReview = reviews.find(r => (r as any).user_id === user?.id);

  React.useEffect(() => {
    if (userReview) {
      setRating(userReview.rating);
      setComment(userReview.comment || '');
    }
  }, [userReview]);

  return (
    <div className="space-y-8 pt-12 border-t border-white/10">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white">Reviews</h3>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <StarRating rating={averageRating} size={16} />
              <span className="text-sm text-gray-400">
                {averageRating.toFixed(1)} based on {reviews.length} reviews
              </span>
            </div>
          )}
          {reviews.length > 0 && (
            <div className="mt-4 space-y-1">
              {ratingCounts.map(rc => (
                <div key={rc.rating} className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="w-3">{rc.rating}</span>
                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                  <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-500" 
                      style={{ width: `${(rc.count / reviews.length) * 100}%` }}
                    />
                  </div>
                  <span className="w-8">{rc.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {user && !showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="px-6 py-2.5 bg-white text-black rounded-full font-bold text-sm hover:bg-gray-100 transition-all flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            {userReview ? 'Edit Your Review' : 'Write a Review'}
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-8 bg-[#141414] rounded-[2rem] border border-white/10 space-y-6"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-bold text-white">
                {userReview ? 'Update your review' : 'How was your experience?'}
              </h4>
              <button 
                onClick={() => setShowForm(false)}
                className="text-sm text-gray-500 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Rating</label>
                <StarRating 
                  rating={rating} 
                  interactive 
                  onRate={setRating} 
                  size={32} 
                  className="gap-2"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Your Review</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts about this product..."
                  className="w-full p-4 bg-black border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-amber-500/50 min-h-[120px]"
                  required
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-amber-500 text-white rounded-2xl font-bold hover:bg-amber-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {reviews.length === 0 ? (
        <div className="p-12 bg-[#141414] rounded-[2.5rem] border border-white/5 text-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-gray-500 font-medium">No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {reviews.map((review) => (
            <div key={review.id} className="p-8 bg-[#141414] rounded-[2.5rem] border border-white/5 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {review.profiles.avatar_url ? (
                    <img 
                      src={review.profiles.avatar_url} 
                      alt={review.profiles.name} 
                      className="w-12 h-12 rounded-full object-cover border border-white/10"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                      <User className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-white text-lg">{review.profiles.name || 'Anonymous'}</h4>
                    <p className="text-xs text-gray-500 font-medium">
                      {format(new Date(review.created_at), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <StarRating rating={review.rating} size={14} />
              </div>
              <p className="text-gray-400 leading-relaxed text-lg italic">
                "{review.comment}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

