import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { ArrowLeft, Megaphone } from 'lucide-react';
import { motion } from 'motion/react';
import { AnnouncementCard } from '../components/ui/cards/AnnouncementCard';

export const Announcements = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('listings')
        .select('*, profiles!listings_seller_id_fkey(username, full_name, avatar_url)')
        .eq('status', 'published')
        .eq('type', 'announcement')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      if (data) {
        setAnnouncements(data.map(l => ({
          ...l,
          creator_name: l.profiles?.full_name || l.profiles?.username,
          creator_avatar: l.profiles?.avatar_url
        })));
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pt-24 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/" className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/20 rounded-xl">
              <Megaphone className="w-6 h-6 text-indigo-400" />
            </div>
            <h1 className="text-3xl font-bold">Platform Announcements</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {announcements.length === 0 ? (
            <div className="col-span-full text-center p-12 bg-[#141414] rounded-2xl border border-white/5">
              <p className="text-gray-400">No announcements found.</p>
            </div>
          ) : (
            announcements.map((announcement, index) => (
              <motion.div 
                key={announcement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <AnnouncementCard announcement={announcement} />
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
