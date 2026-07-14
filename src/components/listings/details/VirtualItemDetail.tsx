import React, { useState } from 'react';
import { 
  ArrowLeft, Share, Heart, ShieldCheck, Star, MapPin, 
  ChevronRight, MessageSquare, ShoppingBag, Truck, 
  Clock, Check, Info, Users, PlayCircle, BookOpen, 
  Award, Zap, ChevronDown, Send, HelpCircle, UserCheck, DollarSign, Link as LinkIcon, Copy, Plus, Gamepad2, Sparkles, Sword, AlertCircle, AlertTriangle, Edit3, Save, X, Video, ChevronLeft, ChevronRight as ChevronRightIcon, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { ReviewsSection } from './ReviewsSection';
import { ReportModal } from '../../ui/ReportModal';
import { DatabaseService } from '../../../services/databaseService';
import { FileUpload } from '../../FileUpload';
import { ListingSettingsSidebar } from '../ListingSettingsSidebar';

import { appToast } from '@/lib/feedback';
interface VirtualItemDetailProps {
  listing: any;
  reviews: any[];
  relatedListings: any[];
  onContactSeller: () => void;
  onShare: () => void;
  onEnroll: () => void;
  canBuy: boolean;
  isSandbox?: boolean;
  listingId?: string;
  onReviewAdded?: () => void;
  initialIsEditing?: boolean;
}

export const VirtualItemDetail = ({ 
  listing: initialListing, 
  reviews, 
  relatedListings, 
  onContactSeller, 
  onShare,
  onEnroll, 
  canBuy,
  isSandbox,
  listingId,
  onReviewAdded,
  initialIsEditing = false
}: VirtualItemDetailProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState(initialListing);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(initialIsEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const isOwner = user?.id === listing.seller_id;
  const images = listing.images || [listing.image_url];

  const nextImage = () => setSelectedImage((prev) => (prev + 1) % images.length);
  const prevImage = () => setSelectedImage((prev) => (prev - 1 + images.length) % images.length);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await DatabaseService.update('listings', listing.id, {
        title: listing.title,
        description: listing.description,
        price: listing.price,
        images: listing.images,
        video_url: listing.video_url,
        categories: listing.categories,
        logo_url: listing.logo_url,
        custom_categories: listing.custom_categories,
        view_type: listing.view_type,
        pricing_type: listing.pricing_type,
        billing_interval: listing.billing_interval,
        affiliate_enabled: listing.affiliate_enabled,
        affiliate_commission: listing.affiliate_commission
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving listing:', error);
      appToast('Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddImage = (url: string) => {
    setListing({ ...listing, images: [...(listing.images || []), url] });
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...listing.images];
    newImages.splice(index, 1);
    setListing({ ...listing, images: newImages });
    if (selectedImage >= newImages.length) {
      setSelectedImage(Math.max(0, newImages.length - 1));
    }
  };

  const handleSidebarUpdate = (updates: any) => {
    setListing({ ...listing, ...updates });
  };

  return (
    <div className="min-h-screen bg-[#0F0F13] text-white pb-24 pt-[calc(4rem+max(env(safe-area-inset-top),0px))]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Sandbox Banner */}
        {isSandbox && (
          <div className="mb-8 p-6 bg-amber-500/10 rounded-3xl border border-amber-500/20 flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-500 mb-1">Sandbox Mode</h3>
              <p className="text-sm text-amber-500/80 leading-relaxed">
                This seller hasn't completed Stripe onboarding yet. You are currently in <strong>Sandbox Mode</strong>. 
                Payments are simulated and no real money will be charged.
              </p>
            </div>
          </div>
        )}

        {/* Breadcrumb / Back & Edit Controls */}
        <div className="mb-8 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to search
          </button>
          
          {isOwner && (
            <div className="flex items-center gap-3">
              {isEditing ? (
                <>
                  <button 
                    onClick={() => {
                      setListing(initialListing);
                      setIsEditing(false);
                    }}
                    className="px-4 py-2 rounded-xl font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition-colors flex items-center gap-2"
                  >
                    {isSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" /> Edit Listing
                  </button>
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <ListingSettingsSidebar
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          listing={listing}
          onUpdate={handleSidebarUpdate}
        />

        {!canBuy && !isOwner && (
          <div className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center gap-4">
            <div className="p-3 bg-red-500/20 rounded-2xl">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{listing.seller} has not setuped payments</h3>
              <p className="text-red-400/70 text-sm">Purchases are currently disabled for this item.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Content */}
          <div className="lg:col-span-7 space-y-12">
            {/* Hero / Gallery */}
            <div className="space-y-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="aspect-square rounded-[2.5rem] overflow-hidden bg-[#1A1A1F] border border-white/10 shadow-2xl shadow-purple-900/20 relative group"
              >
                {listing.video_url && selectedImage === 0 ? (
                  <iframe 
                    src={listing.video_url.replace('watch?v=', 'embed/')} 
                    className="w-full h-full relative z-10"
                    allowFullScreen
                  />
                ) : (
                  <img 
                    src={images[selectedImage]} 
                    alt={listing.title} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                    referrerPolicy="no-referrer" 
                  />
                )}

                {images.length > 1 && !isEditing && (
                  <>
                    <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 backdrop-blur-xl rounded-full text-white hover:bg-black/70 transition-all shadow-xl border border-white/10 z-20">
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 backdrop-blur-xl rounded-full text-white hover:bg-black/70 transition-all shadow-xl border border-white/10 z-20">
                      <ChevronRightIcon className="w-6 h-6" />
                    </button>
                  </>
                )}

                {!isEditing && (
                  <div className="absolute top-6 right-6 flex gap-3 z-20">
                    <button 
                      onClick={onShare}
                      className="p-3 bg-black/50 backdrop-blur-xl rounded-full text-white hover:bg-black/70 transition-all active:scale-95 shadow-xl border border-white/10"
                      title="Share with custom thumbnail"
                    >
                      <Share className="w-5 h-5" />
                    </button>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 pointer-events-none" />
                <div className="absolute bottom-8 left-8 pointer-events-none">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md">
                      {listing.metadata?.rarity || 'Common'}
                    </span>
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md">
                      {listing.metadata?.game || 'Virtual Item'}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Thumbnails & Add Image */}
              <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                {images.map((img: string, i: number) => (
                  <div key={i} className="relative flex-shrink-0 group">
                    <button 
                      onClick={() => setSelectedImage(i)}
                      className={`w-32 aspect-square rounded-2xl bg-[#1A1A1F] overflow-hidden cursor-pointer border transition-all shadow-sm ${selectedImage === i ? 'border-white ring-2 ring-white/5' : 'border-white/10 hover:border-white/20'}`}
                    >
                      <img 
                        src={img} 
                        alt={`Thumbnail ${i + 1}`} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    </button>
                    {isEditing && images.length > 1 && (
                      <button 
                        onClick={() => handleRemoveImage(i)}
                        className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                
                {isEditing && (
                  <div className="flex-shrink-0 w-32 aspect-square rounded-2xl border-2 border-dashed border-white/20 hover:border-white/40 transition-colors bg-white/5 flex items-center justify-center overflow-hidden relative group">
                    <FileUpload
                      bucket="product-images"
                      onUpload={handleAddImage}
                      label=""
                      darkMode={true}
                      customTrigger={
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 group-hover:text-white transition-colors">
                          <Plus className="w-6 h-6 mb-1" />
                          <span className="text-[10px] font-medium uppercase tracking-wider">Add Photo</span>
                        </div>
                      }
                    />
                  </div>
                )}
              </div>

              {isEditing && (
                <div className="p-4 bg-[#1A1A1F] rounded-2xl border border-white/10">
                  <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                    <Video className="w-4 h-4" /> Video URL (YouTube/Vimeo)
                  </label>
                  <input
                    type="text"
                    value={listing.video_url || ''}
                    onChange={(e) => setListing({ ...listing, video_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              )}
            </div>

            <div className="space-y-6">
              {isEditing ? (
                <input
                  type="text"
                  value={listing.title}
                  onChange={(e) => setListing({ ...listing, title: e.target.value })}
                  className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-4xl sm:text-5xl font-bold text-white outline-none focus:border-indigo-500 transition-colors font-display"
                  placeholder="Item Title"
                />
              ) : (
                <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight tracking-tight font-display">
                  {listing.title}
                </h1>
              )}
              <div className="flex items-center gap-3">
                {reviews.length > 0 ? (
                  <div className="flex items-center gap-1.5 text-sm font-bold text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
                    <Star className="w-4 h-4 fill-current" />
                    {Number(listing.rating_avg || listing.rating || 0).toFixed(1)}
                    <span className="text-gray-400 font-medium ml-1">({reviews.length} reviews)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-sm font-bold text-gray-500 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                    <span className="font-medium">No reviews yet</span>
                  </div>
                )}
                <Link to={`/@${listing.seller_handle}`} className="text-indigo-500 font-medium hover:underline">@{listing.seller_handle}</Link>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white">Item Description</h3>
              {isEditing ? (
                <textarea
                  value={listing.description}
                  onChange={(e) => setListing({ ...listing, description: e.target.value })}
                  className="w-full min-h-[200px] bg-[#1A1A1F] border border-white/20 rounded-2xl p-6 text-white outline-none focus:border-indigo-500 transition-colors resize-y"
                  placeholder="Describe your item..."
                />
              ) : (
                <div className="prose prose-xl prose-invert max-w-none text-gray-400 leading-relaxed whitespace-pre-line">
                  {listing.description}
                </div>
              )}
            </div>

            {/* Item Stats / Attributes */}
            {listing.metadata?.attributes && (
              <div className="space-y-6 pt-8 border-t border-white/10">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Sword className="w-6 h-6 text-purple-400" /> Attributes
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {Object.entries(listing.metadata.attributes).map(([key, value]: [string, any], idx) => (
                    <div key={idx} className="p-4 bg-[#1A1A1F] rounded-xl border border-white/5">
                      <p className="text-xs text-gray-500 uppercase font-bold mb-1">{key}</p>
                      <p className="text-lg font-bold text-white">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            {!isEditing && (
              <ReviewsSection 
                reviews={reviews} 
                listingId={listingId} 
                onReviewAdded={onReviewAdded} 
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-32 space-y-6">
              <div className="bg-[#1A1A1F] p-8 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                
                <div className="relative space-y-4">
                  <h3 className="text-2xl font-bold text-white">{listing.pricing_type === 'subscription' ? 'Subscribe Now' : 'Acquire Item'}</h3>
                  <div className="flex items-baseline gap-1">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <span className="text-4xl font-bold text-white">€</span>
                        <input
                          type="number"
                          value={listing.price}
                          onChange={(e) => setListing({ ...listing, price: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-3xl font-bold text-white outline-none focus:border-indigo-500 transition-colors"
                          placeholder="0.00"
                          step="0.01"
                        />
                      </div>
                    ) : (
                      <span className="text-4xl font-bold text-white">€{listing.price}</span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {listing.pricing_type === 'subscription' ? `Billed ${listing.billing_interval || 'monthly'}. Cancel anytime.` : 'Instant delivery via trade or gift.'}
                  </p>
                </div>

                {!isEditing && (
                  <div className="relative space-y-4 pt-4">
                    <button 
                      onClick={onEnroll}
                      disabled={!canBuy}
                      className={`w-full py-5 rounded-2xl font-bold text-xl transition-all active:scale-[0.98] shadow-xl flex items-center justify-center gap-3 ${canBuy ? 'bg-white text-black hover:bg-gray-200 shadow-white/5' : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'}`}
                    >
                      <Gamepad2 className="w-6 h-6" />
                      {canBuy ? (listing.pricing_type === 'subscription' ? 'Subscribe' : 'Buy Now') : 'Payments Disabled'}
                    </button>
                    
                    <button 
                      onClick={onContactSeller}
                      className="w-full py-4 bg-transparent border border-white/20 text-white rounded-2xl font-bold text-lg hover:bg-white/5 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-5 h-5" />
                      Contact Seller
                    </button>
                  </div>
                )}

                <div className="relative flex flex-col gap-4 pt-6 border-t border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">Trade Protection</p>
                      <p className="text-xs font-medium text-gray-500">Secure transaction</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <Zap className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">Instant Delivery</p>
                      <p className="text-xs font-medium text-gray-500">Automated transfer</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seller Info */}
              <div className="bg-[#1A1A1F] p-6 rounded-3xl border border-white/10 shadow-sm flex items-center gap-4">
                <img 
                  src={listing.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${listing.seller}`} 
                  alt={listing.seller} 
                  className="w-14 h-14 bg-gray-800 rounded-2xl object-cover" 
                />
                <div className="flex-1">
                  <h4 className="font-bold text-white">{listing.seller}</h4>
                  <p className="text-xs text-gray-500">@{listing.seller_handle} • Trusted Trader</p>
                </div>
                <button className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {!isOwner && (
                <button 
                  onClick={() => setIsReportModalOpen(true)}
                  className="w-full py-4 bg-transparent border border-white/10 text-gray-400 rounded-2xl font-bold text-sm hover:bg-white/5 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Report this listing
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        reportedUserId={listing.seller_id}
        listingId={listing.id}
        title="Report Listing"
      />
    </div>
  );
};
