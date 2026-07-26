import React, { useState } from 'react';
import { 
  ArrowLeft, Share, Heart, ShieldCheck, Star, MapPin, 
  ChevronRight, MessageSquare, ShoppingBag, Truck, 
  Clock, Check, Info, Users, PlayCircle, BookOpen, 
  Award, Zap, ChevronDown, Send, HelpCircle, UserCheck, DollarSign, Link as LinkIcon, Copy, Plus, Download, FileText, AlertCircle, AlertTriangle, Edit3, Save, X, Video, ChevronLeft, ChevronRight as ChevronRightIcon, Settings, Timer, Lock, RotateCcw, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { tryUserProfilePath } from '../../../routing/routes';
import { useAuth } from '../../../context/AuthContext';
import { ReviewsSection } from './ReviewsSection';
import { ReportModal } from '../../ui/ReportModal';
import { DatabaseService } from '../../../services/databaseService';
import { FileUpload } from '../../FileUpload';
import { ListingSettingsSidebar } from '../ListingSettingsSidebar';
import { ListingWidgets } from '../ListingWidgets';
import { ProductTypeFacts } from './ProductTypeFacts';
import { LocalizedPrice } from '../../store/LocalizedPrice';

import { appToast } from '@/lib/feedback';
interface DigitalDetailProps {
  listing: any;
  reviews: any[];
  relatedListings: any[];
  onContactSeller: () => void;
  onShare: () => void;
  onEnroll: (planIndex?: number) => void;
  canBuy: boolean;
  isSandbox?: boolean;
  listingId?: string;
  onReviewAdded?: () => void;
  initialIsEditing?: boolean;
}

export const DigitalDetail = ({ 
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
}: DigitalDetailProps) => {
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
        affiliate_commission: listing.affiliate_commission,
        plans: listing.plans,
        tracking_links: listing.tracking_links,
        widgets: listing.widgets
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

  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);

  const renderContent = () => {
    const viewType = listing.view_type || 'default_view';
    const plans = listing.plans || [];
    const widgets = listing.widgets || [];

    if (viewType === 'minimal_view' && !isEditing) {
      return (
        <div className="max-w-2xl mx-auto space-y-12 py-12">
          <div className="space-y-6 text-center">
            <div className="w-32 h-32 mx-auto rounded-3xl bg-white/5 border border-white/10 overflow-hidden">
              <img src={images[0]} alt="" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-4xl font-bold text-white">{listing.title}</h1>
            <p className="text-gray-400 text-lg">{listing.description}</p>
          </div>

          <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-8">
            <div className="flex items-center justify-between">
              <LocalizedPrice amount={listing.price} baseCurrency={listing.currency || listing.base_currency || 'EUR'} className="text-3xl font-bold text-white" />
              {listing.pricing_type === 'subscription' && <span className="text-gray-500">/ {listing.billing_interval || 'month'}</span>}
            </div>

            {plans.length > 0 && (
              <div className="space-y-3">
                {plans.map((plan: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedPlan(idx)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all ${
                      selectedPlan === idx ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-white'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold">{plan.name}</span>
                      <LocalizedPrice amount={plan.price} baseCurrency={plan.currency || listing.currency || listing.base_currency || 'EUR'} className="font-bold" showOriginal={false} />
                    </div>
                  </button>
                ))}
              </div>
            )}

            <button 
              onClick={() => onEnroll()}
              className="w-full py-5 bg-white text-black rounded-2xl font-bold text-xl hover:bg-gray-200 transition-all"
            >
              {listing.pricing_type === 'subscription' ? 'Subscribe' : 'Buy Now'}
            </button>
          </div>

          {widgets.length > 0 && (
            <div className="space-y-8">
              {widgets.map((w: string) => <ListingWidgets key={w} type={w} listing={listing} />)}
            </div>
          )}
        </div>
      );
    }

    if (viewType === 'gallery_view' && !isEditing) {
      return (
        <div className="space-y-12 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((img: string, idx: number) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="aspect-square rounded-3xl overflow-hidden border border-white/10"
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </motion.div>
            ))}
          </div>

          <div className="max-w-3xl mx-auto p-12 bg-[#141414] rounded-[3rem] border border-white/5 text-center space-y-8">
            <h1 className="text-5xl font-bold text-white">{listing.title}</h1>
            <p className="text-gray-400 text-xl leading-relaxed">{listing.description}</p>
            
            <div className="flex flex-col items-center gap-6">
              <LocalizedPrice amount={listing.price} baseCurrency={listing.currency || listing.base_currency || 'EUR'} className="text-4xl font-bold text-white" />
              <button 
                onClick={() => onEnroll()}
                className="px-12 py-5 bg-indigo-600 text-white rounded-2xl font-bold text-xl hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20"
              >
                {listing.pricing_type === 'subscription' ? 'Subscribe' : 'Get Instant Access'}
              </button>
            </div>
          </div>

          {widgets.length > 0 && (
            <div className="max-w-3xl mx-auto space-y-8">
              {widgets.map((w: string) => <ListingWidgets key={w} type={w} listing={listing} />)}
            </div>
          )}
        </div>
      );
    }

    return (
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
                placeholder="Product Title"
              />
            ) : (
              <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight tracking-tight">
                {listing.title}
              </h1>
            )}
              <div className="flex items-center gap-3">
                <span className="px-4 py-1.5 bg-white text-black rounded-full text-[10px] font-bold uppercase tracking-widest">
                  Digital Product
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
                <Link to={tryUserProfilePath(listing.seller_handle) || '/'} className="text-indigo-500 font-medium hover:underline">@{listing.seller_handle}</Link>
              </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white">About this product</h3>
            {isEditing ? (
              <textarea
                value={listing.description}
                onChange={(e) => setListing({ ...listing, description: e.target.value })}
                className="w-full min-h-[200px] bg-[#141414] border border-white/20 rounded-2xl p-6 text-white outline-none focus:border-indigo-500 transition-colors resize-y"
                placeholder="Describe your product..."
              />
            ) : (
              <div className="prose prose-xl prose-invert max-w-none text-gray-400 leading-relaxed whitespace-pre-line">
                {listing.description}
              </div>
            )}
          </div>

          {/* Widgets */}
          {!isEditing && widgets.length > 0 && (
            <div className="space-y-8">
              {widgets.map((w: string) => <ListingWidgets key={w} type={w} listing={listing} />)}
            </div>
          )}

          {/* File Info */}
          <ProductTypeFacts type="digital" listing={listing} />

          <div className="space-y-6 pt-8 border-t border-white/10">
            <h3 className="text-2xl font-bold text-white">What's Included</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-4 p-4 bg-[#141414] rounded-xl border border-white/5">
                <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h4 className="font-bold text-white">{listing.metadata?.format || 'PDF'} File</h4>
                  <p className="text-sm text-gray-400">Instant Download</p>
                </div>
              </div>
              {listing.metadata?.pages && (
                <div className="flex items-center gap-4 p-4 bg-[#141414] rounded-xl border border-white/5">
                  <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{listing.metadata.pages} Pages</h4>
                    <p className="text-sm text-gray-400">Comprehensive Guide</p>
                  </div>
                </div>
              )}
            </div>
          </div>

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
                <h3 className="text-2xl font-bold text-white">{listing.pricing_type === 'subscription' ? 'Subscribe Now' : 'Get Instant Access'}</h3>
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
                    <LocalizedPrice amount={listing.price} baseCurrency={listing.currency || listing.base_currency || 'EUR'} className="text-4xl font-bold text-white" />
                  )}
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {listing.pricing_type === 'subscription' ? `Billed ${listing.billing_interval || 'monthly'}. Cancel anytime.` : 'One-time payment. Lifetime access.'}
                </p>
              </div>

              {plans.length > 0 && !isEditing && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Select a Plan</h4>
                  {plans.map((plan: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedPlan(idx)}
                      className={`w-full p-4 rounded-2xl border text-left transition-all ${
                        selectedPlan === idx ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-white/5 border-white/10 text-gray-400'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold">{plan.name}</span>
                        <LocalizedPrice amount={plan.price} baseCurrency={plan.currency || listing.currency || listing.base_currency || 'EUR'} className="font-bold" showOriginal={false} />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!isEditing && (
                <div className="space-y-4 pt-4">
                  <button 
                    onClick={() => onEnroll(selectedPlan !== null ? selectedPlan : undefined)}
                    disabled={!canBuy}
                    style={{ 
                      backgroundColor: canBuy ? (listing.metadata?.customization?.primaryColor || '#FFFFFF') : '#374151',
                      color: canBuy ? (listing.metadata?.customization?.primaryColor ? '#FFFFFF' : '#000000') : '#9ca3af'
                    }}
                    className="w-full py-5 rounded-2xl font-bold text-xl hover:opacity-90 transition-all active:scale-[0.98] shadow-xl shadow-black/10 flex items-center justify-center gap-3 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Download className="w-6 h-6" />
                    {canBuy ? (listing.pricing_type === 'subscription' ? 'Subscribe' : (listing.metadata?.customization?.buttonText || 'Buy Now')) : 'Payments Disabled'}
                  </button>
                  
                  {listing.metadata?.customization?.checkoutMessage && (
                    <p className="text-center text-sm italic text-gray-500">
                      "{listing.metadata.customization.checkoutMessage}"
                    </p>
                  )}

                  <button 
                    onClick={onContactSeller}
                    className="liquid-glass-pill flex w-full items-center justify-center gap-2 rounded-full py-4 text-lg font-bold text-white transition-all hover:border-white/30 active:scale-[0.98]"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Ask a Question
                  </button>
                </div>
              )}

              {listing.affiliate_enabled && !isEditing && (
                <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center gap-3">
                  <Users className="w-5 h-5 text-indigo-400" />
                  <div className="text-xs">
                    <span className="text-indigo-300 font-bold">Affiliate Program Active!</span>
                    <p className="text-gray-500">Promote this and earn {listing.affiliate_commission}% commission.</p>
                  </div>
                </div>
              )}

              {listing.metadata?.customization?.showTrustBadges !== false && (
                <div className="flex flex-col gap-4 pt-6 border-t border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">Secure Checkout</p>
                      <p className="text-xs font-medium text-gray-500">Encrypted payment</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                      <Zap className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">Instant Delivery</p>
                      <p className="text-xs font-medium text-gray-500">Download immediately</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
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
              <p className="text-red-600/70 text-sm">Purchases are currently disabled for this item.</p>
            </div>
          </div>
        )}

        {renderContent()}
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
