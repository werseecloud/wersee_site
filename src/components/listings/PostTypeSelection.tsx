import React from 'react';
import { motion } from 'motion/react';
import { 
  X, Briefcase, Package, Wrench, FileCode, Box,
  Gamepad2, Users, Monitor, Link, Megaphone,
  ChevronRight, Layers
} from 'lucide-react';
import { useListingWizard } from '../../context/ListingWizardContext';

interface PostTypeSelectionProps {
  onClose: () => void;
  onSelect?: (type: string) => void;
  embedded?: boolean;
}

export const PostTypeSelection: React.FC<PostTypeSelectionProps> = ({ onClose, onSelect, embedded = false }) => {
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
      id: 'bundle',
      title: 'Bundle',
      description: 'Package multiple products into one offer',
      icon: Layers,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
      tag: 'Upsell'
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
      className={`${embedded ? 'relative min-h-[calc(100dvh-5rem)]' : 'fixed inset-0 z-[110]'} flex items-center justify-center overflow-hidden bg-[#050505] px-4 py-6 sm:p-8`}
    >
      <div className="relative z-10 flex max-h-[92dvh] w-full max-w-5xl flex-col">
        <div className="flex items-start justify-between gap-6 px-2 pb-7 sm:px-4 sm:pb-10">
          <div>
            <p className="mb-3 text-xs font-medium text-zinc-500">New listing</p>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl text-4xl font-semibold tracking-[-0.045em] text-white sm:text-5xl"
            >
              What would you like to sell?
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-3 max-w-xl text-sm leading-6 text-zinc-500"
            >
              Choose the format that best matches your offer. You can refine every detail in the next steps.
            </motion.p>
          </div>
          <motion.button 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={onClose}
            aria-label="Close listing type selection"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/[0.08] bg-white/[0.04] text-zinc-500 transition hover:bg-white/[0.08] hover:text-white"
          >
            <X className="h-5 w-5" />
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
          className="custom-scrollbar grid auto-rows-[minmax(92px,auto)] grid-cols-1 gap-2 overflow-y-auto px-2 pb-6 sm:grid-cols-2 sm:gap-3 sm:px-4"
        >
          {postTypes.map((type) => (
            <motion.button
              variants={{
                hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
                show: { opacity: 1, y: 0, filter: 'blur(0px)' }
              }}
              key={type.id}
              onClick={() => onSelect ? onSelect(type.id) : openWizard(type.id as any)}
              className="group relative flex h-full min-h-[92px] items-center gap-4 overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 text-left transition hover:border-white/[0.15] hover:bg-white/[0.055] sm:min-h-28 sm:p-5"
            >
              <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${type.bg} ${type.color} transition-transform duration-300 group-hover:scale-105`}>
                <type.icon className="h-5 w-5" />
              </div>
              
              <div className="min-w-0 flex-1">
                <h3 className="text-[15px] font-semibold tracking-tight text-zinc-100">{type.title}</h3>
                <p className="mt-1 pr-3 text-xs leading-5 text-zinc-500 sm:text-[13px]">{type.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-zinc-700 transition group-hover:translate-x-0.5 group-hover:text-zinc-300" />
            </motion.button>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};
