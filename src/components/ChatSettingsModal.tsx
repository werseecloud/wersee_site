import React from 'react';
import { 
  X, Bell, Shield, 
  Trash2, UserX, Volume2,
  Moon, Sun, Languages,
  Lock, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../context/ThemeContext';

interface ChatSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatSettingsModal = ({ isOpen, onClose }: ChatSettingsModalProps) => {
  const { isDark, toggleTheme } = useTheme();

  const sections = [
    {
      title: 'Preferences',
      items: [
        { icon: Moon, label: 'Dark Mode', action: toggleTheme, value: isDark ? 'On' : 'Off' },
        { icon: Bell, label: 'Notifications', action: () => {}, value: 'Enabled' },
        { icon: Volume2, label: 'Sound Effects', action: () => {}, value: 'On' },
        { icon: Languages, label: 'Language', action: () => {}, value: 'English' }
      ]
    },
    {
      title: 'Privacy & Security',
      items: [
        { icon: Lock, label: 'End-to-End Encryption', action: () => {}, value: 'Active', color: 'text-emerald-500' },
        { icon: EyeOff, label: 'Read Receipts', action: () => {}, value: 'On' },
        { icon: Shield, label: 'Data Protection', action: () => {}, value: 'GDPR Compliant' }
      ]
    },
    {
      title: 'Danger Zone',
      items: [
        { icon: Trash2, label: 'Clear Chat History', action: () => {}, color: 'text-red-500' },
        { icon: UserX, label: 'Block Agent', action: () => {}, color: 'text-red-500' }
      ]
    }
  ];

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
            className={`relative w-full max-w-md rounded-[2.5rem] shadow-2xl border overflow-hidden ${
              isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-black/5'
            }`}
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-xl font-bold">Chat Settings</h2>
              <button 
                onClick={onClose}
                className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
              {sections.map((section) => (
                <div key={section.title} className="space-y-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 px-2">
                    {section.title}
                  </h3>
                  <div className={`rounded-2xl overflow-hidden border ${isDark ? 'bg-white/2 border-white/5' : 'bg-gray-50 border-black/5'}`}>
                    {section.items.map((item, idx) => (
                      <button
                        key={item.label}
                        onClick={item.action}
                        className={`w-full p-4 flex items-center justify-between transition-colors ${
                          isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'
                        } ${idx !== section.items.length - 1 ? (isDark ? 'border-b border-white/5' : 'border-b border-black/5') : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className={`w-4 h-4 ${item.color || 'text-gray-500'}`} />
                          <span className={`text-sm font-medium ${item.color || (isDark ? 'text-gray-200' : 'text-gray-700')}`}>
                            {item.label}
                          </span>
                        </div>
                        {item.value && (
                          <span className="text-xs font-bold text-blue-500">{item.value}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className={`p-6 border-t text-center ${isDark ? 'bg-black/20 border-white/5' : 'bg-gray-50 border-black/5'}`}>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                Avenue Support v2.4.0
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
