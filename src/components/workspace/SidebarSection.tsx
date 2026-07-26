import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MoreVertical, Package, ChevronDown, X, Users } from 'lucide-react';
import { createPortal } from 'react-dom';
import { WorkspaceItemContextMenu } from './WorkspaceItemContextMenu';
import { supabase } from '../../lib/supabase';
import { destructiveAction } from '@/lib/feedback';

interface SidebarSectionProps {
  title: string;
  items: any[];
  type: 'product' | 'community';
  isSidebarExpanded: boolean;
  activeView: string;
  setActiveView: (view: string) => void;
  loading: boolean;
}

export const SidebarSection: React.FC<SidebarSectionProps> = ({
  title,
  items,
  type,
  isSidebarExpanded,
  activeView,
  setActiveView,
  loading
}) => {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, item: any } | null>(null);

  const handleContextMenu = (e: React.MouseEvent, item: any) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, item });
  };

  const handleAction = async (action: string, item: any) => {
    switch (action) {
      case 'open':
        setActiveView(type === 'product' ? `access_${item.id}` : `community_${item.id}`);
        break;
      case 'copy-link':
        const url = type === 'product' 
          ? `${window.location.origin}/listing/${item.id}`
          : `${window.location.origin}/community/${item.id}`;
        navigator.clipboard.writeText(url);
        // Could add a toast here
        break;
      case 'info':
        setActiveView(type === 'product' ? `product-details-${item.id}` : `community-details-${item.id}`);
        break;
      case 'message':
        setActiveView('chats');
        // Logic to open specific chat could be added here
        break;
      case 'leave':
        if (await destructiveAction({ description: `Are you sure you want to ${type === 'product' ? 'archive' : 'leave'} ${type === 'product' ? item.title : item.name}?` })) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          try {
              if (type === 'community') {
                await supabase
                  .from('community_members')
                  .delete()
                  .eq('community_id', item.id)
                  .eq('user_id', user.id);
              } else {
                // For products, mark the order as archived
                await supabase
                  .from('orders')
                  .update({ is_archived: true })
                  .eq('listing_id', item.id)
                  .eq('buyer_id', user.id);
              }
              window.location.reload(); // Refresh to update list
            } catch (err) {
              console.error('Error leaving/archiving:', err);
          }
        }
        break;
      default:
        break;
    }
  };

  const visibleItems = type === 'product' ? items.slice(0, 6) : items.slice(0, 3);
  const hasMore = items.length > (type === 'product' ? 6 : 3);
  const dropdownItems = items.slice(type === 'product' ? 6 : 3, 21);
  const showModalButton = items.length > 21;

  useEffect(() => {
    if (isDropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.top,
        left: rect.right + 8 // 8px gap
      });
    }
  }, [isDropdownOpen]);

  // Close dropdown on scroll or resize
  useEffect(() => {
    const handleScroll = () => {
      if (isDropdownOpen) setDropdownOpen(false);
    };
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isDropdownOpen]);

  return (
    <div className="mb-4 relative">
      <AnimatePresence>
        {isSidebarExpanded && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-3 mb-3 text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] flex justify-between items-center"
          >
            <span>{title}</span>
            {hasMore && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="text-[9px] text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                VIEW ALL
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="space-y-1.5">
        {loading ? (
          <div className="animate-pulse flex gap-3 p-2">
            <div className="w-9 h-9 bg-white/5 rounded-full"></div>
            {isSidebarExpanded && <div className="h-3 bg-white/5 rounded w-20 mt-3"></div>}
          </div>
        ) : items.length > 0 ? (
          <>
            {visibleItems.map((item) => {
              const isActive = activeView === (type === 'product' ? `access_${item.id}` : `community_${item.id}`);
              const image = type === 'product' 
                ? (item.image_url || (item.images && item.images[0])) 
                : (item.logo_url || item.banner_url);
              
              return (
                <button 
                  key={`${type}-${item.id}`} 
                  onClick={() => setActiveView(type === 'product' ? `access_${item.id}` : `community_${item.id}`)}
                  onContextMenu={(e) => handleContextMenu(e, item)}
                  className={`w-full flex items-center gap-3 p-2 rounded-full transition-all group ${
                    isActive ? 'bg-white/10 shadow-sm' : 'hover:bg-white/5'
                  }`}
                  title={type === 'product' ? item.title : item.name}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold shrink-0 overflow-hidden border border-white/5 ${
                    !image ? (type === 'product' ? 'bg-white/5 text-gray-500' : 'bg-gradient-to-br from-indigo-500/10 to-purple-600/10 text-indigo-400') : ''
                  }`}>
                    {image ? (
                      <img src={image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      type === 'product' ? <Package className="w-4 h-4" /> : item.name.charAt(0)
                    )}
                  </div>
                  <AnimatePresence mode="wait">
                    {isSidebarExpanded && (
                      <motion.span 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className={`font-semibold text-xs uppercase tracking-wider whitespace-nowrap truncate text-left ${
                          isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                        }`}
                      >
                        {type === 'product' ? item.title : item.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
            
            {hasMore && (
              <div className="relative">
                <button 
                  ref={buttonRef}
                  onClick={() => setDropdownOpen(!isDropdownOpen)}
                  className="w-full flex items-center gap-3 p-2 rounded-full hover:bg-white/5 transition-all group text-gray-500 hover:text-white"
                >
                  <div className="w-9 h-9 rounded-full bg-white/5 border border-white/5 flex items-center justify-center shrink-0">
                    <MoreVertical className="w-4 h-4" />
                  </div>
                  <AnimatePresence mode="wait">
                    {isSidebarExpanded && (
                      <motion.span 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="font-semibold text-xs uppercase tracking-wider whitespace-nowrap"
                      >
                        More
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>

                {isDropdownOpen && createPortal(
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, x: -10, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -10, scale: 0.95 }}
                      style={{
                        top: dropdownPosition.top,
                        left: dropdownPosition.left,
                      }}
                      className="fixed w-[320px] bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-2xl z-50 p-4"
                    >
                      <h3 className="text-sm font-bold text-white mb-3 px-1">More {title}</h3>
                      <div className="grid grid-cols-5 gap-2">
                        {dropdownItems.map((item) => {
                          const image = type === 'product' 
                            ? (item.image_url || (item.images && item.images[0])) 
                            : (item.logo_url || item.banner_url);
                          
                          return (
                            <button
                              key={`${type}-dropdown-${item.id}`}
                              onClick={() => {
                                setActiveView(type === 'product' ? `access_${item.id}` : `community_${item.id}`);
                                setDropdownOpen(false);
                              }}
                              onContextMenu={(e) => {
                                handleContextMenu(e, item);
                                setDropdownOpen(false);
                              }}
                              className="aspect-square rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all overflow-hidden relative group"
                              title={type === 'product' ? item.title : item.name}
                            >
                              {image ? (
                                <img src={image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  {type === 'product' ? <Package className="w-5 h-5" /> : <span className="text-sm font-bold">{item.name.charAt(0)}</span>}
                                </div>
                              )}
                            </button>
                          );
                        })}
                        {showModalButton && (
                          <button
                            onClick={() => {
                              setIsModalOpen(true);
                              setDropdownOpen(false);
                            }}
                            className="aspect-square rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all flex items-center justify-center text-xs text-indigo-400 font-bold"
                          >
                            +{items.length - 18}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  </>,
                  document.body
                )}
              </div>
            )}
          </>
        ) : (
          <div className="p-2 text-xs text-gray-600 text-center flex justify-center">
            {isSidebarExpanded ? (
              `No ${title.toLowerCase()} yet`
            ) : (
              type === 'product' ? <Package className="w-4 h-4 opacity-50" /> : <Users className="w-4 h-4 opacity-50" />
            )}
          </div>
        )}
      </div>

      {contextMenu && createPortal(
        <WorkspaceItemContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          item={contextMenu.item}
          type={type}
          onClose={() => setContextMenu(null)}
          onAction={handleAction}
        />,
        document.body
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-[#141414] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col pointer-events-auto shadow-2xl">
                <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0">
                  <h2 className="text-xl font-bold text-white">All {title}</h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {items.map((item) => {
                    const image = type === 'product' 
                      ? (item.image_url || (item.images && item.images[0])) 
                      : (item.logo_url || item.banner_url);
                    
                    return (
                      <button
                        key={`${type}-modal-${item.id}`}
                        onClick={() => {
                          setActiveView(type === 'product' ? `access_${item.id}` : `community_${item.id}`);
                          setIsModalOpen(false);
                        }}
                        onContextMenu={(e) => {
                          handleContextMenu(e, item);
                          setIsModalOpen(false);
                        }}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group text-left"
                      >
                        <div className="w-12 h-12 rounded-xl bg-black/20 shrink-0 overflow-hidden flex items-center justify-center">
                          {image ? (
                            <img src={image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            type === 'product' ? <Package className="w-6 h-6 text-gray-500" /> : <span className="text-lg font-bold text-gray-500">{item.name.charAt(0)}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-medium text-white truncate group-hover:text-indigo-400 transition-colors">
                            {type === 'product' ? item.title : item.name}
                          </h3>
                          <p className="text-xs text-gray-500 truncate">
                            {type === 'product' ? 'Product' : `${item.member_count || 0} members`}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
