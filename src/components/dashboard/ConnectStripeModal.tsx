import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Loader2 } from 'lucide-react';
import { TeamMember } from '../../services/teamService';

import { appToast } from '@/lib/feedback';
interface ConnectStripeModalProps {
  member: TeamMember;
  onClose: () => void;
  onConnect: (country: string) => void;
}

export const ConnectStripeModal = ({ member, onClose, onConnect }: ConnectStripeModalProps) => {
  const [country, setCountry] = useState('US');
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      await onConnect(country);
      onClose();
    } catch (error) {
      console.error('Error connecting Stripe:', error);
      appToast('Failed to connect Stripe account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#141414] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-white">Connect Stripe Account</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <Plus className="w-6 h-6 rotate-45" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Country</label>
            <select 
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
            >
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="GB">United Kingdom</option>
              <option value="DE">Germany</option>
              <option value="FR">France</option>
              <option value="NL">Netherlands</option>
              <option value="BE">Belgium</option>
              <option value="ES">Spain</option>
              <option value="IT">Italy</option>
              <option value="IE">Ireland</option>
              <option value="AU">Australia</option>
              <option value="NZ">New Zealand</option>
              <option value="SG">Singapore</option>
              <option value="JP">Japan</option>
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Select the country where the team member is located. This determines the verification requirements.
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              onClick={onClose}
              className="flex-1 py-3 bg-white/5 text-white rounded-xl font-bold hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleConnect}
              disabled={loading}
              className="flex-1 py-3 bg-[#635BFF] text-white rounded-xl font-bold hover:bg-[#5851E3] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
