import React from 'react';
import { Share2, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface MessageItemProps {
  msg: any;
  user: any;
  isMe: boolean;
  onContextMenu: (e: React.MouseEvent, messageId: string) => void;
  onShare: (id: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = React.memo(({ 
  msg, 
  user, 
  isMe, 
  onContextMenu, 
  onShare 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col max-w-[85%] lg:max-w-[75%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
      onContextMenu={(e) => onContextMenu(e, msg.id)}
    >
      <div className={`flex items-end gap-2 lg:gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isMe && (
          <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-white/5 border border-white/10 overflow-hidden shrink-0 shadow-lg">
            {msg.user?.avatar_url ? (
              <img src={msg.user.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white/20">
                {msg.user?.full_name?.charAt(0) || '?'}
              </div>
            )}
          </div>
        )}
        
        <div className={`relative group p-4 lg:p-5 rounded-2xl lg:rounded-3xl text-sm lg:text-base shadow-xl border transition-all ${
          isMe 
            ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-sm border-indigo-400/30' 
            : 'bg-gradient-to-br from-[#1A1A1A] to-[#141414] text-gray-200 rounded-tl-sm border-white/5'
        }`}>
          {!isMe && (
            <div className="font-bold mb-1 text-[10px] text-indigo-400 uppercase tracking-widest flex items-center gap-2">
              {msg.user?.full_name || 'Member'}
              <span className="w-1 h-1 rounded-full bg-white/10"></span>
              <span className="text-gray-600 font-medium normal-case tracking-normal">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
          
          {msg.metadata?.attachments?.map((attachment: any, i: number) => (
            <div key={i} className="mb-3 rounded-xl overflow-hidden max-w-sm">
              {attachment.type === 'image' ? (
                <img src={attachment.url} alt={attachment.name} className="w-full h-auto object-cover" referrerPolicy="no-referrer" />
              ) : attachment.type === 'video' ? (
                <video src={attachment.url} controls className="w-full h-auto" />
              ) : null}
            </div>
          ))}

          {msg.content && (
            <p className="leading-relaxed whitespace-pre-wrap font-medium">
              {msg.content}
            </p>
          )}

          <button 
            onClick={() => onShare(msg.id)}
            className={`absolute top-2 ${isMe ? '-left-10' : '-right-10'} opacity-0 group-hover:opacity-100 p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-all shadow-lg backdrop-blur-sm border border-white/5`}
            title="Share message"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {isMe && (
        <div className="flex items-center gap-2 mt-1 mr-1">
          <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest opacity-60">
            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )}
    </motion.div>
  );
});
