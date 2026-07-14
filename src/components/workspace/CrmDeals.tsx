import React, { useState, useEffect } from 'react';
import { DatabaseService } from '../../services/databaseService';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, DollarSign, Calendar, MoreVertical, Building, User, BrainCircuit, X, Check, Edit2, Trash2, Mail, Phone, FileText, ArrowRight, Activity, MessageSquare, Clock, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '../ui/Modal';

import { appToast } from '@/lib/feedback';
export const CrmDeals = ({ listingId }: { listingId?: string }) => {
  const [deals, setDeals] = useState<any[]>([]);
  const [pipeline, setPipeline] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [noBusiness, setNoBusiness] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<any | null>(null);
  const [viewingDeal, setViewingDeal] = useState<any | null>(null);
  const [dealActivities, setDealActivities] = useState<any[]>([]);

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  });

  const [contacts, setContacts] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    value: 0,
    stage_id: '',
    probability: 50,
    expected_close_date: '',
    contact_id: '',
    company_id: '',
    notes: '',
    listing_id: listingId || ''
  });

  useEffect(() => {
    fetchData();
    setFormData(prev => ({ ...prev, listing_id: listingId || '' }));
  }, [listingId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setNoBusiness(false);
      const user = await DatabaseService.getAuthUser();
      if (!user) return;

      const teamMember = await DatabaseService.get('team_members', {
        select: 'business_id',
        eq: { user_id: user.id },
        maybeSingle: true
      });

      let businessIdToUse = teamMember?.business_id;

      if (!businessIdToUse) {
        // Fallback: check if user owns any business
        const ownedBusiness = await DatabaseService.get('businesses', {
          select: 'id',
          eq: { user_id: user.id },
          maybeSingle: true
        });
        
        if (ownedBusiness) {
          businessIdToUse = ownedBusiness.id;
        }
      }

      if (!businessIdToUse) {
        setNoBusiness(true);
        setLoading(false);
        return;
      }

      // Fetch pipeline
      let pipelineData = await DatabaseService.get('crm_pipelines', {
        select: '*',
        eq: { business_id: businessIdToUse },
        maybeSingle: true
      });

      if (!pipelineData) {
        // Create default pipeline
        pipelineData = await DatabaseService.insert('crm_pipelines', { 
          business_id: businessIdToUse, 
          name: 'Default Pipeline' 
        });
      }
      setPipeline(pipelineData);

      // Fetch deals
      const dealsOptions: any = {
        select: `
          *,
          contact:crm_contacts(name),
          company:crm_companies(name)
        `,
        eq: { pipeline_id: pipelineData.id },
        order: { column: 'created_at', ascending: false }
      };
      
      // We'll try to filter by listing_id, but if it fails we'll fallback to all deals
      // This is to handle cases where the column might not exist yet
      if (listingId) {
        try {
          const dealsData = await DatabaseService.get('crm_deals', {
            ...dealsOptions,
            eq: { ...dealsOptions.eq, listing_id: listingId }
          });
          setDeals(dealsData || []);
        } catch (dealsError: any) {
          if (dealsError.message?.includes('column crm_deals.listing_id does not exist')) {
            console.warn('listing_id column missing in crm_deals, fetching all deals');
            const allDealsData = await DatabaseService.get('crm_deals', dealsOptions);
            setDeals(allDealsData || []);
          } else {
            throw dealsError;
          }
        }
      } else {
        const dealsData = await DatabaseService.get('crm_deals', dealsOptions);
        setDeals(dealsData || []);
      }

      // Update viewingDeal if it's currently open
      if (viewingDeal) {
        const updatedViewingDeal = deals.find(d => d.id === viewingDeal.id);
        if (updatedViewingDeal) {
          setViewingDeal(updatedViewingDeal);
          // Re-fetch activities
          const activities = await DatabaseService.get('crm_activities', {
            select: '*',
            eq: { deal_id: updatedViewingDeal.id },
            order: { column: 'created_at', ascending: false }
          });
          setDealActivities(activities || []);
        } else {
          setViewingDeal(null);
        }
      }

      // Fetch related data for forms
      const contactsData = await DatabaseService.get('crm_contacts', { select: 'id, name' });
      const companiesData = await DatabaseService.get('crm_companies', { select: 'id, name' });
      
      setContacts(contactsData || []);
      setCompanies(companiesData || []);

    } catch (error) {
      console.error('Error fetching deals data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDeal = async (deal: any) => {
    setViewingDeal(deal);
    try {
      const data = await DatabaseService.get('crm_activities', {
        select: '*',
        eq: { deal_id: deal.id },
        order: { column: 'created_at', ascending: false }
      });
      setDealActivities(data || []);
    } catch (error) {
      console.error('Error fetching deal activities:', error);
    }
  };

  const handleDeleteDeal = async (id: string) => {
    setDeleteConfirm({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return;
    try {
      await DatabaseService.delete('crm_deals', deleteConfirm.id);
      setViewingDeal(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting deal:', error);
    } finally {
      setDeleteConfirm({ isOpen: false, id: null });
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'call': return <Phone className="w-4 h-4" />;
      case 'meeting': return <Calendar className="w-4 h-4" />;
      case 'note': return <FileText className="w-4 h-4" />;
      case 'status_change': return <ArrowRight className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId) {
      // Reordering within the same column (optional, skipping for now)
      return;
    }

    // Moving to a different column
    const dealId = draggableId;
    const newStageId = destination.droppableId;
    const oldStageId = source.droppableId;

    const oldStage = pipeline?.stages.find((s: any) => s.id === oldStageId);
    const newStage = pipeline?.stages.find((s: any) => s.id === newStageId);

    // Optimistic update
    setDeals(prevDeals => 
      prevDeals.map(deal => 
        deal.id === dealId ? { ...deal, stage_id: newStageId } : deal
      )
    );

    try {
      const user = await DatabaseService.getAuthUser();
      if (!user) return;

      const teamMember = await DatabaseService.get('team_members', {
        select: 'business_id',
        eq: { user_id: user.id },
        single: true
      });

      if (!teamMember) return;

      await DatabaseService.update('crm_deals', dealId, { stage_id: newStageId });

      // Log activity for stage change
      if (oldStage && newStage) {
        await DatabaseService.insert('crm_activities', {
          business_id: teamMember.business_id,
          deal_id: dealId,
          type: 'status_change',
          title: 'Stage Changed',
          description: `Moved from ${oldStage.name} to ${newStage.name}`,
          created_by: user.id
        });
      }

      fetchData();
    } catch (error) {
      console.error('Error updating deal stage:', error);
      fetchData(); // Revert on error
    }
  };

  const handleSaveDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await DatabaseService.getAuthUser();
      if (!user || !pipeline) return;

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

      const dealData = {
        ...formData,
        business_id: businessIdToUse,
        pipeline_id: pipeline.id,
        owner_id: user.id,
        contact_id: formData.contact_id || null,
        company_id: formData.company_id || null,
        expected_close_date: formData.expected_close_date || null
      };

      if (selectedDeal) {
        await DatabaseService.update('crm_deals', selectedDeal.id, dealData);

        // Log activity for deal update
        await DatabaseService.insert('crm_activities', {
          business_id: businessIdToUse,
          deal_id: selectedDeal.id,
          type: 'note',
          title: 'Deal Updated',
          description: `Deal details were updated by ${user.email}`,
          created_by: user.id
        });
      } else {
        const newDeal = await DatabaseService.insert('crm_deals', dealData);

        // Log activity for deal creation
        await DatabaseService.insert('crm_activities', {
          business_id: businessIdToUse,
          deal_id: newDeal.id,
          type: 'status_change',
          title: 'Deal Created',
          description: `Deal was created by ${user.email}`,
          created_by: user.id
        });
      }

      setIsAddModalOpen(false);
      setSelectedDeal(null);
      setFormData({
        title: '', value: 0, stage_id: pipeline.stages[0].id, probability: 50, expected_close_date: '', contact_id: '', company_id: '', notes: '', listing_id: listingId || ''
      });
      fetchData();
    } catch (error) {
      console.error('Error saving deal:', error);
      appToast('Failed to save deal. Please check console.');
    }
  };

  const getAIInsight = (deal: any) => {
    const daysUntilClose = deal.expected_close_date ? Math.ceil((new Date(deal.expected_close_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : null;
    
    if (deal.probability >= 80) {
      return `This deal has an ${deal.probability}% chance. Follow up now to seal it.`;
    }
    if (deal.probability < 30 && deal.value > 5000) {
      return "High value deal at risk. Follow up now → otherwise you lose it.";
    }
    if (deal.probability < 30) {
      return "At risk. Consider a re-engagement campaign or special offer.";
    }
    if (deal.value > 10000) {
      return "High value deal. Ensure all stakeholders are aligned.";
    }
    if (daysUntilClose !== null && daysUntilClose < 0) {
      return "Past expected close date. Follow up immediately to update status.";
    }
    return "On track. Keep nurturing the relationship.";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse flex flex-col items-center gap-2 text-gray-500">
          <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          Loading pipeline...
        </div>
      </div>
    );
  }

  if (noBusiness) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No business found. Please set up a business first.
      </div>
    );
  }

  if (!pipeline) {
    return null;
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-white">{pipeline.name}</h2>
          <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-gray-300">
            {deals.length} Deals
          </div>
          <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-sm font-bold text-emerald-500">
            ${deals.reduce((sum, deal) => sum + (Number(deal.value) || 0), 0).toLocaleString()}
          </div>
        </div>
        <button 
          onClick={() => {
            setSelectedDeal(null);
            setFormData({
              title: '', value: 0, stage_id: pipeline.stages[0].id, probability: 50, expected_close_date: '', contact_id: '', company_id: '', notes: '', listing_id: listingId || ''
            });
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl font-bold hover:bg-gray-100 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Deal
        </button>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-6 h-full min-h-[500px]">
            {pipeline.stages.map((stage: any) => {
              const stageDeals = deals.filter(d => d.stage_id === stage.id);
              const stageTotal = stageDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);

              return (
                <div key={stage.id} className="flex flex-col w-80 shrink-0">
                  <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="font-bold text-gray-300 uppercase tracking-wider text-sm">{stage.name}</h3>
                    <span className="text-xs font-medium text-gray-500 bg-white/5 px-2 py-1 rounded-md">
                      ${stageTotal.toLocaleString()}
                    </span>
                  </div>

                  <Droppable droppableId={stage.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 rounded-2xl p-2 transition-colors ${
                          snapshot.isDraggingOver ? 'bg-white/10' : 'bg-[#141414] border border-white/5'
                        }`}
                      >
                        <div className="space-y-3">
                          {stageDeals.map((deal, index) => (
                            <Draggable key={deal.id} draggableId={deal.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => handleViewDeal(deal)}
                                  className={`bg-[#1A1A1A] border border-white/10 rounded-xl p-4 cursor-pointer hover:border-white/20 transition-all ${
                                    snapshot.isDragging ? 'shadow-2xl shadow-black/50 scale-105 rotate-2' : ''
                                  }`}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-white leading-tight">{deal.title}</h4>
                                    <button className="text-gray-500 hover:text-white transition-colors">
                                      <MoreVertical className="w-4 h-4" />
                                    </button>
                                  </div>
                                  
                                  <div className="text-emerald-500 font-bold text-lg mb-3">
                                    ${Number(deal.value).toLocaleString()}
                                  </div>

                                  <div className="space-y-2 mb-4">
                                    {deal.company && (
                                      <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <Building className="w-3.5 h-3.5" />
                                        <span className="truncate">{deal.company.name}</span>
                                      </div>
                                    )}
                                    {deal.contact && (
                                      <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <User className="w-3.5 h-3.5" />
                                        <span className="truncate">{deal.contact.name}</span>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                                      <Calendar className="w-3.5 h-3.5" />
                                      {deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString() : 'No date'}
                                    </div>
                                    <div className={`text-xs font-bold px-2 py-1 rounded-md ${
                                      deal.probability >= 70 ? 'bg-emerald-500/10 text-emerald-500' :
                                      deal.probability >= 40 ? 'bg-yellow-500/10 text-yellow-500' :
                                      'bg-red-500/10 text-red-500'
                                    }`}>
                                      {deal.probability}%
                                    </div>
                                  </div>

                                  {/* AI Insight */}
                                  <div className="mt-3 p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-2">
                                    <BrainCircuit className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                                    <span className="text-[10px] text-indigo-300 leading-tight">
                                      {getAIInsight(deal)}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>

      {/* Slide-over Deal Details */}
      <AnimatePresence>
        {viewingDeal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingDeal(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-[#141414] border-l border-white/10 shadow-2xl z-[100] flex flex-col"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
                <h2 className="text-xl font-bold text-white">Deal Details</h2>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setSelectedDeal(viewingDeal);
                      setFormData({
                        title: viewingDeal.title,
                        value: viewingDeal.value,
                        stage_id: viewingDeal.stage_id,
                        probability: viewingDeal.probability,
                        expected_close_date: viewingDeal.expected_close_date || '',
                        contact_id: viewingDeal.contact_id || '',
                        company_id: viewingDeal.company_id || '',
                        notes: viewingDeal.notes || '',
                        listing_id: viewingDeal.listing_id || listingId || ''
                      });
                      setIsAddModalOpen(true);
                    }}
                    className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteDeal(viewingDeal.id)}
                    className="p-2 hover:bg-red-500/20 rounded-xl text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setViewingDeal(null)}
                    className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Header Info */}
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">{viewingDeal.title}</h3>
                  <div className="flex items-center gap-4">
                    <div className="text-emerald-500 font-bold text-2xl">
                      ${Number(viewingDeal.value).toLocaleString()}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                      viewingDeal.probability >= 70 ? 'bg-emerald-500/10 text-emerald-500' :
                      viewingDeal.probability >= 40 ? 'bg-yellow-500/10 text-yellow-500' :
                      'bg-red-500/10 text-red-500'
                    }`}>
                      {viewingDeal.probability}% Win Probability
                    </div>
                  </div>
                </div>

                {/* AI Insight */}
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-3">
                  <BrainCircuit className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-indigo-300 mb-1">AI Insight</h4>
                    <p className="text-sm text-indigo-200/80 leading-relaxed">
                      {getAIInsight(viewingDeal)}
                    </p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-white mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition-colors">
                      <MessageSquare className="w-4 h-4" />
                      Send Email
                    </button>
                    <button className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition-colors">
                      <Plus className="w-4 h-4" />
                      Log Call
                    </button>
                    <button className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition-colors">
                      <Clock className="w-4 h-4" />
                      Schedule
                    </button>
                    <button className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition-colors">
                      <Activity className="w-4 h-4" />
                      Add Task
                    </button>
                  </div>
                </div>

                {/* Deal Info */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Deal Information</h4>
                  <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-4">
                    {!viewingDeal.company && !viewingDeal.contact && !viewingDeal.expected_close_date && (
                      <div className="text-gray-500 text-sm italic">No additional information provided.</div>
                    )}
                    {viewingDeal.company && (
                      <div className="flex items-center gap-3 text-gray-300">
                        <Building className="w-4 h-4 text-gray-500" />
                        <span>{viewingDeal.company.name}</span>
                      </div>
                    )}
                    {viewingDeal.contact && (
                      <div className="flex items-center gap-3 text-gray-300">
                        <User className="w-4 h-4 text-gray-500" />
                        <span>{viewingDeal.contact.name}</span>
                      </div>
                    )}
                    {viewingDeal.expected_close_date && (
                      <div className="flex items-center gap-3 text-gray-300">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>Expected Close: {new Date(viewingDeal.expected_close_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {viewingDeal.notes && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Notes</h4>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-gray-300 text-sm whitespace-pre-wrap">
                      {viewingDeal.notes}
                    </div>
                  </div>
                )}

                {/* Activity Timeline */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Activity Timeline</h4>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    {dealActivities.length === 0 ? (
                      <div className="text-center text-gray-500 py-4 text-sm">
                        No recent activity
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {dealActivities.map((activity, index) => (
                          <div key={activity.id} className="relative flex gap-4">
                            {index !== dealActivities.length - 1 && (
                              <div className="absolute left-[11px] top-8 bottom-[-24px] w-px bg-white/10" />
                            )}
                            <div className="relative z-10 w-6 h-6 rounded-full bg-[#141414] border border-white/20 flex items-center justify-center shrink-0 text-gray-400">
                              {getActivityIcon(activity.type)}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white">{activity.title}</div>
                              {activity.description && (
                                <div className="text-sm text-gray-400 mt-1">{activity.description}</div>
                              )}
                              <div className="text-xs text-gray-500 mt-2">
                                {new Date(activity.created_at).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
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
                  {selectedDeal ? 'Edit Deal' : 'Add New Deal'}
                </h2>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <form id="deal-form" onSubmit={handleSaveDeal} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Deal Title</label>
                    <input 
                      type="text" 
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20 transition-colors"
                      placeholder="Enterprise License - Acme Corp"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Value ($)</label>
                      <input 
                        type="number" 
                        required
                        value={formData.value}
                        onChange={(e) => setFormData({...formData, value: parseInt(e.target.value) || 0})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Stage</label>
                      <select 
                        value={formData.stage_id}
                        onChange={(e) => setFormData({...formData, stage_id: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20 transition-colors appearance-none"
                      >
                        {pipeline.stages.map((s: any) => (
                          <option key={s.id} value={s.id} className="bg-[#141414]">{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Probability (%)</label>
                      <input 
                        type="number" 
                        min="0" max="100"
                        value={formData.probability}
                        onChange={(e) => setFormData({...formData, probability: parseInt(e.target.value) || 0})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Expected Close Date</label>
                      <input 
                        type="date" 
                        value={formData.expected_close_date}
                        onChange={(e) => setFormData({...formData, expected_close_date: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contact</label>
                      <select 
                        value={formData.contact_id}
                        onChange={(e) => setFormData({...formData, contact_id: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20 transition-colors appearance-none"
                      >
                        <option value="" className="bg-[#141414]">No Contact</option>
                        {contacts.map(c => (
                          <option key={c.id} value={c.id} className="bg-[#141414]">{c.name}</option>
                        ))}
                      </select>
                    </div>
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
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Notes</label>
                    <textarea 
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20 transition-colors min-h-[100px] resize-y"
                      placeholder="Add any additional notes here..."
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
                  form="deal-form"
                  className="px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  {selectedDeal ? 'Save Changes' : 'Add Deal'}
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
          <h3 className="text-xl font-bold text-white mb-2">Delete Deal</h3>
          <p className="text-gray-400 mb-8">
            Are you sure you want to delete this deal? This action cannot be undone and will remove all associated data.
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
