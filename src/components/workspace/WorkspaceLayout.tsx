import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MobileMoreOptions } from './MobileMoreOptions';
import { MobileSearchDropdown } from './MobileSearchDropdown';
import { 
  Plus, Search, Settings, HelpCircle, MessageCircle, 
  ChevronDown, ChevronRight, Store, ShoppingBag, Users, LogOut, User, Home, Package,
  MoreHorizontal, TrendingUp, CreditCard, Shield, Wallet, Menu, X, Sparkles, Megaphone, HardDrive, Briefcase, Download, Bell, Scale, ArrowRight, GraduationCap, School, Compass, BookOpen, Mail
} from 'lucide-react';
import { getOrCreateTeamChat, supabase, invokeApiRunner } from '../../lib/supabase';
import { appToast } from '../../lib/feedback';
import { emptyPlatformStats, fetchPlatformStats } from '../../lib/platformStats';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { WorkspaceCreateDropdown } from './WorkspaceCreateDropdown';
import { SidebarSection } from './SidebarSection';
import { WorkspaceAiSidebar } from './WorkspaceAiSidebar';
import { BusinessOnboardingWizard } from './BusinessOnboardingWizard';
import { PwaOnboardingModal } from './PwaOnboardingModal';
import { hapticFeedback } from '../../lib/haptics';
import { LoadingState } from '../ui/LoadingState';
import { WhatsNewModal } from '../WhatsNewModal';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  onNavigate: (tab: string) => void;
  activeView: string;
  setActiveView: (view: string) => void;
}

import { WorkspaceNotifications } from './WorkspaceNotifications';
import { WorkspaceSearchResults } from './WorkspaceSearchResults';
import { StudentDiscount } from '../education/StudentDiscount';
import { CampusProgram } from '../education/CampusProgram';
import { LearningPaths } from '../education/LearningPaths';
import { EduResources } from '../education/EduResources';
import { EmailOperationsView } from './EmailOperationsView';

export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({ children, onNavigate, activeView, setActiveView }) => {
  const navigate = useNavigate();
  const isBuilderActive = activeView.startsWith('create-') || activeView.startsWith('edit-');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMoreExpanded, setIsMoreExpanded] = useState(false);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);
  const [isEduExpanded, setIsEduExpanded] = useState(false);
  const [aiContext, setAiContext] = useState<any>(null);
  const [isAgentMode, setIsAgentMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const isManagementOrMoney = activeView.startsWith('management') || activeView.startsWith('money');
  const isCourseView = activeView.startsWith('course-player_') || activeView.startsWith('access_');
  const shouldHideNav = isManagementOrMoney || (isMobile && isCourseView);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleOpenAi = (e: any) => {
      setIsAiSidebarOpen(true);
      if (e.detail?.context) {
        setAiContext(e.detail.context);
      }
    };
    window.addEventListener('open-ai-sidebar', handleOpenAi as EventListener);

    const handleTriggerSearch = (e: any) => {
      if (e.detail?.query !== undefined) {
        setSearchQuery(e.detail.query);
        setActiveView('search-results');
      }
    };
    window.addEventListener('trigger-workspace-search', handleTriggerSearch as EventListener);

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Focus search input if it exists
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        } else {
          navigate('/search');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('open-ai-sidebar', handleOpenAi as EventListener);
      window.removeEventListener('trigger-workspace-search', handleTriggerSearch as EventListener);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const [isTopMenuOpen, setIsTopMenuOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setActiveView('search-results');
      setIsMobileSearchOpen(false);
    }
  };
  const [onboardingBusiness, setOnboardingBusiness] = useState<any | null>(null);
  
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [joinedProducts, setJoinedProducts] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const platformRoles = Array.isArray(user?.app_metadata?.platform_roles) ? user.app_metadata.platform_roles : [];
  const isPlatformEmailAdmin = ['admin', 'platform_admin', 'email_admin'].includes(String(user?.app_metadata?.role ?? '')) || platformRoles.some((role: string) => ['admin', 'email_admin', 'support_admin'].includes(role));
  const [isGuardian, setIsGuardian] = useState(false);
  const [platformStats, setPlatformStats] = useState(emptyPlatformStats);
  const [loading, setLoading] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const { businessId } = useParams();

  useEffect(() => {
    fetchWorkspaceData();
  }, []);

  const fetchWorkspaceData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      fetchPlatformStats().then(setPlatformStats).catch((error) => {
        if (import.meta.env.DEV) console.warn('Could not load workspace platform stats:', error);
      });
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: personalTeamId, error: workspaceError } = await supabase.rpc('ensure_personal_workspace', {
        p_user_id: user.id,
      });

      if (workspaceError) {
        console.error('Error ensuring personal workspace:', workspaceError);
      } else if (personalTeamId) {
        await getOrCreateTeamChat(personalTeamId as string);
      }

      // 1. Sync Team Chats: Ensure user has a chat for every team they are in
      const { data: teamMembers } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id);
        
      if (teamMembers && teamMembers.length > 0) {
        try {
          await Promise.all(teamMembers.map(tm => 
            getOrCreateTeamChat(tm.team_id)
          ));
        } catch (err) {
          console.error('Error syncing team chats:', err);
        }
      }

      // 2. Fetch businesses
      const { data: bData } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (bData) setBusinesses(bData);

      // 3. Fetch products (created by user)
      const { data: pData } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });
        
      if (pData) setProducts(pData);

      // 4. Fetch communities (owned and joined)
      const { data: ownedCommunities } = await supabase
        .from('communities')
        .select('*')
        .eq('owner_id', user.id);
        
      const { data: joinedMemberships } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('user_id', user.id);

      const joinedIds = joinedMemberships?.map(m => m.community_id) || [];
      
      let uniqueCommunities = ownedCommunities || [];
      
      if (joinedIds.length > 0) {
        const { data: joinedCommunities } = await supabase
          .from('communities')
          .select('*')
          .in('id', joinedIds);
          
        if (joinedCommunities) {
          const allCommunities = [...uniqueCommunities, ...joinedCommunities];
          uniqueCommunities = Array.from(new Map(allCommunities.map(c => [c.id, c])).values());
        }
      }
        
      setCommunities(uniqueCommunities);

      // 5. Fetch joined products (purchased)
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          listing:listings (
            id,
            title,
            image_url,
            images,
            type,
            metadata,
            seller_id
          )
        `)
        .eq('buyer_id', user.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (orders) {
        let products = orders
          .map((o: any) => o.listing)
          .filter((l: any) => l !== null);
          
        // Find bundles
        const bundles = products.filter((p: any) => p.type === 'bundle');
        
        if (bundles.length > 0) {
          const regularBundleIds = bundles
            .filter((b: any) => !b.metadata?.is_all_access)
            .map((b: any) => b.id);
            
          const allAccessBundles = bundles.filter((b: any) => b.metadata?.is_all_access);
          
          // Fetch items for regular bundles
          if (regularBundleIds.length > 0) {
            const { data: bundleItemsData } = await supabase
              .from('bundle_items')
              .select(`
                listing:listings (
                  id,
                  title,
                  image_url,
                  images,
                  type
                )
              `)
              .in('bundle_id', regularBundleIds);
              
            if (bundleItemsData) {
              const itemsFromBundles = bundleItemsData
                .map((bi: any) => bi.listing)
                .filter((l: any) => l !== null);
                
              products = [...products, ...itemsFromBundles];
            }
          }
          
          // Fetch items for all-access bundles
          for (const aaBundle of allAccessBundles) {
            if (aaBundle.metadata?.all_access_category && aaBundle.seller_id) {
              const { data: aaItems } = await supabase
                .from('listings')
                .select('id, title, image_url, images, type')
                .eq('seller_id', aaBundle.seller_id)
                .eq('category', aaBundle.metadata.all_access_category)
                .neq('type', 'bundle');
                
              if (aaItems) {
                products = [...products, ...aaItems];
              }
            }
          }
        }
        
        // Remove duplicates and filter out bundles
        const uniqueProducts = Array.from(new Map(products.map((item: any) => [item.id, item])).values())
          .filter((item: any) => item.type !== 'bundle');
        setJoinedProducts(uniqueProducts);
      }

      // 6. Fetch Profile for Points
      const { data: pProfileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (pProfileData) setProfile(pProfileData);

      // Check if user is a guardian
      const { data: inviteData } = await supabase
        .from('next_gen_invites')
        .select('id')
        .eq('parent_id', user.id)
        .limit(1);
      
      if (inviteData && inviteData.length > 0) {
        setIsGuardian(true);
      }

    } catch (error) {
      console.error('Error fetching workspace data:', error);
    } finally {
      setLoading(false);
    }
  };

  const userUsername = profile?.username || user?.email?.split('@')[0] || 'user';

  const handleLogout = async () => {
    if (user?.user_metadata?.is_next_gen || (user?.user_metadata?.age !== undefined && user.user_metadata.age < 18)) {
      // Check for approved logout request
      const response = await invokeApiRunner('next-gen/check-logout-approved', {
        kid_id: user.id
      });

      if (response.success && response.approvedRequest) {
        // Delete the request and log out
        await invokeApiRunner('next-gen/delete-logout-request', { id: response.approvedRequest.id });
        await supabase.auth.signOut();
        navigate('/logged-out');
        return;
      }

      // Send logout request to parent
      try {
        await invokeApiRunner('next-gen/request-logout', {
          kid_id: user.id,
          parent_id: user.user_metadata?.parent_id
        });
        appToast('Logout request sent to your guardian. Please wait for their approval.', 'success');
      } catch (error) {
        console.error('Error sending logout request:', error);
        appToast('Failed to send logout request. Please try again.', 'error');
      }
      return;
    }
    
    await supabase.auth.signOut();
    navigate('/logged-out');
  };

  const handleExit = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsExiting(true);
    setTimeout(() => {
      navigate('/');
    }, 600); // Wait for animation to finish
  };

  // ... existing fetchWorkspaceData ...

  if (!user && !loading) {
    return (
      <div className="min-h-[100dvh] bg-[#0A0A0A] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background Mesh/Glow - More Dramatic */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/20 blur-[140px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/20 blur-[140px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-2xl w-full text-center relative z-10"
        >
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
            className="w-28 h-28 bg-gradient-to-br from-white/10 to-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 border border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.05)] backdrop-blur-xl"
          >
            <Sparkles className="w-14 h-14 text-white" />
          </motion.div>
          
          <h1 className="text-6xl md:text-8xl font-black mb-8 tracking-tighter leading-[0.9] bg-gradient-to-b from-white via-white to-white/30 bg-clip-text text-transparent">
            Make your <br /> account now
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 mb-14 leading-relaxed max-w-md mx-auto font-medium">
            Step into the future of business management. <span className="text-white">Wersee</span> is your all-in-one workspace for growth.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <Link 
              to="/auth?mode=signup"
              className="w-full sm:w-auto px-12 py-5 bg-white text-black rounded-2xl font-black text-lg hover:bg-gray-100 transition-all hover:scale-105 active:scale-95 shadow-[0_20px_40px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2"
            >
              Get Started
              <ChevronRight className="w-5 h-5" />
            </Link>
            <Link 
              to="/auth?mode=signin"
              className="w-full sm:w-auto px-12 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-bold text-lg hover:bg-white/10 transition-all active:scale-95 backdrop-blur-md"
            >
              Sign In
            </Link>
          </div>

          <div className="mt-24 pt-12 border-t border-white/5 grid grid-cols-3 gap-4 md:gap-12">
            <div className="text-center group cursor-default">
              <div className="text-3xl font-black text-white mb-1 group-hover:text-indigo-400 transition-colors">{platformStats.users.toLocaleString()}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold">Users</div>
            </div>
            <div className="text-center group cursor-default">
              <div className="text-3xl font-black text-white mb-1 group-hover:text-purple-400 transition-colors">{platformStats.businesses.toLocaleString()}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold">Businesses</div>
            </div>
            <div className="text-center group cursor-default">
              <div className="text-3xl font-black text-white mb-1 group-hover:text-emerald-400 transition-colors">24/7</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold">Support</div>
            </div>
          </div>
        </motion.div>
        
        {/* Footer Branding */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-20">
          <div className="w-5 h-5 bg-white rounded flex items-center justify-center text-[10px] font-black text-black">W</div>
          <span className="text-[10px] font-black tracking-[0.3em]">WERSEE</span>
        </div>
      </div>
    );
  }

  const hasSecondarySidebar = false;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: isExiting ? 0 : 1, scale: isExiting ? 0.95 : 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`h-[100dvh] overflow-hidden bg-[#0A0A0A] text-white flex font-sans relative transition-all duration-500 ${isAgentMode ? 'ring-[8px] ring-blue-500/30 ring-inset' : ''}`}
    >
      <WhatsNewModal context="workspace" />
      {/* Agent Mode Glow Overlay */}
      <AnimatePresence>
        {isAgentMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-[90] border-[4px] border-blue-500/50 shadow-[inset_0_0_100px_rgba(59,130,246,0.2)]"
          />
        )}
      </AnimatePresence>

      {!isManagementOrMoney && (
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-md z-[140] md:hidden"
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 w-[280px] bg-[#0A0A0A] z-[150] md:hidden flex flex-col border-r border-white/5 shadow-2xl"
              >
              <div className="p-4 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white text-black rounded-xl flex items-center justify-center font-black text-xl">W</div>
                  <div className="flex flex-col">
                    <span className="font-black text-lg tracking-tighter leading-none">WERSEE</span>
                    <button 
                      onClick={() => { setActiveView('early-access'); setIsMobileMenuOpen(false); }}
                      className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mt-0.5 hover:text-indigo-300 transition-colors text-left"
                    >
                      Release
                    </button>
                  </div>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-xl border border-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Main Links */}
                <div className="space-y-1">
                  <button 
                    onClick={() => { setActiveView('home'); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all ${activeView === 'home' ? 'bg-white text-black font-bold' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                  >
                    <Home className="w-5 h-5" />
                    <span className="text-sm uppercase tracking-widest">Home</span>
                  </button>
                  <button 
                    onClick={() => { setActiveView('chats'); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all ${activeView === 'chats' ? 'bg-white text-black font-bold' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm uppercase tracking-widest">Chats</span>
                  </button>
                  <button 
                    onClick={() => { setActiveView('joined-products'); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all ${activeView === 'joined-products' ? 'bg-white text-black font-bold' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                  >
                    <ShoppingBag className="w-5 h-5" />
                    <span className="text-sm uppercase tracking-widest">Purchases</span>
                  </button>
                  <a 
                    href="https://discord.gg/GVCkJ4m8fK"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center gap-4 p-3.5 rounded-2xl text-gray-400 hover:text-[#5865F2] hover:bg-[#5865F2]/10 transition-all group"
                  >
                    <div className="w-5 h-5 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 11.721 11.721 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.23 10.23 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                      </svg>
                    </div>
                    <span className="text-sm uppercase tracking-widest">Discord</span>
                  </a>
                </div>

                <div className="h-px bg-white/5" />

                {/* More Section for Mobile */}
                <div className="space-y-1">
                  <div className="px-4 mb-2 text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Services</div>
                  <button 
                    onClick={() => { setActiveView('management-products'); setIsMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-4 p-3.5 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <Briefcase className="w-5 h-5" />
                    <span className="text-sm uppercase tracking-widest">Management</span>
                  </button>
                  <button 
                    onClick={() => { setActiveView('storage'); setIsMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-4 p-3.5 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <HardDrive className="w-5 h-5" />
                    <span className="text-sm uppercase tracking-widest">Storage</span>
                  </button>
                  <button 
                    onClick={() => { setActiveView('money-balance'); setIsMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-4 p-3.5 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <Wallet className="w-5 h-5" />
                    <span className="text-sm uppercase tracking-widest">Finance</span>
                  </button>
                  <button 
                    onClick={() => { setActiveView('money-investments'); setIsMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-4 p-3.5 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-sm uppercase tracking-widest">Wersee Invest</span>
                  </button>
                </div>

                <div className="h-px bg-white/5" />

                {/* Businesses for Mobile */}
                <div className="space-y-1">
                  <div className="px-4 mb-2 text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Businesses</div>
                  {businesses.map(business => (
                    <button 
                      key={`mobile-menu-business-${business.id}`}
                      onClick={() => { navigate(`/@${userUsername}/workspace/${business.slug || business.id}`); setIsMobileMenuOpen(false); }}
                      className="w-full flex items-center gap-4 p-3 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/10">
                        {business.name.charAt(0)}
                      </div>
                      <span className="text-sm font-bold truncate">{business.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-white/5">
                <button 
                  onClick={() => { setActiveView('help'); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-4 p-3.5 rounded-2xl text-gray-500 hover:text-white transition-all"
                >
                  <HelpCircle className="w-5 h-5" />
                  <span className="text-sm uppercase tracking-widest">Support</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      )}

      {/* Sidebar (Desktop & Mobile) */}
      {!shouldHideNav && !isMobileSearchOpen && !isMobileMoreOpen && !isCreateOpen && !isProfileOpen && (
        <motion.aside
          initial={false}
          animate={{ 
            width: (isSidebarExpanded && !isMobile) ? 260 : 72,
          }}
          className={`flex sticky top-0 left-0 bg-[#0A0A0A] flex-col z-40 h-[100dvh] transition-all duration-300 ease-in-out ${hasSecondarySidebar ? '' : isMobile ? 'border-r border-white/[0.03]' : 'border-r border-white/5'}`}
          onMouseEnter={() => !isMobile && setIsSidebarExpanded(true)}
          onMouseLeave={() => !isMobile && setIsSidebarExpanded(false)}
        >
        <div className={`pt-1 flex flex-col h-full overflow-y-auto scrollbar-hide ${isMobile ? 'p-3 gap-6 items-center' : 'p-3'}`}>
          {/* Top Actions */}
          <div className={`space-y-1.5 ${isMobile ? 'mb-2' : 'mb-6'}`}>
            {isMobile && (
              <button 
                onClick={() => setIsProfileOpen(true)}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 flex items-center justify-center overflow-hidden active:scale-95 transition-all mb-4"
              >
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="w-5 h-5 text-gray-300" />
                )}
              </button>
            )}
            <button 
              onClick={() => {
                if (businessId) {
                  navigate(`/@${userUsername || 'user'}/workspace/overview`);
                } else {
                  setActiveView('home');
                }
              }}
              className={`w-full flex items-center gap-3 p-2.5 rounded-full transition-all ${
                activeView === 'home' && !businessId ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Home className="w-5 h-5 shrink-0" />
              <AnimatePresence mode="wait">
                {(isSidebarExpanded || isMobileMenuOpen) && !isMobile && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="font-semibold text-xs uppercase tracking-wider whitespace-nowrap"
                  >
                    Home
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {isMobile && joinedProducts.slice(0, 4).map((product) => (
              <button 
                key={`mobile-sidebar-product-${product.id}`}
                onClick={() => setActiveView(`access_${product.id}`)}
                className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border border-white/10 active:scale-95 transition-all ${
                  activeView === `access_${product.id}` ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-[#0A0A0A]' : ''
                }`}
              >
                {product.image_url || (product.images && product.images[0]) ? (
                  <img 
                    src={product.image_url || product.images[0]} 
                    alt={product.title} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-white/5 flex items-center justify-center">
                    <Package className="w-4 h-4 text-gray-500" />
                  </div>
                )}
              </button>
            ))}
            {!isMobile && (
              <button 
                onClick={() => setActiveView('chats')}
                className={`w-full flex items-center gap-3 p-2.5 rounded-full transition-all ${
                  activeView === 'chats' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <MessageCircle className="w-5 h-5 shrink-0" />
                <AnimatePresence mode="wait">
                  {(isSidebarExpanded || isMobileMenuOpen) && (
                    <motion.span 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="font-semibold text-xs uppercase tracking-wider whitespace-nowrap"
                    >
                      Chats
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            )}
            {!isMobile && (
              <button 
                onClick={() => setActiveView('joined-products')}
                className={`w-full flex items-center gap-3 p-2.5 rounded-full transition-all ${
                  activeView === 'joined-products' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <ShoppingBag className="w-5 h-5 shrink-0" />
                <AnimatePresence mode="wait">
                  {(isSidebarExpanded || isMobileMenuOpen) && (
                    <motion.span 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="font-semibold text-xs uppercase tracking-wider whitespace-nowrap"
                    >
                      My Purchases
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            )}
            {!isMobile && (
              <>
                <a 
                  href="https://discord.gg/GVCkJ4m8fK"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-3 p-2.5 rounded-full transition-all text-gray-400 hover:text-[#5865F2] hover:bg-[#5865F2]/10 group"
                >
                  <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 group-hover:scale-110 transition-transform">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 11.721 11.721 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.23 10.23 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                  </div>
                  <AnimatePresence mode="wait">
                    {(isSidebarExpanded || isMobileMenuOpen) && (
                      <motion.span 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="font-semibold text-xs uppercase tracking-wider whitespace-nowrap"
                      >
                        Discord
                      </motion.span>
                    )}
                  </AnimatePresence>
                </a>
                <div className="relative">
                  <button 
                    onClick={() => setIsMoreExpanded(!isMoreExpanded)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-full transition-all ${
                      isMoreExpanded ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <MoreHorizontal className="w-5 h-5 shrink-0" />
                    <AnimatePresence mode="wait">
                      {(isSidebarExpanded || isMobileMenuOpen) && (
                        <motion.span 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="font-semibold text-xs uppercase tracking-wider whitespace-nowrap flex-1 text-left"
                        >
                          More
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {(isSidebarExpanded || isMobileMenuOpen) && (
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isMoreExpanded ? 'rotate-180' : ''}`} />
                    )}
                  </button>
                  <AnimatePresence>
                    {isMoreExpanded && (isSidebarExpanded || isMobileMenuOpen) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden pl-3 space-y-1 mt-2"
                      >
                        <button 
                          onClick={() => setActiveView('management-products')}
                          className={`w-full flex items-center gap-3 p-2 rounded-full transition-colors ${
                            activeView.startsWith('management') ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <Briefcase className="w-4 h-4 shrink-0" />
                          <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">Management</span>
                        </button>
                        <button 
                          onClick={() => setActiveView('storage')}
                          className={`w-full flex items-center gap-3 p-2 rounded-full transition-colors ${
                            activeView === 'storage' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <HardDrive className="w-4 h-4 shrink-0" />
                          <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">Storage</span>
                        </button>
                        <button 
                          onClick={() => setActiveView('money-balance')}
                          className={`w-full flex items-center gap-3 p-2 rounded-full transition-colors ${
                            activeView.startsWith('money-') ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <Wallet className="w-4 h-4 shrink-0" />
                          <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">Finance</span>
                        </button>
                        <button 
                          onClick={() => setActiveView('plans')}
                          className={`w-full flex items-center gap-3 p-2 rounded-full transition-colors ${
                            activeView === 'plans' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <CreditCard className="w-4 h-4 shrink-0" />
                          <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">Plans</span>
                        </button>
                        <button 
                          onClick={() => setActiveView('safety-support')}
                          className={`w-full flex items-center gap-3 p-2 rounded-full transition-colors ${
                            activeView === 'safety-support' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <Shield className="w-4 h-4 shrink-0" />
                          <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">Safety</span>
                        </button>
                        <button 
                          onClick={() => setActiveView('management-legal')}
                          className={`w-full flex items-center gap-3 p-2 rounded-full transition-colors ${
                            activeView === 'management-legal' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <Scale className="w-4 h-4 shrink-0" />
                          <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">Legal</span>
                        </button>
                        {isPlatformEmailAdmin && (
                          <button
                            onClick={() => setActiveView('email-operations')}
                            className={`w-full flex items-center gap-3 p-2 rounded-full transition-colors ${
                              activeView === 'email-operations' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <Mail className="w-4 h-4 shrink-0" />
                            <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">Email Ops</span>
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}

            {!isMobile && (
              <>
                <div className="relative">
                  <button 
                    onClick={() => setIsEduExpanded(!isEduExpanded)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-full transition-all ${
                      isEduExpanded ? 'bg-indigo-500/10 text-indigo-400' : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <GraduationCap className="w-5 h-5 shrink-0" />
                    <AnimatePresence mode="wait">
                      {(isSidebarExpanded || isMobileMenuOpen) && (
                        <motion.span 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="font-semibold text-xs uppercase tracking-wider whitespace-nowrap flex-1 text-left"
                        >
                          Education
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {(isSidebarExpanded || isMobileMenuOpen) && (
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isEduExpanded ? 'rotate-180' : ''}`} />
                    )}
                  </button>
                  <AnimatePresence>
                    {isEduExpanded && (isSidebarExpanded || isMobileMenuOpen) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden pl-3 space-y-1 mt-2"
                      >
                        <button 
                          onClick={() => setActiveView('edu-student')}
                          className={`w-full flex items-center gap-3 p-2 rounded-full transition-colors ${
                            activeView === 'edu-student' ? 'bg-indigo-500/10 text-indigo-400' : 'text-gray-500 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <GraduationCap className="w-4 h-4 shrink-0" />
                          <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">Student Discount</span>
                        </button>
                        <button 
                          onClick={() => setActiveView('edu-campus')}
                          className={`w-full flex items-center gap-3 p-2 rounded-full transition-colors ${
                            activeView === 'edu-campus' ? 'bg-indigo-500/10 text-indigo-400' : 'text-gray-500 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <School className="w-4 h-4 shrink-0" />
                          <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">Campus Program</span>
                        </button>
                        <button 
                          onClick={() => setActiveView('edu-paths')}
                          className={`w-full flex items-center gap-3 p-2 rounded-full transition-colors ${
                            activeView === 'edu-paths' ? 'bg-indigo-500/10 text-indigo-400' : 'text-gray-500 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <Compass className="w-4 h-4 shrink-0" />
                          <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">Learning Paths</span>
                        </button>
                        <button 
                          onClick={() => setActiveView('edu-resources')}
                          className={`w-full flex items-center gap-3 p-2 rounded-full transition-colors ${
                            activeView === 'edu-resources' ? 'bg-indigo-500/10 text-indigo-400' : 'text-gray-500 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <BookOpen className="w-4 h-4 shrink-0" />
                          <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">Resources</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button 
                  onClick={() => { setIsCreateOpen(true); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white text-black hover:bg-gray-100 transition-all shadow-lg shadow-white/5 group active:scale-95"
                >
                  <div className="w-6 h-6 rounded-lg bg-black/5 flex items-center justify-center group-hover:rotate-90 transition-transform">
                    <Plus className="w-4 h-4" />
                  </div>
                  <AnimatePresence mode="wait">
                    {(isSidebarExpanded || isMobileMenuOpen) && (
                      <motion.span 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="font-black italic uppercase tracking-widest text-[10px]"
                      >
                        Create
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </>
            )}
          </div>

          {!isMobile && <div className="h-px bg-white/5 my-4 shrink-0 mx-2" />}

          {/* Businesses */}
          <div className={`${isMobile ? 'mb-2' : 'mb-6'}`}>
            <AnimatePresence>
              {(isSidebarExpanded || isMobileMenuOpen) && !isMobile && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-3 mb-3 text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em]"
                >
                  Businesses
                </motion.div>
              )}
            </AnimatePresence>
            <div className="space-y-1.5">
              {loading ? (
                <div className="animate-pulse flex gap-3 p-2">
                  <div className="w-9 h-9 bg-white/5 rounded-full"></div>
                  {(isSidebarExpanded || isMobileMenuOpen) && !isMobile && <div className="h-3 bg-white/5 rounded w-20 mt-3"></div>}
                </div>
              ) : businesses.length > 0 ? (
                businesses.slice(0, isMobile ? 6 : 4).map((business) => (
                  <button 
                    key={`sidebar-business-${business.id}`} 
                    onClick={() => {
                      if (!business.setup_completed) {
                        setOnboardingBusiness(business);
                      } else {
                        navigate(`/@${userUsername || 'user'}/workspace/${business.slug || business.id}`);
                      }
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-full hover:bg-white/5 transition-all group"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border border-white/5 flex items-center justify-center text-indigo-400 font-bold shrink-0 group-hover:scale-105 transition-transform">
                      {business.name.charAt(0)}
                    </div>
                    <AnimatePresence mode="wait">
                      {(isSidebarExpanded || isMobileMenuOpen) && !isMobile && (
                        <motion.span 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="font-semibold text-xs uppercase tracking-wider text-gray-400 group-hover:text-white whitespace-nowrap truncate text-left"
                        >
                          {business.name}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                ))
              ) : !isMobile && (
                <button 
                  onClick={() => { setActiveView('create-business'); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 p-2 rounded-full hover:bg-white/5 transition-all text-gray-500 hover:text-gray-300"
                >
                  <div className="w-9 h-9 rounded-full border border-dashed border-white/10 flex items-center justify-center shrink-0">
                    <Plus className="w-4 h-4" />
                  </div>
                  <AnimatePresence mode="wait">
                    {(isSidebarExpanded || isMobileMenuOpen) && (
                      <motion.span 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="font-semibold text-xs uppercase tracking-wider whitespace-nowrap"
                      >
                        New Business
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              )}
            </div>
          </div>

          {!isMobile && (
            <>
              <div className="h-px bg-white/5 my-4 shrink-0 mx-2" />

              {/* Joined Products */}
              <SidebarSection 
                title="Joined" 
                items={joinedProducts} 
                type="product" 
                isSidebarExpanded={isSidebarExpanded || isMobileMenuOpen}
                activeView={activeView}
                setActiveView={setActiveView}
                loading={loading}
              />

              <div className="h-px bg-white/5 my-4 shrink-0 mx-2" />

              {/* Communities */}
              <SidebarSection 
                title="Communities" 
                items={communities} 
                type="community" 
                isSidebarExpanded={isSidebarExpanded || isMobileMenuOpen}
                activeView={activeView}
                setActiveView={setActiveView}
                loading={loading}
              />
            </>
          )}

          <div className="h-px bg-white/5 my-4 shrink-0 mx-2" />

          {/* Bottom Actions */}
          {!isMobile && (
            <div className="mt-auto space-y-1.5">
            <button 
              onClick={() => { setActiveView('leads'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 p-2.5 rounded-full hover:bg-white/5 transition-all ${activeView === 'leads' ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-500 hover:text-white'}`}
            >
              <Search className="w-5 h-5 shrink-0" />
              <AnimatePresence>
                {(isSidebarExpanded || isMobileMenuOpen) && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="font-medium whitespace-nowrap"
                  >
                    Lead Scraper
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <button 
              onClick={() => { setActiveView('investments'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 p-2.5 rounded-full hover:bg-white/5 transition-all ${activeView === 'investments' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
            >
              <TrendingUp className="w-5 h-5 shrink-0" />
              <AnimatePresence mode="wait">
                {(isSidebarExpanded || isMobileMenuOpen) && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="font-semibold text-xs uppercase tracking-wider whitespace-nowrap"
                  >
                    Investments
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            <button 
              onClick={() => { setActiveView('portfolio'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 p-2.5 rounded-full hover:bg-white/5 transition-all ${activeView === 'portfolio' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
            >
              <Briefcase className="w-5 h-5 shrink-0" />
              <AnimatePresence mode="wait">
                {(isSidebarExpanded || isMobileMenuOpen) && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="font-semibold text-xs uppercase tracking-wider whitespace-nowrap"
                  >
                    Portfolio
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            <a 
              href="/"
              onClick={handleExit}
              className="w-full flex items-center gap-3 p-2.5 rounded-full hover:bg-white/5 transition-all text-gray-500 hover:text-white"
            >
              <ShoppingBag className="w-5 h-5 shrink-0" />
              <AnimatePresence mode="wait">
                {(isSidebarExpanded || isMobileMenuOpen) && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="font-semibold text-xs uppercase tracking-wider whitespace-nowrap"
                  >
                    Store
                  </motion.span>
                )}
              </AnimatePresence>
            </a>
            <button 
              onClick={() => { setActiveView('help'); setIsMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 p-2.5 rounded-full hover:bg-white/5 transition-all text-gray-500 hover:text-white"
            >
              <HelpCircle className="w-5 h-5 shrink-0" />
              <AnimatePresence mode="wait">
                {(isSidebarExpanded || isMobileMenuOpen) && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="font-semibold text-xs uppercase tracking-wider whitespace-nowrap"
                  >
                    Support
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
          )}
        </div>
      </motion.aside>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col h-full overflow-hidden relative transition-all duration-300 ease-in-out ${!isManagementOrMoney ? 'rounded-tl-[2rem] md:rounded-bl-none rounded-bl-[2rem] border-t border-l border-b md:border-b-0 border-white/5 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] mb-16 md:mb-0' : ''}`}>
        {/* Topbar */}
        {!isBuilderActive && (
          <header className="h-16 md:h-20 border-b border-white/5 flex items-center justify-between px-3 md:px-8 bg-[#0A0A0A]/80 backdrop-blur-2xl z-[100] shrink-0 gap-2 md:gap-4 sticky top-0 flex-nowrap">
            {/* Subtle top glow for header */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            
            <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
              {/* Logo & Menu Toggle (Desktop) */}
              <div className="hidden md:flex items-center gap-1.5 md:gap-2 shrink-0">
                {isManagementOrMoney && (
                  <button 
                    onClick={() => {
                      hapticFeedback('light');
                      setActiveView('home');
                    }}
                    className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-xl border border-white/5 active:scale-90 transition-all mr-2"
                  >
                    <ChevronRight className="w-5 h-5 rotate-180" />
                  </button>
                )}
                <button 
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="lg:hidden p-2 text-gray-400 hover:text-white bg-white/5 rounded-xl border border-white/5 active:scale-90 transition-all"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-1.5 md:gap-2">
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-white text-black rounded-lg flex items-center justify-center font-black text-base md:text-lg shadow-lg shrink-0">W</div>
                  <span className="font-black text-xs md:text-sm tracking-tighter leading-none bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent uppercase hidden lg:inline">Wersee</span>
                </div>
              </div>

              {/* Context Switcher (Desktop) */}
              <div className="hidden xl:flex items-center gap-1.5 shrink-0">
                <div className="flex items-center bg-white/5 p-1 rounded-full border border-white/5 shrink-0">
                  <button 
                    onClick={() => onNavigate('overview')}
                    className={`px-3 md:px-5 py-1.5 md:py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${
                      activeView === 'home' || activeView === 'overview' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'
                    }`}
                  >
                    Workspace
                  </button>
                  <a 
                    href="/"
                    onClick={handleExit}
                    className="px-3 md:px-5 py-1.5 md:py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all text-gray-500 hover:text-white"
                  >
                    Store
                  </a>
                </div>
                <button 
                  onClick={() => setActiveView('release')}
                  className="hidden xl:block px-3 py-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] hover:bg-indigo-500/20 transition-all"
                >
                  Release
                </button>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-1.5 md:gap-3 shrink-0">
              <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                <div className="hidden sm:block">
                  <WorkspaceNotifications user={user} />
                </div>
                
                {/* Wersee Points Badge */}
                <button 
                  onClick={() => setActiveView('money-points')}
                  className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3.5 py-1.5 md:py-2 bg-white/5 border border-white/5 rounded-full hover:bg-white/10 transition-all group"
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-500 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] md:text-[11px] font-black text-white tracking-tight hidden xs:inline">{profile?.wersee_points?.toLocaleString() || 0}</span>
                </button>
              </div>

              {/* AI Assistant Button */}
              <button 
                onClick={() => setIsAiSidebarOpen(true)}
                className="flex items-center justify-center w-10 h-10 xl:w-auto xl:px-4 xl:py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500/20 transition-all shrink-0"
                title="AI Assistant"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden xl:inline ml-2">Assistant</span>
              </button>

              {/* Create Button */}
              <div className="relative shrink-0">
                <button 
                  onClick={() => setIsCreateOpen(!isCreateOpen)}
                  className="flex items-center justify-center w-10 h-10 lg:w-auto lg:px-5 lg:py-2.5 bg-white text-black rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black hover:bg-gray-200 transition-all shadow-xl shadow-white/10 active:scale-95 group"
                >
                  <Plus className="w-5 h-5" />
                  <span className="tracking-tight uppercase hidden lg:inline ml-2">Create</span>
                </button>
              </div>
              
              <div className="w-px h-6 bg-white/10 mx-1 hidden md:block" />

              {/* Profile */}
              <div className="relative">
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="w-10 h-10 md:w-11 md:h-11 rounded-xl md:rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-white/20 transition-all shadow-lg"
                >
                  {user?.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User className="w-5 h-5 md:w-6 md:h-6 text-gray-300" />
                  )}
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-56 bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[200]"
                    >
                      <div className="p-3 space-y-1">
                        <div className="px-3 py-2 mb-2">
                          <div className="text-sm font-bold text-white truncate">{user?.email}</div>
                          <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">Free Account</div>
                        </div>
                        <div className="h-px bg-white/5 mb-2" />
                        {isGuardian && (
                          <button 
                            onClick={() => { setIsProfileOpen(false); navigate('/guardian-portal'); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-xl transition-colors font-bold"
                          >
                            <Shield className="w-4 h-4" />
                            Guardian Controls
                          </button>
                        )}
                        <button 
                          onClick={() => { setIsProfileOpen(false); onNavigate('profile'); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                        >
                          <User className="w-4 h-4" />
                          Profile
                        </button>
                        <button 
                          onClick={() => { setIsProfileOpen(false); onNavigate('profile'); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          Account Settings
                        </button>
                        <button 
                          onClick={() => { 
                            setIsProfileOpen(false); 
                            localStorage.removeItem('wersee_tutorial_seen');
                            window.dispatchEvent(new CustomEvent('restart-tutorial'));
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-xl transition-colors"
                        >
                          <Sparkles className="w-4 h-4" />
                          Restart Tutorial
                        </button>
                        <button 
                          onClick={() => { 
                            setIsProfileOpen(false); 
                            // Dispatch custom event to show PWA modal
                            window.dispatchEvent(new CustomEvent('show-pwa-modal'));
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-xl transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Install App
                        </button>
                        <div className="h-px bg-white/5 my-1" />
                        <button 
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Log Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Mobile Streamlined Header */}
            <div className="flex md:hidden items-center justify-between w-full gap-3">
              {isManagementOrMoney && (
                <button 
                  onClick={() => {
                    hapticFeedback('light');
                    setActiveView('home');
                  }}
                  className="p-2.5 text-gray-400 hover:text-white bg-white/5 rounded-xl border border-white/5 active:scale-90 transition-all shrink-0 shadow-lg"
                >
                  <ChevronRight className="w-6 h-6 rotate-180" />
                </button>
              )}
              
              {!isMobileSearchOpen ? (
                <>
                  {/* Mobile Search Trigger - Full Width Focused */}
                  <button 
                    onClick={() => {
                      hapticFeedback('light');
                      setIsMobileSearchOpen(true);
                    }}
                    className="flex-1 flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-gray-400 active:scale-95 transition-all group shadow-inner"
                  >
                    <Search className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold uppercase tracking-widest opacity-60">Search Wersee...</span>
                  </button>

                  {/* Notification Bell */}
                  <button 
                    onClick={() => {
                      hapticFeedback('light');
                      // Open notifications or similar
                    }}
                    className="p-2.5 text-gray-400 hover:text-white bg-white/5 rounded-xl border border-white/5 active:scale-90 transition-all shrink-0 shadow-lg"
                  >
                    <Bell className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <div className="w-full relative">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="flex items-center w-full gap-2"
                  >
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                      <input 
                        autoFocus
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearch}
                        placeholder="Search workspace..."
                        className="w-full bg-white/10 border border-white/20 rounded-2xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-2xl"
                      />
                    </div>
                    <button 
                      onClick={() => {
                        hapticFeedback('light');
                        setIsMobileSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="p-3 text-gray-400 hover:text-white bg-white/5 rounded-2xl border border-white/5 active:scale-90 transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </motion.div>
                </div>
              )}
            </div>

            {/* Mobile Top Dropdown Menu */}
            <AnimatePresence>
              {isTopMenuOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsTopMenuOpen(false)}
                    className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm md:hidden"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: '-100%' }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: '-100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="fixed inset-0 z-[200] bg-[#0A0A0A]/95 backdrop-blur-xl p-6 md:hidden flex flex-col shadow-2xl overflow-y-auto"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <span className="font-black text-xl tracking-tighter uppercase">Menu</span>
                      <button 
                        onClick={() => setIsTopMenuOpen(false)}
                        className="p-2 rounded-full bg-white/5 text-white"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <button 
                        onClick={() => { setIsTopMenuOpen(false); setIsMobileMenuOpen(true); }}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all"
                      >
                        <Menu className="w-6 h-6 text-indigo-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Navigation</span>
                      </button>
                      <button 
                        onClick={() => { setIsTopMenuOpen(false); setIsCreateOpen(true); }}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all"
                      >
                        <Plus className="w-6 h-6 text-emerald-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Create</span>
                      </button>
                      <button 
                        onClick={() => { setIsTopMenuOpen(false); setIsAiSidebarOpen(true); }}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all"
                      >
                        <Sparkles className="w-6 h-6 text-purple-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Assistant</span>
                      </button>
                      <button 
                        onClick={() => { setIsTopMenuOpen(false); navigate('/search'); }}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all"
                      >
                        <Search className="w-6 h-6 text-blue-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Search</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      <button 
                        onClick={() => { setIsTopMenuOpen(false); setActiveView('money-points'); }}
                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <Sparkles className="w-5 h-5 text-yellow-500" />
                          <span className="text-sm font-bold uppercase tracking-widest">Wersee Points</span>
                        </div>
                        <span className="text-sm font-black text-white">{profile?.wersee_points?.toLocaleString() || 0}</span>
                      </button>

                      <a 
                        href="/"
                        onClick={handleExit}
                        className="w-full flex items-center gap-3 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400"
                      >
                        <Store className="w-5 h-5" />
                        <span className="text-sm font-black uppercase tracking-widest">Back to Store</span>
                      </a>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </header>
        )}

        {/* Content Area */}
        <div className={`flex-1 min-h-0 h-full flex flex-col overflow-x-hidden scrollbar-hide ${
          activeView.startsWith('community_') || 
          activeView === 'chats' || 
          activeView.startsWith('access_') ||
          activeView.startsWith('edit-') ||
          activeView.startsWith('course-player_') ||
          activeView.startsWith('create-') ||
          activeView.startsWith('management-') ||
          activeView.startsWith('money-') ||
          activeView === 'email-operations'
            ? 'overflow-hidden' 
            : 'overflow-y-auto p-4 md:p-8'
        }`}>
          {onboardingBusiness ? (
            <BusinessOnboardingWizard
              business={onboardingBusiness}
              onClose={() => setOnboardingBusiness(null)}
              onComplete={(updatedBusiness) => {
                setOnboardingBusiness(null);
                setBusinesses(businesses.map(b => b.id === updatedBusiness.id ? updatedBusiness : b));
                navigate(`/@${userUsername || 'user'}/workspace/${updatedBusiness.slug || updatedBusiness.id}`);
              }}
            />
          ) : activeView === 'search-results' ? (
            <WorkspaceSearchResults 
              query={searchQuery} 
              onNavigate={(view) => {
                setActiveView(view);
                setIsSearching(false);
              }} 
            />
          ) : activeView === 'edu-student' ? (
            <StudentDiscount />
          ) : activeView === 'edu-campus' ? (
            <CampusProgram />
          ) : activeView === 'edu-paths' ? (
            <LearningPaths />
          ) : activeView === 'edu-resources' ? (
            <EduResources />
          ) : activeView === 'email-operations' && isPlatformEmailAdmin ? (
            <EmailOperationsView />
          ) : (
            children
          )}
        </div>
      </main>

      <WorkspaceAiSidebar 
        isOpen={isAiSidebarOpen} 
        onClose={() => setIsAiSidebarOpen(false)} 
        context={{ activeView, user, ...aiContext }} 
        isAgentMode={isAgentMode}
        setIsAgentMode={setIsAgentMode}
      />
      <PwaOnboardingModal />

      {/* Mobile Bottom Bar - Floating Dock Style */}
      {!shouldHideNav && !isMobileSearchOpen && !isMobileMoreOpen && !isCreateOpen && !isProfileOpen && (
        <div className="md:hidden fixed bottom-6 left-[88px] right-6 h-14 z-50 bg-[#0A0A0A]/70 backdrop-blur-3xl flex items-center justify-around px-2 rounded-2xl border border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] overflow-hidden">
          {/* Subtle inner glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
          
          <button 
            onClick={() => {
              if (activeView !== 'home') hapticFeedback('light');
              setActiveView('home');
            }}
            className={`relative z-10 flex-1 flex flex-col items-center justify-center h-full transition-all active:scale-75 ${activeView === 'home' ? 'text-white' : 'text-gray-500'}`}
          >
            <Home className={`w-5 h-5 transition-all ${activeView === 'home' ? 'scale-110 -translate-y-0.5' : ''}`} />
            {activeView === 'home' && (
              <motion.div 
                layoutId="activeTabIndicator"
                className="absolute bottom-1 w-1 h-1 bg-white rounded-full shadow-[0_0_8px_white]"
              />
            )}
          </button>

          <button 
            onClick={() => {
              if (activeView !== 'chats') hapticFeedback('light');
              setActiveView('chats');
            }}
            className={`relative z-10 flex-1 flex flex-col items-center justify-center h-full transition-all active:scale-75 ${activeView === 'chats' ? 'text-white' : 'text-gray-500'}`}
          >
            <MessageCircle className={`w-5 h-5 transition-all ${activeView === 'chats' ? 'scale-110 -translate-y-0.5' : ''}`} />
            {activeView === 'chats' && (
              <motion.div 
                layoutId="activeTabIndicator"
                className="absolute bottom-1 w-1 h-1 bg-white rounded-full shadow-[0_0_8px_white]"
              />
            )}
          </button>

          {/* Central Plus Button */}
          <div className="relative z-10 flex-1 flex justify-center items-center h-full">
            <button 
              onClick={() => {
                hapticFeedback('medium');
                setIsCreateOpen(true);
              }}
              className="relative group flex items-center justify-center h-10 w-10 rounded-xl bg-white text-black shadow-lg active:scale-90 transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Plus className="w-5 h-5 relative z-10" />
            </button>
          </div>

          <button 
            onClick={() => {
              if (activeView !== 'communities') hapticFeedback('light');
              setActiveView('communities');
            }}
            className={`relative z-10 flex-1 flex flex-col items-center justify-center h-full transition-all active:scale-75 ${activeView === 'communities' ? 'text-white' : 'text-gray-500'}`}
          >
            <Users className={`w-5 h-5 transition-all ${activeView === 'communities' ? 'scale-110 -translate-y-0.5' : ''}`} />
            {activeView === 'communities' && (
              <motion.div 
                layoutId="activeTabIndicator"
                className="absolute bottom-1 w-1 h-1 bg-white rounded-full shadow-[0_0_8px_white]"
              />
            )}
          </button>

          <button 
            onClick={() => {
              hapticFeedback('light');
              setIsMobileMoreOpen(true);
            }}
            className="relative z-10 flex-1 flex items-center justify-center h-full transition-all active:scale-75 text-gray-500 hover:text-white"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Mobile Search Dropdown Component */}
      <MobileSearchDropdown 
        isOpen={isMobileSearchOpen}
        searchQuery={searchQuery}
        results={(() => {
          const combined = [...businesses, ...joinedProducts, ...communities];
          const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
          return unique.filter(item => (item.name || item.title)?.toLowerCase().includes(searchQuery.toLowerCase()))
            .slice(0, 10);
        })()}
        onClose={() => {
          setIsMobileSearchOpen(false);
          setSearchQuery('');
        }}
        onSelect={(item) => {
          const type = item.name ? (businesses.includes(item) ? 'Business' : 'Community') : 'Product';
          if (type === 'Business') {
            navigate(`/@${userUsername}/workspace/${item.slug || item.id}`);
          } else if (type === 'Community') {
            setActiveView('communities');
          } else {
            setActiveView('joined-products');
          }
          setIsMobileSearchOpen(false);
          setSearchQuery('');
        }}
      />

      {/* Mobile More Options Component */}
      <MobileMoreOptions 
        isOpen={isMobileMoreOpen}
        onClose={() => setIsMobileMoreOpen(false)}
        onNavigate={(view) => setActiveView(view as any)}
        onLogout={handleLogout}
      />

      <WorkspaceCreateDropdown 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        setActiveView={setActiveView} 
        isAgentMode={isAgentMode}
        setIsAgentMode={setIsAgentMode}
        onOpenAi={() => setIsAiSidebarOpen(true)}
      />

    </motion.div>
  );
};
