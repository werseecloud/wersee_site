import React from 'react';
import { motion } from 'motion/react';
import { Check, Sparkles, Zap, Building2, Users, Shield, Globe, MessageSquare, BarChart3, Rocket, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PLAN_CATEGORIES = [
  {
    id: 'ai',
    name: 'Wersee AI',
    icon: Sparkles,
    color: 'from-indigo-500 to-purple-600',
    plans: [
      {
        id: 'ai-lite',
        name: 'Lite',
        price: '€9.99',
        period: '/mo',
        description: 'Perfect for getting started with AI assistance.',
        features: [
          'Basic AI Chat',
          'Standard Response Speed',
          '100 Messages per month',
          'Community Support'
        ],
        buttonText: 'Get Started'
      },
      {
        id: 'ai-pro',
        name: 'Pro',
        price: '€29.99',
        period: '/mo',
        description: 'Advanced AI features for power users.',
        features: [
          'Unlimited AI Chat',
          'Priority Response Speed',
          'Advanced Reasoning Models',
          'Image Generation (100/mo)',
          'Early Access to Features'
        ],
        buttonText: 'Upgrade to Pro',
        popular: true
      },
      {
        id: 'ai-elite',
        name: 'Elite',
        price: '€99.99',
        period: '/mo',
        description: 'Tailored solutions for large organizations.',
        features: [
          'Custom AI Training',
          'Dedicated Support',
          'SLA Guarantees',
          'Advanced Security & Compliance',
          'Unlimited Everything'
        ],
        buttonText: 'Upgrade to Elite'
      }
    ]
  },
  {
    id: 'business',
    name: 'Wersee Business',
    icon: Building2,
    color: 'from-blue-500 to-indigo-600',
    plans: [
      {
        name: 'Starter',
        price: '€0',
        period: '/mo',
        description: 'Perfect for small creators and individuals.',
        features: [
          '1 Business Profile',
          'Unlimited Products',
          '5% Marketplace Fee',
          'Standard Support',
          'Basic Analytics'
        ],
        buttonText: 'Current Plan',
        current: true
      },
      {
        name: 'WERSEE PRO',
        price: '€29',
        period: '/mo',
        description: 'Scale your business with zero marketplace fees.',
        features: [
          'Unlimited Business Profiles',
          '0% Marketplace Fee',
          'Priority Support',
          'Advanced Analytics',
          'Featured Listings',
          'Instant Payouts (1% fee)'
        ],
        buttonText: 'Upgrade to PRO',
        popular: true
      },
      {
        name: 'Enterprise',
        price: '€99',
        period: '/mo',
        description: 'For large organizations with high volume.',
        features: [
          'Custom Marketplace Fee',
          'Dedicated Account Manager',
          'White-label Options',
          'API Access Included',
          'SLA Guarantees'
        ],
        buttonText: 'Contact Sales'
      }
    ]
  },
  {
    id: 'community',
    name: 'Wersee Community',
    icon: Users,
    color: 'from-emerald-500 to-teal-600',
    plans: [
      {
        name: 'Basic',
        price: '€0',
        period: '/mo',
        description: 'Build your first community for free.',
        features: [
          'Up to 100 Members',
          'Public Channels',
          'Basic Moderation',
          'Standard Support'
        ],
        buttonText: 'Current Plan',
        current: true
      },
      {
        name: 'Premium',
        price: '€49',
        period: '/mo',
        description: 'Unlock the full potential of your community.',
        features: [
          'Unlimited Members',
          'Private Channels',
          'Advanced Moderation',
          'Custom Branding',
          'Monetization Tools'
        ],
        buttonText: 'Upgrade Community',
        popular: true
      }
    ]
  }
];

export const PlansView = () => {
  const navigate = useNavigate();

  const contactSales = (subject: string) => {
    window.location.href = `mailto:support@wersee.com?subject=${encodeURIComponent(subject)}`;
  };

  const handlePlanAction = (categoryId: string, plan: any) => {
    if (plan.current) {
      return;
    }

    if (categoryId === 'ai' && plan.id) {
      navigate(`/ai-checkout/${plan.id}`);
      return;
    }

    if (plan.buttonText?.toLowerCase().includes('contact')) {
      contactSales(`${plan.name} plan sales`);
      return;
    }

    if (categoryId === 'business') {
      navigate('/fees-plans');
      return;
    }

    if (categoryId === 'community') {
      navigate('/workspace/create-community');
      return;
    }

    navigate('/pricing');
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4 md:px-8">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">Subscription Plans</h1>
        <p className="text-gray-400 text-lg max-w-2xl">
          Choose the perfect plan to power your creativity, business, and community.
        </p>
      </div>

      <div className="space-y-24">
        {PLAN_CATEGORIES.map((category) => (
          <section key={category.id} className="relative">
            <div className="flex items-center gap-4 mb-8">
              <div className={`p-3 rounded-2xl bg-gradient-to-br ${category.color} shadow-lg`}>
                <category.icon className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">{category.name}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {category.plans.map((plan, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -5 }}
                  className={`relative p-8 rounded-[2.5rem] border transition-all duration-300 ${
                    plan.popular 
                      ? 'bg-[#1A1A1A] border-indigo-500/50 shadow-2xl shadow-indigo-500/10' 
                      : 'bg-[#141414] border-white/5 hover:border-white/10'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-500 text-white text-xs font-bold rounded-full uppercase tracking-wider">
                      Most Popular
                    </div>
                  )}

                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                    <p className="text-gray-400 text-sm h-10">{plan.description}</p>
                  </div>

                  <div className="mb-8 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-gray-500 font-medium">{plan.period}</span>
                  </div>

                  <ul className="space-y-4 mb-10">
                    {plan.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-3">
                        <div className="mt-1 p-0.5 rounded-full bg-emerald-500/10">
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        </div>
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    disabled={plan.current}
                    onClick={() => handlePlanAction(category.id, plan)}
                    className={`w-full py-4 rounded-2xl font-bold transition-all ${
                      plan.current
                        ? 'bg-white/5 text-gray-400 cursor-default'
                        : plan.popular
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20'
                        : 'bg-white text-black hover:bg-gray-100'
                    }`}
                  >
                    {plan.buttonText}
                  </button>
                </motion.div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Enterprise/Custom Section */}
      <div className="mt-24 p-12 rounded-[3rem] bg-gradient-to-br from-indigo-600/10 to-purple-600/10 border border-white/5 text-center">
        <Rocket className="w-12 h-12 text-indigo-400 mx-auto mb-6" />
        <h2 className="text-3xl font-bold text-white mb-4">Need something custom?</h2>
        <p className="text-gray-400 max-w-2xl mx-auto mb-8 text-lg">
          We offer custom solutions for large teams and organizations. Get in touch with our team to discuss your specific requirements.
        </p>
        <button
          type="button"
          onClick={() => contactSales('Custom Wersee plan')}
          className="px-8 py-4 bg-white text-black rounded-2xl font-bold hover:bg-gray-100 transition-all"
        >
          Contact Our Team
        </button>
      </div>

      <div className="mt-24">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 shadow-lg">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Wersee Developer</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            whileHover={{ y: -5 }}
            className="p-8 rounded-[2.5rem] bg-[#141414] border border-white/5 hover:border-white/10 transition-all"
          >
            <h3 className="text-xl font-bold text-white mb-2">API Access</h3>
            <p className="text-gray-400 text-sm mb-6">Build on top of Wersee infrastructure.</p>
            <div className="mb-8 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-white">€99</span>
              <span className="text-gray-500 font-medium">/mo</span>
            </div>
            <ul className="space-y-4 mb-10">
              <li className="flex items-start gap-3">
                <Check className="w-4 h-4 text-emerald-500 mt-1" />
                <span className="text-gray-300 text-sm">Full API Access</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-4 h-4 text-emerald-500 mt-1" />
                <span className="text-gray-300 text-sm">Webhooks & Events</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-4 h-4 text-emerald-500 mt-1" />
                <span className="text-gray-300 text-sm">Developer Support</span>
              </li>
            </ul>
            <button
              type="button"
              onClick={() => navigate('/workspace/management-developer')}
              className="w-full py-4 rounded-2xl bg-white text-black font-bold hover:bg-gray-100 transition-all"
            >
              Get API Key
            </button>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="p-8 rounded-[2.5rem] bg-[#141414] border border-white/5 hover:border-white/10 transition-all"
          >
            <h3 className="text-xl font-bold text-white mb-2">White Label</h3>
            <p className="text-gray-400 text-sm mb-6">Your brand, our technology.</p>
            <div className="mb-8 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-white">€499</span>
              <span className="text-gray-500 font-medium">/mo</span>
            </div>
            <ul className="space-y-4 mb-10">
              <li className="flex items-start gap-3">
                <Check className="w-4 h-4 text-emerald-500 mt-1" />
                <span className="text-gray-300 text-sm">Custom Domain</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-4 h-4 text-emerald-500 mt-1" />
                <span className="text-gray-300 text-sm">Remove Wersee Branding</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-4 h-4 text-emerald-500 mt-1" />
                <span className="text-gray-300 text-sm">Priority API Limits</span>
              </li>
            </ul>
            <button
              type="button"
              onClick={() => contactSales('White label plan')}
              className="w-full py-4 rounded-2xl bg-white text-black font-bold hover:bg-gray-100 transition-all"
            >
              Start White Labeling
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
