import React, { useState, useEffect } from 'react';
import { MobileManagementNav } from './MobileManagementNav';
import { Package, TrendingUp, Users, Zap, Settings, ChevronRight, Mail, Megaphone, CreditCard, Layout, MessageSquare, ShoppingCart, StickyNote, Globe, Filter, Beaker, Gift, Handshake, FileText, Shield, Briefcase, ShieldCheck, Search, X, Phone, Gauge, Workflow as WorkflowIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DatabaseService } from '../../services/databaseService';
import { WorkspaceSectionSettingsModal } from './WorkspaceSectionSettingsModal';
import { useAuth } from '../../context/AuthContext';

interface ManagementLayoutProps {
  children: React.ReactNode;
  activeView: string;
  onNavigate: (view: string) => void;
  businessId?: string;
}

export const ManagementLayout: React.FC<ManagementLayoutProps> = ({ children, activeView, onNavigate, businessId }) => {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['product', 'team', 'marketing', 'analytics']);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [trustAccessResolved, setTrustAccessResolved] = useState(false);
  const [hasTrustStaffAccess, setHasTrustStaffAccess] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const resolveTrustAccess = async () => {
      if (!user) {
        if (!cancelled) setTrustAccessResolved(true);
        return;
      }

      const platformRoles = Array.isArray(user.app_metadata?.platform_roles) ? user.app_metadata.platform_roles : [];
      const metadataStaff = ['admin', 'platform_admin', 'trust_admin', 'compliance_admin', 'support_admin']
        .includes(String(user.app_metadata?.role || ''))
        || platformRoles.some((role: string) => (
          ['admin', 'platform_admin', 'trust_admin', 'compliance_admin', 'support_admin'].includes(role)
        ));

      let assignedTrustRole = false;
      try {
        const rows = await DatabaseService.get<any[]>('trust_roles', {
          select: 'id',
          eq: { user_id: user.id, status: 'active' },
          limit: 1,
        });
        assignedTrustRole = Array.isArray(rows) && rows.length > 0;
      } catch (error) {
        console.error('Error checking Trust staff access:', error);
      }

      if (!cancelled) {
        setHasTrustStaffAccess(metadataStaff || assignedTrustRole);
        setTrustAccessResolved(true);
      }
    };

    void resolveTrustAccess();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (
      trustAccessResolved
      && !hasTrustStaffAccess
      && (activeView === 'management-legal' || activeView === 'management-marketplace')
    ) {
      onNavigate('management-products');
    }
  }, [activeView, hasTrustStaffAccess, onNavigate, trustAccessResolved]);

  // Load last active view
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const user = await DatabaseService.getAuthUser();
        if (!user) return;
        
        const prefs = await DatabaseService.get('user_preferences', {
          eq: { user_id: user.id },
          maybeSingle: true
        });
        if (prefs?.last_active_management_view && prefs.last_active_management_view !== activeView) {
          onNavigate(prefs.last_active_management_view);
        }
      } catch (error) {
        console.error('Error loading management preferences:', error);
      }
    };
    loadPreferences();
  }, []);

  // Save last active view
  useEffect(() => {
    const savePreference = async () => {
      const user = await DatabaseService.getAuthUser();
      if (!user) return;
      try {
        await DatabaseService.upsert('user_preferences', {
          user_id: user.id,
          last_active_management_view: activeView,
          updated_at: new Date().toISOString()
        }, 'user_id');
      } catch (error) {
        console.error('Error saving management preference:', error);
      }
    };
    if (activeView) savePreference();
  }, [activeView]);

  const categories = [
    { id: 'all', label: 'All Tools', icon: Zap },
    { id: 'team', label: 'Team & CRM', icon: Users },
    { id: 'product', label: 'Product & Store', icon: Package },
    { id: 'marketing', label: 'Marketing & Sales', icon: Megaphone },
    { id: 'analytics', label: 'Analytics & Growth', icon: TrendingUp },
  ];

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId) 
        : [...prev, categoryId]
    );
  };

  const menuItems = [
    { id: 'management-products', label: 'Listings', icon: Package, category: 'product' },
    { id: 'management-jobs', label: 'Business & Jobs', icon: Briefcase, category: 'team' },
    { id: 'management-portal', label: 'Team Portals', icon: ShieldCheck, category: 'team' },
    { id: 'management-calls', label: 'Calls', icon: Phone, category: 'team' },
    { id: 'management-orders', label: 'Orders', icon: ShoppingCart, category: 'product' },
    { id: 'management-crm', label: 'CRM', icon: Users, category: 'team' },
    { id: 'management-notes', label: 'Internal Notes', icon: StickyNote, category: 'team' },
    { id: 'management-reviews', label: 'Reviews & Support', icon: MessageSquare, category: 'team' },
    { id: 'management-terms', label: 'Terms Creator', icon: FileText, category: 'product' },
    { id: 'management-legal', label: 'Trust Center', icon: Shield, category: 'product' },
    { id: 'management-marketplace', label: 'Trust Operations', icon: ShieldCheck, category: 'team' },
    { id: 'management-plans', label: 'Plans', icon: CreditCard, category: 'product' },
    { id: 'management-sites', label: 'Sites', icon: Globe, category: 'product' },
    { id: 'management-store-health', label: 'Store Health', icon: Gauge, category: 'analytics' },
    { id: 'management-websites', label: 'Websites Builder', icon: Globe, category: 'product' },
    { id: 'management-funnels', label: 'Funnels Builder', icon: Filter, category: 'marketing' },
    { id: 'management-ab-testing', label: 'A/B Testing', icon: Beaker, category: 'analytics' },
    { id: 'management-giveaways', label: 'Giveaways', icon: Gift, category: 'marketing' },
    { id: 'management-funding', label: 'Funding & Cap Table', icon: TrendingUp, category: 'analytics' },
    { id: 'management-analytics', label: 'Analytics', icon: TrendingUp, category: 'analytics' },
    { id: 'management-team', label: 'Team', icon: Users, category: 'team' },
    { id: 'management-affiliates', label: 'Affiliates', icon: Users, category: 'marketing' },
    { id: 'management-partnerships', label: 'Partnerships', icon: Handshake, category: 'marketing' },
    { id: 'management-forms', label: 'Forms Builder', icon: FileText, category: 'product' },
    { id: 'management-apps', label: 'Apps & Extensions', icon: Layout, category: 'product' },
    { id: 'management-workflows', label: 'Workflows', icon: WorkflowIcon, category: 'product' },
    { id: 'management-emails', label: 'Emails', icon: Mail, category: 'marketing' },
    { id: 'management-ads', label: 'Ads Manager', icon: Megaphone, category: 'marketing' },
    { id: 'management-developer', label: 'Developer', icon: Settings, category: 'product' },
  ].filter((item) => hasTrustStaffAccess || !['management-legal', 'management-marketplace'].includes(item.id));

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.label.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex-1 min-h-0 flex flex-col md:flex-row h-full w-full bg-[#0A0A0A] overflow-hidden">
      {/* Mobile Navigation */}
      <MobileManagementNav menuItems={menuItems} activeView={activeView} onNavigate={onNavigate} businessId={businessId} />

      {/* Desktop Secondary Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#0A0A0A] border-r border-white/5 flex-col shrink-0 z-10 h-full">
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-xl">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
              </div>
              <h2 className="text-lg font-bold text-white">Management</h2>
            </div>
          </div>
          <p className="text-xs text-gray-500">Growth & Tools</p>
        </div>

        {/* Search Bar (Desktop) */}
        <div className="px-3 py-3 border-b border-white/5 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder:text-gray-600 outline-none focus:border-indigo-500/50 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
        
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide no-scrollbar p-3 space-y-4">
          {categories.map(category => {
            const items = menuItems.filter(item => 
              item.category === category.id && 
              item.label.toLowerCase().includes(searchQuery.toLowerCase())
            );
            
            if (items.length === 0) return null;
            
            const isExpanded = expandedCategories.includes(category.id);
            const CategoryIcon = category.icon;

            return (
              <div key={category.id} className="space-y-1">
                <button 
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between px-3 py-2 text-gray-500 hover:text-white transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <CategoryIcon className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{category.label}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                </button>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden space-y-0.5"
                    >
                      {items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeView === item.id;
                        
                        return (
                          <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all group ${
                              isActive 
                                ? 'bg-white/10 text-white shadow-sm' 
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-white'}`} />
                            <span className="text-sm font-medium">{item.label}</span>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t border-white/5">
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
            aria-haspopup="dialog"
            aria-expanded={isSettingsOpen}
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 bg-[#0A0A0A] overflow-y-auto p-4 md:p-8 scrollbar-hide no-scrollbar relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="min-h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <WorkspaceSectionSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onNavigate={onNavigate}
        variant="management"
        hiddenDestinationIds={hasTrustStaffAccess ? [] : ['management-legal', 'management-marketplace']}
      />
    </div>
  );
};
