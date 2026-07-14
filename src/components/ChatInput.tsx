import React, { useState } from 'react';
import { 
  Plus, Send, Mic, Rocket, 
  ChevronDown, Paperclip, Smile,
  Zap, Globe, Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../context/ThemeContext';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  onOpenContext: () => void;
  isTyping?: boolean;
}

export const ChatInput = ({ onSendMessage, onOpenContext, isTyping }: ChatInputProps) => {
  const { isDark } = useTheme();
  const [text, setText] = useState('');
  const [showAutoMenu, setShowAutoMenu] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim() || isTyping) return;
    onSendMessage(text);
    setText('');
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6">
      <form 
        onSubmit={handleSubmit}
        className={`relative flex flex-col rounded-[2.5rem] p-6 transition-all shadow-2xl ${
          isDark 
            ? 'bg-[#0A0A0A] border border-white/10 focus-within:border-white/20' 
            : 'bg-white border border-gray-200 focus-within:border-black'
        }`}
      >
        {/* Text Input Area */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Type your message..."
          className="w-full bg-transparent outline-none resize-none text-lg min-h-[80px] placeholder-gray-500"
        />

        {/* Bottom Action Bar */}
        <div className="flex items-center justify-between mt-4">
          {/* Left Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenContext}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <Plus className="w-6 h-6" />
            </button>
            <button
              type="button"
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <Smile className="w-6 h-6" />
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Automatic Mode Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAutoMenu(!showAutoMenu)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <Rocket className="w-4 h-4" />
                <span>Automatisch</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showAutoMenu ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {showAutoMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className={`absolute bottom-full right-0 mb-4 w-48 rounded-2xl shadow-2xl border overflow-hidden z-50 ${
                      isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-black/5'
                    }`}
                  >
                    <div className="p-2">
                      {['Automatisch', 'Manual', 'AI Only'].map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setShowAutoMenu(false)}
                          className={`w-full p-3 rounded-xl text-left text-xs font-bold transition-colors ${
                            isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-50 text-gray-600'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Voice Input */}
            <button
              type="button"
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <Mic className="w-5 h-5" />
            </button>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!text.trim() || isTyping}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                text.trim() && !isTyping
                  ? (isDark ? 'bg-white text-black' : 'bg-black text-white')
                  : (isDark ? 'bg-white/5 text-gray-600' : 'bg-gray-100 text-gray-300')
              }`}
            >
              <Send className="w-6 h-6 -rotate-45 -translate-y-0.5 translate-x-0.5" />
            </button>
          </div>
        </div>
      </form>

      {/* Security Footer */}
      <div className="mt-4 flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">
        <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Secure Chat</span>
        <span className="w-1 h-1 rounded-full bg-gray-300" />
        <span>End-to-end encrypted</span>
      </div>
    </div>
  );
};
