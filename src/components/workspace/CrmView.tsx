import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Building2, TrendingUp, Globe, ShoppingBag, MessageSquare, Package, ChevronDown } from 'lucide-react';
import { CrmDeals } from './CrmDeals';
import { CrmContacts } from './CrmContacts';
import { CrmCompanies } from './CrmCompanies';
import { DatabaseService } from '../../services/databaseService';
import { useAuth } from '../../context/AuthContext';

interface CrmViewProps {
  listingId?: string;
}

export const CrmView: React.FC<CrmViewProps> = ({ listingId }) => {
  const [activeTab, setActiveTab] = useState<'deals' | 'contacts' | 'companies'>('deals');
  const [listings, setListings] = useState<any[]>([]);
  const [selectedListingId, setSelectedListingId] = useState<string | 'all'>(listingId || 'all');
  const [isListingDropdownOpen, setIsListingDropdownOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (listingId) {
      setSelectedListingId(listingId);
    }
  }, [listingId]);

  useEffect(() => {
    if (user) {
      fetchListings();
    }
  }, [user]);

  const fetchListings = async () => {
    if (!user) return;

    const { data } = await DatabaseService.get('listings', {
      eq: { user_id: user.id },
      in: { column: 'status', values: ['active', 'published'] }
    });
    
    setListings(data || []);
  };

  const tabs = [
    { id: 'deals', label: 'Deals & Pipeline', icon: TrendingUp },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'companies', label: 'Companies', icon: Building2 },
  ] as const;

  const selectedListing = listings.find(l => l.id === selectedListingId);

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A]">
      {/* Header with Tabs and Listing Selector */}
      <div className="p-4 sm:p-6 border-b border-white/5 bg-[#0A0A0A] sticky top-0 z-20">
        <div className="flex flex-col gap-4 sm:gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3">
                <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
                CRM
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Manage your relationships, pipeline, and growth.</p>
            </div>

            {/* Listing Selector */}
            <div className="relative w-full md:w-auto">
              <button
                onClick={() => setIsListingDropdownOpen(!isListingDropdownOpen)}
                className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all w-full md:min-w-[200px]"
              >
                {selectedListingId === 'all' ? (
                  <>
                    <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                    <span className="text-xs sm:text-sm font-bold text-white">All Products & Communities</span>
                  </>
                ) : (
                  <>
                    {selectedListing?.images?.[0] ? (
                      <img src={selectedListing.images[0]} alt="" className="w-4 h-4 sm:w-5 sm:h-5 rounded-md object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Package className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                    )}
                    <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[150px]">
                      {selectedListing?.title}
                    </span>
                  </>
                )}
                <ChevronDown className={`w-4 h-4 text-gray-500 ml-auto transition-transform ${isListingDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isListingDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setIsListingDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-full md:w-64 bg-[#141414] border border-white/10 rounded-2xl shadow-2xl z-40 overflow-hidden">
                    <div className="p-2 max-h-[60vh] md:max-h-[300px] overflow-y-auto">
                      <button
                        onClick={() => {
                          setSelectedListingId('all');
                          setIsListingDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                          selectedListingId === 'all' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <Globe className="w-4 h-4" />
                        View All
                      </button>
                      <div className="my-2 border-t border-white/5" />
                      {listings.map((listing) => (
                        <button
                          key={listing.id}
                          onClick={() => {
                            setSelectedListingId(listing.id);
                            setIsListingDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                            selectedListingId === listing.id ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          {listing.images?.[0] ? (
                            <img src={listing.images[0]} alt="" className="w-4 h-4 rounded object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <Package className="w-4 h-4" />
                          )}
                          <span className="truncate">{listing.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center p-1 bg-white/5 rounded-2xl border border-white/10 self-start overflow-x-auto max-w-full no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-black shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden p-4 sm:p-6">
        {activeTab === 'deals' && <CrmDeals listingId={selectedListingId === 'all' ? undefined : selectedListingId} />}
        {activeTab === 'contacts' && <CrmContacts listingId={selectedListingId === 'all' ? undefined : selectedListingId} />}
        {activeTab === 'companies' && <CrmCompanies listingId={selectedListingId === 'all' ? undefined : selectedListingId} />}
      </div>
    </div>
  );
};
