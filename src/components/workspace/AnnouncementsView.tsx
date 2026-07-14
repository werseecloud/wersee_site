import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

import { appToast, destructiveAction } from '@/lib/feedback';
export const AnnouncementsView = ({ user }: { user: any }) => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', link_url: '' });
  const [businessId, setBusinessId] = useState<string | null>(null);

  useEffect(() => {
    fetchAnnouncements();
  }, [user]);

  const fetchAnnouncements = async () => {
    if (!user) return;
    try {
      setLoading(true);
      // Get business ID
      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('user_id', user.id)
        .single();
        
      if (business) {
        setBusinessId(business.id);
        const { data } = await supabase
          .from('creator_announcements')
          .select('*')
          .eq('business_id', business.id)
          .order('created_at', { ascending: false });
          
        if (data) setAnnouncements(data);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId || !newAnnouncement.title || !newAnnouncement.content) return;
    
    try {
      const { data, error } = await supabase
        .from('creator_announcements')
        .insert([{
          business_id: businessId,
          title: newAnnouncement.title,
          content: newAnnouncement.content,
          link_url: newAnnouncement.link_url || null
        }])
        .select()
        .single();
        
      if (error) throw error;
      
      setAnnouncements([data, ...announcements]);
      setNewAnnouncement({ title: '', content: '', link_url: '' });
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating announcement:', error);
      appToast('Failed to create announcement');
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await destructiveAction({ description: 'Are you sure you want to delete this announcement?' }))) return;
    
    try {
      const { error } = await supabase
        .from('creator_announcements')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      setAnnouncements(announcements.filter(a => a.id !== id));
    } catch (error) {
      console.error('Error deleting announcement:', error);
      appToast('Failed to delete announcement');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading announcements...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#1D1D1F]">Announcements</h2>
          <p className="text-gray-500">Share news and updates with your audience.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Announcement
        </button>
      </div>

      {isCreating && (
        <motion.form 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleCreate} 
          className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input 
              type="text" 
              required
              value={newAnnouncement.title}
              onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="e.g., Big update coming next week!"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea 
              required
              value={newAnnouncement.content}
              onChange={e => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none min-h-[100px]"
              placeholder="What do you want to tell your audience?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link URL (Optional)</label>
            <input 
              type="url" 
              value={newAnnouncement.link_url}
              onChange={e => setNewAnnouncement({...newAnnouncement, link_url: e.target.value})}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="https://..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button 
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Post Announcement
            </button>
          </div>
        </motion.form>
      )}

      <div className="space-y-4">
        {announcements.length === 0 && !isCreating ? (
          <div className="text-center p-12 bg-white rounded-2xl border border-black/5">
            <p className="text-gray-500">You haven't posted any announcements yet.</p>
          </div>
        ) : (
          announcements.map(announcement => (
            <div key={announcement.id} className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold text-lg text-[#1D1D1F]">{announcement.title}</h3>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                    {new Date(announcement.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-600 mb-3 whitespace-pre-wrap">{announcement.content}</p>
                {announcement.link_url && (
                  <a href={announcement.link_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                    <ExternalLink className="w-4 h-4" />
                    {announcement.link_url}
                  </a>
                )}
              </div>
              <div className="flex items-start shrink-0">
                <button 
                  onClick={() => handleDelete(announcement.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  title="Delete announcement"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
