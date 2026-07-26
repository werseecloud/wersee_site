import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Mail, 
  MessageSquare, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Zap
} from 'lucide-react';
import { invokeApiRunner } from '../lib/supabase';
import { format, addDays, startOfToday, isSameDay, isBefore, startOfDay } from 'date-fns';

interface CallConfig {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  price: number;
  intake_form?: any[];
  group_booking?: {
    enabled: boolean;
    max_guests: number;
  };
  coupons_enabled?: boolean;
  waitlist_enabled?: boolean;
  embed_settings?: {
    theme: 'dark' | 'light';
    color: string;
    radius: string;
    layout?: 'vertical' | 'horizontal';
  };
  businesses: {
    name: string;
    logo_url: string;
  };
}

interface CallSchedulerProps {
  configId?: string;
  businessId?: string;
  username?: string;
  businessSlug?: string;
  configSlug?: string;
  previewConfig?: any;
  onSuccess?: (booking: any) => void;
}

export const CallScheduler: React.FC<CallSchedulerProps> = ({ 
  configId, 
  businessId, 
  username, 
  businessSlug, 
  configSlug, 
  previewConfig,
  onSuccess 
}) => {
  const [config, setConfig] = useState<CallConfig | null>(previewConfig || null);
  const [loading, setLoading] = useState(!previewConfig);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
  const [step, setStep] = useState<'date' | 'details' | 'success'>('date');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    notes: '',
    guestCount: 1,
    couponCode: '',
    intakeResponses: {} as Record<string, any>
  });
  const [submitting, setSubmitting] = useState(false);
  const [userTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);

  useEffect(() => {
    if (previewConfig) {
      setConfig(previewConfig);
      setLoading(false);
      return;
    }
    fetchConfig();
  }, [configId, businessId, username, businessSlug, configSlug, previewConfig]);

  useEffect(() => {
    if (config) {
      fetchSlots();
    }
  }, [selectedDate, config]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await invokeApiRunner('calls/get-config', { 
        configId, 
        businessId, 
        username, 
        businessSlug, 
        configSlug 
      });
      if (res.success) {
        setConfig(res.data);
      } else {
        setError('Could not find scheduling configuration');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async () => {
    if (!config) return;
    if (previewConfig) {
      // Mock slots for preview
      const slots = [];
      const now = new Date();
      for (let i = 9; i < 17; i++) {
        const date = new Date(selectedDate);
        date.setHours(i, 0, 0, 0);
        slots.push({
          start: date.toISOString(),
          price: config.price
        });
      }
      setAvailableSlots(slots);
      return;
    }
    try {
      setLoadingSlots(true);
      const res = await invokeApiRunner('calls/get-availability', { 
        configId: config.id, 
        date: format(selectedDate, 'yyyy-MM-dd'),
        timezone: userTimezone
      });
      if (res.success) {
        setAvailableSlots(res.slots);
      }
    } catch (err: any) {
      console.error('Failed to fetch slots:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !config) return;

    try {
      setSubmitting(true);
      const res = await invokeApiRunner('calls/book', {
        configId: config.id,
        startTime: selectedSlot.start,
        guestEmail: formData.email,
        guestName: formData.name,
        notes: formData.notes,
        intakeResponses: formData.intakeResponses,
        guestCount: formData.guestCount,
        couponCode: formData.couponCode
      });

      if (res.success) {
        setStep('success');
        onSuccess?.(res.booking);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const accentColor = config?.embed_settings?.color || '#6366f1';
  const borderRadius = config?.embed_settings?.radius || '2.5rem';
  const isHorizontal = config?.embed_settings?.layout === 'horizontal';

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: accentColor }} />
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="p-8 text-center bg-red-500/10 border border-red-500/20 rounded-2xl">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">Error</h3>
        <p className="text-gray-400">{error || 'Configuration not found'}</p>
      </div>
    );
  }

  return (
    <div 
      className={`max-w-4xl mx-auto bg-black/40 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl transition-all duration-500 ${
        isHorizontal ? 'md:max-w-5xl' : 'md:max-w-4xl'
      }`}
      style={{ borderRadius }}
    >
      <div className={`grid grid-cols-1 ${isHorizontal ? 'md:grid-cols-12' : 'md:grid-cols-5'}`}>
        {/* Left Sidebar: Info */}
        <div className={`${isHorizontal ? 'md:col-span-4' : 'md:col-span-2'} p-8 border-b md:border-b-0 md:border-r border-white/10 bg-white/5`}>
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-8"
          >
            {config.businesses?.logo_url ? (
              <img src={config.businesses.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
                <Zap className="w-6 h-6" />
              </div>
            )}
            <div>
              <h4 className="text-sm font-medium text-gray-400">{config.businesses?.name}</h4>
              <h1 className="text-xl font-black italic uppercase tracking-tight text-white">{config.title}</h1>
            </div>
          </motion.div>

          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-3 text-gray-300"
            >
              <Clock className="w-5 h-5" style={{ color: accentColor }} />
              <span className="font-medium">{config.duration_minutes} Minutes</span>
            </motion.div>
            
            {(selectedSlot?.price || config.price) > 0 && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-3 text-gray-300"
              >
                <Zap className="w-5 h-5 text-emerald-400" />
                <span className="font-medium">€{selectedSlot?.price || config.price}</span>
              </motion.div>
            )}

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-gray-400 leading-relaxed"
            >
              {config.description || 'Schedule a call to discuss your requirements and how we can help you achieve your goals.'}
            </motion.p>
          </div>

          <AnimatePresence>
            {selectedSlot && step !== 'success' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="mt-12 p-4 rounded-2xl border"
                style={{ backgroundColor: `${accentColor}10`, borderColor: `${accentColor}20` }}
              >
                <div className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: accentColor }}>Selected Time</div>
                <div className="text-white font-bold">
                  {format(new Date(selectedSlot.start), 'EEEE, MMMM do')}
                </div>
                <div className="text-sm" style={{ color: `${accentColor}cc` }}>
                  {format(new Date(selectedSlot.start), 'HH:mm')}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Content: Scheduler */}
        <div className={`${isHorizontal ? 'md:col-span-8' : 'md:col-span-3'} p-8`}>
          <AnimatePresence mode="wait">
            {step === 'date' && (
              <motion.div
                key="date"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-2xl font-black italic uppercase tracking-tight text-white mb-6">Select Date & Time</h2>
                  
                  {/* Date Selection */}
                  <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                    {[...Array(14)].map((_, i) => {
                      const date = addDays(startOfToday(), i);
                      const isSelected = isSameDay(date, selectedDate);
                      return (
                        <motion.button
                          key={i}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedDate(date)}
                          className={`flex-shrink-0 w-20 p-4 rounded-2xl border transition-all ${
                            isSelected 
                              ? 'text-white shadow-lg' 
                              : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                          }`}
                          style={isSelected ? { backgroundColor: accentColor, borderColor: accentColor, boxShadow: `0 10px 15px -3px ${accentColor}40` } : {}}
                        >
                          <div className="text-[10px] font-black uppercase tracking-widest mb-1">
                            {format(date, 'EEE')}
                          </div>
                          <div className="text-lg font-black">
                            {format(date, 'd')}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Slots */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Available Slots
                  </h3>
                  
                  {loadingSlots ? (
                    <div className={`grid ${isHorizontal ? 'grid-cols-4' : 'grid-cols-3'} gap-3`}>
                      {[...Array(isHorizontal ? 8 : 6)].map((_, i) => (
                        <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />
                      ))}
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <div className={`grid ${isHorizontal ? 'grid-cols-4' : 'grid-cols-3'} gap-3`}>
                      {availableSlots.map((slot, i) => (
                        <motion.button
                          key={slot.start}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-3 rounded-xl border text-sm font-bold transition-all ${
                            selectedSlot?.start === slot.start
                              ? 'text-white'
                              : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/20 hover:bg-white/10'
                          }`}
                          style={selectedSlot?.start === slot.start ? { backgroundColor: accentColor, borderColor: accentColor } : {}}
                        >
                          {format(new Date(slot.start), 'HH:mm')}
                          {slot.price !== config.price && (
                            <div className="text-[8px] opacity-70">€{slot.price}</div>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-8 text-center rounded-2xl bg-white/5 border border-dashed border-white/10"
                    >
                      <p className="text-gray-500 text-sm italic">No slots available for this date.</p>
                    </motion.div>
                  )}
                </div>

                <div className="pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={!selectedSlot}
                    onClick={() => setStep('details')}
                    className="w-full py-4 rounded-2xl bg-white text-black font-black italic uppercase tracking-tight hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
                  >
                    Next Step
                  </motion.button>
                </div>
              </motion.div>
            )}

            {step === 'details' && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <button 
                  onClick={() => setStep('date')}
                  className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm font-bold mb-4"
                >
                  <ChevronLeft className="w-4 h-4" /> Back to calendar
                </button>

                <h2 className="text-2xl font-black italic uppercase tracking-tight text-white">Enter Your Details</h2>

                <form onSubmit={handleBooking} className="space-y-6">
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-4">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        required
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none transition-all"
                        style={{ '--tw-ring-color': accentColor } as any}
                        placeholder="John Doe"
                      />
                    </div>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-2"
                  >
                    <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-4">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        required
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none transition-all"
                        style={{ '--tw-ring-color': accentColor } as any}
                        placeholder="john@example.com"
                      />
                    </div>
                  </motion.div>

                  {/* Group Booking */}
                  {config.group_booking?.enabled && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-2"
                    >
                      <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-4">Number of Guests</label>
                      <select
                        value={formData.guestCount}
                        onChange={(e) => setFormData({ ...formData, guestCount: parseInt(e.target.value) })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none transition-all"
                      >
                        {[...Array(config.group_booking.max_guests)].map((_, i) => (
                          <option key={i + 1} value={i + 1} className="bg-black">{i + 1} Guest{i > 0 ? 's' : ''}</option>
                        ))}
                      </select>
                    </motion.div>
                  )}

                  {/* Intake Form */}
                  {config.intake_form?.map((field: any, i: number) => (
                    <motion.div 
                      key={field.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + (i * 0.1) }}
                      className="space-y-2"
                    >
                      <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-4">{field.label}</label>
                      {field.type === 'textarea' ? (
                        <textarea
                          required={field.required}
                          value={formData.intakeResponses[field.id] || ''}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            intakeResponses: { ...formData.intakeResponses, [field.id]: e.target.value } 
                          })}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none transition-all min-h-[100px]"
                          placeholder={field.placeholder}
                        />
                      ) : field.type === 'select' ? (
                        <select
                          required={field.required}
                          value={formData.intakeResponses[field.id] || ''}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            intakeResponses: { ...formData.intakeResponses, [field.id]: e.target.value } 
                          })}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none transition-all"
                        >
                          <option value="" className="bg-black">Select an option</option>
                          {field.options?.map((opt: string) => (
                            <option key={opt} value={opt} className="bg-black">{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          required={field.required}
                          type={field.type || 'text'}
                          value={formData.intakeResponses[field.id] || ''}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            intakeResponses: { ...formData.intakeResponses, [field.id]: e.target.value } 
                          })}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none transition-all"
                          placeholder={field.placeholder}
                        />
                      )}
                    </motion.div>
                  ))}

                  {/* Coupon Code */}
                  {config.coupons_enabled && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2"
                    >
                      <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-4">Coupon Code</label>
                      <input
                        type="text"
                        value={formData.couponCode}
                        onChange={(e) => setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none transition-all"
                        placeholder="PROMO10"
                      />
                    </motion.div>
                  )}

                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-4">Notes (Optional)</label>
                    <div className="relative">
                      <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-gray-500" />
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none transition-all min-h-[120px]"
                        placeholder="Anything else you'd like to share?"
                      />
                    </div>
                  </motion.div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={submitting}
                    className="w-full py-5 rounded-2xl text-white font-black italic uppercase tracking-tight hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl flex items-center justify-center gap-3"
                    style={{ backgroundColor: accentColor, boxShadow: `0 20px 25px -5px ${accentColor}33` }}
                  >
                    {submitting ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        {config.waitlist_enabled ? 'Join Waitlist' : `Confirm Booking ${selectedSlot?.price > 0 ? `(€${selectedSlot.price})` : ''}`}
                      </>
                    )}
                  </motion.button>
                </form>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 space-y-6"
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 12 }}
                  className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 mx-auto"
                >
                  <CheckCircle2 className="w-12 h-12" />
                </motion.div>
                
                <div>
                  <h2 className="text-3xl font-black italic uppercase tracking-tight text-white mb-2">Booking Confirmed!</h2>
                  <p className="text-gray-400">We've sent a confirmation email to {formData.email}.</p>
                </div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-6 rounded-3xl bg-white/5 border border-white/10 max-w-sm mx-auto"
                >
                  <div className="text-sm font-black uppercase tracking-widest text-gray-500 mb-4">Meeting Details</div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-white">
                      <CalendarIcon className="w-5 h-5" style={{ color: accentColor }} />
                      <span className="font-bold">{format(new Date(selectedSlot.start), 'MMMM do, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-3 text-white">
                      <Clock className="w-5 h-5" style={{ color: accentColor }} />
                      <span className="font-bold">{format(new Date(selectedSlot.start), 'HH:mm')} ({config.duration_minutes} min)</span>
                    </div>
                  </div>
                </motion.div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.location.reload()}
                  className="px-8 py-4 rounded-2xl bg-white/10 text-white font-bold hover:bg-white/20 transition-all"
                >
                  Schedule Another
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
