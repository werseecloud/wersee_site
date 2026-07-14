import React, { useState, useEffect } from 'react';
import { 
  Send, Loader2, CheckCircle2, AlertCircle, Mail, Users, 
  LayoutTemplate, Settings, Plus, Search, 
  Filter, MoreVertical, Trash2, Globe, Key, Webhook,
  RefreshCw, FileEdit, Copy, Play, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { invokeApiRunner } from '../../lib/supabase';

import { appToast, destructiveAction } from '@/lib/feedback';
type Tab = 'broadcasts' | 'emails' | 'audience' | 'templates' | 'settings';

export const EmailSender: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('broadcasts');
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [domains, setDomains] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);

  // Modals
  const [isCreating, setIsCreating] = useState(false);
  const [createType, setCreateType] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form states
  const [formData, setFormData] = useState<any>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'broadcasts') {
        const data = await invokeApiRunner('email-campaign-list');
        const items = data.data?.data || data.data || [];
        setBroadcasts(Array.isArray(items) ? items : []);
      } else if (activeTab === 'emails') {
        const data = await invokeApiRunner('email-list');
        const items = data.data?.data || data.data || [];
        setEmails(Array.isArray(items) ? items : []);
      } else if (activeTab === 'audience') {
        const data = await invokeApiRunner('contact-list');
        const items = data.data?.data || data.data || [];
        setContacts(Array.isArray(items) ? items : []);
      } else if (activeTab === 'templates') {
        const data = await invokeApiRunner('email-template-list');
        const items = data.data?.data || data.data || [];
        setTemplates(Array.isArray(items) ? items : []);
      } else if (activeTab === 'settings') {
        const [domData, keyData, hookData] = await Promise.all([
          invokeApiRunner('domain-list'),
          invokeApiRunner('api-key-list'),
          invokeApiRunner('webhook-list')
        ]);
        
        const domItems = domData.data?.data || domData.data || [];
        setDomains(Array.isArray(domItems) ? domItems : []);
        
        const keyItems = keyData.data?.data || keyData.data || [];
        setApiKeys(Array.isArray(keyItems) ? keyItems : []);
        
        const hookItems = hookData.data?.data || hookData.data || [];
        setWebhooks(Array.isArray(hookItems) ? hookItems : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let action = '';
      const payload = { ...formData };

      switch (createType) {
        case 'broadcast':
          action = editingId ? 'email-campaign-update' : 'email-campaign-create';
          if (editingId) payload.id = editingId;
          break;
        case 'email':
          action = 'email-send';
          if (typeof payload.to === 'string') {
            payload.to = payload.to.split(',').map((e: string) => e.trim());
          }
          break;
        case 'contact':
          action = editingId ? 'contact-update' : 'contact-create';
          if (editingId) payload.id = editingId;
          break;
        case 'template':
          action = editingId ? 'email-template-update' : 'email-template-create';
          if (editingId) payload.id = editingId;
          break;
        case 'domain':
          action = editingId ? 'domain-update' : 'domain-create';
          if (editingId) payload.id = editingId;
          break;
        case 'apikey':
          action = 'api-key-create';
          break;
        case 'webhook':
          action = editingId ? 'webhook-update' : 'webhook-create';
          if (editingId) payload.id = editingId;
          if (typeof payload.events === 'string') {
            payload.events = payload.events.split(',').map((e: string) => e.trim());
          }
          break;
      }

      if (!action) throw new Error('Unknown action type');

      const data = await invokeApiRunner(action, payload);

      setSuccess(editingId ? 'Successfully updated!' : 'Successfully created!');
      setTimeout(() => {
        setIsCreating(false);
        setFormData({});
        setEditingId(null);
        setSuccess(null);
        fetchData();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (type: string, id: string) => {
    if (!(await destructiveAction({ description: 'Are you sure you want to delete this? This cannot be undone.' }))) return;
    
    try {
      let action = '';
      switch (type) {
        case 'broadcasts': action = 'email-campaign-delete'; break;
        case 'contacts': action = 'contact-delete'; break;
        case 'templates': action = 'email-template-delete'; break;
        case 'domains': action = 'domain-delete'; break;
        case 'api-keys': action = 'api-key-delete'; break;
        case 'webhooks': action = 'webhook-delete'; break;
      }

      if (!action) throw new Error('Unknown delete type');

      await invokeApiRunner(action, { id });
      fetchData();
    } catch (err) {
      console.error(err);
      appToast('Failed to delete this item.');
    }
  };

  const handleSendBroadcast = async (id: string) => {
    if (!(await destructiveAction({ description: 'Are you sure you want to send this newsletter now?' }))) return;
    try {
      await invokeApiRunner('email-campaign-send', { id });
      fetchData();
    } catch (err) {
      console.error(err);
      appToast('Failed to send the newsletter.');
    }
  };

  const openCreateModal = (type: string) => {
    setCreateType(type);
    setEditingId(null);
    setFormData({});
    setError(null);
    setSuccess(null);
    setIsCreating(true);
  };

  const openEditModal = (type: string, item: any) => {
    setCreateType(type);
    setEditingId(item.id);
    
    // Format data for the form if needed
    const formattedData = { ...item };
    if (type === 'webhook' && Array.isArray(item.events)) {
      formattedData.events = item.events.join(', ');
    }
    
    setFormData(formattedData);
    setError(null);
    setSuccess(null);
    setIsCreating(true);
  };

  const renderTabNavigation = () => (
    <div className="flex items-center gap-1 border-b border-white/10 mb-8 overflow-x-auto pb-px">
      {[
        { id: 'broadcasts', label: 'Newsletters', icon: Mail },
        { id: 'emails', label: 'Single Emails', icon: Send },
        { id: 'audience', label: 'Contacts', icon: Users },
        { id: 'templates', label: 'Templates', icon: LayoutTemplate },
        { id: 'settings', label: 'Settings', icon: Settings },
      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id as Tab)}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === tab.id
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-white/10'
          }`}
        >
          <tab.icon className="w-4 h-4" />
          {tab.label}
        </button>
      ))}
    </div>
  );

  const renderBroadcasts = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-white">Newsletters</h3>
          <p className="text-sm text-gray-400">Send an email to a whole group of people at once.</p>
        </div>
        <button onClick={() => openCreateModal('broadcast')} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors">
          <Plus className="w-4 h-4" /> New Newsletter
        </button>
      </div>
      <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-sm text-gray-400">
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Subject</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
            ) : broadcasts.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No newsletters yet. Click "New Newsletter" to start.</td></tr>
            ) : (
              broadcasts.map((b) => (
                <tr key={b.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-6 py-4 text-white font-medium">{b.name}</td>
                  <td className="px-6 py-4 text-gray-400">{b.subject}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-white/5 text-gray-300 border-white/10 capitalize">{b.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    {b.status === 'draft' && (
                      <button onClick={() => handleSendBroadcast(b.id)} className="p-2 text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors" title="Send">
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    {b.status === 'draft' && (
                      <button onClick={() => openEditModal('broadcast', b)} className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-colors" title="Edit">
                        <FileEdit className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => handleDelete('broadcasts', b.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderEmails = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-white">Sent Emails</h3>
          <p className="text-sm text-gray-400">View emails that have already been sent, or send a new email to one person.</p>
        </div>
        <button onClick={() => openCreateModal('email')} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors">
          <Send className="w-4 h-4" /> Send Single Email
        </button>
      </div>
      <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-sm text-gray-400">
              <th className="px-6 py-4 font-medium">To</th>
              <th className="px-6 py-4 font-medium">Subject</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Sent At</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
            ) : emails.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No emails sent yet.</td></tr>
            ) : (
              emails.map((e) => (
                <tr key={e.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-6 py-4 text-white">{e.to?.join(', ')}</td>
                  <td className="px-6 py-4 text-gray-400">{e.subject}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-white/5 text-gray-300 border-white/10 capitalize">{e.status}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{new Date(e.created_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAudience = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-white">Contacts</h3>
          <p className="text-sm text-gray-400">Manage the list of people who receive your emails.</p>
        </div>
        <button onClick={() => openCreateModal('contact')} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors">
          <Plus className="w-4 h-4" /> Add Contact
        </button>
      </div>
      <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-sm text-gray-400">
              <th className="px-6 py-4 font-medium">Email Address</th>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Unsubscribed</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
            ) : contacts.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No contacts added yet.</td></tr>
            ) : (
              contacts.map((c) => (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-6 py-4 text-white">{c.email}</td>
                  <td className="px-6 py-4 text-gray-400">{c.first_name} {c.last_name}</td>
                  <td className="px-6 py-4 text-gray-400">{c.unsubscribed ? 'Yes' : 'No'}</td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button onClick={() => openEditModal('contact', c)} className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-colors" title="Edit">
                      <FileEdit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete('contacts', c.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTemplates = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-white">Templates</h3>
          <p className="text-sm text-gray-400">Create standard designs that you can use more often.</p>
        </div>
        <button onClick={() => openCreateModal('template')} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors">
          <Plus className="w-4 h-4" /> New Template
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-8 text-center text-gray-500"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
        ) : templates.length === 0 ? (
          <div className="col-span-full py-8 text-center text-gray-500">No templates created yet.</div>
        ) : (
          templates.map((t) => (
            <div key={t.id} className="bg-[#141414] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <LayoutTemplate className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEditModal('template', t)} className="text-gray-500 hover:text-indigo-400 transition-colors" title="Edit">
                    <FileEdit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete('templates', t.id)} className="text-gray-500 hover:text-red-400 transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h4 className="text-white font-medium mb-1">{t.name}</h4>
              <p className="text-sm text-gray-500">ID: {t.id}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-8">
      {/* Domains */}
      <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Globe className="w-5 h-5" /> Website Names (Domains)</h3>
            <p className="text-sm text-gray-400 mt-1">Connect your own website name so emails look like they really come from you.</p>
          </div>
          <button onClick={() => openCreateModal('domain')} className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">Add Domain</button>
        </div>
        <div className="space-y-3">
          {domains.length === 0 ? <p className="text-sm text-gray-500">No domains found.</p> : domains.map(d => (
            <div key={d.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
              <div>
                <p className="text-white font-medium">{d.name}</p>
                <p className="text-xs text-gray-500 capitalize">Status: {d.status}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => openEditModal('domain', d)} className="text-gray-500 hover:text-indigo-400"><FileEdit className="w-4 h-4" /></button>
                <button onClick={() => handleDelete('domains', d.id)} className="text-gray-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* API Keys */}
      <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Key className="w-5 h-5" /> Connections (API Keys)</h3>
            <p className="text-sm text-gray-400 mt-1">Manage the keys to connect other programs.</p>
          </div>
          <button onClick={() => openCreateModal('apikey')} className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">New Key</button>
        </div>
        <div className="space-y-3">
          {apiKeys.length === 0 ? <p className="text-sm text-gray-500">No keys found.</p> : apiKeys.map(k => (
            <div key={k.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
              <div>
                <p className="text-white font-medium">{k.name}</p>
                <p className="text-xs text-gray-500">Created on: {new Date(k.created_at).toLocaleDateString()}</p>
              </div>
              <button onClick={() => handleDelete('api-keys', k.id)} className="text-gray-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Webhooks */}
      <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Webhook className="w-5 h-5" /> Automatic Notifications (Webhooks)</h3>
            <p className="text-sm text-gray-400 mt-1">Get an automatic signal when an email has arrived or been opened.</p>
          </div>
          <button onClick={() => openCreateModal('webhook')} className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">Add Notification</button>
        </div>
        <div className="space-y-3">
          {webhooks.length === 0 ? <p className="text-sm text-gray-500">No notifications found.</p> : webhooks.map(w => (
            <div key={w.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
              <div>
                <p className="text-white font-medium">{w.endpoint_url}</p>
                <p className="text-xs text-gray-500">When: {w.events?.join(', ')}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => openEditModal('webhook', w)} className="text-gray-500 hover:text-indigo-400"><FileEdit className="w-4 h-4" /></button>
                <button onClick={() => handleDelete('webhooks', w.id)} className="text-gray-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCreateModal = () => {
    if (!isCreating) return null;

    const getModalTitle = () => {
      const typeNames: Record<string, string> = {
        'broadcast': 'Newsletter',
        'email': 'Single Email',
        'contact': 'Contact',
        'template': 'Template',
        'domain': 'Domain',
        'apikey': 'API Key',
        'webhook': 'Notification (Webhook)'
      };
      const name = typeNames[createType] || createType;
      return editingId ? `Edit ${name}` : `New ${name}`;
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#141414] border border-white/10 rounded-3xl p-8 w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto"
        >
          <button 
            onClick={() => setIsCreating(false)}
            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          
          <h2 className="text-2xl font-bold text-white mb-6">
            {getModalTitle()}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {createType === 'broadcast' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Newsletter Name</label>
                  <input required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50" placeholder="E.g.: Spring Update 2026" />
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Info className="w-3 h-3"/> A name for yourself, so you know which one this is.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Group ID (Audience ID)</label>
                  <input required value={formData.audience_id || ''} onChange={e => setFormData({...formData, audience_id: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50" placeholder="E.g.: aud_123456789" />
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Info className="w-3 h-3"/> The ID of the group of people you want to send this to. You can find this in the Contacts tab.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Sender Email Address</label>
                  <input required value={formData.from || ''} onChange={e => setFormData({...formData, from: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50" placeholder="Your Name <info@yourwebsite.com>" />
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Info className="w-3 h-3"/> The email address you are sending from. It must be a domain you have added in the Settings tab.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Email Subject</label>
                  <input required value={formData.subject || ''} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50" placeholder="Check out our new features!" />
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Info className="w-3 h-3"/> This is what people see in their inbox.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Email Content (Text / HTML)</label>
                  <textarea required value={formData.html || ''} onChange={e => setFormData({...formData, html: e.target.value})} rows={5} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 font-mono text-sm" placeholder="<h1>Hello everyone!</h1><p>This is a test.</p>" />
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Info className="w-3 h-3"/> The content of your email. You can use HTML tags like &lt;b&gt;bold&lt;/b&gt; or &lt;h1&gt;heading&lt;/h1&gt;.</p>
                </div>
              </>
            )}

            {createType === 'email' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Recipient(s)</label>
                  <input required value={formData.to || ''} onChange={e => setFormData({...formData, to: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50" placeholder="john@example.com, sarah@example.com" />
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Info className="w-3 h-3"/> Who are you sending this to? You can type multiple emails separated by a comma.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Sender Email Address</label>
                  <input required value={formData.from || ''} onChange={e => setFormData({...formData, from: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50" placeholder="Your Name <info@yourwebsite.com>" />
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Info className="w-3 h-3"/> The email address you are sending from. It must be a domain you have added in the Settings tab.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Email Subject</label>
                  <input required value={formData.subject || ''} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50" placeholder="Your purchase was successful!" />
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Info className="w-3 h-3"/> This is what people see in their inbox.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Email Content (Text / HTML)</label>
                  <textarea required value={formData.html || ''} onChange={e => setFormData({...formData, html: e.target.value})} rows={5} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 font-mono text-sm" placeholder="<p>Thank you for your order!</p>" />
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Info className="w-3 h-3"/> The content of your email. You can use HTML tags like &lt;b&gt;bold&lt;/b&gt; or &lt;h1&gt;heading&lt;/h1&gt;.</p>
                </div>
              </>
            )}

            {createType === 'contact' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Group ID (Audience ID)</label>
                  <input required value={formData.audience_id || ''} onChange={e => setFormData({...formData, audience_id: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50" placeholder="E.g.: aud_123456789" />
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Info className="w-3 h-3"/> The ID of the group this person should be added to.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Email Address</label>
                  <input type="email" required value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50" placeholder="customer@example.com" />
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Info className="w-3 h-3"/> The email address of the person you want to add.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-300">First Name (Optional)</label>
                    <input value={formData.first_name || ''} onChange={e => setFormData({...formData, first_name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50" placeholder="John" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-300">Last Name (Optional)</label>
                    <input value={formData.last_name || ''} onChange={e => setFormData({...formData, last_name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50" placeholder="Doe" />
                  </div>
                </div>
                {editingId && (
                  <div className="flex items-center gap-3 pt-2">
                    <input type="checkbox" id="unsubscribed" checked={formData.unsubscribed || false} onChange={e => setFormData({...formData, unsubscribed: e.target.checked})} className="w-4 h-4 rounded border-white/10 bg-black/40 text-indigo-500 focus:ring-indigo-500/50" />
                    <label htmlFor="unsubscribed" className="text-sm font-medium text-gray-300">Unsubscribed</label>
                  </div>
                )}
              </>
            )}

            {createType === 'template' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Template Name</label>
                  <input required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50" placeholder="E.g.: Welcome Email" />
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Info className="w-3 h-3"/> A name for yourself, so you know which template this is.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Email Content (Text / HTML)</label>
                  <textarea required value={formData.html || ''} onChange={e => setFormData({...formData, html: e.target.value})} rows={8} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 font-mono text-sm" placeholder="<h1>Welcome {{first_name}}!</h1>" />
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Info className="w-3 h-3"/> Create your design. You can use codes like {'{{first_name}}'} to automatically insert the person's first name.</p>
                </div>
              </>
            )}

            {createType === 'domain' && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Your Website Name</label>
                <input required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50" placeholder="mycompany.com" />
                <p className="text-xs text-gray-500 flex items-center gap-1"><Info className="w-3 h-3"/> Enter the name of your website (e.g., mycompany.com). This is needed to send emails from your own address.</p>
              </div>
            )}

            {createType === 'apikey' && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Key Name</label>
                <input required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50" placeholder="E.g.: Key for webshop" />
                <p className="text-xs text-gray-500 flex items-center gap-1"><Info className="w-3 h-3"/> A handy name so you know what this key is used for.</p>
              </div>
            )}

            {createType === 'webhook' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Website Link (URL)</label>
                  <input required type="url" value={formData.endpoint_url || ''} onChange={e => setFormData({...formData, endpoint_url: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50" placeholder="https://yourwebsite.com/notifications" />
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Info className="w-3 h-3"/> The link where the automatic notifications should be sent to.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Which Notifications?</label>
                  <input value={formData.events || ''} onChange={e => setFormData({...formData, events: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50" placeholder="email.sent, email.delivered" />
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Info className="w-3 h-3"/> For example: type "email.sent" to get a notification when an email is sent, or "email.delivered" when it arrives.</p>
                </div>
              </>
            )}

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
                  <AlertCircle className="w-5 h-5" /> {error}
                </motion.div>
              )}
              {success && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5" /> {success}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setIsCreating(false)} className="px-6 py-3 bg-white/5 text-white rounded-xl font-medium hover:bg-white/10 transition-colors">Cancel</button>
              <button type="submit" disabled={actionLoading} className="flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 transition-colors disabled:opacity-50">
                {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingId ? <CheckCircle2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />)}
                {editingId ? 'Save' : 'Create'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-white tracking-tight">Send Emails</h1>
          <p className="text-gray-400">Send newsletters, manage your contacts, and adjust settings.</p>
        </div>
      </div>

      {renderTabNavigation()}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'broadcasts' && renderBroadcasts()}
          {activeTab === 'emails' && renderEmails()}
          {activeTab === 'audience' && renderAudience()}
          {activeTab === 'templates' && renderTemplates()}
          {activeTab === 'settings' && renderSettings()}
        </motion.div>
      </AnimatePresence>

      {renderCreateModal()}
    </div>
  );
};
