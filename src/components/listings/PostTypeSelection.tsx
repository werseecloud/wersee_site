import React from 'react';
import { motion } from 'motion/react';
import { 
  X, Briefcase, Package, Wrench, FileCode, Box,
  Gamepad2, Users, Monitor, Link, Megaphone,
  ArrowRight
} from 'lucide-react';
import { useListingWizard } from '../../context/ListingWizardContext';

interface PostTypeSelectionProps {
  onClose: () => void;
}

export const PostTypeSelection: React.FC<PostTypeSelectionProps> = ({ onClose }) => {
  const { openWizard } = useListingWizard();

  const postTypes = [
    {
      id: 'product',
      title: 'Physical Product',
      description: 'Sell tangible items like electronics, fashion or furniture',
      icon: Package,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      tag: 'Popular'
    },
    {
      id: 'digital',
      title: 'Digital Product',
      description: 'Sell courses, e-books, software or assets',
      icon: FileCode,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      tag: 'High Margin'
    },
    {
      id: 'asset_3d',
      title: '3D Asset',
      description: 'Sell models, textures, rigs, animations or asset packs',
      icon: Box,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10',
      tag: 'New'
    },
    {
      id: 'service',
      title: 'Service',
      description: 'Offer consulting, design, or professional services',
      icon: Wrench,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10'
    },
    {
      id: 'job',
      title: 'Job / Vacancy',
      description: 'Hire talent or post career opportunities',
      icon: Briefcase,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10'
    },
    {
      id: 'community',
      title: 'Paid Community',
      description: 'Start a subscription-based group or group chat',
      icon: Users,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10'
    },
    {
      id: 'affiliate',
      title: 'Affiliate Product',
      description: 'Promote external products and earn commission',
      icon: Link,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10'
    },
    {
      id: 'virtual',
      title: 'Virtual Item',
      description: 'Sell in-game items, skins, or digital currency',
      icon: Gamepad2,
      color: 'text-pink-400',
      bg: 'bg-pink-500/10'
    },
    {
      id: 'pos_item',
      title: 'POS Item',
      description: 'Add items for in-person sales and inventory',
      icon: Monitor,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10'
    },
    {
      id: 'announcement',
      title: 'Announcement',
      description: 'Share news, updates or important alerts',
      icon: Megaphone,
      color: 'text-red-400',
      bg: 'bg-red-500/10'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl overflow-hidden"
    >
      {/* Ambient Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-5xl max-h-[90vh] flex flex-col relative z-10">
        <div className="flex justify-between items-end mb-12 px-6">
          <div className="space-y-2">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl lg:text-6xl font-black text-white tracking-tighter leading-none"
            >
              CREATE <span className="text-gray-600">SOMETHING</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[10px]"
            >
              Select your listing type to begin
            </motion.p>
          </div>
          <motion.button 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={onClose}
            className="p-4 rounded-2xl bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all border border-white/5 group"
          >
            <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
          </motion.button>
        </div>

        <motion.div 
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.03
              }
            }
          }}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6 overflow-y-auto custom-scrollbar"
        >
          {postTypes.map((type) => (
            <motion.button
              variants={{
                hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
                show: { opacity: 1, y: 0, filter: 'blur(0px)' }
              }}
              key={type.id}
              onClick={() => openWizard(type.id as any)}
              className="group relative flex flex-col p-8 rounded-[2.5rem] bg-[#0A0A0A] border border-white/5 hover:border-white/20 transition-all text-left overflow-hidden shadow-2xl"
            >
              {type.tag && (
                <div className="absolute top-6 right-6 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                  <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">{type.tag}</span>
                </div>
              )}
              
              <div className={`w-14 h-14 rounded-2xl ${type.bg} ${type.color} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                <type.icon className="w-7 h-7" />
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">{type.title}</h3>
              <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6">{type.description}</p>
              
              <div className="mt-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                Start Creating <ArrowRight className="w-3 h-3" />
              </div>
              
              {/* Animated background pattern */}
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.02] pointer-events-none" />
              
              {/* Subtle gradient glow on hover */}
              <div className={`absolute -bottom-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity ${type.bg}`} />
            </motion.button>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};
