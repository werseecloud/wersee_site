import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Mic, ArrowUp, ArrowRight, Star, Users, Briefcase, Lightbulb,
  ChevronLeft, ChevronRight, CheckCircle2, Play, ChevronDown,
  Megaphone, CreditCard, Zap, Link2, Plus, MessageSquare,
  ShieldCheck, Mail, ArrowUpCircle, Bot
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { emptyPlatformStats, fetchPlatformStats } from '../lib/platformStats';
import { Link, useNavigate } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { useAuth } from '../context/AuthContext';
import { AnnouncementCard } from '../components/ui/cards/AnnouncementCard';

const WhopCard = ({ item }: { item: any }) => {
  const link = item.username && item.slug 
    ? `/@${item.username}/${item.slug}`
    : `/listing/${item.id}`;

  const displayImage = (Array.isArray(item.images) ? item.images[0] : (typeof item.images === 'string' ? JSON.parse(item.images)[0] : null)) || item.image_url || item.image || item.banner_url || item.thumbnail || 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=800';

  return (
    <motion.div
      whileHover={{ y: -12 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="h-full"
    >
      <Link to={link} className="block w-[280px] sm:w-[360px] shrink-0 bg-[#0F0F0F] rounded-[2.5rem] overflow-hidden border border-white/5 hover:border-indigo-500/40 transition-all duration-500 group hover:shadow-[0_20px_80px_rgba(99,102,241,0.15)] h-full flex flex-col">
        {/* Banner Image */}
        <div className="h-[200px] sm:h-[240px] w-full relative overflow-hidden bg-gray-900">
          <img 
            src={displayImage} 
            alt={item.title} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" 
            referrerPolicy="no-referrer" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-transparent to-transparent opacity-80" />
          
          {/* Type Badge */}
          <div className="absolute top-5 right-5 px-4 py-1.5 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-white shadow-2xl">
            {item.type || 'Digital'}
          </div>
        </div>
        
        <div className="p-6 sm:p-8 pt-0 relative flex-1 flex flex-col">
          {/* Overlapping Square Logo */}
          <div className="relative -top-10 left-0 w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] bg-[#1A1A1A] border-4 border-[#0F0F0F] overflow-hidden flex items-center justify-center shadow-2xl group-hover:-translate-y-2 transition-transform duration-500 z-10">
            {item.logo_url || item.creator_avatar ? (
              <img src={item.logo_url || item.creator_avatar} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-500 flex items-center justify-center text-white font-black text-2xl sm:text-3xl italic tracking-tighter">
                {item.title?.charAt(0) || 'W'}
              </div>
            )}
          </div>
          
          <div className="flex-1 flex flex-col -mt-4">
            {/* Title with Checkmark */}
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-black italic uppercase tracking-tighter text-2xl sm:text-3xl leading-none text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                {item.title}
              </h3>
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3 h-3 text-white fill-current" />
              </div>
            </div>
            
            {/* Creator Section */}
            <div className="flex items-center gap-2.5 mb-8">
              <div className="w-6 h-6 rounded-full bg-gray-800 overflow-hidden border border-white/10 shadow-sm">
                <img src={item.creator_avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + item.seller_id} alt="Creator" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <span className="text-[11px] text-gray-400 font-bold tracking-tight">by {item.creator_name || 'Creator'}</span>
            </div>
            
            {/* Bottom Row: Rating and Price */}
            <div className="mt-auto flex items-center justify-between pt-6 border-t border-white/5">
              <div className="flex items-center gap-2">
                {(item.rating_avg || item.rating) ? (
                  <>
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-white font-black text-lg leading-none">{(item.rating_avg || item.rating).toFixed(1)}</span>
                  </>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">No reviews yet</span>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                {item.user_count !== undefined && item.user_count > 0 && (
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Users className="w-4 h-4" />
                    <span className="text-xs font-bold">{item.user_count >= 1000 ? (item.user_count / 1000).toFixed(1) + 'k' : item.user_count}</span>
                  </div>
                )}
                <div className="text-white font-black italic tracking-tighter text-2xl leading-none">
                  {item.price === '0' || !item.price ? (item.user_count ? '' : 'FREE') : `€${item.price}`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const ReviewSlider = ({ reviews }: { reviews: any[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = direction === 'left' ? -current.offsetWidth / 2 : current.offsetWidth / 2;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!reviews || reviews.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="mb-24"
    >
      <div className="flex items-end justify-between mb-8 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter text-white leading-none mb-2">
            Recent <span className="text-indigo-500">Reviews</span>
          </h2>
          <p className="text-gray-500 text-sm font-medium">What our community is saying</p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <button onClick={() => scroll('left')} className="p-3 rounded-xl bg-[#141414] hover:bg-[#1A1A1A] border border-white/5 text-gray-400 hover:text-white transition-colors shadow-lg">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => scroll('right')} className="p-3 rounded-xl bg-[#141414] hover:bg-[#1A1A1A] border border-white/5 text-gray-400 hover:text-white transition-colors shadow-lg">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="relative">
        <div 
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-8 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto scrollbar-hide snap-x"
        >
          {reviews.map((review, i) => (
            <motion.div
              key={review.id || i}
              whileHover={{ y: -5 }}
              className="snap-start shrink-0 w-[300px] sm:w-[400px] p-8 rounded-[2.5rem] bg-[#141414] border border-white/5 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <MessageSquare className="w-12 h-12 text-indigo-500" />
              </div>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full border border-white/10 overflow-hidden bg-gray-800">
                  <img 
                    src={review.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.user_id}`} 
                    alt={review.profiles?.full_name || 'User'} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer" 
                  />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{review.profiles?.full_name || review.profiles?.username || 'Anonymous'}</h4>
                  <div className="flex items-center gap-1 mt-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-3 h-3 ${i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-600'}`} 
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <p className="text-gray-400 text-sm leading-relaxed italic line-clamp-3 mb-4">
                "{review.comment}"
              </p>
              
              {review.listings && (
                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Reviewed</span>
                  <span className="text-[10px] font-bold text-indigo-400 truncate max-w-[150px]">{review.listings.title}</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

import { JobCard } from '../components/ui/cards/JobCard';

import { appToast } from '@/lib/feedback';
const HorizontalScrollSection = ({ title, subtitle, items, type }: { title: string, subtitle?: string, items: any[], type?: string }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = direction === 'left' ? -current.offsetWidth / 2 : current.offsetWidth / 2;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!items || items.length === 0) return null;

  const uniqueItems = Array.from(new Map(items.map((item, i) => [item.id || i, item])).values());

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="mb-12"
    >
      <div className="flex items-end justify-between mb-4 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs sm:text-sm text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <button onClick={() => scroll('left')} className="p-2 rounded-lg bg-[#141414] hover:bg-[#1A1A1A] border border-white/5 text-gray-400 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => scroll('right')} className="p-2 rounded-lg bg-[#141414] hover:bg-[#1A1A1A] border border-white/5 text-gray-400 hover:text-white transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="relative">
        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto scrollbar-hide snap-x"
        >
          {uniqueItems.map((item: any, i: number) => (
            <div key={item.id || i} className="snap-start">
              {type === 'job' ? (
                <JobCard 
                  variant={i % 2 === 0 ? 'default' : 'freelance'}
                  job={{
                  id: item.id,
                  title: item.title,
                  company: item.creator_name || 'Wersee Partner',
                  location: item.location || 'Remote',
                  salary: item.price ? `€${item.price}` : 'Competitive',
                  type: item.metadata?.jobType || 'Full-time',
                  postedAt: new Date(item.created_at).toLocaleDateString(),
                  logo_url: item.logo_url || item.creator_avatar,
                  description: item.description,
                  tags: item.metadata?.skills || ['React', 'TypeScript', 'Node.js'],
                  author: {
                    name: item.creator_name || 'Wersee Partner',
                    avatar_url: item.creator_avatar
                  }
                }} />
              ) : (
                <WhopCard item={item} />
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const PWAInstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [inIframe, setInIframe] = useState(false);

  useEffect(() => {
    // Check if in iframe
    try {
      setInIframe(window.self !== window.top);
    } catch (e) {
      setInIframe(true);
    }

    // Check if iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) return;

    const handler = (e: any) => {
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // If iOS and not standalone, we can show a custom banner for iOS instructions
    if (ios && !isStandalone) {
       const hasSeen = sessionStorage.getItem('ios_pwa_prompt');
       if (!hasSeen) {
         setShowBanner(true);
       }
    }

    // If in iframe, we might want to show it anyway to explain to the user
    if (window.self !== window.top) {
      const hasSeen = sessionStorage.getItem('iframe_pwa_prompt');
      if (!hasSeen) {
        setShowBanner(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (inIframe) {
      appToast('To install the app, please open it in a new tab first. The install prompt is blocked inside the preview iframe.');
      return;
    }

    if (isIOS) {
      appToast('To install on iOS: tap the Share button at the bottom of Safari, then select "Add to Home Screen".');
      setShowBanner(false);
      sessionStorage.setItem('ios_pwa_prompt', 'true');
      return;
    }

    if (!deferredPrompt) {
      appToast('Installation is not supported in this browser, or the app is already installed.');
      return;
    }
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // prompt handled, clear reference regardless of outcome
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    if (isIOS) sessionStorage.setItem('ios_pwa_prompt', 'true');
    if (inIframe) sessionStorage.setItem('iframe_pwa_prompt', 'true');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed top-24 sm:top-auto sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md">
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="bg-indigo-600 text-white rounded-[2rem] shadow-2xl p-4 flex items-center justify-between border border-indigo-500/30 backdrop-blur-md"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <ArrowUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-sm">Install Wersee App</h4>
            <p className="text-xs text-indigo-200">Get the best experience on your device.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleDismiss}
            className="p-2 text-indigo-200 hover:text-white transition-colors text-xs font-medium"
          >
            Later
          </button>
          <button 
            onClick={handleInstallClick}
            className="px-4 py-2 bg-white text-indigo-600 rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-50 transition-colors"
          >
            Install
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [homeTab, setHomeTab] = useState<'launch' | 'discover' | 'jobs'>('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [listings, setListings] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [digitalProducts, setDigitalProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState(emptyPlatformStats);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [discordGuilds, setDiscordGuilds] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [wordIndex, setWordIndex] = useState(0);
  const words = ["world", "internet", "creators", "experts", "innovators", "builders", "dreamers", "community", "economy"];
  const verbs = ["does", "does", "do", "do", "do", "do", "do", "does", "does"];

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % words.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [listingsRes, businessesRes, reviewsRes, platformStats, discordRes] = await Promise.all([
          supabase.from('listings').select('*, profiles!listings_seller_id_fkey(username, full_name, avatar_url)').eq('status', 'published').order('created_at', { ascending: false }).limit(50),
          supabase.from('businesses').select('*').eq('setup_completed', true).order('created_at', { ascending: false }).limit(20),
          supabase.from('reviews').select('*').order('created_at', { ascending: false }).limit(20),
          fetchPlatformStats(),
          supabase.from('discord_server_configs').select('guild_id', { count: 'exact', head: true })
        ]);

        if (listingsRes.data) {
          const processedListings = listingsRes.data.map(l => ({
            ...l,
            username: l.profiles?.username,
            creator_name: l.profiles?.full_name || l.profiles?.username,
            creator_avatar: l.profiles?.avatar_url
          }));
          setListings(processedListings);
          
          // Filter into categories
          setJobs(processedListings.filter(l => l.type === 'job' || l.category === 'Jobs'));
          setCourses(processedListings.filter(l => 
            l.type === 'course' || 
            l.category === 'Courses' || 
            l.category === 'Education' ||
            l.metadata?.digitalType === 'course'
          ));
          setCommunities(processedListings.filter(l => l.type === 'community' || l.category === 'Communities' || l.category === 'Community'));
          setDigitalProducts(processedListings.filter(l => 
            l.type === 'digital' || 
            l.type === 'virtual' || 
            l.category === 'Digital' ||
            l.metadata?.digitalType === 'ebook'
          ));
          setServices(processedListings.filter(l => l.type === 'service' || l.category === 'Services' || l.category === 'Graphic Design'));
          setAnnouncements(processedListings.filter(l => l.type === 'announcement' || l.category === 'Announcements'));
        }

        if (businessesRes.data) {
          setBusinesses(businessesRes.data);
        }

        if (reviewsRes.error) {
          console.error('Error fetching reviews:', reviewsRes.error);
        }

        if (reviewsRes.data && reviewsRes.data.length > 0) {
          const reviewsData = reviewsRes.data;
          const reviewUserIds = Array.from(new Set(reviewsData.map((r: any) => r.user_id).filter(Boolean)));
          const reviewListingIds = Array.from(new Set(reviewsData.map((r: any) => r.listing_id).filter(Boolean)));

          const [reviewProfilesRes, reviewListingsRes] = await Promise.all([
            reviewUserIds.length > 0
              ? supabase.from('profiles').select('id, full_name, avatar_url, username').in('id', reviewUserIds)
              : Promise.resolve({ data: [], error: null } as any),
            reviewListingIds.length > 0
              ? supabase.from('listings').select('id, title').in('id', reviewListingIds)
              : Promise.resolve({ data: [], error: null } as any),
          ]);

          const profileMap = new Map((reviewProfilesRes.data || []).map((p: any) => [p.id, p]));
          const listingMap = new Map((reviewListingsRes.data || []).map((l: any) => [l.id, l]));

          const enrichedReviews = reviewsData.map((review: any) => ({
            ...review,
            profiles: profileMap.get(review.user_id) || null,
            listings: listingMap.get(review.listing_id) || null,
          }));

          setReviews(enrichedReviews);
        } else {
          // Fallback mock reviews for initial display
          setReviews([
            {
              id: '1',
              rating: 5,
              comment: "Wersee has completely changed how I manage my digital products. The interface is stunning and the fees are the lowest in the industry.",
              user_id: 'mock1',
              profiles: { full_name: "David Hoffman", username: "davidh", avatar_url: "https://i.pravatar.cc/150?u=david" },
              listings: { title: "Elite Trading Course" }
            },
            {
              id: '2',
              rating: 5,
              comment: "The community features are incredible. I've met so many like-minded creators here. Highly recommended!",
              user_id: 'mock2',
              profiles: { full_name: "Elena Rodriguez", username: "elena", avatar_url: "https://i.pravatar.cc/150?u=elena" },
              listings: { title: "Creative Mastermind" }
            },
            {
              id: '3',
              rating: 4,
              comment: "Solid platform with great support. Wersee Pay makes international transactions a breeze.",
              user_id: 'mock3',
              profiles: { full_name: "James Wilson", username: "jamesw", avatar_url: "https://i.pravatar.cc/150?u=james" },
              listings: { title: "SaaS Starter Kit" }
            },
            {
              id: '4',
              rating: 5,
              comment: "The best place to scale your digital business. The analytics are top-notch.",
              user_id: 'mock4',
              profiles: { full_name: "Sophie Chen", username: "sophie", avatar_url: "https://i.pravatar.cc/150?u=sophie" },
              listings: { title: "Growth Blueprint" }
            },
            {
              id: '5',
              rating: 5,
              comment: "I love the editorial design. It makes my products look so much more professional.",
              user_id: 'mock5',
              profiles: { full_name: "Thomas Wright", username: "thomas", avatar_url: "https://i.pravatar.cc/150?u=thomas" },
              listings: { title: "Design Assets Pack" }
            }
          ]);
        }

        setStats(platformStats);

        if (discordRes.count !== undefined) {
           setDiscordGuilds(discordRes.count || 0);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const displayListings = listings;

  return (
    <div className="min-h-[100dvh] bg-[#0A0A0A] text-white font-sans selection:bg-indigo-500/30 pb-24">
      <SEO 
        title="Wersee - Where the internet does business" 
        description={`Build your business and get discovered by ${stats.customers.toLocaleString()}+ customers on Wersee.`}
        image="https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/Ontwerp_zonder_titel__1_-removebg-preview%20(1).png"
        url="/"
      />
      <PWAInstallBanner />

      {/* Hero Section */}
      <div className="pt-32 sm:pt-40 pb-20 sm:pb-32 px-4 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[85vh]">
        
        {/* Animated Background Gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/20 rounded-full blur-[120px] opacity-50 mix-blend-screen pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[100px] opacity-30 mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] opacity-30 mix-blend-screen pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto w-full">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="mb-10 flex justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/30 blur-2xl rounded-full scale-150" />
              <img 
                src="https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/business_logos/a1e58d3a96480df827eafe98567353d2-removebg-preview.png" 
                alt="Wersee Logo" 
                className="relative w-20 h-20 sm:w-28 sm:h-28 object-contain drop-shadow-[0_0_30px_rgba(99,102,241,0.6)]"
                referrerPolicy="no-referrer"
              />
            </div>
          </motion.div>

          {/* Top Toggle/Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-1 p-1.5 bg-[#141414]/80 backdrop-blur-xl border border-white/10 rounded-full mb-8 sm:mb-10 shadow-2xl"
          >
            <button 
              onClick={() => setHomeTab('launch')}
              className={`px-5 sm:px-6 py-2 rounded-full text-sm sm:text-base font-semibold transition-all duration-300 ${homeTab === 'launch' ? 'bg-white text-black shadow-lg scale-105' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              Launch
            </button>
            <button 
              onClick={() => setHomeTab('discover')}
              className={`px-5 sm:px-6 py-2 rounded-full text-sm sm:text-base font-semibold transition-all duration-300 ${homeTab === 'discover' ? 'bg-white text-black shadow-lg scale-105' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              Discover
            </button>
            <button 
              onClick={() => setHomeTab('jobs')}
              className={`px-5 sm:px-6 py-2 rounded-full text-sm sm:text-base font-semibold transition-all duration-300 ${homeTab === 'jobs' ? 'bg-white text-black shadow-lg scale-105' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              Jobs
            </button>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter text-white mb-6 sm:mb-8 leading-[1.05] relative"
          >
            <span className="relative z-10">Where the </span>
            <span className="relative inline-block z-10 min-w-[280px] sm:min-w-[400px] text-left">
              <AnimatePresence mode="wait">
                <motion.span
                  key={wordIndex}
                  initial={{ opacity: 0, y: 40, rotateX: -90 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  exit={{ opacity: 0, y: -40, rotateX: 90 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="text-indigo-400 absolute left-0"
                >
                  {words[wordIndex]}
                </motion.span>
              </AnimatePresence>
              <span className="invisible">internet</span>
            </span><br />
            <span className="relative z-10">{verbs[wordIndex]} business.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-xl sm:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto font-medium leading-relaxed"
          >
            Build your business and get discovered by more<br className="hidden sm:block" />
            than <span className="text-white font-bold">{stats.customers.toLocaleString()}+</span> customers on Wersee.
          </motion.p>

          {/* Auth-based CTAs */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
          >
            {user ? (
              <>
                <Link to="/dashboard" className="px-10 py-5 rounded-2xl bg-white text-black font-bold text-lg hover:bg-gray-100 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all duration-300 w-full sm:w-auto">
                  Go to Workspace
                </Link>
                <Link to="/search" className="px-10 py-5 rounded-2xl bg-[#141414] border border-white/10 text-white font-bold text-lg hover:bg-[#1A1A1A] hover:border-white/20 hover:scale-105 transition-all duration-300 w-full sm:w-auto">
                  Explore Collection
                </Link>
              </>
            ) : (
              <>
                <Link to="/auth" className="px-10 py-5 rounded-2xl bg-white text-black font-bold text-lg hover:bg-gray-100 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all duration-300 w-full sm:w-auto">
                  Start Selling
                </Link>
                <Link to="/search" className="px-10 py-5 rounded-2xl bg-[#141414] border border-white/10 text-white font-bold text-lg hover:bg-[#1A1A1A] hover:border-white/20 hover:scale-105 transition-all duration-300 w-full sm:w-auto">
                  Explore Collection
                </Link>
              </>
            )}
          </motion.div>

          {/* Search/Chat Bar */}
          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            onSubmit={handleSearch} 
            className="relative max-w-3xl mx-auto w-full mb-8 group px-4 sm:px-0"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-blue-500/30 rounded-[2rem] sm:rounded-3xl blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />
            <div className="relative flex items-center bg-[#141414]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] sm:rounded-3xl p-2 sm:p-3 hover:border-white/20 focus-within:border-indigo-500/50 focus-within:bg-[#1A1A1A] transition-all duration-300 shadow-2xl">
              {homeTab === 'launch' ? (
                <button type="button" aria-label="Create new" className="p-3 sm:p-4 text-gray-400 hover:text-white transition-colors">
                  <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              ) : (
                <button type="button" aria-label="Search" className="p-3 sm:p-4 text-gray-400 hover:text-white transition-colors">
                  <Search className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              )}
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={homeTab === 'launch' ? "Describe your idea..." : homeTab === 'jobs' ? "Search jobs..." : "Search anything..."}
                className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-gray-500 px-2 text-base sm:text-xl font-medium"
              />
              <div className="flex items-center gap-1 sm:gap-2 pr-2 sm:pr-3">
                <button type="button" aria-label="Voice search" className="hidden sm:flex p-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                  <Mic className="w-6 h-6" />
                </button>
                <button type="submit" aria-label="Submit search" className="p-2.5 sm:p-2 bg-white text-black sm:bg-white/5 sm:text-white hover:bg-white/10 rounded-2xl sm:rounded-xl transition-colors">
                  {homeTab === 'launch' ? <Search className="w-5 h-5" /> : <ArrowUp className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </motion.form>

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-2 text-[10px] sm:text-sm text-gray-500 font-medium">
            <span>US$ {stats.earned.toLocaleString()} <span className="text-gray-600">earned</span></span>
            <span className="hidden xs:inline">·</span>
            <span>{stats.users.toLocaleString()} <span className="text-gray-600">users</span></span>
            <span className="hidden xs:inline">·</span>
            <span>{stats.businesses.toLocaleString()} <span className="text-gray-600">businesses</span></span>
            <span className="hidden xs:inline">·</span>
            <span>{stats.customers.toLocaleString()} <span className="text-gray-600">customers</span></span>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      {homeTab === 'jobs' ? (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-white tracking-tight">Featured Jobs</h2>
              <Link to="/jobs" className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from(new Map(jobs.slice(0, 6).map(j => [j.id, j])).values()).map((job, i) => (
                <JobCard 
                  key={job.id}
                  variant={i % 2 === 0 ? 'default' : 'freelance'}
                  job={{
                    id: job.id,
                    title: job.title,
                    company: job.creator_name || 'Wersee Partner',
                    location: job.location || 'Remote',
                    salary: job.price ? `€${job.price}` : 'Competitive',
                    type: job.metadata?.jobType || 'Full-time',
                    postedAt: new Date(job.created_at).toLocaleDateString(),
                    logo_url: job.logo_url || job.creator_avatar,
                    description: job.description,
                    tags: job.metadata?.skills || ['React', 'TypeScript', 'Node.js'],
                    author: {
                      name: job.creator_name || 'Wersee Partner',
                      avatar_url: job.creator_avatar
                    }
                  }} 
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Discord Bot Section */}
          <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-[#5865F2]/20 via-[#5865F2]/5 to-transparent border border-[#5865F2]/20 rounded-[3rem] p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-12 overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#5865F2]/10 blur-[100px] -mr-48 -mt-48 pointer-events-none" />
              
              <div className="flex-1 space-y-6 relative z-10 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#5865F2]/20 border border-[#5865F2]/30 rounded-full text-[#5865F2] text-sm font-bold uppercase tracking-widest">
                  <Bot className="w-4 h-4" />
                  <span>Discord Integration</span>
                </div>
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white">
                  Power your server with <span className="text-[#5865F2]">Wersee Bot</span>
                </h2>
                <p className="text-xl text-gray-400 max-w-xl">
                  Automate support, sync sales, and reward your community. Active in <span className="text-white font-bold">{discordGuilds.toLocaleString()} servers</span> and counting.
                </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-4">
                  <Link 
                    to="/bot-guide" 
                    className="px-8 py-4 bg-[#5865F2] text-white rounded-2xl font-bold hover:bg-[#4752C4] transition-all flex items-center gap-2 group"
                  >
                    View Bot Guide
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <a 
                    href="https://discord.gg/GVCkJ4m8fK" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all"
                  >
                    Join Our Discord
                  </a>
                </div>
              </div>

              <div className="flex-1 relative">
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-6 bg-[#141414] border border-white/5 rounded-3xl space-y-4"
                    >
                      <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-[#5865F2]">
                        {i === 1 ? <ShieldCheck className="w-6 h-6" /> : i === 2 ? <Zap className="w-6 h-6" /> : i === 3 ? <Users className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
                      </div>
                      <h4 className="font-bold text-white">
                        {i === 1 ? 'Auto-Mod' : i === 2 ? 'XP System' : i === 3 ? 'Support' : 'Sales Sync'}
                      </h4>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </section>
          {/* Creator Announcements */}
      {announcements.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mb-16"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Megaphone className="w-5 h-5 text-indigo-500" />
              <h2 className="text-xl font-bold text-white tracking-tight">Creator Announcements</h2>
            </div>
            <Link to="/announcements" className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">
              View All
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
            {announcements.map((announcement, i) => (
              <div key={i} className="snap-start shrink-0 w-[300px] sm:w-[400px]">
                <AnnouncementCard announcement={announcement} />
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Get Started Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mb-24"
      >
        <div className="flex items-center gap-3 mb-8">
          <Zap className="w-6 h-6 text-indigo-500" />
          <h2 className="text-2xl font-bold text-white tracking-tight">Get Started</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
          {/* Card 1: Wersee Creators */}
          <Link to="/creators" className="group relative h-[400px] sm:h-[480px] rounded-[3rem] overflow-hidden bg-[#0F0F0F] border border-white/5 hover:border-orange-500/40 transition-all duration-700 shadow-2xl">
            {/* Background Image with Parallax-like effect */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1598550476439-6847785fce66?q=80&w=1200&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:opacity-60 group-hover:scale-110 transition-all duration-1000 ease-out" />
            
            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0A0A0A]/20 to-[#0A0A0A]" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-transparent to-transparent opacity-80" />
            
            {/* Floating Badge */}
            <div className="absolute top-10 left-10 z-20">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 backdrop-blur-md"
              >
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">
                  Earn Money
                </span>
              </motion.div>
            </div>

            {/* Icon/Star */}
            <div className="absolute top-10 right-10 z-20">
              <div className="w-14 h-14 rounded-[1.5rem] bg-white/5 border border-white/10 backdrop-blur-xl flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white group-hover:rotate-12 transition-all duration-500 shadow-2xl">
                <Star className="w-7 h-7 fill-current" />
              </div>
            </div>

            {/* Content Area */}
            <div className="absolute bottom-0 left-0 w-full p-10 sm:p-12 z-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tighter italic uppercase flex items-center gap-4 group-hover:text-orange-400 transition-colors">
                  Wersee Creators 
                  <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:translate-x-3 group-hover:bg-white group-hover:text-black transition-all duration-500">
                    <ChevronRight className="w-6 h-6" />
                  </div>
                </h3>
                <p className="text-gray-400 text-lg sm:text-xl max-w-md leading-tight font-medium">
                  Get paid to create content for top brands. Join our network of elite creators and start earning today.
                </p>
                
                {/* Micro-stats or labels */}
                <div className="mt-8 flex items-center gap-6">
                  <div className="flex -space-x-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0A0A0A] bg-gray-800 overflow-hidden">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=creator${i}`} alt="User" />
                      </div>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{stats.creators.toLocaleString()} Active Creators</span>
                </div>
              </motion.div>
            </div>
            
            {/* Hover Glow */}
            <div className="absolute -inset-full bg-gradient-to-r from-transparent via-orange-500/10 to-transparent rotate-45 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />
          </Link>

          {/* Card 2: Wersee Academy */}
          <Link to="/features/academy-builder" className="group relative h-[400px] sm:h-[480px] rounded-[3rem] overflow-hidden bg-[#0F0F0F] border border-white/5 hover:border-indigo-500/40 transition-all duration-700 shadow-2xl">
            {/* Background with abstract shapes and gradients */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-transparent opacity-60" />
            
            {/* Floating Glass Element */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div 
                animate={{ 
                  y: [0, -20, 0],
                  rotate: [12, 15, 12]
                }}
                transition={{ 
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-72 h-72 bg-white/5 backdrop-blur-3xl rounded-[4rem] border border-white/10 shadow-[0_0_100px_rgba(99,102,241,0.1)] relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-[4rem]" />
              </motion.div>
            </div>

            {/* Floating Badge */}
            <div className="absolute top-10 left-10 z-20">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md"
              >
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">
                  Learn & Grow
                </span>
              </motion.div>
            </div>

            {/* Icon/Play */}
            <div className="absolute top-10 right-10 z-20">
              <div className="w-14 h-14 rounded-[1.5rem] bg-white/5 border border-white/10 backdrop-blur-xl flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white group-hover:scale-110 transition-all duration-500 shadow-2xl">
                <Play className="w-7 h-7 fill-current ml-1" />
              </div>
            </div>

            {/* Content Area */}
            <div className="absolute bottom-0 left-0 w-full p-10 sm:p-12 z-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tighter italic uppercase flex items-center gap-4 group-hover:text-indigo-400 transition-colors">
                  Wersee Academy
                  <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:translate-x-3 group-hover:bg-white group-hover:text-black transition-all duration-500">
                    <ChevronRight className="w-6 h-6" />
                  </div>
                </h3>
                <p className="text-gray-400 text-lg sm:text-xl max-w-md leading-tight font-medium">
                  Master the platform with our expert-led courses. From setup to scale, we've got you covered.
                </p>

                {/* Course Tags */}
                <div className="mt-8 flex flex-wrap gap-3">
                  {['Marketing', 'Sales', 'Design'].map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Hover Glow */}
            <div className="absolute -inset-full bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent rotate-45 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />
          </Link>
        </div>
      </motion.div>

      {/* Verified Businesses */}
      <HorizontalScrollSection 
        title="Verified Businesses" 
        subtitle="Top performing businesses on the platform"
        items={businesses} 
      />

      {/* Digital Products Section */}
      <HorizontalScrollSection 
        title="Digital Products" 
        subtitle="Ebooks, templates, and digital assets"
        items={digitalProducts} 
      />

      {/* Services Section */}
      <HorizontalScrollSection 
        title="Services" 
        subtitle="Hire experts for your next project"
        items={services} 
      />

      {/* Business Ideas */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mb-16 overflow-hidden"
      >
        <h2 className="text-xl font-bold text-white tracking-tight mb-4">Business Ideas</h2>
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {['Start a painting service business', 'Start a pmp certification prep business', 'Start a personal styling business', 'Start a consulting agency', 'Start a digital product store'].map((idea, i) => (
            <button key={i} className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-[#141414] border border-white/5 hover:border-white/20 hover:bg-[#1A1A1A] transition-all text-sm text-gray-300 hover:text-white whitespace-nowrap shrink-0">
              <Lightbulb className="w-4 h-4 text-gray-500" />
              {idea}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Jobs Section */}
      <HorizontalScrollSection 
        title="Jobs on Wersee" 
        subtitle="Find your next opportunity or hire the best talent on the platform"
        items={jobs} 
        type="job"
      />

      {/* Prop Firm Trading */}
      <div className="relative">
        <HorizontalScrollSection 
          title="Prop firm trading" 
          subtitle="Master forex, crypto, stocks and options with real traders sharing live setups"
          items={displayListings.slice().reverse()} 
        />
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 -mt-8 mb-12">
          <Link to="/jobs" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors">
            View all job listings <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Courses Section */}
      <HorizontalScrollSection 
        title="Courses" 
        subtitle="Learn from the best in the industry with our curated selection of courses"
        items={courses} 
      />
      </>
      )}

      {/* Treasury Banner */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="relative rounded-[2rem] overflow-hidden bg-[#141414] border border-white/5 flex flex-col md:flex-row items-center">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent pointer-events-none" />
          <div className="p-8 md:p-16 flex-1 relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Meet Wersee Treasury</h2>
            <p className="text-xl text-gray-400 mb-8">Earn up to 6% yield on your cash.</p>
            <Link to="/treasure" className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors">
              Get started
            </Link>
          </div>
          <div className="flex-1 p-8 md:p-12 relative z-10 w-full">
            <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#0A0A0A]">
              {/* Mock Dashboard UI */}
              <div className="absolute inset-0 p-4 flex flex-col">
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-indigo-500 rounded-md" />
                    <span className="font-bold text-sm">Wersee Treasury</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 rounded-full bg-white/10 text-xs text-white">Deposit</div>
                    <div className="px-3 py-1 rounded-full bg-white/10 text-xs text-white">Withdraw</div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-400 mb-1">Total balance</div>
                  <div className="text-3xl font-bold text-white mb-6">$6,993.54 <span className="text-sm text-gray-500 font-normal">USD</span></div>
                  
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden mb-4 flex">
                    <div className="h-full bg-blue-500 w-[60%]" />
                    <div className="h-full bg-indigo-500 w-[40%]" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /> Available cash</div>
                      <div className="text-white">$4,120.25</div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500" /> Treasury</div>
                      <div className="text-white">$2,873.29</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wersee Pay Banner */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-[#141414] to-[#0A0A0A] border border-white/5 flex flex-col md:flex-row items-center">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay" />
          <div className="p-8 md:p-16 flex-1 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-6">
              <CreditCard className="w-6 h-6 text-emerald-500" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Wersee Pay</h2>
            <p className="text-xl text-gray-400 mb-8">The ultimate financial toolkit for creators. Wersee Pay acts as your Merchant of Record (MoR), handling global VAT, platform fees, and automated payouts so you can focus on building.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {[
                { title: 'Global VAT & Tax', desc: 'We handle tax compliance in 100+ countries.' },
                { title: 'Automated Payouts', desc: 'Get paid directly to your bank account monthly.' },
                { title: 'Revenue Analytics', desc: 'Track gross revenue, fees, and net profit.' },
                { title: 'Professional Invoices', desc: 'Generate and send invoices in seconds.' }
              ].map((feat, i) => (
                <div key={i} className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-white font-bold text-sm">{feat.title}</h4>
                    <p className="text-gray-500 text-xs">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/features/wersee-pay" className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-900/20">
              Explore Wersee Pay
            </Link>
          </div>
          <div className="flex-1 p-8 md:p-12 relative z-10 w-full flex justify-center">
             {/* Mock Pay UI */}
             <div className="w-full max-w-sm bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-white fill-current" />
                    </div>
                    <span className="text-white font-bold">Wersee Pay</span>
                  </div>
                  <div className="text-gray-500 text-xs">MoR Active</div>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Total Balance</p>
                    <p className="text-3xl font-bold text-white">€12,450.00</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-gray-500 text-[10px] uppercase font-bold mb-1">Net Profit</p>
                      <p className="text-emerald-500 font-bold">€10,230.00</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-gray-500 text-[10px] uppercase font-bold mb-1">Fees & VAT</p>
                      <p className="text-red-500 font-bold">-€2,220.00</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400 text-xs">Next Payout</span>
                      <span className="text-white text-xs font-bold">April 1st</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="w-[75%] h-full bg-emerald-500" />
                    </div>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="flex items-center gap-3 mb-6">
          <Link2 className="w-5 h-5 text-gray-400" />
          <h2 className="text-xl font-bold text-white tracking-tight">Quick Links</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { title: 'Help Center', link: '/help', icon: <Search className="w-5 h-5" /> },
            { title: 'Creator Academy', link: '/features/academy-builder', icon: <Star className="w-5 h-5" /> },
            { title: 'Community Guidelines', link: '/guidelines', icon: <Users className="w-5 h-5" /> },
            { title: 'Partner Program', link: '/partners', icon: <Briefcase className="w-5 h-5" /> }
          ].map((item, i) => (
            <Link key={i} to={item.link} className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[#141414] border border-white/5 hover:border-white/20 hover:bg-[#1A1A1A] transition-all text-center group">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-white group-hover:bg-white/10 transition-colors mb-3">
                {item.icon}
              </div>
              <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">{item.title}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Communities Section */}
      <HorizontalScrollSection 
        title="Communities" 
        subtitle="Connect with creators, editors, photographers and writers who understand"
        items={communities} 
      />

      {/* Popular Businesses */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter text-white leading-none mb-2">
              Wersee <span className="text-indigo-500">Creators</span>
            </h2>
            <p className="text-gray-500 text-sm font-medium">The most successful businesses on the platform</p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm font-bold text-white group">
            Filter <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(businesses.length > 0 ? businesses : displayListings.slice(0, 8)).map((item, i) => (
            <Link 
              key={i} 
              to={item.user_id ? `/${item.slug || item.id}` : `/@${item.username || 'creator'}/${item.slug || item.id}`} 
              className="group relative aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-[#0F0F0F] border border-white/5 hover:border-indigo-500/40 transition-all duration-700 hover:shadow-[0_20px_80px_rgba(99,102,241,0.15)]"
            >
              {/* Background Image/Gradient */}
              <div className="absolute inset-0">
                {item.banner_url ? (
                  <img src={item.banner_url} alt="Banner" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-black" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-[#0F0F0F]/40 to-transparent opacity-90" />
              </div>

              {/* Content Overlay */}
              <div className="absolute inset-0 p-8 flex flex-col justify-end">
                {/* Logo */}
                <div className="w-16 h-16 rounded-2xl bg-[#1A1A1A] border-2 border-white/10 overflow-hidden mb-6 shadow-2xl group-hover:-translate-y-2 transition-transform duration-500">
                  {item.logo_url ? (
                    <img src={item.logo_url} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl italic tracking-tighter">
                      {(item.name || item.title)?.charAt(0) || 'W'}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white group-hover:text-indigo-400 transition-colors truncate">
                        {item.name || item.title}
                      </h3>
                      <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                    </div>
                    <p className="text-xs text-gray-400 font-bold tracking-tight">
                      by {item.creator_name || item.profiles?.full_name || 'Creator'}
                    </p>
                  </div>

                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed font-medium">
                    {item.description || 'Premium community access and exclusive digital assets.'}
                  </p>

                  <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                    {(item.rating_avg || 0) > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                        <span className="text-white font-black text-sm leading-none">
                          {item.rating_avg.toFixed(1)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">No reviews yet</span>
                    )}
                    
                    {(item.user_count || 0) > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-gray-400 font-bold text-[11px] leading-none">
                          {item.user_count >= 1000 ? (item.user_count / 1000).toFixed(1) + 'k' : item.user_count}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">No customers yet</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Hover Glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2.5rem] blur opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
            </Link>
          ))}
        </div>
      </div>

      {/* Reviews Slider */}
      <ReviewSlider reviews={reviews} />

      {/* Testimonials Section */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <h2 className="text-3xl font-bold text-white tracking-tight mb-12 text-center">Trusted by thousands of creators</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              name: "Alex Rivera",
              role: "Digital Artist",
              content: "Wersee transformed how I sell my assets. The 5% fee is unbeatable compared to other platforms.",
              avatar: "https://i.pravatar.cc/150?u=alex"
            },
            {
              name: "Sarah Chen",
              role: "Course Creator",
              content: "The community features are top-notch. My students love the integrated chat and file sharing.",
              avatar: "https://i.pravatar.cc/150?u=sarah"
            },
            {
              name: "Marcus Thorne",
              role: "SaaS Founder",
              content: "Wersee Pay made it so easy to accept international payments. Highly recommended for any digital business.",
              avatar: "https://i.pravatar.cc/150?u=marcus"
            }
          ].map((testimonial, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5 }}
              className="p-8 rounded-3xl bg-[#141414] border border-white/5 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <MessageSquare className="w-12 h-12 text-indigo-500" />
              </div>
              <div className="flex items-center gap-4 mb-6">
                <img src={testimonial.avatar} alt={testimonial.name} className="w-12 h-12 rounded-full border border-white/10" referrerPolicy="no-referrer" />
                <div>
                  <h4 className="font-bold text-white">{testimonial.name}</h4>
                  <p className="text-xs text-gray-500">{testimonial.role}</p>
                </div>
              </div>
              <p className="text-gray-400 leading-relaxed italic">"{testimonial.content}"</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Trust & Security Section */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="p-12 rounded-[3rem] bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-bold">
                <ShieldCheck className="w-4 h-4" /> Secure Platform
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
                Your security is our <span className="text-indigo-400">top priority</span>
              </h2>
              <p className="text-xl text-gray-400 leading-relaxed">
                We use industry-leading encryption and security protocols to ensure your data and transactions are always protected.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { title: "Buyer Protection", desc: "14-day money-back guarantee on all eligible purchases." },
                  { title: "Secure Payments", desc: "PCI-compliant processing for all major credit cards and iDEAL." },
                  { title: "Identity Verification", desc: "Strict KYC protocols for all sellers to prevent fraud." },
                  { title: "24/7 Monitoring", desc: "Automated systems monitoring for suspicious activity." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-1">{item.title}</h4>
                      <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-[3rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center p-12">
                <motion.div
                  animate={{ 
                    scale: [1, 1.05, 1],
                    rotate: [0, 5, 0]
                  }}
                  transition={{ duration: 6, repeat: Infinity }}
                  className="w-full h-full rounded-[2rem] bg-[#0A0A0A] border border-white/5 shadow-2xl flex flex-col items-center justify-center space-y-6"
                >
                  <div className="w-24 h-24 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <ShieldCheck className="w-12 h-12 text-indigo-400" />
                  </div>
                  <div className="text-center space-y-2">
                    <div className="text-2xl font-bold text-white">Wersee Secure</div>
                    <div className="text-sm text-gray-500">Active Protection Enabled</div>
                  </div>
                  <div className="w-48 h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      animate={{ x: [-192, 192] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-full h-full bg-indigo-500"
                    />
                  </div>
                </motion.div>
              </div>
              {/* Decorative glows */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-indigo-500/10 blur-[100px] pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="p-12 rounded-[3rem] bg-[#141414] border border-white/5 text-center relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-8">
            <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mx-auto mb-8">
              <Mail className="w-10 h-10 text-indigo-400" />
            </div>
            <h2 className="text-4xl font-bold text-white tracking-tight">Join the Wersee community</h2>
            <p className="text-xl text-gray-400">
              Get weekly insights on the creator economy, platform updates, and exclusive opportunities delivered to your inbox.
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="flex-1 px-6 py-4 rounded-2xl bg-[#0A0A0A] border border-white/10 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
              />
              <button className="px-8 py-4 bg-white text-black font-bold rounded-2xl hover:bg-gray-200 transition-all active:scale-95">
                Subscribe
              </button>
            </form>
            <p className="text-xs text-gray-600">
              By subscribing, you agree to our <Link to="/terms" className="text-gray-400 hover:text-white underline">Terms</Link> and <Link to="/privacy" className="text-gray-400 hover:text-white underline">Privacy Policy</Link>.
            </p>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px] translate-x-1/2 translate-y-1/2" />
        </div>
      </div>

      {/* Back to Top */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mb-12 flex justify-center">
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#141414] border border-white/5 hover:border-white/20 text-gray-400 hover:text-white transition-all text-sm font-medium group"
        >
          <ArrowUpCircle className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
          Back to top
        </button>
      </div>

    </div>
  );
};
