import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Settings, 
  Code, 
  Plus, 
  Trash2, 
  Check, 
  Copy, 
  ExternalLink,
  Zap,
  Shield,
  Loader2,
  AlertCircle,
  ChevronRight,
  User,
  Mail,
  MessageSquare
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { format } from 'date-fns';

interface PortalCallsProps {
  businessId: string;
  user: any;
}

export const PortalCalls: React.FC<PortalCallsProps> = ({ businessId, user }) => {
  const [activeTab, setActiveTab] = useState<'bookings' | 'settings' | 'embed'>('bookings');
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRevisionRef = useRef(0);
  const pendingUpdatesRef = useRef<Record<string, unknown>>({});

  useEffect(() => {
    fetchData();
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [businessId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [configRes, bookingsRes] = await Promise.all([
        supabase
          .from('call_configs')
          .select('*')
          .eq('business_id', businessId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('call_bookings')
          .select('*')
          .eq('business_id', businessId)
          .order('start_time', { ascending: true })
      ]);

      if (configRes.error) throw configRes.error;
      if (bookingsRes.error) throw bookingsRes.error;
      setConfig(configRes.data || null);
      if (bookingsRes.data) setBookings(bookingsRes.data);
    } catch (err) {
      console.error('Error fetching call data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConfig = (updates: any) => {
    const configId = config?.id;
    const revision = ++saveRevisionRef.current;
    pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...updates };
    setConfig((current: any) => ({ ...current, ...updates }));
    setSaveState('saving');

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const pendingUpdates = pendingUpdatesRef.current;
      try {
        if (!configId) throw new Error('No call configuration is selected.');
        const { data, error } = await supabase
          .from('call_configs')
          .update(pendingUpdates)
          .eq('id', configId)
          .eq('business_id', businessId)
          .select('*')
          .maybeSingle();
        if (saveRevisionRef.current !== revision) return;
        if (error) throw error;
        if (!data) throw new Error('Call settings could not be saved.');
        pendingUpdatesRef.current = {};
        setConfig(data);
        setSaveState('saved');
      } catch (err) {
        if (saveRevisionRef.current !== revision) return;
        console.error('Error updating config:', err);
        setSaveState('error');
      }
    }, 650);
  };

  const updateAvailability = (day: string, patch: Record<string, unknown>) => {
    const availability = Object.fromEntries(
      Object.entries(config?.availability || {}).map(([key, value]: [string, any]) => [
        key,
        { ...value, slots: Array.isArray(value.slots) ? value.slots.map((slot: any) => ({ ...slot })) : [] },
      ]),
    );
    const currentDay = availability[day] || { enabled: false, slots: [] };
    availability[day] = { ...currentDay, ...patch };
    handleUpdateConfig({ availability });
  };

  const updateAvailabilityTime = (day: string, field: 'start' | 'end', value: string) => {
    const dayConfig = config?.availability?.[day] || { enabled: true, slots: [] };
    const firstSlot = dayConfig.slots?.[0] || { start: '09:00', end: '17:00' };
    updateAvailability(day, { slots: [{ ...firstSlot, [field]: value }] });
  };

  const copyEmbedCode = () => {
    if (!config) return;
    const code = `<script src="${window.location.origin}/api/embed/call.js" data-config-id="${config.id}"></script>`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tight text-white flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-indigo-500" /> Call Scheduling
          </h1>
          <p className="text-gray-500 mt-1">Manage your discovery calls and client appointments.</p>
        </div>
        
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
          {(['bookings', 'settings', 'embed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-xl text-sm font-black italic uppercase tracking-tight transition-all ${
                activeTab === tab 
                  ? 'bg-white text-black shadow-lg' 
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'bookings' && (
          <motion.div
            key="bookings"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {bookings.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {bookings.map((booking) => (
                  <div 
                    key={booking.id}
                    className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/10 transition-all group"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex flex-col items-center justify-center text-indigo-400 border border-indigo-500/20">
                        <span className="text-[10px] font-black uppercase tracking-widest">{format(new Date(booking.start_time), 'MMM')}</span>
                        <span className="text-xl font-black">{format(new Date(booking.start_time), 'dd')}</span>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-white">{booking.guest_name}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            booking.status === 'scheduled' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" /> {format(new Date(booking.start_time), 'HH:mm')}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-4 h-4" /> {booking.guest_email}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button className="p-3 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                        <MessageSquare className="w-5 h-5" />
                      </button>
                      <button className="px-6 py-3 rounded-xl bg-white text-black font-black italic uppercase tracking-tight hover:scale-105 transition-all">
                        Join Call
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white/5 border border-dashed border-white/10 rounded-[3rem]">
                <CalendarIcon className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No bookings yet</h3>
                <p className="text-gray-500">Share your booking link to start receiving appointments.</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-3xl space-y-8"
          >
            <div className="flex min-h-7 justify-end">
              <AnimatePresence mode="wait">
                {saveState !== 'idle' && (
                  <motion.div
                    key={saveState}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    role="status"
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
                      saveState === 'saved'
                        ? 'bg-emerald-500/10 text-emerald-300'
                        : saveState === 'error'
                          ? 'bg-red-500/10 text-red-300'
                          : 'bg-white/5 text-white/50'
                    }`}
                  >
                    {saveState === 'saving' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {saveState === 'saved' && <Check className="h-3.5 w-3.5" />}
                    {saveState === 'error' && <AlertCircle className="h-3.5 w-3.5" />}
                    {saveState === 'saving' ? 'Saving changes…' : saveState === 'saved' ? 'All changes saved' : 'Save failed'}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-4">Call Title</label>
                  <input 
                    type="text"
                    value={config?.title || ''}
                    onChange={(e) => handleUpdateConfig({ title: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                    placeholder="Discovery Call"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-4">Duration (Minutes)</label>
                  <select 
                    value={config?.duration_minutes || 30}
                    onChange={(e) => handleUpdateConfig({ duration_minutes: parseInt(e.target.value) })}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-4">Description</label>
                <textarea 
                  value={config?.description || ''}
                  onChange={(e) => handleUpdateConfig({ description: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-indigo-500/50 transition-all min-h-[100px]"
                  placeholder="What is this call about?"
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-500" /> Weekly Availability
                </h3>
                <div className="space-y-3">
                  {config?.availability && Object.entries(config.availability).map(([day, data]: [string, any]) => (
                    <div key={day} className="flex items-center justify-between p-4 rounded-2xl bg-black/20 border border-white/5">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black italic uppercase text-xs ${
                          data.enabled ? 'bg-indigo-500 text-white' : 'bg-white/5 text-gray-600'
                        }`}>
                          {day.substring(0, 3)}
                        </div>
                        <span className={`text-sm font-bold ${data.enabled ? 'text-white' : 'text-gray-600'}`}>
                          {day.charAt(0).toUpperCase() + day.slice(1)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <input
                            type="time"
                            aria-label={`${day} start time`}
                            disabled={!data.enabled}
                            value={data.slots?.[0]?.start || '09:00'}
                            onChange={(event) => updateAvailabilityTime(day, 'start', event.target.value)}
                            className="w-[108px] rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-white disabled:cursor-not-allowed disabled:opacity-30"
                          />
                          <span>-</span>
                          <input
                            type="time"
                            aria-label={`${day} end time`}
                            disabled={!data.enabled}
                            value={data.slots?.[0]?.end || '17:00'}
                            onChange={(event) => updateAvailabilityTime(day, 'end', event.target.value)}
                            className="w-[108px] rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-white disabled:cursor-not-allowed disabled:opacity-30"
                          />
                        </div>
                        {!data.enabled && (
                          <span className="hidden text-xs font-black uppercase tracking-widest text-gray-700 xl:inline">Unavailable</span>
                        )}
                        <button 
                          type="button"
                          aria-pressed={Boolean(data.enabled)}
                          aria-label={`${data.enabled ? 'Disable' : 'Enable'} ${day}`}
                          onClick={() => {
                            const slots = data.slots?.length ? data.slots : [{ start: '09:00', end: '17:00' }];
                            updateAvailability(day, { enabled: !data.enabled, slots });
                          }}
                          className={`w-12 h-6 rounded-full relative transition-all ${
                            data.enabled ? 'bg-indigo-500' : 'bg-white/10'
                          }`}
                        >
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                            data.enabled ? 'left-7' : 'left-1'
                          }`} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'embed' && (
          <motion.div
            key="embed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-3xl space-y-8"
          >
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-8">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                  <Code className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-black italic uppercase tracking-tight text-white">Embed Your Scheduler</h2>
                  <p className="text-gray-500">Add the booking widget to your own website with a single line of code.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-6 rounded-3xl bg-black/60 border border-white/10 font-mono text-sm text-indigo-300 relative group">
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={copyEmbedCode}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <code>
                    {`<script src="${window.location.origin}/api/embed/call.js" data-config-id="${config?.id}"></script>`}
                  </code>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                    <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-400" /> Fast Loading
                    </h4>
                    <p className="text-xs text-gray-500">Optimized for performance, won't slow down your site.</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                    <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-400" /> Secure
                    </h4>
                    <p className="text-xs text-gray-500">Built-in protection against spam and double bookings.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={() => window.open(`/book/${config?.id}`, '_blank')}
                  className="w-full py-5 rounded-2xl bg-white text-black font-black italic uppercase tracking-tight hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                  Preview Booking Page <ExternalLink className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
