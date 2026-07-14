import React, { useState, useEffect } from 'react';
import { DatabaseService } from '../../services/databaseService';
import { motion } from 'framer-motion';
import { Store, Package, Users, DollarSign, TrendingUp, Activity, ArrowRight, Settings, ChevronRight, Layout, CreditCard } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BusinessDashboardProps {
  businessId: string;
  onNavigate: (view: string) => void;
}

type Accent = 'emerald' | 'blue' | 'violet' | 'amber';

const accentClasses: Record<Accent, { icon: string; glow: string; badge: string }> = {
  emerald: {
    icon: 'bg-emerald-500/[0.12] text-emerald-300 border-emerald-400/20',
    glow: 'from-emerald-400/[0.18]',
    badge: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/15',
  },
  blue: {
    icon: 'bg-blue-500/[0.12] text-blue-300 border-blue-400/20',
    glow: 'from-blue-400/[0.18]',
    badge: 'bg-blue-400/10 text-blue-300 border-blue-400/15',
  },
  violet: {
    icon: 'bg-violet-500/[0.12] text-violet-300 border-violet-400/20',
    glow: 'from-violet-400/[0.18]',
    badge: 'bg-violet-400/10 text-violet-300 border-violet-400/15',
  },
  amber: {
    icon: 'bg-amber-500/[0.12] text-amber-300 border-amber-400/20',
    glow: 'from-amber-400/[0.18]',
    badge: 'bg-amber-400/10 text-amber-300 border-amber-400/15',
  },
};

export const BusinessDashboard: React.FC<BusinessDashboardProps> = ({ businessId, onNavigate }) => {
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const statCards: Array<{
    label: string;
    value: React.ReactNode;
    icon: LucideIcon;
    accent: Accent;
    detail?: string;
  }> = [
    {
      label: 'Total Revenue',
      value: <>&euro;0.00</>,
      icon: DollarSign,
      accent: 'emerald',
      detail: '+12%',
    },
    {
      label: 'Active Products',
      value: '0',
      icon: Package,
      accent: 'blue',
    },
    {
      label: 'Customers',
      value: '0',
      icon: Users,
      accent: 'violet',
    },
    {
      label: 'Active Subscriptions',
      value: '0',
      icon: Activity,
      accent: 'amber',
    },
  ];

  const quickActions: Array<{
    label: string;
    description: string;
    icon: LucideIcon;
    accent: Accent;
    view: string;
  }> = [
    {
      label: 'Manage Products',
      description: 'Add or edit items',
      icon: Package,
      accent: 'blue',
      view: 'management-products',
    },
    {
      label: 'Subscription Plans',
      description: 'Create recurring plans',
      icon: CreditCard,
      accent: 'violet',
      view: 'management-plans',
    },
    {
      label: 'Site Editor',
      description: 'Customize your storefront',
      icon: Layout,
      accent: 'emerald',
      view: 'management-site-editor',
    },
    {
      label: 'View Finances',
      description: 'Check your balance',
      icon: DollarSign,
      accent: 'amber',
      view: 'money-balance',
    },
  ];

  useEffect(() => {
    const fetchBusiness = async () => {
      setLoading(true);
      try {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(businessId || '');
        
        let data;
        if (isUUID) {
          data = await DatabaseService.get('businesses', {
            or: `slug.eq.${businessId},id.eq.${businessId}`,
            maybeSingle: true
          });
        } else {
          data = await DatabaseService.get('businesses', {
            eq: { slug: businessId },
            maybeSingle: true
          });
        }
        
        setBusiness(data);
      } catch (err) {
        console.error('Error fetching business:', err);
      } finally {
        setLoading(false);
      }
    };

    if (businessId) {
      fetchBusiness();
    }
  }, [businessId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-white/10 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Store className="w-12 h-12 text-gray-600 mb-4" />
        <h2 className="text-2xl font-bold text-white">Business Not Found</h2>
        <p className="text-gray-500 mt-2">The business you are looking for does not exist or you don't have access.</p>
        <button 
          onClick={() => navigate('/workspace/overview')}
          className="mt-6 px-6 py-2 bg-white text-black rounded-full font-medium hover:scale-105 transition-transform"
        >
          Back to Workspace
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto min-h-full text-white">
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.08] via-white/[0.035] to-transparent p-5 sm:p-6 mb-8 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        <div className="absolute -right-24 -top-28 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -left-28 -bottom-32 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {business.logo_url ? (
              <img src={business.logo_url} alt={business.name} className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-white/10 shadow-xl" />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-black shadow-xl border border-white/10">
                {business.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-1 truncate">{business.name}</h1>
              <p className="text-gray-300 font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live & Active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.open(`/${business.slug || business.id}`, '_blank')}
              className="px-5 py-2.5 bg-white text-black rounded-full font-bold hover:bg-gray-100 transition-colors flex items-center gap-2 shadow-lg shadow-black/20"
            >
              View Public Page
              <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => navigate('/workspace/overview?view=settings')}
              className="p-2.5 bg-white/[0.08] border border-white/10 rounded-full text-gray-300 hover:text-white hover:bg-white/[0.14] transition-colors"
              aria-label="Business settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          const classes = accentClasses[card.accent];

          return (
            <motion.div 
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.045] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.16)] backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-white/[0.07] hover:border-white/[0.14]"
            >
              <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${classes.glow} to-transparent opacity-80`} />
              <div className="relative flex items-start justify-between mb-5">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${classes.icon}`}>
                  <Icon className="w-5 h-5" />
                </div>
                {card.detail && (
                  <span className={`text-xs font-bold flex items-center gap-1 border px-2 py-1 rounded-full ${classes.badge}`}>
                    <TrendingUp className="w-3.5 h-3.5" />
                    {card.detail}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 font-medium mb-1 relative">{card.label}</p>
              <h3 className="text-3xl font-black text-white relative">{card.value}</h3>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-6 sm:p-8 shadow-[0_18px_50px_rgba(0,0,0,0.16)] backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Recent Activity</h3>
              <button className="text-sm font-bold text-blue-300 hover:text-blue-200 transition-colors">View All</button>
            </div>
            <div className="flex flex-col items-center justify-center min-h-[280px] text-center border border-dashed border-white/[0.09] rounded-2xl bg-gradient-to-b from-white/[0.035] to-transparent px-6">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center mb-4">
                <Activity className="w-7 h-7 text-gray-400" />
              </div>
              <p className="text-white font-bold text-lg mb-1">No recent activity</p>
              <p className="text-sm text-gray-400 max-w-sm leading-relaxed">When customers interact with your business, it will show up here.</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6 shadow-[0_18px_50px_rgba(0,0,0,0.16)] backdrop-blur-xl">
            <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
            <div className="space-y-2.5">
              {quickActions.map((action) => {
                const Icon = action.icon;
                const classes = accentClasses[action.accent];

                return (
                  <button 
                    key={action.view}
                    onClick={() => onNavigate(action.view)}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.025] hover:bg-white/[0.07] transition-all border border-white/[0.04] hover:border-white/[0.12] group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-105 ${classes.icon}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="text-left min-w-0">
                        <span className="block font-bold text-white truncate">{action.label}</span>
                        <span className="block text-xs text-gray-400 truncate">{action.description}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 shrink-0 text-gray-500 group-hover:text-white transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
