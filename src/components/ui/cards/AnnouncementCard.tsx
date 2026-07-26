import React from 'react';
import { Megaphone, Calendar, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

interface AnnouncementCardProps {
  announcement: any;
}

export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({ announcement }) => {
  const words = announcement.description?.split(' ') || [];
  const previewText = words.slice(0, 15).join(' ') + (words.length > 15 ? '...' : '');

  return (
    <motion.div 
      whileHover={{ y: -8 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="bg-[#141414] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl hover:border-indigo-500/30 transition-all flex flex-col h-[320px] relative overflow-hidden group"
    >
      {/* Background Image */}
      {announcement.metadata?.imageUrl && (
        <>
          <img 
            src={announcement.metadata.imageUrl} 
            alt={announcement.title} 
            className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-40 transition-opacity duration-1000 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/90 to-transparent" />
        </>
      )}

      {/* Top: Maker logo and name */}
      <div className="flex items-center gap-4 mb-6 z-10">
        <div className="w-12 h-12 rounded-2xl overflow-hidden bg-indigo-500/10 border border-indigo-500/20 shrink-0 flex items-center justify-center shadow-2xl">
          {announcement.creator_avatar ? (
            <img src={announcement.creator_avatar} alt={announcement.creator_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-indigo-400 font-black text-xl italic tracking-tighter">
              {announcement.creator_name?.charAt(0) || 'U'}
            </div>
          )}
        </div>
        <div>
          <p className="text-white font-black uppercase tracking-widest text-[10px] mb-1">{announcement.creator_name || 'User'}</p>
          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            <Calendar className="w-3 h-3" />
            {new Date(announcement.created_at).toLocaleDateString()}
          </div>
        </div>
        <div className="ml-auto">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <Megaphone className="w-4 h-4 text-indigo-500" />
          </div>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-3 z-10 line-clamp-2 leading-[0.9] group-hover:text-indigo-400 transition-colors">
        {announcement.title}
      </h3>

      {/* Announcement text preview */}
      <div className="relative flex-1 z-10">
        <p className="text-gray-400 text-sm leading-relaxed font-medium">
          {previewText}
        </p>
        
        {/* Gradient blur fading up */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/60 to-transparent pointer-events-none" />
      </div>

      {/* Button: See announcement */}
      <div className="mt-6 z-20">
        <Link 
          to={`/announcements/${announcement.id}`}
          className="w-full py-4 bg-white/5 hover:bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all border border-white/5 hover:border-indigo-500 shadow-2xl active:scale-95"
        >
          See announcement
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
};
