import React, { useState } from 'react';
import { 
  ArrowLeft, Share, Heart, ShieldCheck, Star, MapPin, 
  ChevronRight, MessageSquare, ShoppingBag, Truck, 
  Clock, Check, Info, Users, PlayCircle, BookOpen, 
  Award, Zap, ChevronDown, Send, HelpCircle, UserCheck, DollarSign, Link as LinkIcon, Copy, Plus, Briefcase, AlertCircle, AlertTriangle, Edit3, Save, X, Video, ChevronLeft, ChevronRight as ChevronRightIcon, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { ReviewsSection } from './ReviewsSection';
import { ReportModal } from '../../ui/ReportModal';
import { DatabaseService } from '../../../services/databaseService';
import { FileUpload } from '../../FileUpload';
import { ListingSettingsSidebar } from '../ListingSettingsSidebar';
import { ProductTypeFacts } from './ProductTypeFacts';

import { appToast } from '@/lib/feedback';
interface ServiceDetailProps {
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

export const ServiceDetail = ({ 
  listing: initialListing, 
  reviews, 
  relatedListings, 
  onContactSeller, 
  onShare,
  onEnroll, 
  canBuy,
  isSandbox,
  listingId,
  onReviewAdded
}: ServiceDetailProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState(initialListing);
  const [selectedPackage, setSelectedPackage] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const isOwner = user?.id === listing.seller_id;
  const images = listing.images || [listing.image_url];
  const packages = listing.metadata?.packages || [];

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
    <div className="min-h-screen bg-[#0A0A0A] pb-24 pt-[calc(4rem+max(env(safe-area-inset-top),0px))] text-white">
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
              <p className="text-red-600/70 text-sm">Purchases are currently disabled for this service.</p>
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
                className="aspect-video rounded-[2.5rem] overflow-hidden bg-[#141414] border border-white/5 shadow-2xl relative group"
              >
                {listing.video_url && selectedImage === 0 ? (
                  <iframe 
                    src={listing.video_url.replace('watch?v=', 'embed/')} 
                    className="w-full h-full"
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
                    <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 backdrop-blur-xl rounded-full text-white hover:bg-black/70 transition-all shadow-xl border border-white/10">
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 backdrop-blur-xl rounded-full text-white hover:bg-black/70 transition-all shadow-xl border border-white/10">
                      <ChevronRightIcon className="w-6 h-6" />
                    </button>
                  </>
                )}

                {!isEditing && (
                  <div className="absolute top-6 right-6 flex gap-3">
                    <button 
                      onClick={onShare}
                      className="p-3 bg-black/50 backdrop-blur-xl rounded-full text-white hover:bg-black/70 transition-all active:scale-95 shadow-xl border border-white/10"
                      title="Share with custom thumbnail"
                    >
                      <Share className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </motion.div>

              {/* Thumbnails & Add Image */}
              <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                {images.map((img: string, i: number) => (
                  <div key={i} className="relative flex-shrink-0 group">
                    <button 
                      onClick={() => setSelectedImage(i)}
                      className={`w-40 aspect-video rounded-2xl bg-[#141414] overflow-hidden cursor-pointer border transition-all shadow-sm ${selectedImage === i ? 'border-white ring-2 ring-white/5' : 'border-white/5 hover:border-white/20'}`}
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
                  <div className="flex-shrink-0 w-40 aspect-video rounded-2xl border-2 border-dashed border-white/20 hover:border-white/40 transition-colors bg-white/5 flex items-center justify-center overflow-hidden relative group">
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
                <div className="p-4 bg-[#141414] rounded-2xl border border-white/10">
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
                  className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-4xl sm:text-5xl font-bold text-white outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Service Title"
                />
              ) : (
                <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight tracking-tight">
                  {listing.title}
                </h1>
              )}
              <div className="flex items-center gap-3">
                <span className="px-4 py-1.5 bg-white text-black rounded-full text-[10px] font-bold uppercase tracking-widest">
                  Service
                </span>
                {reviews.length > 0 ? (
                  <div className="flex items-center gap-1.5 text-sm font-bold text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full">
                    <Star className="w-4 h-4 fill-current" />
                    {Number(listing.rating_avg || listing.rating || 0).toFixed(1)}
                    <span className="text-gray-400 font-medium ml-1">({reviews.length} reviews)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-sm font-bold text-gray-500 bg-white/5 px-3 py-1 rounded-full">
                    <span className="font-medium">No reviews yet</span>
                  </div>
                )}
                <Link to={`/@${listing.seller_handle}`} className="text-indigo-500 font-medium hover:underline">@{listing.seller_handle}</Link>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white">About this service</h3>
              {isEditing ? (
                <textarea
                  value={listing.description}
                  onChange={(e) => setListing({ ...listing, description: e.target.value })}
                  className="w-full min-h-[200px] bg-[#141414] border border-white/20 rounded-2xl p-6 text-white outline-none focus:border-indigo-500 transition-colors resize-y"
                  placeholder="Describe your service..."
                />
              ) : (
                <div className="prose prose-xl prose-invert max-w-none text-gray-400 leading-relaxed whitespace-pre-line">
                  {listing.description}
                </div>
              )}
            </div>

            <ProductTypeFacts type="service" listing={listing} />

            {/* Packages Comparison (if multiple) */}
            {packages.length > 1 && (
              <div className="space-y-6 pt-8 border-t border-white/10">
                <h3 className="text-2xl font-bold text-white">Compare Packages</h3>
                <div className="overflow-x-auto pb-4">
                  <div className="flex gap-4 min-w-max">
                    {packages.map((pkg: any, idx: number) => (
                      <div 
                        key={idx} 
                        className={`p-6 rounded-2xl border min-w-[280px] cursor-pointer transition-all ${selectedPackage === idx ? 'border-white bg-white/10' : 'border-white/10 bg-[#1A1A1A] hover:border-white/20'}`}
                        onClick={() => setSelectedPackage(idx)}
                      >
                        <h4 className="font-bold text-lg mb-2 text-white">{pkg.name}</h4>
                        <p className="text-2xl font-bold mb-4 text-white">€{pkg.price}</p>
                        <p className="text-sm text-gray-400 mb-4 h-10 line-clamp-2">{pkg.description}</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Clock className="w-4 h-4 text-gray-500" /> {pkg.deliveryTime} Days Delivery
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Briefcase className="w-4 h-4 text-gray-500" /> {pkg.revisions} Revisions
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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
              <div className="bg-[#141414] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-8">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-white">
                    {packages[selectedPackage]?.name || 'Standard Package'}
                  </h3>
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
                      <span className="text-4xl font-bold text-white">€{packages[selectedPackage]?.price || listing.price}</span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {listing.pricing_type === 'subscription' ? `Billed ${listing.billing_interval || 'monthly'}. Cancel anytime.` : (packages[selectedPackage]?.description || listing.description)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/10">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
                    <Clock className="w-4 h-4 text-gray-500" />
                    {packages[selectedPackage]?.deliveryTime || '3'} Days Delivery
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
                    <Briefcase className="w-4 h-4 text-gray-500" />
                    {packages[selectedPackage]?.revisions || '1'} Revision
                  </div>
                </div>

                <div className="space-y-2">
                  {packages[selectedPackage]?.features?.map((feat: string, i: number) => (
                    feat && <div key={i} className="flex items-center gap-2 text-sm text-gray-400">
                      <Check className="w-4 h-4 text-emerald-500" /> {feat}
                    </div>
                  ))}
                </div>

                {!isEditing && (
                  <div className="space-y-4 pt-4">
                    <button 
                      onClick={onEnroll}
                      disabled={!canBuy}
                      className={`w-full py-5 rounded-2xl font-bold text-xl transition-all active:scale-[0.98] shadow-xl flex items-center justify-center gap-3 ${canBuy ? 'bg-white text-black hover:bg-gray-200' : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'}`}
                    >
                      {canBuy ? (listing.pricing_type === 'subscription' ? 'Subscribe' : `Continue (€${packages[selectedPackage]?.price || listing.price})`) : 'Payments Disabled'}
                    </button>
                    <button 
                      onClick={onContactSeller}
                      className="w-full py-4 bg-[#1A1A1A] border border-white/10 text-white rounded-2xl font-bold text-lg hover:bg-[#252525] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      Contact Seller
                    </button>
                  </div>
                )}
              </div>

              {/* Seller Info */}
              <Link 
                to={`/@${listing.seller_handle}`}
                className="bg-[#141414] p-6 rounded-3xl border border-white/5 shadow-sm flex items-center gap-4 hover:bg-white/5 transition-all group"
              >
                <img 
                  src={listing.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${listing.seller}`} 
                  alt={listing.seller} 
                  className="w-14 h-14 bg-gray-800 rounded-2xl object-cover border border-white/10 group-hover:scale-105 transition-transform" 
                />
                <div className="flex-1">
                  <h4 className="font-bold text-white group-hover:text-indigo-400 transition-colors">{listing.seller}</h4>
                  <p className="text-xs text-gray-500">@{listing.seller_handle} • Verified Seller</p>
                </div>
                <div className="p-2 bg-white/5 rounded-xl transition-colors group-hover:bg-white/10">
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </Link>

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
