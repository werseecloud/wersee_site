import React, { useState, useEffect } from 'react';
import { 
  User, CreditCard, DollarSign, Bell, Shield, FileText, 
  ChevronRight, Globe, Lock, Smartphone, Trash2, ExternalLink,
  Check, AlertCircle, Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { PayoutScheduleModal } from './PayoutScheduleModal';

import { appToast } from '@/lib/feedback';
type SettingsTab = 'profile' | 'payment' | 'sales' | 'notifications' | 'privacy' | 'legal' | 'referrals';

export const SettingsView = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const tabs = [
    { id: 'profile', label: 'Profile & Account', icon: User, description: 'Basics' },
    { id: 'payment', label: 'Payment Methods & Currency', icon: CreditCard, description: 'Money matters' },
    { id: 'sales', label: 'Sales & Payouts', icon: DollarSign, description: 'De Polar.sh koppeling' },
    { id: 'notifications', label: 'Community & Notifications', icon: Bell, description: 'Communication' },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield, description: 'Data & Access' },
    { id: 'legal', label: 'Legal & Compliance', icon: FileText, description: 'Taxes/DAC7' },
    { id: 'referrals', label: 'Platform Referrals', icon: Users, description: 'Earn by inviting others' },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar Navigation */}
      <div className="w-full lg:w-80 flex-shrink-0">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="font-semibold text-gray-900">Instellingen</h2>
          </div>
          <nav className="p-2 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                  activeTab === tab.id 
                    ? 'bg-black text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className={`p-2 rounded-lg ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-100'}`}>
                  <tab.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium text-sm">{tab.label}</div>
                  <div className={`text-xs ${activeTab === tab.id ? 'text-white/70' : 'text-gray-400'}`}>
                    {tab.description}
                  </div>
                </div>
                {activeTab === tab.id && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-w-0">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          {activeTab === 'profile' && <ProfileSettings user={user} />}
          {activeTab === 'payment' && <PaymentSettings />}
          {activeTab === 'sales' && <SalesSettings user={user} />}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'privacy' && <PrivacySettings />}
          {activeTab === 'legal' && <LegalSettings />}
          {activeTab === 'referrals' && <ReferralSettings user={user} />}
        </div>
      </div>
    </div>
  );
};

const ProfileSettings = ({ user }: { user: any }) => {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-1">Profile & Account</h3>
        <p className="text-gray-500 text-sm">Beheer je persoonlijke gegevens en publieke profiel.</p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Naam</label>
            <input 
              type="text" 
              defaultValue={user?.user_metadata?.full_name || ''}
              className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">E-mailadres</label>
            <input 
              type="email" 
              defaultValue={user?.email || ''}
              disabled
              className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Bio</label>
          <textarea 
            rows={4}
            placeholder="Vertel iets over jezelf..."
            className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Website</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="url" 
                placeholder="https://jouwwebsite.nl"
                className="w-full p-3 pl-10 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Taalinstellingen</label>
            <select className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all bg-white">
              <option value="nl">Dutch</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-100 flex justify-end">
        <button className="px-6 py-2 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors">
          Save
        </button>
      </div>
    </div>
  );
};

const PaymentSettings = () => {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-1">Payment Methods & Currency</h3>
        <p className="text-gray-500 text-sm">Manage your payment preferences and billing details.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Default Currency</label>
          <select className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all bg-white">
            <option value="EUR">Euro (EUR)</option>
            <option value="USD">US Dollar (USD)</option>
            <option value="GBP">British Pound (GBP)</option>
          </select>
          <p className="text-xs text-gray-500">Which currency do you want to view and set prices in?</p>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Saved cards</h4>
          <div className="p-4 border border-gray-200 rounded-xl bg-gray-50 flex items-center justify-center flex-col gap-3 py-8">
            <CreditCard className="w-10 h-10 text-gray-300" />
            <p className="text-sm text-gray-500">You have not saved any payment methods yet.</p>
            <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
              + Add new card
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Billing details</h4>
          <div className="grid grid-cols-1 gap-4">
            <input 
              type="text" 
              placeholder="Company name (optional)"
              className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
            />
            <input 
              type="text" 
              placeholder="Address line 1"
              className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
            />
            <div className="grid grid-cols-2 gap-4">
              <input 
                type="text" 
                placeholder="Postal code"
                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
              />
              <input 
                type="text" 
                placeholder="City"
                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="pt-6 border-t border-gray-100 flex justify-end">
        <button className="px-6 py-2 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors">
          Save
        </button>
      </div>
    </div>
  );
};

const SalesSettings = ({ user }: { user: any }) => {
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [payoutSchedule, setPayoutSchedule] = useState('monthly');

  useEffect(() => {
    if (user) {
      fetchSchedule();
    }
  }, [user]);

  const fetchSchedule = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('payout_schedule')
      .eq('id', user.id)
      .single();
    
    if (data?.payout_schedule) {
      setPayoutSchedule(data.payout_schedule);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-1">Sales & Payouts</h3>
        <p className="text-gray-500 text-sm">Manage your Polar.sh connection and payouts.</p>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <img src="https://polar.sh/favicon.ico" alt="Polar" className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900">Polar Connect</h4>
            <p className="text-sm text-blue-700 mt-1">
              Connect your account with Polar.sh to receive payments and manage subscriptions.
            </p>
            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
              Connect with Polar <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Payout method</label>
          <div className="p-4 border border-gray-200 rounded-xl bg-gray-50 flex items-center justify-between">
            <span className="text-gray-500">No bank account connected</span>
            <button className="text-sm font-medium text-blue-600">Set up</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 border border-gray-200 rounded-xl relative group">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Payout Schema</h4>
                <p className="text-2xl font-semibold text-gray-900 capitalize">{payoutSchedule}</p>
                <p className="text-xs text-gray-500 mt-1">Next payout: -</p>
              </div>
              <button 
                onClick={() => setIsScheduleModalOpen(true)}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Change
              </button>
            </div>
          </div>
          <div className="p-4 border border-gray-200 rounded-xl">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Platform Fee</h4>
            <p className="text-2xl font-semibold text-gray-900">5%</p>
            <p className="text-xs text-gray-500 mt-1">Per successful transaction</p>
          </div>
        </div>
      </div>

      {user && (
        <PayoutScheduleModal 
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          onSave={fetchSchedule}
          userId={user.id}
        />
      )}
    </div>
  );
};

const NotificationSettings = () => {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-1">Community & Notifications</h3>
        <p className="text-gray-500 text-sm">Choose how and when you are notified.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <Bell className="w-4 h-4" /> Email Notifications
          </h4>
          <div className="space-y-3">
            {[
              'New sales',
              'New bids',
              'Community tags & mentions',
              'System updates & news'
            ].map((item) => (
              <label key={item} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                <span className="text-sm text-gray-700">{item}</span>
                <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black" />
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <Smartphone className="w-4 h-4" /> Push Notifications
          </h4>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
              <span className="text-sm text-gray-700">Enable on this device</span>
              <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black" />
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Community Preferences</h4>
          <label className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
            <div>
              <span className="block text-sm text-gray-700">Allow DMs from the community</span>
              <span className="block text-xs text-gray-500">People can message you through the community tab</span>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black" />
          </label>
        </div>
      </div>
      
      <div className="pt-6 border-t border-gray-100 flex justify-end">
        <button className="px-6 py-2 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors">
          Save
        </button>
      </div>
    </div>
  );
};

const PrivacySettings = () => {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-1">Privacy & Security</h3>
        <p className="text-gray-500 text-sm">Manage your password and security settings.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <Lock className="w-4 h-4" /> Password
          </h4>
          <div className="grid grid-cols-1 gap-4">
            <input 
              type="password" 
              placeholder="Current password"
              className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                type="password" 
                placeholder="New password"
                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
              />
              <input 
                type="password" 
                placeholder="Confirm new password"
                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
              />
            </div>
            <button className="w-full md:w-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
              Password wijzigen
            </button>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100 space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <Shield className="w-4 h-4" /> Two-step verification (2FA)
          </h4>
          <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-orange-800 font-medium">Not enabled</p>
              <p className="text-xs text-orange-700 mt-1">
                We recommend enabling 2FA to protect your balance and account.
              </p>
              <button className="mt-3 text-sm font-medium text-orange-900 underline">
                Enable now
              </button>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100 space-y-4">
          <h4 className="font-medium text-gray-900">Visibility</h4>
          <label className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
            <div>
              <span className="block text-sm text-gray-700">Profile discoverable in search engines</span>
              <span className="block text-xs text-gray-500">Allow Google and other search engines to index your profile</span>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black" />
          </label>
        </div>

        <div className="pt-6 border-t border-gray-100 space-y-4">
          <h4 className="font-medium text-gray-900">Session management</h4>
          <div className="p-4 border border-gray-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Globe className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Current session</p>
                <p className="text-xs text-gray-500">Chrome op macOS • Amsterdam, NL</p>
              </div>
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReferralSettings = ({ user }: { user: any }) => {
  const [referralCode, setReferralCode] = useState(user?.referral_code || user?.id?.substring(0, 8).toUpperCase() || 'LOADING');
  const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;

  useEffect(() => {
    const ensureReferralCode = async () => {
      if (user && !user.referral_code) {
        const code = user.id.substring(0, 8).toUpperCase();
        const { error } = await supabase
          .from('profiles')
          .update({ referral_code: code })
          .eq('id', user.id);
        
        if (!error) {
          setReferralCode(code);
        }
      }
    };
    ensureReferralCode();
  }, [user]);

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    appToast('Link copied to clipboard!');
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-1">Platform Referrals</h3>
        <p className="text-gray-500 text-sm">Invite others to the platform and earn a commission on their sales.</p>
      </div>

      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="relative z-10">
          <h4 className="text-2xl font-bold mb-2">Earn 5% Lifetime Commission</h4>
          <p className="text-indigo-100 max-w-lg mb-6">
            When you invite a new seller to the platform, you'll earn 5% of our platform fee from every sale they make, forever.
          </p>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 flex items-center gap-4">
            <div className="flex-1 bg-black/20 rounded-lg px-4 py-2 font-mono text-sm truncate">
              {referralLink}
            </div>
            <button 
              onClick={copyLink}
              className="px-4 py-2 bg-white text-indigo-600 rounded-lg font-bold text-sm hover:bg-indigo-50 transition-colors"
            >
              Copy Link
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 border border-gray-200 rounded-2xl bg-gray-50">
          <Users className="w-8 h-8 text-indigo-500 mb-4" />
          <h4 className="font-bold text-gray-900">Total Referrals</h4>
          <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
          <p className="text-xs text-gray-500 mt-1">Active sellers invited</p>
        </div>
        <div className="p-6 border border-gray-200 rounded-2xl bg-gray-50">
          <DollarSign className="w-8 h-8 text-emerald-500 mb-4" />
          <h4 className="font-bold text-gray-900">Total Earnings</h4>
          <p className="text-3xl font-bold text-gray-900 mt-2">€0.00</p>
          <p className="text-xs text-gray-500 mt-1">Lifetime earnings</p>
        </div>
        <div className="p-6 border border-gray-200 rounded-2xl bg-gray-50">
          <CreditCard className="w-8 h-8 text-blue-500 mb-4" />
          <h4 className="font-bold text-gray-900">Next Payout</h4>
          <p className="text-3xl font-bold text-gray-900 mt-2">€0.00</p>
          <p className="text-xs text-gray-500 mt-1">Available for withdrawal</p>
        </div>
      </div>
    </div>
  );
};

const LegalSettings = () => {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-1">Legal & Compliance</h3>
        <p className="text-gray-500 text-sm">Tax information and legal documents.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Business Details</h4>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">VAT identification number</label>
            <input 
              type="text" 
              placeholder="NL000000000B01"
              className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
            />
            <p className="text-xs text-gray-500">Only fill this in if you are a business seller.</p>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100 space-y-4">
          <h4 className="font-medium text-gray-900">DAC7 Reporting</h4>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <p className="text-sm text-gray-700 mb-3">
              As a platform in the EU, we are required to report seller income to the tax authority.
            </p>
            <button className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Complete DAC7 Form <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100 space-y-4">
          <h4 className="font-medium text-gray-900">Documents</h4>
          <div className="space-y-2">
            <a href="#" className="block p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm text-gray-700 flex items-center justify-between">
              Terms and Conditions <ExternalLink className="w-4 h-4 text-gray-400" />
            </a>
            <a href="#" className="block p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm text-gray-700 flex items-center justify-between">
              Privacy Policy <ExternalLink className="w-4 h-4 text-gray-400" />
            </a>
            <a href="#" className="block p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm text-gray-700 flex items-center justify-between">
              Polar.sh Merchant Agreement <ExternalLink className="w-4 h-4 text-gray-400" />
            </a>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100">
          <h4 className="font-medium text-red-600 mb-2">Danger zone</h4>
          <div className="p-4 border border-red-100 bg-red-50 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-900">Delete account</p>
              <p className="text-xs text-red-700">This will permanently delete your account and all data.</p>
            </div>
            <button className="p-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
