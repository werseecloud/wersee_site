import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Package, ExternalLink, Play, FileText, ChevronRight, Search, ShoppingBag, Box } from 'lucide-react';
import { motion } from 'framer-motion';

interface JoinedProductsViewProps {
  onNavigate: (view: string) => void;
}

export const JoinedProductsView: React.FC<JoinedProductsViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchJoinedProducts();
  }, [user]);

  const fetchJoinedProducts = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          listing:listings (
            id,
            title,
            description,
            image_url,
            images,
            type,
            metadata,
            seller_id
          )
        `)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (orders) {
        let extractedProducts = orders
          .map((o: any) => o.listing ? { ...o.listing, purchase: { id: o.id, created_at: o.created_at } } : null)
          .filter((l: any) => l !== null);
          
        // Find bundles
        const bundles = extractedProducts.filter((p: any) => p.type === 'bundle');
        
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
                  description,
                  image_url,
                  images,
                  type,
                  seller_id
                )
              `)
              .in('bundle_id', regularBundleIds);
              
            if (bundleItemsData) {
              const itemsFromBundles = bundleItemsData
                .map((bi: any) => bi.listing)
                .filter((l: any) => l !== null);
                
              extractedProducts = [...extractedProducts, ...itemsFromBundles];
            }
          }
          
          // Fetch items for all-access bundles
          for (const aaBundle of allAccessBundles) {
            if (aaBundle.metadata?.all_access_category && aaBundle.seller_id) {
              const { data: aaItems } = await supabase
                .from('listings')
                .select(`
                  id, 
                  title, 
                  description,
                  image_url, 
                  images, 
                  type,
                  seller_id
                `)
                .eq('seller_id', aaBundle.seller_id)
                .eq('category', aaBundle.metadata.all_access_category)
                .neq('type', 'bundle');
                
              if (aaItems) {
                extractedProducts = [...extractedProducts, ...aaItems];
              }
            }
          }
        }
        
        // Remove duplicates and filter out bundles
        const uniqueProducts = Array.from(new Map(extractedProducts.map((item: any) => [item.id, item])).values())
          .filter((item: any) => item.type !== 'bundle');
          
        // Fetch businesses separately
        const sellerIds = [...new Set(uniqueProducts.map((p: any) => p.seller_id).filter(Boolean))];
        if (sellerIds.length > 0) {
          const { data: businessesData } = await supabase
            .from('businesses')
            .select('id, name, logo_url, user_id')
            .in('user_id', sellerIds);
            
          if (businessesData) {
            const businessMap = businessesData.reduce((acc: any, b: any) => {
              acc[b.user_id] = b;
              return acc;
            }, {});
            
            uniqueProducts.forEach((p: any) => {
              if (p.seller_id && businessMap[p.seller_id]) {
                p.business = businessMap[p.seller_id];
              }
            });
          }
        }
        
        setProducts(uniqueProducts);
      }
    } catch (error) {
      console.error('Error fetching joined products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => 
    product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.business?.name && product.business.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
              <ShoppingBag className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Workspace</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">My Purchases</h1>
          <p className="text-gray-400 text-lg max-w-md">Access all the products and courses you've joined in your journey.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          {/* View Toggle */}
          <div className="flex items-center bg-white/5 p-1 rounded-2xl border border-white/5 w-full sm:w-auto">
            <button 
              onClick={() => setViewMode('grid')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'grid' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
            >
              Grid
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
            >
              List
            </button>
          </div>

          <div className="relative w-full sm:w-72 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-white transition-colors" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all"
            />
          </div>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-20 text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/10">
              <Package className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-2xl font-black text-white mb-3">No products yet</h3>
            <p className="text-gray-400 max-w-sm mx-auto mb-8 font-medium">
              You haven't joined any products or courses yet. Explore businesses to find something you like.
            </p>
            <button 
              onClick={() => window.location.href = '/'}
              className="px-8 py-3 bg-white text-black rounded-2xl font-bold hover:bg-gray-200 transition-all active:scale-95"
            >
              Explore Store
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onNavigate(`access_${product.id}`)}
              className="group bg-[#111111] border border-white/5 rounded-[2rem] overflow-hidden hover:border-white/20 transition-all cursor-pointer flex flex-col shadow-2xl hover:shadow-white/5"
            >
              <div className="aspect-[16/10] relative bg-gray-900 overflow-hidden">
                {product.image_url || (product.images && product.images.length > 0) ? (
                  <img 
                    src={product.image_url || product.images[0]} 
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                    <Package className="w-12 h-12 text-gray-700" />
                  </div>
                )}
                
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                
                {/* Product Type Badge */}
                <div className="absolute top-5 right-5 px-4 py-1.5 bg-black/60 backdrop-blur-xl rounded-full border border-white/10 flex items-center gap-2 shadow-2xl">
                  {product.type === 'course' ? (
                    <Play className="w-3.5 h-3.5 text-indigo-400" />
                  ) : product.type === 'asset_3d' ? (
                    <Box className="w-3.5 h-3.5 text-sky-400" />
                  ) : product.type === 'digital' ? (
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Package className="w-3.5 h-3.5 text-blue-400" />
                  )}
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">{product.type}</span>
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col">
                {product.business && (
                  <div className="flex items-center gap-2.5 mb-4">
                    {product.business.logo_url ? (
                      <img src={product.business.logo_url} alt={product.business.name} className="w-6 h-6 rounded-lg object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/20">
                        <span className="text-[10px] font-black text-indigo-400">{product.business.name.charAt(0)}</span>
                      </div>
                    )}
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{product.business.name}</span>
                  </div>
                )}
                
                <h3 className="text-xl font-black text-white mb-3 group-hover:text-indigo-400 transition-colors line-clamp-2 leading-tight">
                  {product.title}
                </h3>
                
                <p className="text-sm text-gray-500 line-clamp-2 mb-8 flex-1 font-medium leading-relaxed">
                  {product.description || 'No description provided.'}
                </p>
                
                <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {product.type === 'asset_3d' ? 'View in 3D' : 'Ready to access'}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-300 shadow-lg">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onNavigate(`access_${product.id}`)}
              className="group bg-[#111111] border border-white/5 rounded-3xl p-4 hover:border-white/20 transition-all cursor-pointer flex items-center gap-6"
            >
              <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 bg-gray-900 border border-white/5">
                {product.image_url || (product.images && product.images.length > 0) ? (
                  <img 
                    src={product.image_url || product.images[0]} 
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-8 h-8 text-gray-700" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{product.type}</span>
                  {product.type === 'asset_3d' && (
                    <span className="rounded-md border border-sky-300/20 bg-sky-400/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-sky-200">3D</span>
                  )}
                  {product.business && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-white/10" />
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{product.business.name}</span>
                    </>
                  )}
                </div>
                <h3 className="text-lg font-black text-white group-hover:text-indigo-400 transition-colors truncate">
                  {product.title}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-1 font-medium">
                  {product.description || 'No description provided.'}
                </p>
              </div>

              <div className="flex items-center gap-6 pr-4">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Status</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-white">Active</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-300">
                  <ChevronRight className="w-6 h-6" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
