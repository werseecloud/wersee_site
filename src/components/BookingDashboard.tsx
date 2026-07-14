import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Clock, 
  User, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  Users,
  Euro,
  Search,
  Filter,
  Plus,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { CallConfigWizard } from './CallConfigWizard';

export const BookingDashboard: React.FC = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    revenue: 0,
    attended: 0,
    noShow: 0
  });

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('call_bookings')
        .select(`
          *,
          call_configs (
            title,
            price
          )
        `)
        .order('start_time', { ascending: false });

      if (error) throw error;
      setBookings(data || []);

      // Calculate stats
      const total = data?.length || 0;
      const revenue = data?.reduce((sum, b) => sum + (b.call_configs?.price || 0), 0) || 0;
      const attended = data?.filter(b => b.attended === true).length || 0;
      const noShow = data?.filter(b => b.attended === false).length || 0;

      setStats({ total, revenue, attended, noShow });
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateAttendance = async (id: string, attended: boolean) => {
    try {
      const { error } = await supabase
        .from('call_bookings')
        .update({ attended })
        .eq('id', id);
      
      if (error) throw error;
      fetchBookings();
    } catch (err) {
      console.error('Error updating attendance:', err);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-500">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tight text-white flex items-center gap-3">
              Call Scheduling
              <span className="px-2 py-0.5 rounded bg-indigo-500 text-[10px] not-italic tracking-widest">PRO</span>
            </h1>
            <p className="text-gray-400 text-sm">Manage your discovery calls and client appointments.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex p-1 rounded-xl bg-white/5 border border-white/10">
            {['Bookings', 'Settings', 'Embed'].map((tab) => (
              <button 
                key={tab}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  tab === 'Bookings' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setShowWizard(true)}
            className="px-6 py-3 rounded-xl bg-indigo-500 text-white font-black italic uppercase tracking-tight hover:scale-105 transition-all flex items-center gap-2 shadow-xl shadow-indigo-500/20"
          >
            <Plus className="w-5 h-5" />
            Create Booking
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showWizard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWizard(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-[1400px] max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setShowWizard(false)}
                className="absolute top-6 right-6 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
              <CallConfigWizard onSuccess={() => {
                setShowWizard(false);
                fetchBookings();
              }} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="h-[500px] rounded-[3rem] border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-center space-y-6 bg-white/[0.01]">
          <div className="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center text-gray-700">
            <Calendar className="w-12 h-12" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black italic uppercase tracking-tight text-white">No bookings yet</h3>
            <p className="text-gray-500 max-w-sm mx-auto">Share your booking link to start receiving appointments.</p>
          </div>
          <button 
            onClick={() => setShowWizard(true)}
            className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create your first booking type
          </button>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: 'Total Bookings', value: stats.total, icon: Calendar, color: 'text-indigo-400' },
              { label: 'Total Revenue', value: `€${stats.revenue.toFixed(2)}`, icon: Euro, color: 'text-emerald-400' },
              { label: 'Attended', value: stats.attended, icon: CheckCircle2, color: 'text-blue-400' },
              { label: 'No-Shows', value: stats.noShow, icon: XCircle, color: 'text-red-400' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-[2rem] bg-white/5 border border-white/10"
              >
                <stat.icon className={`w-8 h-8 ${stat.color} mb-4`} />
                <div className="text-2xl font-black text-white">{stat.value}</div>
                <div className="text-sm font-medium text-gray-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Bookings Table */}
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Search bookings..." 
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500/50"
                />
              </div>
              <div className="flex gap-2">
                <button className="p-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all">
                  <Filter className="w-5 h-5" />
                </button>
                <button 
                  onClick={fetchBookings}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all"
                >
                  <TrendingUp className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-widest text-gray-500 border-b border-white/10">
                    <th className="px-6 py-4">Guest</th>
                    <th className="px-6 py-4">Service</th>
                    <th className="px-6 py-4">Date & Time</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Attendance</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <AnimatePresence>
                    {bookings.map((booking, i) => (
                      <motion.tr 
                        key={booking.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="group hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                            {booking.guest_name[0]}
                          </div>
                          <div>
                            <div className="text-white font-bold">{booking.guest_name}</div>
                            <div className="text-xs text-gray-500">{booking.guest_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">{booking.call_configs?.title}</div>
                        <div className="text-xs text-emerald-400">€{booking.call_configs?.price}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">{format(new Date(booking.start_time), 'MMM d, yyyy')}</div>
                        <div className="text-xs text-gray-500">{format(new Date(booking.start_time), 'HH:mm')}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          booking.status === 'scheduled' ? 'bg-emerald-500/20 text-emerald-400' :
                          booking.status === 'pending_payment' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {booking.attended === null ? (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => updateAttendance(booking.id, true)}
                              className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-all"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => updateAttendance(booking.id, false)}
                              className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className={`flex items-center gap-2 text-sm font-bold ${booking.attended ? 'text-emerald-400' : 'text-red-400'}`}>
                            {booking.attended ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                            {booking.attended ? 'Attended' : 'No-Show'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-gray-500 hover:text-white transition-colors">
                          <AlertCircle className="w-5 h-5" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
