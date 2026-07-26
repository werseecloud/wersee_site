import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Plus, User, LayoutDashboard, ChevronDown, BookOpen, TrendingUp, PieChart, Flame, Gamepad2, Menu, X, Moon, Sun, Sparkles, LayoutGrid, Shield, CreditCard, Users, Zap, QrCode, ShoppingBag, MoreVertical, Store, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { CreateDropdown } from './CreateDropdown';
import { SearchDropdown } from './SearchDropdown';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useCart } from '../lib/cart';

export const NavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const { count: cartCount } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isFeaturesOpen, setIsFeaturesOpen] = useState(false);
  const [isSolutionsOpen, setIsSolutionsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState({ products: [], courses: [], creators: [] });
  const moreRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const solutionsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setScrolled(scrollY > 20);
      // Show search bar in header on home page only after scrolling past hero search bar (~600px)
      // On other pages, show it as soon as scrolled or always
      setShowSearch(location.pathname !== '/' || scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults({ products: [], courses: [], creators: [] });
        return;
      }

      setIsSearching(true);
      try {
        const [listingsRes, profilesRes] = await Promise.all([
          supabase
            .from('listings')
            .select('*, profiles(username, name, avatar_url)')
            .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
            .limit(10),
          supabase
            .from('profiles')
            .select('*')
            .or(`username.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%`)
            .limit(5)
        ]);

        if (listingsRes.data) {
          const products = listingsRes.data.filter(l => l.type !== 'course');
          const courses = listingsRes.data.filter(l => l.type === 'course');
          setSearchResults(prev => ({ ...prev, products, courses }));
        }

        if (profilesRes.data) {
          setSearchResults(prev => ({ ...prev, creators: profilesRes.data }));
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(() => {
      if (searchQuery) performSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
      if (featuresRef.current && !featuresRef.current.contains(event.target as Node)) {
        setIsFeaturesOpen(false);
      }
      if (solutionsRef.current && !solutionsRef.current.contains(event.target as Node)) {
        setIsSolutionsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchDropdownOpen(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const isHome = location.pathname === '/';

  return (
    <>
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        className={`fixed top-0 left-0 right-0 z-[100] border-b border-transparent bg-transparent transition-all duration-500 ${
          scrolled 
            ? 'py-2'
            : 'bg-transparent border-transparent py-4 sm:py-3'
        }`}
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-14 sm:h-16">
            {/* Mobile Header */}
            <div className="flex sm:hidden items-center justify-between w-full h-full">
              {/* Left: standalone logo pill */}
              <Link
                to="/"
                aria-label="Wersee home"
                className="liquid-glass-pill group flex h-12 items-center gap-2 rounded-full px-3.5 pr-5"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/20 blur-lg rounded-full group-hover:bg-blue-500/40 transition-colors" />
                  <img 
                    src="https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/business_logos/a1e58d3a96480df827eafe98567353d2-removebg-preview.png" 
                    alt="Wersee Logo" 
                    className="w-8 h-8 object-contain relative z-10 group-hover:scale-110 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="font-black text-lg tracking-tighter text-white italic uppercase">
                  Wersee
                </span>
              </Link>

              <div className="flex items-center gap-2">
                {/* Standalone mobile create pill */}
                <button
                  onClick={() => user ? setIsCreateOpen(true) : navigate('/auth')}
                  type="button"
                  className="flex h-12 shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 text-[10px] font-black uppercase tracking-[0.12em] text-black shadow-[0_12px_36px_rgba(255,255,255,0.12)] transition-all active:scale-95"
                  aria-label={user ? 'Create on Wersee' : 'Log in to create'}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create</span>
                </button>

                {/* Right: standalone square menu */}
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  type="button"
                  aria-label="Open menu"
                  className="liquid-glass-pill flex h-12 w-12 shrink-0 flex-col items-center justify-center gap-1 rounded-[1rem] text-white transition-all hover:border-white/30 active:scale-90"
                >
                  <div className="w-5 h-0.5 rounded-full bg-current" />
                  <div className="w-3 h-0.5 rounded-full bg-current" />
                  <div className="w-5 h-0.5 rounded-full bg-current" />
                </button>
              </div>

            </div>

            {/* Desktop Header */}
            <div className="hidden sm:flex h-full w-full items-center justify-between gap-3">
              {/* Standalone logo pill */}
              <Link
                to="/"
                aria-label="Wersee home"
                className="liquid-glass-pill group flex h-14 min-w-[190px] shrink-0 items-center gap-3 rounded-full px-5 pr-8 transition-colors hover:border-white/30"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full group-hover:bg-blue-500/40 transition-colors" />
                  <img 
                    src="https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/business_logos/a1e58d3a96480df827eafe98567353d2-removebg-preview.png" 
                    alt="Wersee Logo" 
                    className="w-10 h-10 object-contain relative z-10 group-hover:scale-110 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="font-black text-2xl tracking-tighter text-white italic uppercase">
                  Wersee
                </span>
              </Link>

              {/* Back to Store Switch (Visible when in Workspace) */}
              {location.pathname.startsWith('/workspace') && (
                <Link 
                  to="/" 
                  className="flex h-11 shrink-0 items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 text-sm font-bold text-blue-400 backdrop-blur-2xl transition-all hover:bg-blue-500/20"
                >
                  <Store className="w-4 h-4" />
                  <span className="hidden sm:inline">Back to Store</span>
                </Link>
              )}

              {/* Desktop Navigation */}
              <nav className="liquid-glass-pill mx-auto hidden h-14 items-center gap-1 rounded-full p-1.5 md:flex">
                <Link 
                  to="/" 
                  className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
                    location.pathname === '/'
                      ? 'text-white bg-white/10'
                      : 'text-white/80 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Home
                </Link>
                {user && (
                  <Link 
                    to="/workspace/overview" 
                    className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
                      location.pathname.startsWith('/workspace')
                        ? 'text-white bg-white/10'
                        : 'text-white/80 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Workspace
                  </Link>
                )}
                {user && (
                  <Link 
                    to={location.pathname.startsWith('/investments') ? '/portfolio' : '/investments'} 
                    className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
                      location.pathname.startsWith('/portfolio') || location.pathname.startsWith('/investments')
                        ? 'text-white bg-white/10'
                        : 'text-white/80 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <motion.div
                      animate={{ 
                        rotate: location.pathname.startsWith('/investments') ? 180 : 0,
                        scale: (location.pathname.startsWith('/portfolio') || location.pathname.startsWith('/investments')) ? [1, 1.2, 1] : 1
                      }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    >
                      {location.pathname.startsWith('/investments') ? <PieChart className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                    </motion.div>
                    {location.pathname.startsWith('/investments') ? 'Switch to Portfolio' : location.pathname.startsWith('/portfolio') ? 'Switch to Investments' : 'Investments'}
                  </Link>
                )}

                {/* Solutions Dropdown */}
                <div className="relative" ref={solutionsRef}>
                  <button 
                    onClick={() => setIsSolutionsOpen(!isSolutionsOpen)}
                    className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
                      isSolutionsOpen ? 'text-white bg-white/10' : 'text-white/80 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Solutions <ChevronDown className={`w-4 h-4 transition-transform ${isSolutionsOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {isSolutionsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 mt-2 w-64 bg-black/90 border border-white/10 backdrop-blur-2xl rounded-2xl p-2 shadow-2xl"
                      >
                        <Link 
                          to="/custom-app-build" 
                          onClick={() => setIsSolutionsOpen(false)}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-white transition-colors"
                        >
                          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                            <Zap className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-sm font-bold">Custom App Build</div>
                            <div className="text-[10px] text-gray-500">Bespoke software engineering</div>
                          </div>
                        </Link>
                        <Link 
                          to="/enterprise" 
                          onClick={() => setIsSolutionsOpen(false)}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-white transition-colors"
                        >
                          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                            <Shield className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-sm font-bold">Enterprise Solutions</div>
                            <div className="text-[10px] text-gray-500">Scale your organization</div>
                          </div>
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </nav>

              <AnimatePresence initial={false}>
                {showSearch && (
                  <motion.div
                    ref={searchRef}
                    initial={{ opacity: 0, width: 0, scale: 0.96 }}
                    animate={{ opacity: 1, width: 'clamp(210px, 20vw, 320px)', scale: 1 }}
                    exit={{ opacity: 0, width: 0, scale: 0.96 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="relative hidden min-w-[210px] max-w-[320px] flex-[0_1_320px] xl:block"
                  >
                    <form onSubmit={handleSearch} className="group relative">
                      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 transition-colors group-focus-within:text-blue-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setIsSearchDropdownOpen(true);
                        }}
                        onFocus={() => setIsSearchDropdownOpen(true)}
                        placeholder="Search Wersee..."
                        className="liquid-glass-pill h-12 w-full rounded-full pl-10 pr-10 text-sm font-medium text-white outline-none transition-all placeholder:text-gray-500 hover:border-white/30 focus:border-blue-300/50 focus:ring-2 focus:ring-blue-500/15"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setIsSearchDropdownOpen(false);
                          }}
                          className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-white/10 hover:text-white"
                          aria-label="Clear search"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </form>
                    <SearchDropdown
                      isOpen={isSearchDropdownOpen && searchQuery.length > 0}
                      results={searchResults}
                      isLoading={isSearching}
                      onClose={() => setIsSearchDropdownOpen(false)}
                      searchQuery={searchQuery}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <div className="liquid-glass-pill flex h-14 min-w-14 items-center justify-center gap-1 rounded-full p-1.5">
                {/* Cart */}
                <Link
                  to="/checkout"
                  aria-label="Open checkout"
                  className="relative flex h-10 w-10 items-center justify-center rounded-full text-white transition-all hover:bg-white/10 active:scale-90"
                >
                  <ShoppingBag className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute right-0 top-0 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#0A0A0A] bg-blue-500 px-1 text-[10px] font-black leading-none text-white">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </Link>

                {user ? (
                  <Link 
                    to="/profile" 
                    aria-label="Open profile"
                    className="relative rounded-full"
                  >
                    <div className={`flex w-10 h-10 rounded-full overflow-hidden border-2 transition-all hover:scale-110 hover:border-purple-500 border-white/10`}>
                      <div className={`w-full h-full flex items-center justify-center bg-white/10 text-white`}>
                        {user.user_metadata?.avatar_url ? (
                          <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <User className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                    {user.user_metadata?.age !== undefined && user.user_metadata.age < 12 && (
                      <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full border border-[#0A0A0B] shadow-lg z-10">
                        KIDS
                      </div>
                    )}
                    {user.user_metadata?.age !== undefined && user.user_metadata.age >= 12 && user.user_metadata.age < 18 && (
                      <div className="absolute -bottom-1 -right-1 bg-purple-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full border border-[#0A0A0B] shadow-lg z-10">
                        NEXT GEN
                      </div>
                    )}
                    {user.user_metadata?.has_children && (
                      <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full border border-[#0A0A0B] shadow-lg z-10">
                        <Shield className="w-2 h-2" />
                      </div>
                    )}
                  </Link>
                ) : null}
                </div>
                
                {/* Create Button - Desktop only */}
                <button 
                  onClick={() => user ? setIsCreateOpen(true) : navigate('/auth')}
                  className={`group relative hidden h-14 items-center gap-3 overflow-hidden rounded-full bg-white px-8 text-sm font-black italic uppercase tracking-widest text-black shadow-2xl shadow-white/10 transition-all hover:scale-105 hover:bg-gray-200 active:scale-95 sm:flex`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  {user ? (
                    <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  <span>{user ? 'Create' : 'Login'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md md:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className={`fixed top-0 right-0 bottom-0 w-[85%] z-[120] p-6 md:hidden flex flex-col shadow-2xl bg-[#0A0A0B] border-l border-white/10`}
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <img 
                    src="https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/business_logos/a1e58d3a96480df827eafe98567353d2-removebg-preview.png" 
                    alt="Wersee Logo" 
                    className="w-10 h-10 object-contain"
                    referrerPolicy="no-referrer"
                  />
                  <span className="font-black text-2xl text-white italic uppercase tracking-tighter">Wersee</span>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`p-3 rounded-2xl bg-white/5 text-white border border-white/10 active:scale-90 transition-transform`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                {/* Mobile Search Input */}
                <div className="mb-8 px-2">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                    <input 
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search Wersee..."
                      className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:bg-white/10 focus:border-white/20 transition-all font-bold italic uppercase tracking-tight text-sm"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/10 text-gray-400 hover:text-white transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {searchQuery.length > 0 ? (
                  <div className="space-y-8">
                    {/* Pages Search Results */}
                    {(() => {
                      const pages = [
                        { title: 'Shop', path: '/', icon: ShoppingBag },
                        { title: 'Education', path: '/edu/student', icon: GraduationCap },
                        { title: 'Student Discount', path: '/edu/student', icon: GraduationCap },
                        { title: 'Campus Program', path: '/edu/campus', icon: GraduationCap },
                        { title: 'Learning Paths', path: '/edu/paths', icon: GraduationCap },
                        { title: 'Edu Resources', path: '/edu/resources', icon: GraduationCap },
                        { title: 'Investments', path: '/investments', icon: TrendingUp },
                        { title: 'Blog', path: '/blog', icon: BookOpen },
                        { title: 'Workspace', path: '/workspace/overview', icon: LayoutDashboard },
                        { title: 'Portfolio', path: '/portfolio', icon: TrendingUp },
                        { title: 'Profile', path: '/profile', icon: User },
                        { title: 'Terms', path: '/terms', icon: Shield },
                        { title: 'Privacy', path: '/privacy', icon: Shield },
                      ].filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()));

                      if (pages.length === 0) return null;
                      return (
                        <div>
                          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-4 ml-4">Pages</h4>
                          <div className="space-y-2">
                            {pages.map((page, i) => (
                              <Link 
                                key={i}
                                to={page.path} 
                                onClick={() => setIsMobileMenuOpen(false)} 
                                className="p-4 rounded-[1.5rem] font-bold flex items-center gap-4 bg-white/5 text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/10"
                              >
                                <page.icon className="w-5 h-5 text-blue-400" />
                                <span className="text-sm uppercase italic font-black tracking-tight">{page.title}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Listings Search Results */}
                    {(searchResults.products.length > 0 || searchResults.courses.length > 0) && (
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-4 ml-4">Listings</h4>
                        <div className="space-y-2">
                          {[...searchResults.products, ...searchResults.courses].map((item: any) => (
                            <Link 
                              key={item.id}
                              to={`/listing/${item.id}`} 
                              onClick={() => setIsMobileMenuOpen(false)} 
                              className="p-4 rounded-[1.5rem] font-bold flex items-center gap-4 bg-white/5 text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/10"
                            >
                              <div className="w-10 h-10 rounded-xl bg-white/10 overflow-hidden shrink-0">
                                {item.images?.[0] && (
                                  <img src={item.images[0]} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <span className="text-sm uppercase italic font-black tracking-tight block truncate">{item.title}</span>
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">${item.price}</span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Creators Search Results */}
                    {searchResults.creators.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-4 ml-4">Creators</h4>
                        <div className="space-y-2">
                          {searchResults.creators.map((creator: any) => (
                            <Link 
                              key={creator.id}
                              to={`/profile/${creator.id}`} 
                              onClick={() => setIsMobileMenuOpen(false)} 
                              className="p-4 rounded-[1.5rem] font-bold flex items-center gap-4 bg-white/5 text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/10"
                            >
                              <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden shrink-0">
                                {creator.avatar_url ? (
                                  <img src={creator.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <User className="w-full h-full p-2 text-gray-500" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <span className="text-sm uppercase italic font-black tracking-tight block truncate">{creator.name || creator.username}</span>
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">@{creator.username}</span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {isSearching && (
                      <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                ) : (
                  <nav className="flex flex-col gap-2">
                    <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className={`p-5 rounded-[2rem] font-black italic uppercase tracking-tight flex items-center gap-4 text-lg bg-white/5 text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/10`}>
                      <ShoppingBag className="w-6 h-6 text-blue-400" /> Shop
                    </Link>
                    <Link to="/investments" onClick={() => setIsMobileMenuOpen(false)} className={`p-5 rounded-[2rem] font-black italic uppercase tracking-tight flex items-center gap-4 text-lg bg-white/5 text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/10`}>
                      <TrendingUp className="w-6 h-6 text-green-400" /> Investments
                    </Link>
                    <Link to="/blog" onClick={() => setIsMobileMenuOpen(false)} className={`p-5 rounded-[2rem] font-black italic uppercase tracking-tight flex items-center gap-4 text-lg bg-white/5 text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/10`}>
                      <BookOpen className="w-6 h-6 text-orange-400" /> Blog
                    </Link>
                    
                    <div className="h-px bg-white/10 my-4" />
                    
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-4 ml-4">Solutions</h4>
                    <Link to="/custom-app-build" onClick={() => setIsMobileMenuOpen(false)} className={`p-5 rounded-[2rem] font-black italic uppercase tracking-tight flex items-center gap-4 text-lg bg-white/5 text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/10`}>
                      <Zap className="w-6 h-6 text-indigo-400" /> Custom App Build
                    </Link>
                    <Link to="/enterprise" onClick={() => setIsMobileMenuOpen(false)} className={`p-5 rounded-[2rem] font-black italic uppercase tracking-tight flex items-center gap-4 text-lg bg-white/5 text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/10`}>
                      <Shield className="w-6 h-6 text-emerald-400" /> Enterprise Solutions
                    </Link>

                    <div className="h-px bg-white/10 my-4" />
                    
                    {user ? (
                      <>
                        <Link to="/workspace/overview" onClick={() => setIsMobileMenuOpen(false)} className={`p-5 rounded-[2rem] font-black italic uppercase tracking-tight flex items-center gap-4 text-lg bg-white/5 text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/10`}>
                          <LayoutDashboard className="w-6 h-6 text-indigo-400" /> Workspace
                        </Link>
                        <Link to="/portfolio" onClick={() => setIsMobileMenuOpen(false)} className={`p-5 rounded-[2rem] font-black italic uppercase tracking-tight flex items-center gap-4 text-lg bg-white/5 text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/10`}>
                          <TrendingUp className="w-6 h-6 text-emerald-400" /> Portfolio
                        </Link>
                        <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className={`p-5 rounded-[2rem] font-black italic uppercase tracking-tight flex items-center gap-4 text-lg bg-white/5 text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/10`}>
                          <User className="w-6 h-6 text-pink-400" /> Profile
                        </Link>
                      </>
                    ) : (
                      <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)} className={`p-5 rounded-[2rem] font-black italic uppercase tracking-tight flex items-center gap-4 text-lg bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20`}>
                        <User className="w-6 h-6" /> Sign In
                      </Link>
                    )}
                  </nav>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CreateDropdown isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </>
  );
};
