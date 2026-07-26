import React, { useState, useEffect } from 'react';
import { DatabaseService } from '../../services/databaseService';
import { Building, Search, Plus, Globe, Users, Edit2, Trash2, X, Check, DollarSign, Activity, MessageSquare, Mail, Star, User, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '../ui/Modal';
import { SaveStateButton, type SaveState } from '../ui/SaveStateButton';
import { resolveCrmBusinessId } from '../../lib/crmBusiness';

import { appToast } from '@/lib/feedback';
export const CrmCompanies = ({ listingId }: { listingId?: string }) => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [noBusiness, setNoBusiness] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  });

  // View state
  const [viewingCompany, setViewingCompany] = useState<any | null>(null);
  const [companyActivities, setCompanyActivities] = useState<any[]>([]);
  const [companyDeals, setCompanyDeals] = useState<any[]>([]);
  const [companyContacts, setCompanyContacts] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    industry: '',
    estimated_revenue: 0,
    employee_count: 0,
    listing_id: listingId || ''
  });

  useEffect(() => {
    fetchCompanies();
    setFormData(prev => ({ ...prev, listing_id: listingId || '' }));
  }, [listingId]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setNoBusiness(false);
      const user = await DatabaseService.getAuthUser();
      if (!user) return;

      const businessIdToUse = await resolveCrmBusinessId(user.id);

      if (!businessIdToUse) {
        setNoBusiness(true);
        setLoading(false);
        return;
      }

      const queryOptions: any = {
        select: `
          *,
          contacts:crm_contacts(count),
          deals:crm_deals(count)
        `,
        eq: { business_id: businessIdToUse },
        order: { column: 'created_at', ascending: false }
      };
      
      if (listingId) {
        // Try filtering by listing_id
        try {
          const companiesData = await DatabaseService.get('crm_companies', {
            ...queryOptions,
            eq: { ...queryOptions.eq, listing_id: listingId }
          });
          setCompanies(companiesData || []);
        } catch (companiesError: any) {
          if (companiesError.message?.includes('column crm_companies.listing_id does not exist')) {
            console.warn('listing_id column missing in crm_companies, fetching all companies for business');
            const allCompaniesData = await DatabaseService.get('crm_companies', queryOptions);
            setCompanies(allCompaniesData || []);
          } else {
            throw companiesError;
          }
        }
      } else {
        const companiesData = await DatabaseService.get('crm_companies', queryOptions);
        setCompanies(companiesData || []);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyDetails = async (companyId: string) => {
    try {
      setLoadingDetails(true);
      
      // Fetch contacts
      const contacts = await DatabaseService.get('crm_contacts', {
        select: '*',
        eq: { company_id: companyId },
        order: { column: 'name', ascending: true }
      });
        
      setCompanyContacts(contacts || []);

      // Fetch deals
      const deals = await DatabaseService.get('crm_deals', {
        select: '*, pipeline:crm_pipelines(name)',
        eq: { company_id: companyId },
        order: { column: 'created_at', ascending: false }
      });
        
      setCompanyDeals(deals || []);

      // Fetch activities (we need to get activities for all contacts in this company + deals in this company)
      // For simplicity, let's just fetch activities where contact_id is in companyContacts
      if (contacts && contacts.length > 0) {
        const contactIds = contacts.map((c: any) => c.id);
        const activities = await DatabaseService.get('crm_activities', {
          select: '*',
          in: { column: 'contact_id', values: contactIds },
          order: { column: 'created_at', ascending: false },
          limit: 20
        });
          
        setCompanyActivities(activities || []);
      } else {
        setCompanyActivities([]);
      }
      
    } catch (error) {
      console.error('Error fetching company details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewCompany = (company: any) => {
    setViewingCompany(company);
    fetchCompanyDetails(company.id);
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveState('saving');
    try {
      const user = await DatabaseService.getAuthUser();
      if (!user) throw new Error('You must be signed in to save a company.');
      const businessIdToUse = await resolveCrmBusinessId(user.id);

      if (!businessIdToUse) throw new Error('No business found. Please create a business first.');

      const companyData = {
        ...formData,
        listing_id: formData.listing_id || null,
        business_id: businessIdToUse
      };

      if (selectedCompany) {
        await DatabaseService.update('crm_companies', selectedCompany.id, companyData);
      } else {
        await DatabaseService.insert('crm_companies', companyData);
      }

      setSaveState('saved');
      await new Promise((resolve) => setTimeout(resolve, 550));
      setIsAddModalOpen(false);
      setSelectedCompany(null);
      setFormData({
        name: '', website: '', industry: '', estimated_revenue: 0, employee_count: 0, listing_id: listingId || ''
      });
      fetchCompanies();

      if (viewingCompany && selectedCompany && viewingCompany.id === selectedCompany.id) {
        setViewingCompany({ ...viewingCompany, ...companyData });
      }
      setSaveState('idle');
    } catch (error) {
      console.error('Error saving company:', error);
      setSaveState('error');
      appToast(error instanceof Error ? error.message : 'Failed to save company');
    }
  };

  const handleDeleteCompany = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeleteConfirm({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return;
    try {
      await DatabaseService.delete('crm_companies', deleteConfirm.id);
      if (viewingCompany?.id === deleteConfirm.id) setViewingCompany(null);
      fetchCompanies();
    } catch (error) {
      console.error('Error deleting company:', error);
    } finally {
      setDeleteConfirm({ isOpen: false, id: null });
    }
  };

  const openEditModal = (company: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedCompany(company);
    setFormData({
      name: company.name || '',
      website: company.website || '',
      industry: company.industry || '',
      estimated_revenue: company.estimated_revenue || 0,
      employee_count: company.employee_count || 0,
      listing_id: company.listing_id || listingId || ''
    });
    setIsAddModalOpen(true);
  };

  const filteredCompanies = companies.filter(c => 
    `${c.name} ${c.industry}`.toLowerCase().includes(searchQuery.toLowerCase())
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
            placeholder="Search companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>
        <button 
          onClick={() => {
            setSelectedCompany(null);
            setFormData({
              name: '', website: '', industry: '', estimated_revenue: 0, employee_count: 0, listing_id: listingId || ''
            });
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl font-bold hover:bg-gray-100 transition-colors shrink-0"
        >
          <Plus className="w-5 h-5" />
          Add Company
        </button>
      </div>

      <div className="bg-[#141414] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-gray-500 bg-white/[0.02]">
                <th className="p-4 font-bold">Company</th>
                <th className="p-4 font-bold">Industry</th>
                <th className="p-4 font-bold">Revenue</th>
                <th className="p-4 font-bold">Employees</th>
                <th className="p-4 font-bold">Contacts</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    <div className="animate-pulse flex flex-col items-center gap-2">
                      <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      Loading companies...
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
                      <p className="font-medium">No business found. Please set up a business first.</p>
                    </div>
                  </td>
                </tr>
              ) : filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                        <Building className="w-8 h-8 text-gray-600" />
                      </div>
                      <p className="font-medium">No companies found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((company) => (
                  <tr 
                    key={company.id} 
                    onClick={() => handleViewCompany(company)}
                    className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center text-white font-bold shrink-0">
                          <Building className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-white">
                            {company.name}
                          </div>
                          {company.website && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                              <Globe className="w-3 h-3" />
                              <a href={company.website} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="hover:text-white transition-colors">
                                {company.website.replace(/^https?:\/\//, '')}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-300">
                      {company.industry || '-'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-emerald-500 font-medium">
                        <DollarSign className="w-4 h-4" />
                        {company.estimated_revenue ? company.estimated_revenue.toLocaleString() : '-'}
                      </div>
                    </td>
                    <td className="p-4 text-gray-300">
                      {company.employee_count || '-'}
                    </td>
                    <td className="p-4 text-gray-300">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-gray-500" />
                        {company.contacts?.[0]?.count || 0}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => openEditModal(company, e)}
                          className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteCompany(company.id, e)}
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
                Loading companies...
              </div>
            </div>
          ) : noBusiness ? (
            <div className="p-12 text-center text-gray-500">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                  <Building className="w-8 h-8 text-gray-600" />
                </div>
                <p className="font-medium">No business found. Please set up a business first.</p>
              </div>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                  <Building className="w-8 h-8 text-gray-600" />
                </div>
                <p className="font-medium">No companies found.</p>
              </div>
            </div>
          ) : (
            filteredCompanies.map((company) => (
              <div 
                key={company.id} 
                onClick={() => handleViewCompany(company)}
                className="p-4 hover:bg-white/[0.02] transition-colors active:bg-white/5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center text-white font-bold shrink-0">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-white">{company.name}</div>
                      <div className="text-xs text-gray-500">{company.industry || 'No industry'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-500 text-sm font-bold">
                    <DollarSign className="w-3.5 h-3.5" />
                    {company.estimated_revenue ? company.estimated_revenue.toLocaleString() : '0'}
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Users className="w-3.5 h-3.5" />
                    {company.contacts?.[0]?.count || 0} Contacts
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Activity className="w-3.5 h-3.5" />
                    {company.deals?.[0]?.count || 0} Deals
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  {company.website ? (
                    <div className="flex items-center gap-1 text-xs text-blue-400 truncate max-w-[150px]">
                      <Globe className="w-3 h-3" />
                      <span className="truncate">{company.website.replace(/^https?:\/\//, '')}</span>
                    </div>
                  ) : <div />}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => openEditModal(company, e)}
                      className="p-2 bg-white/5 rounded-lg text-gray-400"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => handleDeleteCompany(company.id, e)}
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

      {/* Slide-over Company Details */}
      <AnimatePresence>
        {viewingCompany && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingCompany(null)}
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
                <h2 className="text-xl font-bold text-white">Company Details</h2>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => openEditModal(viewingCompany)}
                    className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setViewingCompany(null)}
                    className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Header Info */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center text-white shrink-0">
                    <Building className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{viewingCompany.name}</h3>
                    {viewingCompany.industry && (
                      <div className="text-gray-400 mt-1">
                        {viewingCompany.industry}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Est. Revenue</div>
                    <div className="flex items-center gap-2 text-emerald-500">
                      <DollarSign className="w-5 h-5" />
                      <span className="text-2xl font-bold">{viewingCompany.estimated_revenue ? viewingCompany.estimated_revenue.toLocaleString() : '0'}</span>
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Employees</div>
                    <div className="flex items-center gap-2 text-blue-500">
                      <Users className="w-5 h-5" />
                      <span className="text-2xl font-bold">{viewingCompany.employee_count || '0'}</span>
                    </div>
                  </div>
                </div>

                {/* Company Info */}
                {viewingCompany.website && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Website</h4>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <div className="flex items-center gap-3 text-gray-300">
                        <Globe className="w-4 h-4 text-gray-500" />
                        <a href={viewingCompany.website} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                          {viewingCompany.website}
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Linked Contacts */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Contacts ({companyContacts.length})</h4>
                  {loadingDetails ? (
                    <div className="animate-pulse h-20 bg-white/5 rounded-2xl" />
                  ) : companyContacts.length > 0 ? (
                    <div className="space-y-3">
                      {companyContacts.map(contact => (
                        <div key={contact.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-colors flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                              {contact.name?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <div className="font-bold text-white text-sm">{contact.name}</div>
                              {contact.email && <div className="text-xs text-gray-500">{contact.email}</div>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold">
                            <Star className="w-3 h-3 fill-current" />
                            {contact.customer_score}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 bg-white/5 rounded-2xl p-4 text-center">
                      No contacts linked to this company.
                    </div>
                  )}
                </div>

                {/* Linked Deals */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Active Deals ({companyDeals.length})</h4>
                  {loadingDetails ? (
                    <div className="animate-pulse h-20 bg-white/5 rounded-2xl" />
                  ) : companyDeals.length > 0 ? (
                    <div className="space-y-3">
                      {companyDeals.map(deal => (
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
                      No active deals for this company.
                    </div>
                  )}
                </div>

                {/* Activity Timeline */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Recent Activity</h4>
                  {loadingDetails ? (
                    <div className="animate-pulse h-32 bg-white/5 rounded-2xl" />
                  ) : companyActivities.length > 0 ? (
                    <div className="relative pl-4 space-y-6 before:absolute before:inset-y-0 before:left-[11px] before:w-px before:bg-white/10">
                      {companyActivities.map((activity, i) => (
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
                  {selectedCompany ? 'Edit Company' : 'Add New Company'}
                </h2>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <form id="company-form" onSubmit={handleSaveCompany} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Company Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20 transition-colors"
                      placeholder="Acme Corp"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Website</label>
                      <input 
                        type="url" 
                        value={formData.website}
                        onChange={(e) => setFormData({...formData, website: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20 transition-colors"
                        placeholder="https://acme.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Industry</label>
                      <input 
                        type="text" 
                        value={formData.industry}
                        onChange={(e) => setFormData({...formData, industry: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20 transition-colors"
                        placeholder="Software, Retail, etc."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Estimated Revenue</label>
                      <input 
                        type="number" 
                        value={formData.estimated_revenue}
                        onChange={(e) => setFormData({...formData, estimated_revenue: parseInt(e.target.value) || 0})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Employee Count</label>
                      <input 
                        type="number" 
                        value={formData.employee_count}
                        onChange={(e) => setFormData({...formData, employee_count: parseInt(e.target.value) || 0})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20 transition-colors"
                      />
                    </div>
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
                <SaveStateButton
                  type="submit"
                  form="company-form"
                  state={saveState}
                  idleLabel={selectedCompany ? 'Save Changes' : 'Add Company'}
                  savedLabel="Company saved"
                />
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
          <h3 className="text-xl font-bold text-white mb-2">Delete Company</h3>
          <p className="text-gray-400 mb-8">
            Are you sure you want to delete this company? This action cannot be undone and will remove all associated data.
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
