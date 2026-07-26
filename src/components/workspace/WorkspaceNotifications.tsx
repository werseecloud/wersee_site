import React, { useState } from 'react';
import { Bell, Check, Trash2, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate, useParams } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';

export function WorkspaceNotifications({ user }: { user: any }) {
  const navigate = useNavigate();
  const { accountHandle } = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, requestPermission } = useNotifications();
  const workspaceBasePath = accountHandle ? `/${accountHandle}/workspace` : '/workspace';

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await supabase.from('notifications').delete().eq('id', id);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => {
          setIsOpen(!isOpen);
          requestPermission(); // Request push permission when they open notifications
        }}
        className="relative p-2.5 text-gray-400 hover:text-white bg-white/5 rounded-xl border border-white/5 active:scale-95 transition-all"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[190]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-2xl z-[200] overflow-hidden"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                <h3 className="font-bold text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {notifications.map((notification) => (
                      <div 
                        key={notification.id}
                        onClick={() => {
                          if (!notification.read) markAsRead(notification.id);
                          if (notification.data?.url) {
                            navigate(notification.data.url);
                            setIsOpen(false);
                          }
                        }}
                        className={`p-4 hover:bg-white/5 transition-colors cursor-pointer group ${!notification.read ? 'bg-blue-500/5' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <img src="/vite.svg" alt="Wersee" className="w-4 h-4 rounded-full" referrerPolicy="no-referrer" />
                              {!notification.read && (
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0" />
                              )}
                              <h4 className={`text-sm font-medium truncate ${!notification.read ? 'text-white' : 'text-gray-300'}`}>
                                {notification.title}
                              </h4>
                            </div>
                            <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                              {notification.message}
                            </p>
                            <span className="text-[10px] text-gray-500">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <button 
                            onClick={(e) => deleteNotification(notification.id, e)}
                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {notifications.length > 0 && (
                <div className="p-3 border-t border-white/10 bg-white/5">
                  <button 
                    onClick={() => {
                      navigate(`${workspaceBasePath}/notifications`);
                      setIsOpen(false);
                    }}
                    className="w-full py-2 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    View all notifications
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
