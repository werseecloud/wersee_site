import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Globe, Briefcase, Settings, LayoutDashboard, MessageCircle, Users, TrendingUp, Sparkles, ChevronRight, ArrowRight, HardDrive, Shield, HelpCircle, Megaphone, Wallet } from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: 'Business' | 'Tools' | 'Social' | 'Finance';
  icon: React.ElementType;
  view: string;
}

interface WorkspaceSearchResultsProps {
  query: string;
  onNavigate: (view: string) => void;
}

export const WorkspaceSearchResults: React.FC<WorkspaceSearchResultsProps> = ({ query, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'Business' | 'Tools' | 'Social' | 'Finance'>('all');

  const allResults: SearchResult[] = useMemo(() => [
    { id: '1', title: 'Business Overview', description: 'Manage your active businesses and performance.', category: 'Business', icon: Briefcase, view: 'overview' },
    { id: '2', title: 'Marketing Tools', description: 'Access AI-powered marketing and SEO tools.', category: 'Tools', icon: Globe, view: 'marketing' },
    { id: '3', title: 'Financial Dashboard', description: 'Track your earnings, payouts, and investments.', category: 'Finance', icon: TrendingUp, view: 'money-balance' },
    { id: '4', title: 'Community Clubs', description: 'Join and manage your creator communities.', category: 'Social', icon: Users, view: 'communities' },
    { id: '5', title: 'Direct Messages', description: 'Chat with your team and customers.', category: 'Social', icon: MessageCircle, view: 'chats' },
    { id: '6', title: 'Investments', description: 'Track Wersee Invest orders, documents and cooling-off status.', category: 'Finance', icon: TrendingUp, view: 'money-investments' },
    { id: '7', title: 'Account Settings', description: 'Manage your profile and security.', category: 'Tools', icon: Settings, view: 'profile' },
    { id: '8', title: 'Portfolio Management', description: 'View your digital asset portfolio.', category: 'Finance', icon: LayoutDashboard, view: 'portfolio' },
    { id: '9', title: 'Cloud Storage', description: 'Manage your files and assets.', category: 'Tools', icon: HardDrive, view: 'storage' },
    { id: '10', title: 'Safety & Legal', description: 'Compliance, terms, and safety guidelines.', category: 'Tools', icon: Shield, view: 'safety-legal' },
    { id: '11', title: 'Help Center', description: 'Documentation, FAQs, and support.', category: 'Tools', icon: HelpCircle, view: 'help' },
    { id: '12', title: 'Announcements', description: 'Latest updates from the Wersee team.', category: 'Social', icon: Megaphone, view: 'announcements' },
    { id: '13', title: 'Job Board', description: 'Find and apply for opportunities.', category: 'Business', icon: Briefcase, view: 'jobs' },
    { id: '14', title: 'Payouts', description: 'Manage your earnings and bank transfers.', category: 'Finance', icon: Wallet, view: 'money-payouts' },
    { id: '15', title: 'Wersee Points', description: 'Your rewards and loyalty points.', category: 'Finance', icon: Sparkles, view: 'money-points' },
  ], []);

  const filteredResults = useMemo(() => {
    const lowerQuery = query.toLowerCase();
    return allResults.filter(result => {
      const matchesQuery = result.title.toLowerCase().includes(lowerQuery) || 
                          result.description.toLowerCase().includes(lowerQuery);
      const matchesTab = activeTab === 'all' || result.category === activeTab;
      return matchesQuery && matchesTab;
    });
  }, [query, activeTab, allResults]);

  const tabs = [
    { id: 'all', label: 'All Results' },
    { id: 'Business', label: 'Business' },
    { id: 'Tools', label: 'Tools' },
    { id: 'Social', label: 'Social' },
    { id: 'Finance', label: 'Finance' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Search Results</h2>
        <p className="text-gray-500 font-medium">Showing results for "{query}"</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
              activeTab === tab.id 
                ? 'bg-white text-black border-white' 
                : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/20'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredResults.length > 0 ? (
            filteredResults.map((result, index) => (
              <motion.button
                key={result.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onNavigate(result.view)}
                className="group w-full flex items-center gap-4 p-6 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 hover:border-white/20 transition-all text-left relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  {(() => {
                    const Icon = result.icon as any;
                    return <Icon className="w-6 h-6 text-white" />;
                  })()}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">{result.category}</span>
                    <div className="w-1 h-1 rounded-full bg-white/20" />
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{result.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-1">{result.description}</p>
                </div>

                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </motion.button>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center space-y-4"
            >
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                <Search className="w-8 h-8 text-gray-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white">No results found</h3>
                <p className="text-gray-500">Try searching for something else or check your spelling.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
