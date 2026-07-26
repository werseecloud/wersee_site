import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Edit, Trash2, Eye, MoreVertical, Package, Search, Filter, Plus, Loader2, Layers, BookOpen, X, AlertTriangle } from 'lucide-react';
import { DatabaseService } from '../../services/databaseService';
import { useListingWizard } from '../../context/ListingWizardContext';
import { useAuth } from '../../context/AuthContext';
import { Skeleton } from '../ui/Skeleton';
import { AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { appToast } from '../../lib/feedback';

interface Listing {
  id: string;
  title: string;
  price: number;
  status: string;
  views: number;
  sales: number;
  images: string[];
  category: string;
  type: string;
  created_at: string;
  is_sandbox?: boolean;
}

const ListingSkeleton = () => (
  <div className="bg-[#141414] rounded-2xl p-4 border border-white/5">
    <div className="flex gap-4">
      <Skeleton className="w-24 h-24 shrink-0" />
      <div className="flex-1 space-y-3 py-1">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2 mt-4">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  </div>
);

interface ManageProductsViewProps {
  onEdit?: (id: string) => void;
}

export const ManageProductsView: React.FC<ManageProductsViewProps> = ({ onEdit }) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'products' | 'courses' | 'bundles'>('products');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<Listing | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const { openWizard } = useListingWizard();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchListings();

      // Real-time subscription for stats
      const channel = supabase
        .channel('listings-stats')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'listings',
            filter: `seller_id=eq.${user.id}`
          },
          (payload) => {
            setListings(current => 
              current.map(l => l.id === payload.new.id ? { ...l, ...payload.new } : l)
            );
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchListings = async (retries = 3) => {
    try {
      setLoading(true);
      if (user) {
        const data = await DatabaseService.get<Listing>('listings', {
          eq: { seller_id: user.id },
          order: { column: 'created_at', ascending: false }
        });

        setListings((data as Listing[]) || []);
      }
    } catch (error: any) {
      if (retries > 0 && (error.message?.includes('fetch') || error.message?.includes('Network'))) {
        console.warn(`Retrying fetchListings... (${retries} left)`);
        await new Promise(r => setTimeout(r, 2000));
        return fetchListings(retries - 1);
      }
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (listing: Listing) => {
    setListingToDelete(listing);
    setDeleteConfirmText('');
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!listingToDelete || deleteConfirmText !== listingToDelete.title) return;
    
    try {
      setIsDeleting(true);
      await DatabaseService.delete('listings', listingToDelete.id);
      setListings(listings.filter(l => l.id !== listingToDelete.id));
      setDeleteModalOpen(false);
      setListingToDelete(null);
    } catch (error) {
      console.error('Error deleting listing:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const updateListingStatus = async (listing: Listing, status: 'draft' | 'published' | 'archived') => {
    try {
      await DatabaseService.update('listings', listing.id, { status });
      setListings((current) => current.map((item) => item.id === listing.id ? { ...item, status } : item));
      setOpenMenuId(null);
      appToast(status === 'published' ? 'Listing published.' : status === 'archived' ? 'Listing archived.' : 'Listing moved to drafts.', 'success');
    } catch (error) {
      console.error('Error updating listing status:', error);
      appToast('The listing status could not be updated.', 'error');
    }
  };

  const filteredListings = listings.filter(l => {
    const matchesSearch = l.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (typeFilter !== 'all' && l.type !== typeFilter) return false;

    if (activeTab === 'bundles') return l.type === 'bundle';
    if (activeTab === 'courses') return l.category === 'course';
    return l.type !== 'bundle';
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white">Management</h2>
          <p className="text-gray-400">Manage your digital listings, services, and courses</p>
        </div>
        <button 
          onClick={() => {
            onEdit?.('create-listing');
          }}
          className="w-full sm:w-auto px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create {activeTab === 'bundles' ? 'Bundle' : activeTab === 'courses' ? 'Course' : 'Listing'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-[#141414] rounded-xl border border-white/10 w-full sm:w-fit overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 sm:px-6 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'products' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            All Listings
          </div>
        </button>
        <button
          onClick={() => setActiveTab('courses')}
          className={`px-4 sm:px-6 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'courses' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Courses
          </div>
        </button>
        <button
          onClick={() => setActiveTab('bundles')}
          className={`px-4 sm:px-6 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'bundles' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Bundles & Collections
          </div>
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 bg-[#141414] p-2 rounded-2xl border border-white/10">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search listings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-transparent text-white placeholder:text-gray-600 outline-none focus:bg-white/5 transition-colors"
          />
        </div>
        <div className="relative">
        <button
          type="button"
          aria-label="Filter listings"
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen((open) => !open)}
          className={`p-2 hover:bg-white/5 rounded-xl transition-colors ${filtersOpen || statusFilter !== 'all' || typeFilter !== 'all' ? 'text-indigo-300 bg-indigo-500/10' : 'text-gray-400 hover:text-white'}`}
        >
          <Filter className="w-5 h-5" />
        </button>
        <AnimatePresence>
          {filtersOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute right-0 top-12 z-40 w-72 rounded-2xl border border-white/10 bg-[#181818] p-4 shadow-2xl"
            >
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500">Status</label>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white">
                <option value="all">All statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
              <label className="mt-4 block text-[10px] font-bold uppercase tracking-widest text-gray-500">Listing type</label>
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white">
                <option value="all">All types</option>
                {Array.from(new Set(listings.map((listing) => listing.type).filter(Boolean))).sort().map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <button type="button" onClick={() => { setStatusFilter('all'); setTypeFilter('all'); setFiltersOpen(false); }} className="mt-4 w-full rounded-xl bg-white/5 px-3 py-2 text-xs font-bold text-gray-300 hover:bg-white/10">
                Reset filters
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            <ListingSkeleton />
            <ListingSkeleton />
            <ListingSkeleton />
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-16 bg-[#141414] rounded-3xl border border-dashed border-white/10">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-white">No {activeTab} found</h3>
            <p className="text-gray-500 mb-6">Start selling by creating your first {activeTab === 'bundles' ? 'bundle' : 'listing'}.</p>
                <button 
                onClick={() => {
                onEdit?.('create-listing');
              }}
              className="text-indigo-400 font-medium hover:text-indigo-300 transition-colors"
            >
              Create {activeTab === 'bundles' ? 'Bundle' : 'Listing'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredListings.map((listing) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0A0A0A] p-5 rounded-3xl border border-white/10 hover:border-indigo-500/30 transition-all group relative overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                  {/* Image */}
                  <div className="w-full sm:w-32 h-48 sm:h-32 bg-[#141414] rounded-2xl overflow-hidden shrink-0 relative group-hover:scale-[1.02] transition-transform duration-500 border border-white/5">
                    {listing.images?.[0] ? (
                      <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-700">
                        <Package className="w-10 h-10" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-2 gap-2 sm:gap-0">
                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                            listing.status === 'published' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {listing.status}
                          </span>
                          {listing.is_sandbox && (
                            <span className="text-[10px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20">
                              Sandbox
                            </span>
                          )}
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                            {listing.type}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-white truncate group-hover:text-indigo-400 transition-colors">{listing.title}</h3>
                        <p className="text-sm text-gray-500 font-medium italic serif">{listing.category}</p>
                      </div>
                      <div className="text-left sm:text-right w-full sm:w-auto">
                        <div className="text-2xl font-black text-white tracking-tight">
                          {listing.type === 'service' || listing.category === 'job' ? (
                            <span className="text-indigo-400 uppercase text-lg tracking-widest">Job</span>
                          ) : (
                            listing.price > 0 ? `€${listing.price}` : 'FREE'
                          )}
                        </div>
                        <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mt-1">
                          {new Date(listing.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 gap-4 sm:gap-0 border-t border-white/5 sm:border-none">
                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                          <Eye className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{listing.views || 0} <span className="text-[10px] text-gray-600 uppercase ml-0.5">Views</span></span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                          <Package className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{listing.sales || 0} <span className="text-[10px] text-gray-600 uppercase ml-0.5">Sales</span></span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button 
                          onClick={() => onEdit?.(listing.id)}
                          className="flex-1 sm:flex-none p-2.5 bg-white/5 hover:bg-indigo-500/20 text-gray-400 hover:text-indigo-400 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-all flex justify-center"
                          title="Edit Listing"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(listing)}
                          className="flex-1 sm:flex-none p-2.5 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-xl border border-white/5 hover:border-red-500/30 transition-all flex justify-center"
                          title="Delete Listing"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="relative flex-1 sm:flex-none">
                        <button
                          type="button"
                          aria-label={`More actions for ${listing.title}`}
                          aria-expanded={openMenuId === listing.id}
                          onClick={() => setOpenMenuId((current) => current === listing.id ? null : listing.id)}
                          className="w-full p-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl border border-white/5 transition-all flex justify-center"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        <AnimatePresence>
                          {openMenuId === listing.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.96, y: -6 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.96, y: -6 }}
                              className="absolute bottom-12 right-0 z-30 w-48 overflow-hidden rounded-2xl border border-white/10 bg-[#181818] p-1.5 shadow-2xl"
                            >
                              <button type="button" onClick={() => { setOpenMenuId(null); onEdit?.(listing.id); }} className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-gray-200 hover:bg-white/10">Edit listing</button>
                              {listing.status !== 'published' && <button type="button" onClick={() => void updateListingStatus(listing, 'published')} className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-emerald-300 hover:bg-emerald-500/10">Publish</button>}
                              {listing.status === 'published' && <button type="button" onClick={() => void updateListingStatus(listing, 'draft')} className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-amber-300 hover:bg-amber-500/10">Move to drafts</button>}
                              {listing.status !== 'archived' && <button type="button" onClick={() => void updateListingStatus(listing, 'archived')} className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-gray-300 hover:bg-white/10">Archive</button>}
                              <button type="button" onClick={() => { setOpenMenuId(null); handleDeleteClick(listing); }} className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-red-300 hover:bg-red-500/10">Delete</button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#141414] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Delete Listing?</h3>
                    <p className="text-sm text-gray-400">This action cannot be undone.</p>
                  </div>
                  <button 
                    onClick={() => setDeleteModalOpen(false)}
                    className="ml-auto p-2 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-sm text-gray-400 mb-2">To confirm deletion, please type the name of the product below:</p>
                    <p className="text-sm font-bold text-white mb-3 select-none">"{listingToDelete?.title}"</p>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="Type product name here..."
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-red-500/50 outline-none transition-all"
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteModalOpen(false)}
                      className="flex-1 px-6 py-3 rounded-xl font-bold text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDelete}
                      disabled={isDeleting || deleteConfirmText !== listingToDelete?.title}
                      className={`flex-1 px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                        deleteConfirmText === listingToDelete?.title
                          ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20'
                          : 'bg-red-500/20 text-red-500/50 cursor-not-allowed'
                      }`}
                    >
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      Delete Forever
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
