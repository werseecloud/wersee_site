import React from 'react';
import { ShieldCheck, Timer, Users, HelpCircle, Mail, Lock, RotateCcw, Truck, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface WidgetProps {
  type: string;
  listing: any;
}

export const ListingWidgets: React.FC<WidgetProps> = ({ type, listing }) => {
  switch (type) {
    case 'trust_badges':
      return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-white/5 border border-white/10 rounded-3xl">
          <div className="flex flex-col items-center text-center gap-2">
            <Lock className="w-6 h-6 text-indigo-400" />
            <span className="text-[10px] font-bold uppercase text-gray-400">Secure Payment</span>
          </div>
          <div className="flex flex-col items-center text-center gap-2">
            <RotateCcw className="w-6 h-6 text-indigo-400" />
            <span className="text-[10px] font-bold uppercase text-gray-400">Money Back</span>
          </div>
          <div className="flex flex-col items-center text-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            <span className="text-[10px] font-bold uppercase text-gray-400">Buyer Protection</span>
          </div>
          <div className="flex flex-col items-center text-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-indigo-400" />
            <span className="text-[10px] font-bold uppercase text-gray-400">Verified Seller</span>
          </div>
        </div>
      );

    case 'countdown':
      return (
        <div className="p-6 bg-indigo-600 rounded-3xl text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-white font-bold uppercase tracking-widest text-xs">
            <Timer className="w-4 h-4" /> Limited Time Offer
          </div>
          <div className="flex justify-center gap-4">
            <div className="flex flex-col">
              <span className="text-3xl font-black text-white">02</span>
              <span className="text-[10px] text-indigo-200 font-bold uppercase">Hours</span>
            </div>
            <span className="text-3xl font-black text-white">:</span>
            <div className="flex flex-col">
              <span className="text-3xl font-black text-white">45</span>
              <span className="text-[10px] text-indigo-200 font-bold uppercase">Mins</span>
            </div>
            <span className="text-3xl font-black text-white">:</span>
            <div className="flex flex-col">
              <span className="text-3xl font-black text-white">12</span>
              <span className="text-[10px] text-indigo-200 font-bold uppercase">Secs</span>
            </div>
          </div>
        </div>
      );

    case 'social_proof':
      return (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl"
        >
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <img 
                key={i}
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`}
                className="w-8 h-8 rounded-full border-2 border-black bg-gray-800"
                alt=""
              />
            ))}
          </div>
          <div className="text-sm">
            <span className="text-white font-bold">12 people</span>
            <span className="text-gray-400"> viewed this in the last hour</span>
          </div>
        </motion.div>
      );

    case 'faq':
      return (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white">Frequently Asked Questions</h3>
          <div className="space-y-2">
            {[
              { q: 'How do I receive my item?', a: 'You will receive an email with instructions immediately after purchase.' },
              { q: 'Is there a refund policy?', a: 'Yes, we offer a 14-day money back guarantee if you are not satisfied.' }
            ].map((item, i) => (
              <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                <div className="font-bold text-white text-sm mb-1">{item.q}</div>
                <div className="text-gray-400 text-xs">{item.a}</div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'newsletter':
      return (
        <div className="p-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-[2.5rem] space-y-4">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white">Join the Newsletter</h3>
            <p className="text-indigo-100 text-sm">Get updates on new products and exclusive discounts.</p>
          </div>
          <div className="flex gap-2">
            <input 
              type="email" 
              placeholder="your@email.com"
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-colors">
              Join
            </button>
          </div>
        </div>
      );

    default:
      return null;
  }
};
