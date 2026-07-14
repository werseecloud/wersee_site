import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Terminal, 
  QrCode, 
  MapPin, 
  Users, 
  Receipt, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  Monitor,
  Smartphone,
  ShieldCheck,
  Building2,
  Mail,
  Image as ImageIcon
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface MoneyPosViewProps {
  isStripeComplete: boolean;
}

export const MoneyPosView: React.FC<MoneyPosViewProps> = ({ isStripeComplete }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>({
    enabled: false,
    terminal_config: { mode: 'digital', qr_enabled: false },
    location_settings: { location_name: '', tax_override: false, tax_rate: 0 },
    permissions: { staff_ids: [], roles: {} },
    receipt_settings: { auto_email: true, branding_logo: null, success_message: 'Thanks for your purchase!' }
  });

  useEffect(() => {
    fetchSettings();
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('pos_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setSettings(data);
      } else {
        // Create default settings if not exists
        const { data: newData, error: createError } = await supabase
          .from('pos_settings')
          .insert({ user_id: user.id })
          .select()
          .single();
        
        if (newData) setSettings(newData);
      }
    } catch (err) {
      console.error('Error fetching POS settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: any) => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('pos_settings')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;
      setSettings({ ...settings, ...updates });
    } catch (err) {
      console.error('Error updating POS settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleLaunchTerminal = () => {
    // Generate URL: /[username]/pos/[systemname]/v1
    // For now, we use user.id or a slug if available. Let's assume username is available in user metadata or we fetch it.
    // Actually, we can just use 'me' or fetch the username.
    // Let's fetch username first.
    const username = user?.user_metadata?.username || 'user';
    const systemName = settings.location_settings.location_name.toLowerCase().replace(/\s+/g, '-') || 'main';
    window.open(`/${username}/pos/${systemName}/v1`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 pb-24 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">Point of Sale (POS)</h1>
          <p className="text-xs md:text-sm text-gray-400">Turn any device into a powerful checkout terminal.</p>
        </div>
        <button
          onClick={handleLaunchTerminal}
          disabled={!settings.enabled}
          className="w-full md:w-auto px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base"
        >
          Launch POS Terminal <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 1. Activation Toggle */}
      <div className="bg-[#141414] border border-white/5 rounded-2xl md:rounded-3xl p-5 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3 md:gap-4">
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 ${settings.enabled ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white/5 text-gray-500'}`}>
              <Terminal className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-white">Enable Wersee POS</h2>
              <p className="text-gray-400 text-[10px] md:text-sm">Activate terminal access for this account.</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={settings.enabled}
              onChange={(e) => updateSettings({ enabled: e.target.checked })}
            />
            <div className="w-11 h-6 md:w-14 md:h-8 bg-white/10 peer-focus:outline-none peer-focus:ring-2 md:peer-focus:ring-4 peer-focus:ring-emerald-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 md:after:h-7 md:after:w-7 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>

        {!isStripeComplete && (
          <div className="p-3 md:p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3 text-yellow-500">
            <AlertCircle className="w-4 h-4 md:w-5 md:h-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-xs md:text-sm">Sandbox Mode Active</h4>
              <p className="text-[10px] md:text-xs opacity-80 mt-1">Stripe is not connected. POS will run in Sandbox Mode (no real payments).</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          {/* 2. Terminal Configuration */}
          <div className="bg-[#141414] border border-white/5 rounded-2xl md:rounded-3xl p-5 md:p-8 space-y-4 md:space-y-6">
            <div className="flex items-center gap-3 mb-2 md:mb-4">
              <Monitor className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
              <h3 className="text-base md:text-lg font-bold text-white">Terminal Configuration</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <button 
                onClick={() => updateSettings({ terminal_config: { ...settings.terminal_config, mode: 'digital' } })}
                className={`p-4 rounded-xl md:rounded-2xl border text-left transition-all ${settings.terminal_config.mode === 'digital' ? 'bg-blue-500/10 border-blue-500 text-blue-400' : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'}`}
              >
                <Monitor className="w-5 h-5 md:w-6 md:h-6 mb-2 md:mb-3" />
                <div className="font-bold text-sm md:text-base mb-1">Digital Terminal</div>
                <div className="text-[10px] md:text-xs opacity-70">Use this device as a register.</div>
              </button>
              
              <button 
                onClick={() => updateSettings({ terminal_config: { ...settings.terminal_config, qr_enabled: !settings.terminal_config.qr_enabled } })}
                className={`p-4 rounded-xl md:rounded-2xl border text-left transition-all ${settings.terminal_config.qr_enabled ? 'bg-purple-500/10 border-purple-500 text-purple-400' : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'}`}
              >
                <QrCode className="w-5 h-5 md:w-6 md:h-6 mb-2 md:mb-3" />
                <div className="font-bold text-sm md:text-base mb-1">QR Payment Mode</div>
                <div className="text-[10px] md:text-xs opacity-70">Allow customers to scan & pay.</div>
              </button>
            </div>
          </div>

          {/* 3. Location & Tax */}
          <div className="bg-[#141414] border border-white/5 rounded-2xl md:rounded-3xl p-5 md:p-8 space-y-4 md:space-y-6">
            <div className="flex items-center gap-3 mb-2 md:mb-4">
              <MapPin className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />
              <h3 className="text-base md:text-lg font-bold text-white">Location & Tax</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase mb-2">Business Location Name</label>
                <input 
                  type="text" 
                  value={settings.location_settings.location_name}
                  onChange={(e) => updateSettings({ location_settings: { ...settings.location_settings, location_name: e.target.value } })}
                  placeholder="e.g. Amsterdam Pop-up Store"
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm md:text-base"
                />
              </div>

              <div className="flex items-center justify-between p-3 md:p-4 bg-white/5 rounded-xl">
                <div>
                  <div className="font-bold text-white text-xs md:text-sm">Local Tax Override</div>
                  <div className="text-[10px] md:text-xs text-gray-500">Apply specific tax rate for this location</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={settings.location_settings.tax_override}
                    onChange={(e) => updateSettings({ location_settings: { ...settings.location_settings, tax_override: e.target.checked } })}
                  />
                  <div className="w-9 h-5 md:w-10 md:h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 md:after:h-5 md:after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>
            </div>
          </div>

          {/* 5. Receipt Settings */}
          <div className="bg-[#141414] border border-white/5 rounded-2xl md:rounded-3xl p-5 md:p-8 space-y-4 md:space-y-6">
            <div className="flex items-center gap-3 mb-2 md:mb-4">
              <Receipt className="w-4 h-4 md:w-5 md:h-5 text-pink-500" />
              <h3 className="text-base md:text-lg font-bold text-white">Receipt Settings</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 md:p-4 bg-white/5 rounded-xl">
                <div>
                  <div className="font-bold text-white text-xs md:text-sm">Auto-Email Receipt</div>
                  <div className="text-[10px] md:text-xs text-gray-500">Send digital receipt automatically</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={settings.receipt_settings.auto_email}
                    onChange={(e) => updateSettings({ receipt_settings: { ...settings.receipt_settings, auto_email: e.target.checked } })}
                  />
                  <div className="w-9 h-5 md:w-10 md:h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 md:after:h-5 md:after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
                </label>
              </div>

              <div>
                <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase mb-2">Success Message</label>
                <textarea 
                  value={settings.receipt_settings.success_message}
                  onChange={(e) => updateSettings({ receipt_settings: { ...settings.receipt_settings, success_message: e.target.value } })}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500 transition-colors h-24 resize-none text-sm md:text-base"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Checklist */}
        <div className="space-y-6 md:space-y-8">
          <div className="bg-[#141414] border border-white/5 rounded-2xl md:rounded-3xl p-5 md:p-8 sticky top-8">
            <h3 className="text-base md:text-lg font-bold text-white mb-4 md:mb-6">Ready to Sell</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-xs md:text-sm">Stripe Connect</span>
                {isStripeComplete ? (
                  <span className="flex items-center gap-1 text-emerald-500 text-[10px] md:text-xs font-bold uppercase"><CheckCircle2 className="w-3 h-3 md:w-4 md:h-4" /> Connected</span>
                ) : (
                  <span className="flex items-center gap-1 text-red-500 text-[10px] md:text-xs font-bold uppercase"><AlertCircle className="w-3 h-3 md:w-4 md:h-4" /> Missing</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-xs md:text-sm">Location Set</span>
                {settings.location_settings.location_name ? (
                  <span className="flex items-center gap-1 text-emerald-500 text-[10px] md:text-xs font-bold uppercase"><CheckCircle2 className="w-3 h-3 md:w-4 md:h-4" /> {settings.location_settings.location_name}</span>
                ) : (
                  <span className="flex items-center gap-1 text-yellow-500 text-[10px] md:text-xs font-bold uppercase"><AlertCircle className="w-3 h-3 md:w-4 md:h-4" /> Not Set</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-xs md:text-sm">POS Enabled</span>
                {settings.enabled ? (
                  <span className="flex items-center gap-1 text-emerald-500 text-[10px] md:text-xs font-bold uppercase"><CheckCircle2 className="w-3 h-3 md:w-4 md:h-4" /> Active</span>
                ) : (
                  <span className="flex items-center gap-1 text-gray-500 text-[10px] md:text-xs font-bold uppercase"><AlertCircle className="w-3 h-3 md:w-4 md:h-4" /> Inactive</span>
                )}
              </div>
            </div>

            <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-white/5">
              <div className="text-[10px] md:text-xs text-gray-500 mb-4">
                Your POS terminal is accessible via a secure link. Share it only with authorized staff.
              </div>
              <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex items-center justify-between group cursor-pointer hover:border-white/10 transition-colors">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3 md:w-4 md:h-4 text-emerald-500" />
                  <span className="text-[10px] md:text-xs font-mono text-gray-400">Session Token Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
