import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase, invokeApiRunner } from '../lib/supabase';
import { useNavigate, useParams } from 'react-router-dom';
import { Settings, MapPin, Calendar, Edit3, Globe, Share2, Grid, List, User, Star, MessageCircle, Package, AlertCircle, CreditCard, LogOut, AlertTriangle, UserCheck, Plus, X } from 'lucide-react';
import { CourseCard } from '../components/ui/cards/CourseCard';
import { VirtualItemCard } from '../components/ui/cards/VirtualItemCard';
import { ProductCard } from '../components/ui/cards/ProductCard';
import { ProfileBuilder } from '../components/dashboard/ProfileBuilder';
import { AnimatePresence, motion } from 'motion/react';
import { PageWrapper } from '../components/PageWrapper';
import { SEO } from '../components/SEO';
import { ReportModal } from '../components/ui/ReportModal';

import { appToast } from '@/lib/feedback';
export const Profile = () => {
  const { user, signOut } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { id, username, slugOrUsername } = useParams();
  const effectiveUsername = username || slugOrUsername;
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [listings, setListings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'shop' | 'about' | 'reviews' | 'announcements'>('shop');
  const [stats, setStats] = useState({ products: 0, sales: 0, rating: 0, followers: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', image_url: '' });
  const [isSubmittingAnnouncement, setIsSubmittingAnnouncement] = useState(false);

  const isOwnProfile = (user && profile && user.id === profile.id);

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        let query = supabase.from('profiles').select('*');
        
        if (effectiveUsername) {
          // Remove @ if present
          const cleanUsername = effectiveUsername.replace('@', '');
          query = query.eq('username', cleanUsername);
        } else if (id) {
          query = query.eq('id', id);
        } else if (user) {
          query = query.eq('id', user.id);
        } else {
          navigate('/auth');
          return;
        }

        const { data: profileData, error } = await query.single();
        
        if (error || !profileData) {
          // If looking for own profile but it doesn't exist, create it
          if (!effectiveUsername && !id && user) {
             const { data: newProfile } = await supabase
              .from('profiles')
              .insert([{ id: user.id, full_name: user.email?.split('@')[0], username: user.email?.split('@')[0] }])
              .select()
              .single();
             setProfile(newProfile);
          } else {
             setProfile(null);
          }
        } else {
          setProfile(profileData);
        }

        if (profileData) {
          // Fetch listings
          const { data: listingsData } = await supabase
            .from('listings')
            .select('*')
            .eq('user_id', profileData.id)
            .eq('status', 'published')
            .order('created_at', { ascending: false });
            
          setListings(listingsData || []);

          // Fetch stats
          const { count: salesCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('seller_id', profileData.id)
            .eq('status', 'completed');

          const { count: followersCount } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', profileData.id);

          // Check if current user is following
          if (user && user.id !== profileData.id) {
            const { data: followData } = await supabase
              .from('follows')
              .select('*')
              .eq('follower_id', user.id)
              .eq('following_id', profileData.id)
              .maybeSingle();
            setIsFollowing(!!followData);
          }

          // Fetch reviews
          const { data: reviewsData } = await supabase
            .from('profile_reviews')
            .select('*, reviewer:profiles!profile_reviews_reviewer_id_fkey(full_name, avatar_url, username)')
            .eq('profile_id', profileData.id)
            .order('created_at', { ascending: false });
          setReviews(reviewsData || []);

          // Fetch announcements
          const { data: announcementsData } = await supabase
            .from('profile_announcements')
            .select('*')
            .eq('user_id', profileData.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false });
          setAnnouncements(announcementsData || []);

          // Calculate average rating
          const avgRating = reviewsData && reviewsData.length > 0
            ? reviewsData.reduce((acc, rev) => acc + rev.rating, 0) / reviewsData.length
            : profileData.rating || 5.0;

          setStats({
            products: listingsData?.length || 0,
            sales: salesCount || 0,
            rating: Number(avgRating.toFixed(1)), 
            followers: followersCount || 0
          });
        }

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [id, effectiveUsername, user, navigate]);

  const handleFollow = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (isOwnProfile) return;

    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', profile.id);
        setIsFollowing(false);
        setStats(prev => ({ ...prev, followers: prev.followers - 1 }));
      } else {
        await supabase
          .from('follows')
          .insert([{ follower_id: user.id, following_id: profile.id }]);
        setIsFollowing(true);
        setStats(prev => ({ ...prev, followers: prev.followers + 1 }));
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isOwnProfile) return;

    setIsSubmittingAnnouncement(true);
    try {
      const { data, error } = await supabase
        .from('profile_announcements')
        .insert([{
          user_id: user.id,
          title: newAnnouncement.title,
          content: newAnnouncement.content,
          image_url: newAnnouncement.image_url
        }])
        .select()
        .single();

      if (error) throw error;

      setAnnouncements([data, ...announcements]);
      setIsAnnouncementModalOpen(false);
      setNewAnnouncement({ title: '', content: '', image_url: '' });
    } catch (error) {
      console.error('Error creating announcement:', error);
    } finally {
      setIsSubmittingAnnouncement(false);
    }
  };

  const renderListingCard = (listing: any) => {
    if (listing.type === 'community' || listing.category === 'Education' || listing.metadata?.digitalType === 'course') {
      return (
        <CourseCard
          id={listing.id}
          title={listing.title}
          instructor={profile?.full_name || "Instructor"}
          price={listing.price}
          rating={4.8}
          students={120}
          duration={listing.metadata?.duration || "4h 30m"}
          image={listing.images?.[0] || "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&q=80"}
          category={listing.category}
        />
      );
    } else if (listing.type === 'virtual' || listing.type === 'digital') {
      return (
        <VirtualItemCard
          id={listing.id}
          title={listing.title}
          price={listing.price}
          image={listing.images?.[0] || "https://images.unsplash.com/photo-1614726365723-49cfae96c695?w=800&q=80"}
          rarity={listing.metadata?.rarity || "Rare"}
          game={listing.metadata?.game}
          type={listing.metadata?.digitalType || "Asset"}
        />
      );
    } else {
      return (
        <ProductCard
          id={listing.id}
          title={listing.title}
          price={listing.price}
          image={listing.images?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80"}
          category={listing.category}
          brand={listing.metadata?.brand}
        />
      );
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">User not found</h2>
        <p className="text-gray-400">The profile you are looking for does not exist.</p>
      </div>
    </div>
  );

  return (
    <PageWrapper>
      <SEO 
        title={profile.full_name} 
        description={profile.bio || `Check out ${profile.full_name}'s profile on Wersee.`}
        image={profile.avatar_url}
        url={profile.username ? `/@${profile.username}` : `/profile/${profile.id}`}
        type="profile"
      />
      <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#050505]">
        {/* Cinematic Banner */}
        <div className="relative h-80 md:h-96 w-full overflow-hidden">
          {profile.banner_url ? (
            <img src={profile.banner_url} alt="Banner" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-900 via-purple-900 to-black" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-32 pb-20">
          {/* Payment Setup Banner for Seller */}
          {isOwnProfile && !profile.stripe_onboarding_complete && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-6 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-xl"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/20 rounded-2xl">
                  <CreditCard className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Setup your payment processor</h3>
                  <p className="text-amber-200/70 text-sm">You need to complete your Stripe setup to start receiving payments from customers.</p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/dashboard')} // Assuming dashboard has money setup
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-2xl transition-all whitespace-nowrap"
              >
                Setup Payments
              </button>
            </motion.div>
          )}

          {/* Payment Not Setup Message for Customers */}
          {!isOwnProfile && !profile.stripe_onboarding_complete && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center gap-4 backdrop-blur-xl"
            >
              <div className="p-3 bg-red-500/20 rounded-2xl">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{profile.full_name} has not setuped payments</h3>
                <p className="text-red-200/70 text-sm">Purchases are currently disabled for this shop.</p>
              </div>
            </motion.div>
          )}

          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-end mb-8 text-center md:text-left">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl overflow-hidden border-4 border-[#050505] shadow-2xl bg-[#1A1A1A]">
                <img 
                  src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`} 
                  alt={profile.full_name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              {isOwnProfile && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="absolute bottom-2 right-2 p-2 bg-white text-black rounded-xl shadow-lg opacity-0 md:group-hover:opacity-100 transition-opacity"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 w-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h1 className="text-3xl md:text-5xl font-black text-white mb-2 tracking-tighter uppercase italic">{profile.full_name}</h1>
                  <div className="flex items-center gap-2">
                    <p className="text-[#C9A84C] font-bold text-lg tracking-tight">@{profile.username || profile.full_name?.toLowerCase().replace(/\s+/g, '')}</p>
                    {profile.is_verified && (
                      <div className="p-1 bg-[#C9A84C]/20 rounded-full">
                        <UserCheck className="w-3 h-3 text-[#C9A84C]" />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap justify-center md:justify-end gap-3">
                  {!isOwnProfile && (
                    <button 
                      onClick={handleFollow}
                      className={`flex-1 md:flex-none px-10 py-4 rounded-2xl font-black uppercase italic tracking-widest transition-all active:scale-95 ${
                        isFollowing 
                          ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20' 
                          : 'bg-white text-black hover:bg-gray-200 shadow-[0_0_30px_rgba(255,255,255,0.2)]'
                      }`}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                  )}
                  <div className="flex gap-2">
                    <button className="p-4 bg-white/5 text-white rounded-2xl hover:bg-white/10 transition-all backdrop-blur-xl border border-white/10 active:scale-95">
                      <Share2 className="w-5 h-5" />
                    </button>
                    {!isOwnProfile && (
                      <>
                        <button className="p-4 bg-white/5 text-white rounded-2xl hover:bg-white/10 transition-all backdrop-blur-xl border border-white/10 active:scale-95">
                          <MessageCircle className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => setIsReportModalOpen(true)}
                          className="p-4 bg-red-500/5 text-red-500 rounded-2xl hover:bg-red-500/10 transition-all backdrop-blur-xl border border-red-500/10 active:scale-95"
                          title="Report User"
                        >
                          <AlertTriangle className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    {isOwnProfile && (
                      <button 
                        onClick={async () => {
                          const currentUser = (await supabase.auth.getUser()).data.user;
                          if (currentUser?.user_metadata?.is_next_gen || (currentUser?.user_metadata?.age !== undefined && currentUser.user_metadata.age < 18)) {
                            // Check for approved logout request
                            const response = await invokeApiRunner('next-gen/check-logout-approved', {
                              kid_id: currentUser.id
                            });

                            if (response.success && response.approvedRequest) {
                              // Delete the request and log out
                              await invokeApiRunner('next-gen/delete-logout-request', { id: response.approvedRequest.id });
                              await signOut();
                              navigate('/logged-out');
                              return;
                            }

                            try {
                              await invokeApiRunner('next-gen/request-logout', {
                                kid_id: currentUser.id,
                                parent_id: currentUser.user_metadata?.parent_id
                              });
                              appToast('Logout request sent to your guardian. Please wait for their approval.');
                            } catch (error) {
                              console.error('Error sending logout request:', error);
                              appToast('Failed to send logout request. Please try again.');
                            }
                            return;
                          }
                          await signOut();
                          navigate('/logged-out');
                        }}
                        className="p-4 bg-red-500/5 text-red-500 rounded-2xl hover:bg-red-500/10 transition-all backdrop-blur-xl border border-red-500/10 active:scale-95"
                        title="Log Out"
                      >
                        <LogOut className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-2xl flex items-center gap-4 group hover:bg-white/[0.08] transition-all">
              <div className="p-3 bg-blue-500/20 text-blue-400 rounded-2xl group-hover:scale-110 transition-transform">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-white tracking-tighter">{stats.products}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Products</div>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-2xl flex items-center gap-4 group hover:bg-white/[0.08] transition-all">
              <div className="p-3 bg-green-500/20 text-green-400 rounded-2xl group-hover:scale-110 transition-transform">
                <User className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-white tracking-tighter">{stats.followers}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Followers</div>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-2xl flex items-center gap-4 group hover:bg-white/[0.08] transition-all">
              <div className="p-3 bg-[#C9A84C]/20 text-[#C9A84C] rounded-2xl group-hover:scale-110 transition-transform">
                <Star className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-white tracking-tighter">{stats.rating}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Rating</div>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-2xl flex items-center gap-4 group hover:bg-white/[0.08] transition-all">
              <div className="p-3 bg-purple-500/20 text-purple-400 rounded-2xl group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-white tracking-tighter">{new Date(profile.created_at).getFullYear()}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Joined</div>
              </div>
            </div>
          </div>

          {/* Content Tabs */}
          <div className="flex gap-10 border-b border-white/5 mb-10 overflow-x-auto no-scrollbar">
            {['shop', 'announcements', 'about', 'reviews'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`pb-4 text-sm font-black uppercase tracking-[0.2em] transition-all relative whitespace-nowrap ${
                  activeTab === tab 
                    ? 'text-white' 
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9A84C] rounded-full"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'shop' && (
              <motion.div
                key="shop"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {listings.map((listing, idx) => (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    {renderListingCard(listing)}
                  </motion.div>
                ))}
                {listings.length === 0 && (
                  <div className="col-span-full py-20 text-center text-gray-500">
                    No active listings found.
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'announcements' && (
              <motion.div
                key="announcements"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {isOwnProfile && (
                  <button 
                    onClick={() => setIsAnnouncementModalOpen(true)}
                    className="w-full p-8 rounded-[2rem] border border-dashed border-white/10 bg-white/5 text-white hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-4 group"
                  >
                    <div className="p-4 bg-[#C9A84C]/20 text-[#C9A84C] rounded-2xl group-hover:scale-110 transition-transform">
                      <Plus className="w-8 h-8" />
                    </div>
                    <span className="font-black uppercase italic tracking-widest text-sm">Create New Announcement</span>
                  </button>
                )}

                {announcements.map((ann, idx) => (
                  <div key={ann.id} className="p-8 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-xl">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-2xl font-black uppercase italic text-white">{ann.title}</h3>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{new Date(ann.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-gray-400 leading-relaxed mb-6">{ann.content}</p>
                    {ann.image_url && (
                      <img src={ann.image_url} alt="" className="w-full h-64 object-cover rounded-2xl border border-white/5" referrerPolicy="no-referrer" />
                    )}
                  </div>
                ))}
                {announcements.length === 0 && (
                  <div className="py-20 text-center text-gray-500 bg-white/5 rounded-[2rem] border border-dashed border-white/10">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="font-bold uppercase tracking-widest text-xs">No announcements yet</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'about' && (
              <motion.div
                key="about"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-3xl"
              >
                <div className="bg-white/5 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/10 shadow-2xl">
                  <h3 className="text-2xl font-black uppercase italic text-white mb-6 tracking-tight">The Story of {profile.full_name}</h3>
                  <p className="text-gray-400 text-lg leading-relaxed mb-10 font-light">
                    {profile.bio || "This creator hasn't shared their story yet."}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {profile.location && (
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                        <div className="p-2 bg-blue-500/20 rounded-xl">
                          <MapPin className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="text-white font-bold">{profile.location}</span>
                      </div>
                    )}
                    {profile.website && (
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                        <div className="p-2 bg-[#C9A84C]/20 rounded-xl">
                          <Globe className="w-5 h-5 text-[#C9A84C]" />
                        </div>
                        <span className="text-white font-bold truncate">{profile.website.replace('https://', '')}</span>
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div
                key="reviews"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-8 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-xl flex gap-6">
                    <img 
                      src={rev.reviewer?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${rev.reviewer_id}`} 
                      className="w-14 h-14 rounded-2xl bg-gray-800 object-cover border border-white/10"
                      alt=""
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-black text-white uppercase italic">{rev.reviewer?.full_name || 'Anonymous'}</h4>
                          <p className="text-[10px] text-[#C9A84C] font-bold uppercase tracking-widest">@{rev.reviewer?.username}</p>
                        </div>
                        <div className="flex items-center gap-1 text-[#C9A84C]">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="font-black">{rev.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <p className="text-gray-400 leading-relaxed">{rev.comment}</p>
                      <div className="mt-4 text-[9px] text-gray-600 font-bold uppercase tracking-[0.2em]">
                        {new Date(rev.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
                {reviews.length === 0 && (
                  <div className="py-20 text-center text-gray-500 bg-white/5 rounded-[2rem] border border-dashed border-white/10">
                    <Star className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="font-bold uppercase tracking-widest text-xs">No reviews yet</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Profile Builder Modal */}
      <AnimatePresence>
        {isEditing && isOwnProfile && (
          <ProfileBuilder 
            initialData={profile}
            onSave={(data) => {
              setProfile({ ...profile, ...data });
              setIsEditing(false);
            }}
            onCancel={() => setIsEditing(false)}
          />
        )}
      </AnimatePresence>

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        reportedUserId={profile.id}
        title="Report User"
      />

      {/* Announcement Modal */}
      <AnimatePresence>
        {isAnnouncementModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAnnouncementModalOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 sm:p-10">
                <div className="flex items-center justify-between mb-10">
                  <h2 className="text-3xl font-black uppercase italic text-white tracking-tighter">New Announcement</h2>
                  <button 
                    onClick={() => setIsAnnouncementModalOpen(false)}
                    className="p-3 hover:bg-white/5 rounded-2xl transition-colors text-gray-500 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleCreateAnnouncement} className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Title</label>
                    <input 
                      type="text"
                      required
                      value={newAnnouncement.title}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-white font-bold outline-none focus:border-[#C9A84C]/50 focus:bg-white/10 transition-all"
                      placeholder="Summer Sale! 50% OFF"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Content</label>
                    <textarea 
                      required
                      value={newAnnouncement.content}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                      rows={5}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-white font-medium outline-none focus:border-[#C9A84C]/50 focus:bg-white/10 transition-all resize-none leading-relaxed"
                      placeholder="Share your news with your followers..."
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Banner Image URL (Optional)</label>
                    <input 
                      type="url"
                      value={newAnnouncement.image_url}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, image_url: e.target.value })}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-white font-bold outline-none focus:border-[#C9A84C]/50 focus:bg-white/10 transition-all"
                      placeholder="https://..."
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmittingAnnouncement}
                    className="w-full py-6 bg-white text-black rounded-[1.5rem] font-black uppercase italic tracking-widest hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 shadow-[0_0_50px_rgba(255,255,255,0.1)]"
                  >
                    {isSubmittingAnnouncement ? 'Posting...' : 'Post Announcement'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
};
