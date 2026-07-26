import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Edit, Trash2, Eye, MoreVertical, Package, Search, Filter, Plus, Star } from 'lucide-react';
import { DatabaseService } from '../../services/databaseService';
import { useListingWizard } from '../../context/ListingWizardContext';

interface Listing {
  id: string;
  title: string;
  price: number;
  status: string;
  views: number;
  images: string[];
  category: string;
  type: string;
  created_at: string;
  rating_avg?: number;
  rating_count?: number;
}

import { Skeleton } from '../ui/Skeleton';

import { destructiveAction } from '@/lib/feedback';
const ListingSkeleton = () => (
  <div className="bg-white rounded-2xl p-4 border border-gray-100">
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

export const SellerListings = ({ user }: { user: any }) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'draft'>('all');
  const { openWizard } = useListingWizard();

  useEffect(() => {
    fetchListings();
  }, [user, activeTab]);

  const fetchListings = async () => {
    try {
      setLoading(true);

      const query: any = { seller_id: user.id };
      if (activeTab !== 'all') {
        query.status = activeTab;
      }

      const data = await DatabaseService.get<Listing>('listings', {
        eq: query,
        order: { column: 'created_at', ascending: false }
      });

      setListings((data as Listing[]) || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await destructiveAction({ description: 'Are you sure you want to delete this listing?' }))) return;
    
    try {
      await DatabaseService.delete('listings', id);
      setListings(listings.filter(l => l.id !== id));
    } catch (error) {
      console.error('Error deleting listing:', error);
    }
  };

  const filteredListings = listings.filter(l => 
    l.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1D1D1F]">My Listings</h2>
          <p className="text-gray-500">Manage your products and services</p>
        </div>
        <button 
          onClick={() => openWizard('product')}
          className="w-full sm:w-auto px-8 py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-black/10 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" /> Create New Listing
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-gray-100 shadow-sm w-fit">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'all' ? 'bg-black text-white shadow-lg' : 'text-gray-500 hover:text-black'
          }`}
        >
          Management
        </button>
        <button
          onClick={() => setActiveTab('draft')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'draft' ? 'bg-black text-white shadow-lg' : 'text-gray-500 hover:text-black'
          }`}
        >
          Concepts
        </button>
        <button
          onClick={() => setActiveTab('published')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'published' ? 'bg-black text-white shadow-lg' : 'text-gray-500 hover:text-black'
          }`}
        >
          Live
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search listings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-transparent outline-none"
          />
        </div>
        <button className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-500">
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {loading ? (
          <>
            <ListingSkeleton />
            <ListingSkeleton />
            <ListingSkeleton />
          </>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No listings found</h3>
            <p className="text-gray-500 mb-6">Start selling by creating your first listing.</p>
            <button 
              onClick={() => openWizard('product')}
              className="text-blue-600 font-medium hover:underline"
            >
              Create Listing
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredListings.map((listing) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex gap-4">
                  {/* Image */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                    {listing.images?.[0] ? (
                      <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Package className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-[#1D1D1F] truncate pr-4">{listing.title}</h3>
                        <p className="text-sm text-gray-500 mb-1">{listing.category}</p>
                        <div className="font-medium">€{listing.price}</div>
                      </div>
                      <div className="relative">
                        <button className="p-2 hover:bg-gray-50 rounded-full text-gray-400 hover:text-black transition-colors">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                        <Eye className="w-3 h-3" />
                        <span>{listing.views || 0} views</span>
                      </div>
                      {listing.rating_count && listing.rating_count > 0 ? (
                        <div className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-md">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{listing.rating_avg?.toFixed(1)} ({listing.rating_count})</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                          <span>No reviews</span>
                        </div>
                      )}
                      <span className={`text-xs px-2 py-1 rounded-md capitalize ${
                        listing.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                      }`}>
                        {listing.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions (Mobile optimized) */}
                <div className="flex gap-3 mt-4 pt-4 border-t border-gray-50">
                  <button 
                    onClick={() => openWizard(listing.type as any, listing.id)}
                    className="flex-1 py-2.5 text-sm font-bold text-gray-700 hover:bg-black hover:text-white rounded-xl transition-all flex items-center justify-center gap-2 border border-gray-100 hover:border-black shadow-sm"
                  >
                    <Edit className="w-4 h-4" /> {listing.status === 'draft' ? 'Continue' : 'Edit'}
                  </button>
                  <button 
                    onClick={() => handleDelete(listing.id)}
                    className="flex-1 py-2.5 text-sm font-bold text-red-600 hover:bg-red-500 hover:text-white rounded-xl transition-all flex items-center justify-center gap-2 border border-red-50 hover:border-red-500 shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
