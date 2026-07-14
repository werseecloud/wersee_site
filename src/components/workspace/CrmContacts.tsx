import React, { useState, useEffect } from 'react';
import { DatabaseService } from '../../services/databaseService';
import { Users, Search, Plus, Mail, Phone, Building, Edit2, Trash2, X, Check, Tag, Activity, Star, Calendar, DollarSign, BrainCircuit, MessageSquare, ArrowRight, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '../ui/Modal';

import { appToast } from '@/lib/feedback';
export const CrmContacts = ({ listingId }: { listingId?: string }) => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [noBusiness, setNoBusiness] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any | null>(null);

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  });
  
  // View state
  const [viewingContact, setViewingContact] = useState<any | null>(null);
  const [contactActivities, setContactActivities] = useState<any[]>([]);
  const [contactDeals, setContactDeals] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company_id: '',
    tags: [] as string[],
    customer_score: 50,
    social_accounts: { twitter: '', linkedin: '' },
    listing_id: listingId || ''
  });

  const [companies, setCompanies] = useState<any[]>([]);

  useEffect(() => {
    fetchContacts();
    fetchCompanies();
    setFormData(prev => ({ ...prev, listing_id: listingId || '' }));
  }, [listingId]);

  const fetchCompanies = async () => {
    try {
      const data = await DatabaseService.get('crm_companies', {
        select: 'id, name',
        order: { column: 'name' }
      });
      if (data) setCompanies(data);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchContacts = async () => {
    try {
      setLoading(true);
      setNoBusiness(false);
      
      const user = await DatabaseService.getAuthUser();
      if (!user) return;

      // Get user's business_id
      const teamMember = await DatabaseService.get('team_members', {
        select: 'business_id',
        eq: { user_id: user.id },
        maybeSingle: true
      });

      let businessIdToUse = teamMember?.business_id;

      if (!businessIdToUse) {
        const ownedBusiness = await DatabaseService.get('businesses', {
          select: 'id',
          eq: { user_id: user.id },
          maybeSingle: true
        });
        if (ownedBusiness) businessIdToUse = ownedBusiness.id;
      }

      if (!businessIdToUse) {
        setNoBusiness(true);
        setLoading(false);
        return;
      }

      const options: any = {
        select: '*, company:crm_companies(id, name)',
        eq: { business_id: businessIdToUse },
        order: { column: 'created_at', ascending: false }
      };
      
      if (listingId) {
        options.eq.listing_id = listingId;
      }

      try {
        const contactsData = await DatabaseService.get('crm_contacts', options);
        setContacts(contactsData || []);
      } catch (contactsError: any) {
        if (contactsError && contactsError.message && contactsError.message.includes('column crm_contacts.listing_id does not exist')) {
          console.warn('listing_id column missing in crm_contacts, fetching all contacts for business');
          delete options.eq.listing_id;
          const allContactsData = await DatabaseService.get('crm_contacts', options);
          setContacts(allContactsData || []);
        } else {
          throw contactsError;
        }
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContactDetails = async (contactId: string) => {
    try {
      setLoadingDetails(true);
      
      // Fetch activities
      const { data: activities } = await DatabaseService.get('crm_activities', {
        eq: { contact_id: contactId },
        order: { column: 'created_at', ascending: false }
      });
        
      setContactActivities(activities || []);

      // Fetch deals
      const { data: deals } = await DatabaseService.get('crm_deals', {
        select: '*, pipeline:crm_pipelines(name)',
        eq: { contact_id: contactId },
        order: { column: 'created_at', ascending: false }
      });
        
      setContactDeals(deals || []);
      
    } catch (error) {
      console.error('Error fetching contact details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewContact = (contact: any) => {
    setViewingContact(contact);
    fetchContactDetails(contact.id);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await DatabaseService.getAuthUser();
      if (!user) return;

      // Get user's business_id
      const teamMember = await DatabaseService.get('team_members', {
        select: 'business_id',
        eq: { user_id: user.id },
        maybeSingle: true
      });

      let businessIdToUse = teamMember?.business_id;

      if (!businessIdToUse) {
        const ownedBusiness = await DatabaseService.get('businesses', {
          select: 'id',
          eq: { user_id: user.id },
          maybeSingle: true
        });
        if (ownedBusiness) businessIdToUse = ownedBusiness.id;
      }

      if (!businessIdToUse) throw new Error('No business found. Please create a business first.');

      const contactData = {
        ...formData,
        business_id: businessIdToUse,
        user_id: user.id
      };

      if (selectedContact) {
        const { error } = await DatabaseService.update('crm_contacts', selectedContact.id, contactData);
        if (error) throw error;
        
        // Log activity
        await DatabaseService.insert('crm_activities', {
          business_id: businessIdToUse,
          contact_id: selectedContact.id,
          type: 'status_change',
          description: 'Contact profile updated',
          created_by: user.id
        });
      } else {
        const { data: newContactData, error } = await DatabaseService.insert('crm_contacts', contactData);
        if (error) throw error;
        
        const newContact = Array.isArray(newContactData) ? newContactData[0] : newContactData;
        
        // Log activity
        if (newContact) {
          await DatabaseService.insert('crm_activities', {
            business_id: businessIdToUse,
            contact_id: newContact.id,
            type: 'note_added',
            description: 'Contact created',
            created_by: user.id
          });
        }
      }

      setIsAddModalOpen(false);
      setSelectedContact(null);
      setFormData({
        name: '', email: '', phone: '', company_id: '', tags: [], customer_score: 50, social_accounts: { twitter: '', linkedin: '' }, listing_id: listingId || ''
      });
      fetchContacts();
      
      if (viewingContact && selectedContact && viewingContact.id === selectedContact.id) {
        // Update viewing contact with new data
        setViewingContact({ ...viewingContact, ...contactData });
      }
    } catch (error) {
      console.error('Error saving contact:', error);
      appToast('Failed to save contact. Please check console.');
    }
  };

  const handleDeleteContact = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeleteConfirm({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return;
    try {
      await DatabaseService.delete('crm_contacts', deleteConfirm.id);
      if (viewingContact?.id === deleteConfirm.id) setViewingContact(null);
      fetchContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
    } finally {
      setDeleteConfirm({ isOpen: false, id: null });
    }
  };

  const openEditModal = (contact: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedContact(contact);
    setFormData({
      name: contact.name || '',
      email: contact.email || '',
      phone: contact.phone || '',
      company_id: contact.company_id || '',
      tags: contact.tags || [],
      customer_score: contact.customer_score || 50,
      social_accounts: contact.social_accounts || { twitter: '', linkedin: '' },
      listing_id: contact.listing_id || listingId || ''
    });
    setIsAddModalOpen(true);
  };

  const filteredContacts = contacts.filter(c => 
    `${c.name} ${c.email} ${c.company?.name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'note_added': return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case 'status_change': return <Activity className="w-4 h-4 text-purple-400" />;
      case 'email_sent': return <Mail className="w-4 h-4 text-emerald-400" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input 
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>
        <button 
          onClick={() => {
            setSelectedContact(null);
            setFormData({
              name: '', email: '', phone: '', company_id: '', tags: [], customer_score: 50, social_accounts: { twitter: '', linkedin: '' }, listing_id: listingId || ''
            });
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl font-bold hover:bg-gray-100 transition-colors shrink-0"
        >
          <Plus className="w-5 h-5" />
          Add Contact
        </button>
      </div>

      <div className="bg-[#141414] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-gray-500 bg-white/[0.02]">
                <th className="p-4 font-bold">Name</th>
                <th className="p-4 font-bold">Contact</th>
                <th className="p-4 font-bold">Company</th>
                <th className="p-4 font-bold">Score</th>
                <th className="p-4 font-bold">Tags</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    <div className="animate-pulse flex flex-col items-center gap-2">
                      <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      Loading contacts...
                    </div>
                  </td>
                </tr>
              ) : noBusiness ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                        <Building className="w-8 h-8 text-gray-600" />
                      </div>
                      <p className="font-medium">No business found. Please create a business first.</p>
                    </div>
                  </td>
                </tr>
              ) : filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                        <Users className="w-8 h-8 text-gray-600" />
                      </div>
                      <p className="font-medium">No contacts found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => (
                  <tr 
                    key={contact.id} 
                    onClick={() => handleViewContact(contact)}
                    className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-white font-bold shrink-0">
                          {contact.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="font-bold text-white">
                          {contact.name}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        {contact.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Mail className="w-3.5 h-3.5" />
                            <a href={`mailto:${contact.email}`} onClick={e => e.stopPropagation()} className="hover:text-white transition-colors">{contact.email}</a>
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Phone className="w-3.5 h-3.5" />
                            <a href={`tel:${contact.phone}`} onClick={e => e.stopPropagation()} className="hover:text-white transition-colors">{contact.phone}</a>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {contact.company ? (
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Building className="w-4 h-4 text-gray-500" />
                          {contact.company.name}
                        </div>
                      ) : (
                        <span className="text-gray-600 text-sm">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="font-bold">{contact.customer_score}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {contact.tags?.map((tag: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-white/10 text-xs text-gray-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => openEditModal(contact, e)}
                          className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteContact(contact.id, e)}
                          className="p-2 hover:bg-red-500/20 rounded-xl text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Layout */}
        <div className="md:hidden divide-y divide-white/5">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-pulse flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                Loading contacts...
              </div>
            </div>
          ) : noBusiness ? (
            <div className="p-12 text-center text-gray-500">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                  <Building className="w-8 h-8 text-gray-600" />
                </div>
                <p className="font-medium">No business found. Please create a business first.</p>
              </div>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                  <Users className="w-8 h-8 text-gray-600" />
                </div>
                <p className="font-medium">No contacts found.</p>
              </div>
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <div 
                key={contact.id} 
                onClick={() => handleViewContact(contact)}
                className="p-4 hover:bg-white/[0.02] transition-colors active:bg-white/5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-white font-bold shrink-0">
                      {contact.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="font-bold text-white">{contact.name}</div>
                      {contact.company && (
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          {contact.company.name}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-500 text-sm">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-bold">{contact.customer_score}</span>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  {contact.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate">{contact.email}</span>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{contact.phone}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {contact.tags?.slice(0, 3).map((tag: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] text-gray-300">
                        {tag}
                      </span>
                    ))}
                    {contact.tags?.length > 3 && (
                      <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] text-gray-500">
                        +{contact.tags.length - 3}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => openEditModal(contact, e)}
                      className="p-2 bg-white/5 rounded-lg text-gray-400"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => handleDeleteContact(contact.id, e)}
                      className="p-2 bg-red-500/10 rounded-lg text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Slide-over Contact Details */}
      <AnimatePresence>
        {viewingContact && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingContact(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full md:max-w-md bg-[#141414] border-l border-white/10 shadow-2xl z-[100] flex flex-col"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
                <h2 className="text-xl font-bold text-white">Contact Details</h2>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => openEditModal(viewingContact)}
                    className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setViewingContact(null)}
                    className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Header Info */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-white text-2xl font-bold shrink-0">
                    {viewingContact.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{viewingContact.name}</h3>
                    {viewingContact.company && (
                      <div className="flex items-center gap-2 text-gray-400 mt-1">
                        <Building className="w-4 h-4" />
                        <span>{viewingContact.company.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Customer Score</div>
                    <div className="flex items-center gap-2 text-yellow-500">
                      <Star className="w-5 h-5 fill-current" />
                      <span className="text-2xl font-bold">{viewingContact.customer_score}</span>
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Lifetime Value</div>
                    <div className="flex items-center gap-2 text-emerald-500">
                      <DollarSign className="w-5 h-5" />
                      <span className="text-2xl font-bold">{viewingContact.lifetime_value || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Contact Information</h4>
                  <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-4">
                    {viewingContact.email && (
                      <div className="flex items-center gap-3 text-gray-300">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <a href={`mailto:${viewingContact.email}`} className="hover:text-white transition-colors">{viewingContact.email}</a>
                      </div>
                    )}
                    {viewingContact.phone && (
                      <div className="flex items-center gap-3 text-gray-300">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <a href={`tel:${viewingContact.phone}`} className="hover:text-white transition-colors">{viewingContact.phone}</a>
                      </div>
                    )}
                    {(!viewingContact.email && !viewingContact.phone) && (
                      <div className="text-sm text-gray-500">No contact information provided.</div>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {viewingContact.tags && viewingContact.tags.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {viewingContact.tags.map((tag: string, i: number) => (
                        <span key={i} className="px-3 py-1 rounded-lg bg-white/10 text-sm text-gray-300 flex items-center gap-1.5">
                          <Tag className="w-3 h-3 text-gray-400" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Linked Deals */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Active Deals</h4>
                  {loadingDetails ? (
                    <div className="animate-pulse h-20 bg-white/5 rounded-2xl" />
                  ) : contactDeals.length > 0 ? (
                    <div className="space-y-3">
                      {contactDeals.map(deal => (
                        <div key={deal.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-bold text-white">{deal.title}</h5>
                            <span className="text-emerald-500 font-bold">${Number(deal.value).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">{deal.pipeline?.name || 'Pipeline'}</span>
                            <span className={`font-bold px-2 py-1 rounded-md ${
                              deal.probability >= 70 ? 'bg-emerald-500/10 text-emerald-500' :
                              deal.probability >= 40 ? 'bg-yellow-500/10 text-yellow-500' :
                              'bg-red-500/10 text-red-500'
                            }`}>
                              {deal.probability}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 bg-white/5 rounded-2xl p-4 text-center">
                      No active deals for this contact.
                    </div>
                  )}
                </div>

                {/* Activity Timeline */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Activity Timeline</h4>
                  {loadingDetails ? (
                    <div className="animate-pulse h-32 bg-white/5 rounded-2xl" />
                  ) : contactActivities.length > 0 ? (
                    <div className="relative pl-4 space-y-6 before:absolute before:inset-y-0 before:left-[11px] before:w-px before:bg-white/10">
                      {contactActivities.map((activity, i) => (
                        <div key={activity.id} className="relative pl-6">
                          <div className="absolute left-[-13px] top-1 w-6 h-6 rounded-full bg-[#141414] border border-white/10 flex items-center justify-center">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                            <p className="text-sm text-white">{activity.description}</p>
                            <span className="text-xs text-gray-500 mt-1 block">
                              {new Date(activity.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 bg-white/5 rounded-2xl p-4 text-center">
                      No recent activity.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[#141414] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-full"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
                <h2 className="text-xl font-bold text-white">
                  {selectedContact ? 'Edit Contact' : 'Add New Contact'}
                </h2>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <form id="contact-form" onSubmit={handleSaveContact} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20 transition-colors"
                      placeholder="Jane Doe"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email</label>
                      <input 
                        type="email" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20 transition-colors"
                        placeholder="jane@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Phone</label>
                      <input 
                        type="tel" 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20 transition-colors"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Company</label>
                      <select 
                        value={formData.company_id}
                        onChange={(e) => setFormData({...formData, company_id: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20 transition-colors appearance-none"
                      >
                        <option value="" className="bg-[#141414]">No Company</option>
                        {companies.map(c => (
                          <option key={c.id} value={c.id} className="bg-[#141414]">{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Customer Score (0-100)</label>
                      <input 
                        type="number" 
                        min="0" max="100"
                        value={formData.customer_score}
                        onChange={(e) => setFormData({...formData, customer_score: parseInt(e.target.value) || 0})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tags (comma separated)</label>
                    <input 
                      type="text" 
                      value={formData.tags.join(', ')}
                      onChange={(e) => setFormData({...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20 transition-colors"
                      placeholder="VIP, High Spender, Tech"
                    />
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-white/5 flex items-center justify-end gap-3 shrink-0 bg-[#0A0A0A]">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-6 py-3 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  form="contact-form"
                  className="px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  {selectedContact ? 'Save Changes' : 'Add Contact'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        className="max-w-md"
      >
        <div className="flex flex-col items-center text-center p-2">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Delete Contact</h3>
          <p className="text-gray-400 mb-8">
            Are you sure you want to delete this contact? This action cannot be undone and will remove all associated data.
          </p>
          <div className="flex gap-3 w-full">
            <button
              onClick={() => setDeleteConfirm({ isOpen: false, id: null })}
              className="flex-1 px-6 py-3 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
