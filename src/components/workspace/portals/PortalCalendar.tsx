import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, MoreHorizontal, Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../../lib/supabase';

interface PortalCalendarProps {
  businessId: string;
  user: any;
}

export const PortalCalendar: React.FC<PortalCalendarProps> = ({ businessId, user }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    start_time: '',
    location: ''
  });

  useEffect(() => {
    fetchEvents();

    // Real-time subscription
    const channel = supabase
      .channel(`portal-events-${businessId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'portal_events',
          filter: `business_id=eq.${businessId}`
        },
        () => {
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId, currentDate]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();

      const { data, error } = await supabase
        .from('portal_events')
        .select('*')
        .eq('business_id', businessId)
        .gte('start_time', startOfMonth)
        .lte('start_time', endOfMonth);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async () => {
    try {
      const { error } = await supabase
        .from('portal_events')
        .insert({
          business_id: businessId,
          title: newEvent.title,
          description: newEvent.description,
          start_time: newEvent.start_time,
          location: newEvent.location,
          created_by: user.id
        });

      if (error) throw error;
      setShowAddModal(false);
      setNewEvent({ title: '', description: '', start_time: '', location: '' });
      fetchEvents();
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const padding = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-1">Team Calendar</h1>
          <p className="text-gray-500 text-sm">Schedule meetings, deadlines, and team events.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden p-1">
            <button onClick={prevMonth} className="p-2 hover:bg-white/5 text-gray-400 hover:text-white transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-4 text-sm font-bold text-white min-w-[120px] text-center">
              {monthName} {year}
            </div>
            <button onClick={nextMonth} className="p-2 hover:bg-white/5 text-gray-400 hover:text-white transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-sm font-bold text-white transition-all shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden">
        <div className="grid grid-cols-7 border-b border-white/5">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-4 text-center text-[10px] font-black text-gray-500 uppercase tracking-widest">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {padding.map(i => (
            <div key={`p-${i}`} className="aspect-square p-4 border-r border-b border-white/5 opacity-20" />
          ))}
          {days.map(day => {
            const dateStr = `${year}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = events.filter(e => e.start_time.startsWith(dateStr));
            const isToday = new Date().toDateString() === new Date(year, currentDate.getMonth(), day).toDateString();

            return (
              <div key={day} className="aspect-square p-4 border-r border-b border-white/5 group hover:bg-white/[0.01] transition-all relative">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-2 ${
                  isToday ? 'bg-indigo-500 text-white' : 'text-gray-400 group-hover:text-white'
                }`}>
                  {day}
                </div>
                <div className="space-y-1 overflow-hidden">
                  {dayEvents.slice(0, 2).map((event, i) => (
                    <div key={i} className="px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-[9px] font-bold text-indigo-400 truncate">
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[9px] font-bold text-gray-500 pl-2">
                      + {dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Events List */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white">Upcoming Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.slice(0, 4).map((event, i) => (
            <div key={i} className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl flex items-start gap-4 group hover:border-white/10 transition-all">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 shrink-0">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-white group-hover:text-indigo-400 transition-colors">{event.title}</h4>
                  <button className="p-1 text-gray-500 hover:text-white transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-3 line-clamp-1">{event.description}</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      {event.location}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {events.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white/[0.01] border border-dashed border-white/5 rounded-3xl">
              <p className="text-gray-500 text-sm font-medium">No events scheduled for this month.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Event Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-[#111] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl"
            >
              <h2 className="text-2xl font-black text-white tracking-tight mb-2">Schedule Event</h2>
              <p className="text-gray-400 mb-8 text-sm">Add a new event to the team calendar.</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Event Title</label>
                  <input 
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="e.g. Weekly Sync"
                    className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Date & Time</label>
                  <input 
                    type="datetime-local"
                    value={newEvent.start_time}
                    onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                    className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Location</label>
                  <input 
                    type="text"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    placeholder="e.g. Zoom or Meeting Room A"
                    className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAddEvent}
                    className="flex-1 py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20"
                  >
                    Create Event
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
