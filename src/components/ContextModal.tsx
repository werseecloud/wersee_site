import React, { useEffect, useState } from 'react';
import { 
  X, BookOpen, Globe, 
  Zap, Clock, ChevronRight,
  Layout, PlayCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';

interface ContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: 'course' | 'page', item: any) => void;
}

export const ContextModal = ({ isOpen, onClose, onSelect }: ContextModalProps) => {
  const { isDark } = useTheme();
  const [courses, setCourses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [pages, setPages] = useState<any[]>([
    { id: 'p1', name: 'Workspace > Analytics', url: '/workspace/analytics', time: '2 mins ago' },
    { id: 'p2', name: 'Course Builder > Lesson 4', url: '/builder/lesson-4', time: '15 mins ago' },
    { id: 'p3', name: 'Marketplace > Premium UI Kit', url: '/marketplace/ui-kit', time: '1 hour ago' }
  ]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch purchased items (orders)
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          listing_id,
          listings (
            id,
            title,
            type,
            price
          )
        `)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (orders) {
        const fetchedCourses = orders
          .filter(o => {
            const listing = Array.isArray(o.listings) ? o.listings[0] : o.listings;
            return listing?.type === 'course';
          })
          .map(o => {
            const listing = Array.isArray(o.listings) ? o.listings[0] : o.listings;
            return {
              id: listing?.id,
              name: listing?.title,
              instructor: 'Instructor',
              progress: '0%'
            };
          });
        setCourses(fetchedCourses);

        const fetchedProducts = orders
          .filter(o => {
            const listing = Array.isArray(o.listings) ? o.listings[0] : o.listings;
            return listing?.type !== 'course';
          })
          .map(o => {
            const listing = Array.isArray(o.listings) ? o.listings[0] : o.listings;
            return {
              id: listing?.id,
              name: listing?.title,
              type: listing?.type,
              price: `$${listing?.price}`,
              icon: Layout
            };
          });
        setProducts(fetchedProducts);
      }
    };

    fetchData();
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative w-full max-w-3xl rounded-[2.5rem] shadow-2xl border overflow-hidden ${
              isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-black/5'
            }`}
          >
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <Zap className="w-6 h-6 text-blue-500" />
                  Inject Context
                </h2>
                <p className="text-sm text-gray-500 mt-1">Select an item to help our support team understand your issue.</p>
              </div>
              <button 
                onClick={onClose}
                className={`p-3 rounded-full transition-colors ${isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Courses Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500">
                  <BookOpen className="w-4 h-4" />
                  Active Courses
                </div>
                <div className="space-y-2">
                  {courses.length > 0 ? (
                    courses.map((course: any) => (
                      <button
                        key={course.id}
                        onClick={() => onSelect('course', course)}
                        className={`w-full p-4 rounded-2xl text-left transition-all group border ${
                          isDark 
                            ? 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20' 
                            : 'bg-gray-50 border-black/5 hover:bg-gray-100 hover:border-black/10'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <PlayCircle className="w-5 h-5 text-blue-500" />
                          <span className="text-[10px] font-bold text-gray-50">{course.progress} Complete</span>
                        </div>
                        <p className="text-sm font-bold mb-1">{course.name}</p>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{course.instructor}</p>
                      </button>
                    ))
                  ) : (
                    <div className={`p-8 rounded-2xl border-2 border-dashed text-center ${
                      isDark ? 'border-white/5 bg-white/2' : 'border-black/5 bg-gray-50'
                    }`}>
                      <BookOpen className="w-8 h-8 mx-auto text-gray-500 mb-2 opacity-20" />
                      <p className="text-xs font-bold text-gray-500">No active courses</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Products Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500">
                  <Layout className="w-4 h-4" />
                  Purchased Items
                </div>
                <div className="space-y-2">
                  {products.length > 0 ? products.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => onSelect('course', product)}
                      className={`w-full p-4 rounded-2xl text-left transition-all group border ${
                        isDark 
                          ? 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20' 
                          : 'bg-gray-50 border-black/5 hover:bg-gray-100 hover:border-black/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <product.icon className="w-5 h-5 text-purple-500" />
                        <span className="text-[10px] font-bold text-gray-500">{product.type}</span>
                      </div>
                      <p className="text-sm font-bold mb-1">{product.name}</p>
                      <p className="text-[10px] text-blue-500 font-bold">{product.price}</p>
                    </button>
                  )) : (
                    <div className={`p-8 rounded-2xl border-2 border-dashed text-center ${
                      isDark ? 'border-white/5 bg-white/2' : 'border-black/5 bg-gray-50'
                    }`}>
                      <Layout className="w-8 h-8 mx-auto text-gray-500 mb-2 opacity-20" />
                      <p className="text-xs font-bold text-gray-500">No purchased items</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Pages Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500">
                  <Globe className="w-4 h-4" />
                  Recent Pages
                </div>
                <div className="space-y-2">
                  {pages.map((page) => (
                    <button
                      key={page.id}
                      onClick={() => onSelect('page', page)}
                      className={`w-full p-4 rounded-2xl text-left transition-all group border ${
                        isDark 
                          ? 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20' 
                          : 'bg-gray-50 border-black/5 hover:bg-gray-100 hover:border-black/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Layout className="w-5 h-5 text-emerald-500" />
                        <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {page.time}
                        </span>
                      </div>
                      <p className="text-sm font-bold mb-1">{page.name}</p>
                      <p className="text-[10px] text-gray-500 font-medium truncate">{page.url}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={`p-6 border-t flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 ${
              isDark ? 'bg-black/20 border-white/5' : 'bg-gray-50 border-black/5'
            }`}>
              <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Context Injection</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span>Free Member Status</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
