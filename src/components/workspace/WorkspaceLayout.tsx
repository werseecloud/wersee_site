import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MobileMoreOptions } from './MobileMoreOptions';
import { MobileSearchDropdown } from './MobileSearchDropdown';
import { 
  Plus, Search, Settings, HelpCircle, MessageCircle, 
  ChevronDown, ChevronRight, Store, ShoppingBag, Users, LogOut, User, Home, Package,
  MoreHorizontal, TrendingUp, CreditCard, Shield, Wallet, Menu, X, Sparkles, Megaphone, HardDrive, Briefcase, Download, Bell, Scale, ArrowRight, ArrowLeft, GraduationCap, School, Compass, BookOpen, Mail
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
import { useTheme } from '../../context/ThemeContext';
import { safeLocalStorage } from '../../lib/browserStorage';
import { useAuth } from '../../context/AuthContext';
import { parseUsername, routes } from '../../routing/routes';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  onNavigate: (tab: string) => void;
  activeView: string;
  setActiveView: (view: string) => void;
}

const WORKSPACE_VIEW_LABELS: Record<string, string> = {
  home: 'Overview',
  overview: 'Overview',
  chats: 'Chats',
  'joined-products': 'My products',
  'management-products': 'Products',
  'money-balance': 'Balance',
  'money-investments': 'Investments',
  notifications: 'Notifications',
  profile: 'Profile',
  'search-results': 'Search',
};

const getWorkspaceViewLabel = (view: string) =>
  WORKSPACE_VIEW_LABELS[view] || view.replace(/^(management|money)-/, '').replace(/-/g, ' ').replace(/^./, (letter) => letter.toUpperCase());

type ThemePreference = 'light' | 'dark' | 'system';

const getLocalThemePreference = (): ThemePreference | null => {
  const saved = safeLocalStorage.getItem('theme_preference');
  if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;

  const legacySaved = safeLocalStorage.getItem('theme');
  return legacySaved === 'light' || legacySaved === 'dark' ? legacySaved : null;
};

const resolveThemePreference = (preference: ThemePreference): 'light' | 'dark' => {
  return preference === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : preference;
};

import { WorkspaceNotifications } from './WorkspaceNotifications';
import { WorkspaceSearchResults } from './WorkspaceSearchResults';
import { StudentDiscount } from '../education/StudentDiscount';
import { CampusProgram } from '../education/CampusProgram';
import { LearningPaths } from '../education/LearningPaths';
import { EduResources } from '../education/EduResources';
import { EmailOperationsView } from './EmailOperationsView';

export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({ children, onNavigate, activeView, setActiveView }) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { isDark, setTheme } = useTheme();
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
  const activeViewTitle = getWorkspaceViewLabel(activeView);
  const [isContentScrolled, setIsContentScrolled] = useState(false);

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
    const handleOpenCreate = () => setIsCreateOpen(true);
    window.addEventListener('open-workspace-create', handleOpenCreate);

    const handleTriggerSearch = (e: any) => {
      if (e.detail?.query !== undefined) {
        setSearchQuery(e.detail.query);
        setActiveView('search-results');
      }
    };
    window.addEventListener('trigger-workspace-search', handleTriggerSearch as EventListener);

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setIsAiSidebarOpen(true);
        return;
      }
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
      window.removeEventListener('open-workspace-create', handleOpenCreate);
      window.removeEventListener('trigger-workspace-search', handleTriggerSearch as EventListener);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const [isTopMenuOpen, setIsTopMenuOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [mobileChatSection, setMobileChatSection] = useState<'chats' | 'groups'>('chats');

  useEffect(() => {
    if (activeView !== 'chats') setMobileChatSection('chats');
  }, [activeView]);

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

  useEffect(() => {
    const handleBusinessCreated = (event: Event) => {
      const created = (event as CustomEvent<any>).detail;
      if (!created?.id) return;
      setBusinesses((current) => [created, ...current.filter((business) => business.id !== created.id)]);
    };

    window.addEventListener('workspace:business-created', handleBusinessCreated);
    return () => window.removeEventListener('workspace:business-created', handleBusinessCreated);
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
      const { data: pProfileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error loading profile theme preference:', profileError);
      }
      
      if (pProfileData) {
        setProfile(pProfileData);
      }

      const { data: preferenceData, error: preferenceError } = await supabase
        .from('user_preferences')
        .select('workspace_theme_preference')
        .eq('user_id', user.id)
        .maybeSingle();

      if (preferenceError) {
        console.error('Error loading workspace theme preference:', preferenceError);
      }

      const localTheme = getLocalThemePreference();
      const remoteThemePreference =
        preferenceData?.workspace_theme_preference === 'light'
          || preferenceData?.workspace_theme_preference === 'dark'
          || preferenceData?.workspace_theme_preference === 'system'
          ? preferenceData.workspace_theme_preference
          : null;
      const legacyProfileTheme =
        pProfileData?.theme === 'light' || pProfileData?.theme === 'dark' || pProfileData?.theme === 'system'
          ? pProfileData.theme
          : null;
      const resolvedTheme = resolveThemePreference(remoteThemePreference || localTheme || legacyProfileTheme || 'system');
      setTheme(resolvedTheme);

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

  const userUsername = parseUsername(profile?.username || user?.email?.split('@')[0]);
  const userWorkspacePath = (pageName: string) =>
    userUsername
      ? routes.userWorkspacePage({ username: userUsername, pageName })
      : '/workspace';
  const currentBusiness = businesses.find((business) => business.id === businessId || business.slug === businessId);
  const currentWorkspaceName =
    currentBusiness?.name ||
    profile?.full_name ||
    (userUsername ? `${userUsername}'s Workspace` : 'Personal Workspace');

  const handleLogout = async () => {
    if (user?.user_metadata?.is_next_gen || (user?.user_metadata?.age !== undefined && user.user_metadata.age < 18)) {
      // Check for approved logout request
      const response = await invokeApiRunner('next-gen/check-logout-approved', {
        kid_id: user.id
      });

      if (response.success && response.approvedRequest) {
        // Delete the request and log out
        await invokeApiRunner('next-gen/delete-logout-request', { id: response.approvedRequest.id });
        await signOut();
        navigate('/auth', { replace: true });
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
    
    await signOut();
    navigate('/auth', { replace: true });
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
      data-workspace-theme={isDark ? 'dark' : 'light'}
      className={`workspace-shell h-[100dvh] overflow-hidden bg-[#0A0A0A] text-white flex font-sans relative transition-all duration-500 ${isAgentMode ? 'ring-[8px] ring-blue-500/30 ring-inset' : ''}`}
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

      <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 z-[140] bg-black/80 backdrop-blur-md lg:hidden"
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 z-[150] flex w-[min(86vw,320px)] flex-col border-r border-white/5 bg-[#0A0A0A] shadow-2xl lg:hidden"
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
                  aria-label="Close workspace navigation"
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
                      onClick={() => { navigate(userWorkspacePath(business.slug || business.id)); setIsMobileMenuOpen(false); }}
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

      {/* Sidebar (Desktop & Mobile) */}
      {!shouldHideNav && !isMobileSearchOpen && !isMobileMoreOpen && !isCreateOpen && !isProfileOpen && (
        <motion.aside
          initial={false}
          animate={{ 
            width: (isSidebarExpanded && !isMobile) ? 260 : 72,
          }}
          className={`sticky left-0 top-0 z-40 hidden h-[100dvh] flex-col bg-[#0A0A0A] transition-all duration-300 ease-in-out lg:flex ${hasSecondarySidebar ? '' : 'border-r border-white/5'}`}
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
                  navigate(userWorkspacePath('overview'));
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
                        navigate(userWorkspacePath(business.slug || business.id));
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
      <main className={`relative flex h-full min-w-0 flex-1 flex-col overflow-hidden transition-all duration-300 ease-in-out ${!isManagementOrMoney ? 'lg:rounded-tl-[2rem] lg:border-l lg:border-t lg:border-white/5 lg:shadow-[-10px_0_30px_rgba(0,0,0,0.5)]' : ''}`}>
        {/* Topbar */}
        {!isBuilderActive && (
          <header className={`sticky top-0 z-[100] min-h-[calc(60px+env(safe-area-inset-top))] shrink-0 flex-nowrap items-center justify-between gap-2 border-b bg-[#0A0A0A]/92 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-2xl transition-colors duration-200 lg:flex lg:h-20 lg:min-h-20 lg:gap-4 lg:px-8 lg:pt-0 ${
            activeView === 'chats' ? 'hidden' : 'flex'
          } ${
            isContentScrolled ? 'border-white/10 lg:border-white/5' : 'border-transparent lg:border-white/5'
          }`}>
            {/* Subtle top glow for header */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            
            <div className="hidden min-w-0 flex-1 items-center gap-3 lg:flex">
              {isManagementOrMoney && (
                <button
                  onClick={() => {
                    hapticFeedback('light');
                    setActiveView('home');
                  }}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.055] text-gray-400 transition-all hover:bg-white/10 hover:text-white active:scale-90"
                  aria-label="Back to workspace overview"
                >
                  <ChevronRight className="h-5 w-5 rotate-180" />
                </button>
              )}

              {/* Workspace identity and current context */}
              <div className="flex h-12 min-w-0 shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] p-1.5 pr-4 shadow-lg backdrop-blur-xl">
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black transition-transform active:scale-90 lg:hidden"
                  aria-label="Open workspace navigation"
                >
                  <Menu className="h-4 w-4" />
                </button>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-base font-black text-black shadow-lg">W</div>
                <div className="min-w-0 leading-none">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/35">Workspace</p>
                  <p className="mt-1 max-w-32 truncate text-sm font-bold text-white">{activeViewTitle}</p>
                </div>
              </div>

              {/* Frequently used workspace destinations */}
              <nav className="hidden h-12 items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1 lg:flex" aria-label="Workspace shortcuts">
                <button onClick={() => setActiveView('home')} className={`flex h-10 items-center gap-2 rounded-full px-3 text-xs font-bold transition-all ${activeView === 'home' || activeView === 'overview' ? 'bg-white text-black' : 'text-white/45 hover:bg-white/[0.07] hover:text-white'}`}>
                  <Home className="h-3.5 w-3.5" /> Overview
                </button>
                <button onClick={() => setActiveView('chats')} className={`flex h-10 items-center gap-2 rounded-full px-3 text-xs font-bold transition-all ${activeView === 'chats' ? 'bg-white text-black' : 'text-white/45 hover:bg-white/[0.07] hover:text-white'}`}>
                  <MessageCircle className="h-3.5 w-3.5" /> Chats
                </button>
                <button onClick={() => setActiveView('joined-products')} className={`hidden h-10 items-center gap-2 rounded-full px-3 text-xs font-bold transition-all xl:flex ${activeView === 'joined-products' ? 'bg-white text-black' : 'text-white/45 hover:bg-white/[0.07] hover:text-white'}`}>
                  <Package className="h-3.5 w-3.5" /> Products
                </button>
              </nav>

              <a href="/" onClick={handleExit} className="hidden h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 text-xs font-bold text-white/45 transition-all hover:bg-white/[0.07] hover:text-white xl:flex">
                <Store className="h-3.5 w-3.5" /> Store
              </a>
            </div>
            <div className="hidden shrink-0 items-center gap-3 lg:flex">
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

            {/* Mobile workspace command bar */}
            <div className="flex w-full items-center gap-2 lg:hidden">
              <button
                type="button"
                onClick={() => {
                  hapticFeedback('light');
                  setIsMobileMenuOpen(true);
                }}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.055] text-white transition-transform active:scale-90"
                aria-label="Open workspace navigation"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => {
                  hapticFeedback('light');
                  setIsTopMenuOpen(true);
                }}
                className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl px-1 text-left transition-colors hover:bg-white/[0.04] active:scale-[0.99]"
                aria-label={`Switch workspace. Current workspace: ${currentWorkspaceName}`}
                aria-haspopup="dialog"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white text-xs font-black text-black">
                  {currentWorkspaceName.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">Workspace</span>
                  <span className="mt-0.5 block truncate text-sm font-semibold text-white">{currentWorkspaceName}</span>
                </span>
                <ChevronDown className="mr-1 h-4 w-4 shrink-0 text-white/40" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => {
                  hapticFeedback('light');
                  setIsMobileSearchOpen(true);
                }}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white/70 transition-colors hover:bg-white/[0.055] hover:text-white active:scale-90"
                aria-label="Search workspace"
              >
                <Search className="h-5 w-5" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => {
                  hapticFeedback('light');
                  setIsProfileOpen(true);
                }}
                className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-gray-700 to-gray-900 text-white transition-transform active:scale-90"
                aria-label="Open account menu"
                aria-haspopup="dialog"
              >
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="h-5 w-5 text-white/75" aria-hidden="true" />
                )}
              </button>
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
                    className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm lg:hidden"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: '-100%' }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: '-100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="workspace-switcher-title"
                    className="fixed inset-x-0 top-0 z-[200] flex max-h-[85dvh] flex-col overflow-y-auto rounded-b-3xl border-b border-white/10 bg-[#0A0A0A]/98 px-4 pb-6 pt-[calc(16px+env(safe-area-inset-top))] shadow-2xl backdrop-blur-xl lg:hidden"
                  >
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">Wersee</p>
                        <h2 id="workspace-switcher-title" className="mt-1 text-xl font-semibold tracking-tight text-white">Switch workspace</h2>
                      </div>
                      <button 
                        onClick={() => setIsTopMenuOpen(false)}
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-white"
                        aria-label="Close workspace switcher"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => {
                          navigate(userWorkspacePath('overview'));
                          setIsTopMenuOpen(false);
                        }}
                        className={`flex min-h-16 w-full items-center gap-3 rounded-[18px] border p-3 text-left transition-colors ${
                          !businessId ? 'border-white/20 bg-white/[0.09]' : 'border-white/[0.06] bg-white/[0.025]'
                        }`}
                      >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-black text-black">
                          {(userUsername || profile?.full_name || 'W').charAt(0).toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-white">{currentWorkspaceName}</span>
                          <span className="mt-1 block text-xs text-white/45">Personal workspace</span>
                        </span>
                        {!businessId && <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" aria-label="Current workspace" />}
                      </button>

                      {businesses.map((business) => {
                        const isCurrent = business.id === businessId || business.slug === businessId;
                        return (
                          <button
                            key={`workspace-switcher-${business.id}`}
                            type="button"
                            onClick={() => {
                              navigate(userWorkspacePath(business.slug || business.id));
                              setIsTopMenuOpen(false);
                            }}
                            className={`flex min-h-16 w-full items-center gap-3 rounded-[18px] border p-3 text-left transition-colors ${
                              isCurrent ? 'border-white/20 bg-white/[0.09]' : 'border-white/[0.06] bg-white/[0.025]'
                            }`}
                          >
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
                              {business.name?.charAt(0)?.toUpperCase() || 'B'}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-white">{business.name || 'Business workspace'}</span>
                              <span className="mt-1 block truncate text-xs text-white/45">{business.description || 'Business workspace'}</span>
                            </span>
                            {isCurrent && <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" aria-label="Current workspace" />}
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => {
                          setIsTopMenuOpen(false);
                          setActiveView('create-business');
                        }}
                        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-[18px] border border-dashed border-white/10 text-sm font-semibold text-white/60 transition-colors hover:border-white/20 hover:text-white"
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        Create business workspace
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

          </header>
        )}

        {/* Content Area */}
        <div
          onScroll={(event) => setIsContentScrolled(event.currentTarget.scrollTop > 2)}
          className={`flex h-full min-h-0 flex-1 flex-col overflow-x-hidden scrollbar-hide ${
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
        } ${!isCourseView ? 'max-lg:pb-[calc(96px+env(safe-area-inset-bottom))]' : ''}`}
        >
          {onboardingBusiness ? (
            <BusinessOnboardingWizard
              business={onboardingBusiness}
              onClose={() => setOnboardingBusiness(null)}
              onComplete={(updatedBusiness) => {
                setOnboardingBusiness(null);
                setBusinesses(businesses.map(b => b.id === updatedBusiness.id ? updatedBusiness : b));
                navigate(userWorkspacePath(updatedBusiness.slug || updatedBusiness.id));
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

      <AnimatePresence>
        {isProfileOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close account menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileOpen(false)}
              className="fixed inset-0 z-[210] bg-black/70 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-account-menu-title"
              className="fixed inset-x-0 bottom-0 z-[220] rounded-t-3xl border-t border-white/10 bg-[#101010] px-4 pb-[calc(20px+env(safe-area-inset-bottom))] pt-3 shadow-2xl lg:hidden"
            >
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/15" />
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-gray-700 to-gray-900">
                  {user?.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User className="h-5 w-5 text-white/70" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 id="mobile-account-menu-title" className="truncate text-base font-semibold text-white">
                    {profile?.full_name || userUsername}
                  </h2>
                  <p className="mt-1 truncate text-xs text-white/45">{user?.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-white/60"
                  aria-label="Close account menu"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setIsProfileOpen(false); onNavigate('profile'); }}
                  className="flex min-h-14 items-center gap-3 rounded-[18px] border border-white/[0.07] bg-white/[0.035] px-4 text-sm font-medium text-white"
                >
                  <User className="h-4.5 w-4.5 text-emerald-300" aria-hidden="true" />
                  Profile
                </button>
                <button
                  type="button"
                  onClick={() => { setIsProfileOpen(false); setActiveView('notifications'); }}
                  className="flex min-h-14 items-center gap-3 rounded-[18px] border border-white/[0.07] bg-white/[0.035] px-4 text-sm font-medium text-white"
                >
                  <Bell className="h-4.5 w-4.5 text-amber-300" aria-hidden="true" />
                  Notifications
                </button>
                <button
                  type="button"
                  onClick={() => { setIsProfileOpen(false); window.dispatchEvent(new CustomEvent('show-pwa-modal')); }}
                  className="flex min-h-14 items-center gap-3 rounded-[18px] border border-white/[0.07] bg-white/[0.035] px-4 text-sm font-medium text-white"
                >
                  <Download className="h-4.5 w-4.5 text-indigo-300" aria-hidden="true" />
                  Install app
                </button>
                <a
                  href="/"
                  onClick={(event) => {
                    setIsProfileOpen(false);
                    handleExit(event);
                  }}
                  className="flex min-h-14 items-center gap-3 rounded-[18px] border border-white/[0.07] bg-white/[0.035] px-4 text-sm font-medium text-white"
                >
                  <Store className="h-4.5 w-4.5 text-blue-300" aria-hidden="true" />
                  Store
                </a>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  void handleLogout();
                }}
                className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-red-400/10 text-sm font-semibold text-red-300"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Log out
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <WorkspaceAiSidebar 
        isOpen={isAiSidebarOpen} 
        onClose={() => setIsAiSidebarOpen(false)} 
        context={{ page: activeView, businessId, businessName: businesses.find((business) => business.id === businessId)?.name, ...aiContext }} 
        isAgentMode={isAgentMode}
        setIsAgentMode={setIsAgentMode}
        onNavigate={setActiveView}
      />
      <PwaOnboardingModal />

      {/* Mobile and tablet bottom navigation */}
      {!isCourseView && !isMobileSearchOpen && !isMobileMoreOpen && !isCreateOpen && !isProfileOpen && !isTopMenuOpen && (
        <nav
          aria-label="Mobile workspace navigation"
          className={`fixed inset-x-0 bottom-0 z-50 grid min-h-[72px] border-t px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_35px_rgba(0,0,0,0.22)] backdrop-blur-2xl lg:hidden ${
            isDark ? 'border-white/10 bg-[#0A0A0A]/94' : 'border-black/10 bg-white/94'
          } ${
            activeView === 'chats' ? 'grid-cols-4' : 'grid-cols-5'
          }`}
        >
          {activeView === 'chats' ? (
            <>
              <motion.button
                layout
                type="button"
                onClick={() => {
                  hapticFeedback('light');
                  setMobileChatSection('chats');
                  window.dispatchEvent(new CustomEvent('wersee:chat-mobile-nav', { detail: { section: 'chats' } }));
                }}
                aria-current={mobileChatSection === 'chats' ? 'page' : undefined}
                className={`relative flex min-h-[64px] flex-col items-center justify-center gap-1 text-[11px] font-semibold active:scale-95 ${
                  mobileChatSection === 'chats'
                    ? (isDark ? 'text-white' : 'text-black')
                    : (isDark ? 'text-white/55' : 'text-black/50')
                }`}
                aria-label="Show chats"
              >
                {mobileChatSection === 'chats' && (
                  <motion.span
                    layoutId="workspace-mobile-chat-active"
                    className={`absolute inset-x-2 inset-y-2 rounded-[18px] ${
                      isDark ? 'bg-white/[0.08]' : 'bg-black/[0.055]'
                    }`}
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <MessageCircle className="relative h-5 w-5" aria-hidden="true" />
                <span className="relative">Chats</span>
              </motion.button>
              <motion.button
                layout
                type="button"
                onClick={() => {
                  hapticFeedback('light');
                  setMobileChatSection('groups');
                  window.dispatchEvent(new CustomEvent('wersee:chat-mobile-nav', { detail: { section: 'groups' } }));
                }}
                aria-current={mobileChatSection === 'groups' ? 'page' : undefined}
                className={`relative flex min-h-[64px] flex-col items-center justify-center gap-1 text-[11px] font-medium active:scale-95 ${
                  mobileChatSection === 'groups'
                    ? (isDark ? 'text-white' : 'text-black')
                    : (isDark ? 'text-white/55' : 'text-black/50')
                }`}
                aria-label="Show chat groups"
              >
                {mobileChatSection === 'groups' && (
                  <motion.span
                    layoutId="workspace-mobile-chat-active"
                    className={`absolute inset-x-2 inset-y-2 rounded-[18px] ${
                      isDark ? 'bg-white/[0.08]' : 'bg-black/[0.055]'
                    }`}
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <Users className="relative h-5 w-5" aria-hidden="true" />
                <span className="relative">Groups</span>
              </motion.button>
              <motion.button
                layout
                type="button"
                onClick={() => {
                  hapticFeedback('medium');
                  window.dispatchEvent(new CustomEvent('wersee:chat-mobile-nav', { detail: { section: 'add' } }));
                }}
                className={`flex min-h-[64px] flex-col items-center justify-center gap-1 text-[11px] font-semibold active:scale-95 ${
                  isDark ? 'text-white' : 'text-black'
                }`}
                aria-label="Create a chat or group"
              >
                <span className={`-mt-4 flex h-12 w-12 items-center justify-center rounded-2xl shadow-[0_10px_28px_rgba(0,0,0,0.16)] ${
                  isDark ? 'bg-white text-black' : 'bg-black text-white'
                }`}>
                  <Plus className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>New</span>
              </motion.button>
              <motion.button
                layout
                type="button"
                onClick={() => {
                  hapticFeedback('light');
                  setActiveView('home');
                }}
                className={`flex min-h-[64px] flex-col items-center justify-center gap-1 text-[11px] font-medium active:scale-95 ${
                  isDark ? 'text-white/55' : 'text-black/50'
                }`}
                aria-label="Go to workspace overview"
              >
                <Home className="h-5 w-5" aria-hidden="true" />
                <span>Workspace</span>
              </motion.button>
            </>
          ) : (
            <>
          <button
            type="button"
            onClick={() => {
              if (activeView !== 'home') hapticFeedback('light');
              setActiveView('home');
            }}
            aria-current={activeView === 'home' || activeView === 'overview' ? 'page' : undefined}
            className={`relative flex min-h-[64px] flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors active:scale-95 ${
              activeView === 'home' || activeView === 'overview' ? 'text-white' : 'text-white/45'
            }`}
          >
            <Home className="h-5 w-5" aria-hidden="true" />
            <span>Home</span>
            {(activeView === 'home' || activeView === 'overview') && <span className="absolute top-0 h-0.5 w-7 rounded-full bg-white" />}
          </button>

          <button
            type="button"
            onClick={() => {
              if (activeView !== 'chats') hapticFeedback('light');
              setActiveView('chats');
            }}
            aria-current={activeView === 'chats' ? 'page' : undefined}
            className={`relative flex min-h-[64px] flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors active:scale-95 ${
              activeView === 'chats' ? 'text-white' : 'text-white/45'
            }`}
          >
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
            <span>Messages</span>
            {activeView === 'chats' && <span className="absolute top-0 h-0.5 w-7 rounded-full bg-white" />}
          </button>

          <button
            type="button"
            onClick={() => {
              hapticFeedback('medium');
              setIsCreateOpen(true);
            }}
            className="relative flex min-h-[64px] flex-col items-center justify-center gap-1 text-[11px] font-semibold text-white"
            aria-label="Create in workspace"
          >
            <span className="-mt-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-black shadow-[0_10px_28px_rgba(255,255,255,0.14)] transition-transform active:scale-90">
              <Plus className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>Create</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (activeView !== 'management-team') hapticFeedback('light');
              setActiveView('management-team');
            }}
            aria-current={activeView === 'management-team' ? 'page' : undefined}
            className={`relative flex min-h-[64px] flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors active:scale-95 ${
              activeView === 'management-team' ? 'text-white' : 'text-white/45'
            }`}
          >
            <Users className="h-5 w-5" aria-hidden="true" />
            <span>Team</span>
            {activeView === 'management-team' && <span className="absolute top-0 h-0.5 w-7 rounded-full bg-white" />}
          </button>

          <button
            type="button"
            onClick={() => {
              hapticFeedback('light');
              setIsMobileMoreOpen(true);
            }}
            className="flex min-h-[64px] flex-col items-center justify-center gap-1 text-[11px] font-medium text-white/45 transition-colors active:scale-95"
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
            <span>More</span>
          </button>
            </>
          )}
        </nav>
      )}

      {/* Mobile Search Dropdown Component */}
      <MobileSearchDropdown 
        isOpen={isMobileSearchOpen}
        searchQuery={searchQuery}
        results={(() => {
          const combined = [
            ...businesses.map((item) => ({ ...item, _workspaceSearchType: 'businesses' })),
            ...joinedProducts.map((item) => ({ ...item, _workspaceSearchType: 'products' })),
            ...communities.map((item) => ({ ...item, _workspaceSearchType: 'communities' })),
          ];
          const unique = Array.from(new Map(combined.map(item => [`${item._workspaceSearchType}:${item.id}`, item])).values());
          return unique.filter(item => (item.name || item.title)?.toLowerCase().includes(searchQuery.toLowerCase()))
            .slice(0, 10);
        })()}
        onClose={() => {
          setIsMobileSearchOpen(false);
          setSearchQuery('');
        }}
        onQueryChange={setSearchQuery}
        onSubmit={() => {
          if (!searchQuery.trim()) return;
          setActiveView('search-results');
          setIsMobileSearchOpen(false);
        }}
        onSelect={(item) => {
          if (item._workspaceSearchType === 'businesses') {
            navigate(userWorkspacePath(item.slug || item.id));
          } else if (item._workspaceSearchType === 'communities') {
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
