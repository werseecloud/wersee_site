import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, Search, Filter, MoreVertical, CheckCircle, Clock, FileSignature, X, ChevronRight, Edit3, Trash2, Send, Link as LinkIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { ContractBuilder } from './ContractBuilder';

import { appToast, destructiveAction } from '@/lib/feedback';
type ContractStatus = 'draft' | 'sent' | 'viewed' | 'review' | 'signed' | 'expired' | 'rejected';

interface Contract {
  id: string;
  title: string;
  type: string;
  status: ContractStatus;
  client_id?: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

export const MoneyContractsView = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'drafts' | 'sent' | 'signed' | 'templates'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingContractId, setEditingContractId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchContracts();
    }
  }, [user, activeTab]);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('contracts')
        .select('*')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false });

      if (activeTab === 'drafts') query = query.eq('status', 'draft');
      if (activeTab === 'sent') query = query.in('status', ['sent', 'viewed', 'review']);
      if (activeTab === 'signed') query = query.eq('status', 'signed');
      
      const { data, error } = await query;
      
      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContract = () => {
    navigate('/builder/contract');
  };

  const handleEditContract = (id: string) => {
    navigate(`/builder/contract/${id}`);
  };

  const handleCopyLink = async (e: React.MouseEvent, contractId: string) => {
    e.stopPropagation();
    const url = `${window.location.origin}/contract/${contractId}`;
    try {
      await navigator.clipboard.writeText(url);
      appToast('Contract link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy link:', err);
      appToast('Failed to copy link.');
    }
  };

  const handleDeleteContract = async (e: React.MouseEvent, contractId: string) => {
    e.stopPropagation();
    const confirmed = await destructiveAction({
      description: 'Are you sure you want to delete this contract? This action cannot be undone.',
    });
    if (!confirmed) return;

    try {
      const { error } = await supabase.from('contracts').delete().eq('id', contractId);
      if (error) throw error;
      setContracts(contracts.filter(c => c.id !== contractId));
    } catch (error) {
      console.error('Error deleting contract:', error);
      appToast('Failed to delete contract.');
    }
  };

  const getStatusColor = (status: ContractStatus) => {
    switch (status) {
      case 'signed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'sent':
      case 'viewed':
      case 'review': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'draft': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      case 'expired':
      case 'rejected': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: ContractStatus) => {
    switch (status) {
      case 'signed': return <CheckCircle className="w-3.5 h-3.5" />;
      case 'sent':
      case 'viewed':
      case 'review': return <Send className="w-3.5 h-3.5" />;
      case 'draft': return <Edit3 className="w-3.5 h-3.5" />;
      default: return <Clock className="w-3.5 h-3.5" />;
    }
  };

  const filteredContracts = contracts.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isBuilderOpen) {
    return (
      <ContractBuilder 
        contractId={editingContractId} 
        onClose={() => {
          setIsBuilderOpen(false);
          fetchContracts();
        }} 
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FileSignature className="w-6 h-6 text-indigo-400" />
            Contracts
          </h1>
          <p className="text-gray-400 mt-1">Create, manage, and sign digital agreements.</p>
        </div>
        <button 
          onClick={handleCreateContract}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Contract
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/5 p-2 rounded-2xl border border-white/5">
        <div className="flex items-center gap-1 w-full md:w-auto overflow-x-auto scrollbar-hide">
          {['all', 'drafts', 'sent', 'signed', 'templates'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab 
                  ? 'bg-white/10 text-white shadow-sm' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search contracts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Contracts List */}
      <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading contracts...</div>
        ) : filteredContracts.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No contracts found</h3>
            <p className="text-gray-400 max-w-sm mb-6">
              {searchQuery ? 'No contracts match your search.' : 'You haven\'t created any contracts yet.'}
            </p>
            {!searchQuery && (
              <button 
                onClick={handleCreateContract}
                className="px-6 py-2 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                Create your first contract
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredContracts.map((contract) => (
              <div 
                key={contract.id}
                className="p-4 hover:bg-white/[0.02] transition-colors flex items-center justify-between group cursor-pointer"
                onClick={() => handleEditContract(contract.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl border ${getStatusColor(contract.status)}`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white group-hover:text-indigo-400 transition-colors">{contract.title}</h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="capitalize">{contract.type.replace('_', ' ')}</span>
                      <span>•</span>
                      <span>Updated {new Date(contract.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(contract.status)}`}>
                    {getStatusIcon(contract.status)}
                    <span className="capitalize">{contract.status}</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    {contract.status !== 'draft' && (
                      <button 
                        onClick={(e) => handleCopyLink(e, contract.id)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="Copy Link"
                      >
                        <LinkIcon className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={(e) => handleDeleteContract(e, contract.id)}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete Contract"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
