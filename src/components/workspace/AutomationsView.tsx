import React, { useState, useEffect } from 'react';
import { 
  Zap, Mail, MessageSquare, ShoppingBag, 
  TrendingUp, Plus, Trash2, Save, 
  Loader2, CheckCircle, AlertCircle, Play, 
  Clock, Settings, ChevronRight
} from 'lucide-react';
import { DatabaseService } from '../../services/databaseService';
import { invokeApiRunner } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

import { appToast, destructiveAction } from '@/lib/feedback';
const AutomationCard = ({ automation, onToggle, onDelete, onTest }: any) => (
  <div className="bg-[#141414] p-5 rounded-3xl border border-white/5 hover:border-white/10 transition-all group">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
          automation.type === 'dm' ? 'bg-blue-500/10 text-blue-400' :
          automation.type === 'email' ? 'bg-amber-500/10 text-amber-400' :
          automation.type === 'marketing' ? 'bg-purple-500/10 text-purple-400' :
          'bg-emerald-500/10 text-emerald-400'
        }`}>
          {automation.type === 'dm' ? <MessageSquare className="w-6 h-6" /> :
           automation.type === 'email' ? <Mail className="w-6 h-6" /> :
           automation.type === 'marketing' ? <TrendingUp className="w-6 h-6" /> :
           <ShoppingBag className="w-6 h-6" />}
        </div>
        <div>
          <h3 className="font-bold text-white text-lg">{automation.name}</h3>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Trigger: {automation.trigger_event}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button 
          onClick={() => onTest(automation.id)}
          className="p-2 hover:bg-white/10 rounded-xl text-gray-500 hover:text-white transition-colors"
          title="Test Automation"
        >
          <Play className="w-4 h-4" />
        </button>
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            className="sr-only peer" 
            checked={automation.is_active}
            onChange={() => onToggle(automation.id, !automation.is_active)}
          />
          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
        </label>
      </div>
    </div>
    
    <div className="bg-black/30 p-4 rounded-2xl border border-white/5 mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Action Payload</span>
        <Settings className="w-3 h-3 text-gray-600" />
      </div>
      <pre className="text-[10px] text-indigo-300 font-mono overflow-x-auto">
        {JSON.stringify(automation.action_payload, null, 2)}
      </pre>
    </div>

    <div className="flex items-center justify-between pt-4 border-t border-white/5">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
        <span className="text-[10px] text-gray-500">Last run: 2 hours ago</span>
      </div>
      <button 
        onClick={() => onDelete(automation.id)}
        className="p-2 hover:bg-red-500/10 rounded-xl text-gray-500 hover:text-red-400 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  </div>
);

export const AutomationsView = () => {
  const [loading, setLoading] = useState(true);
  const [automations, setAutomations] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newAutomation, setNewAutomation] = useState({
    name: '',
    type: 'dm',
    trigger_event: 'new_order',
    action_payload: { message: 'Hi! Thanks for your order.' }
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAutomations();
  }, []);

  const fetchAutomations = async () => {
    try {
      setLoading(true);
      const user = await DatabaseService.getAuthUser();
      if (!user) return;

      const data = await DatabaseService.get('automations', {
        select: '*',
        eq: { user_id: user.id },
        order: { column: 'created_at', ascending: false }
      });
      
      setAutomations(data || []);
    } catch (error) {
      console.error('Error fetching automations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await DatabaseService.update('automations', id, { is_active: isActive });
      setAutomations(automations.map(a => a.id === id ? { ...a, is_active: isActive } : a));
    } catch (error) {
      console.error('Error toggling automation:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await destructiveAction({ description: 'Are you sure you want to delete this automation?' }))) return;
    try {
      await DatabaseService.delete('automations', id);
      setAutomations(automations.filter(a => a.id !== id));
    } catch (error) {
      console.error('Error deleting automation:', error);
    }
  };

  const handleCreate = async () => {
    try {
      setSaving(true);
      const user = await DatabaseService.getAuthUser();
      if (!user) return;

      const data = await DatabaseService.insert('automations', {
        ...newAutomation,
        user_id: user.id,
        is_active: true
      });
      
      setAutomations([data, ...automations]);
      setIsAdding(false);
      setNewAutomation({
        name: '',
        type: 'dm',
        trigger_event: 'new_order',
        action_payload: { message: 'Hi! Thanks for your order.' }
      });
    } catch (error) {
      console.error('Error creating automation:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (id: string) => {
    try {
      appToast('Testing automation... Check logs for results.');
      const resData = await invokeApiRunner('trigger', {
        automation_id: id,
        trigger_event: automations.find(a => a.id === id)?.trigger_event,
        payload: { sender_id: 'test-user', receiver_id: 'test-receiver', message: 'Test message' }
      });

      if (resData.error) {
        throw new Error(resData.error || 'Trigger failed');
      }

    } catch (error) {
      console.error('Error testing automation:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Automations</h2>
          <p className="text-gray-400">Automate your workflow with smart triggers and actions.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl font-medium hover:bg-gray-100 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Automation
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {isAdding && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1A1A1A] p-6 rounded-3xl border border-indigo-500/30 shadow-2xl shadow-indigo-500/10"
            >
              <h3 className="text-lg font-bold text-white mb-4">New Automation</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Name</label>
                  <input 
                    type="text" 
                    value={newAutomation.name}
                    onChange={(e) => setNewAutomation({...newAutomation, name: e.target.value})}
                    placeholder="e.g., Welcome DM"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Type</label>
                  <select 
                    value={newAutomation.type}
                    onChange={(e) => setNewAutomation({...newAutomation, type: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none"
                  >
                    <option value="dm">Direct Message</option>
                    <option value="email">Email</option>
                    <option value="product_flow">Product Flow</option>
                    <option value="marketing">Marketing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Trigger Event</label>
                  <select 
                    value={newAutomation.trigger_event}
                    onChange={(e) => setNewAutomation({...newAutomation, trigger_event: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none"
                  >
                    <option value="new_order">New Order</option>
                    <option value="new_message">New Message</option>
                    <option value="new_affiliate">New Affiliate</option>
                    <option value="product_view">Product Viewed</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={handleCreate}
                    disabled={saving || !newAutomation.name}
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create'}
                  </button>
                  <button 
                    onClick={() => setIsAdding(false)}
                    className="px-4 py-2 bg-white/5 text-gray-400 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {automations.map(automation => (
          <AutomationCard 
            key={automation.id} 
            automation={automation} 
            onToggle={handleToggle}
            onDelete={handleDelete}
            onTest={handleTest}
          />
        ))}

        {automations.length === 0 && !isAdding && (
          <div className="col-span-full py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No automations yet</h3>
            <p className="text-gray-500 max-w-xs mx-auto">
              Create your first automation to start scaling your business with zero effort.
            </p>
          </div>
        )}
      </div>

      {/* Logs Section */}
      <div className="bg-[#141414] border border-white/5 rounded-3xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-white">Execution Logs</h3>
          </div>
          <button className="text-sm text-gray-500 hover:text-white transition-colors">Clear Logs</button>
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center justify-between p-4 bg-black/30 rounded-2xl border border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm text-white font-medium">Welcome DM Sent</p>
                  <p className="text-[10px] text-gray-500">To: user_8293 • 15 minutes ago</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
