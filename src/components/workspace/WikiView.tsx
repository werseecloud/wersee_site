import React, { useState, useEffect } from 'react';
import { 
  Book, Plus, Search, Folder, FileText, 
  ChevronRight, MoreVertical, Trash2, Edit3,
  Search as SearchIcon, Loader2, Sparkles,
  Tag, Clock, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { DocumentEditor } from '../dashboard/DocumentEditor';
import { getGeminiClient, requireGeminiClient } from "../../lib/geminiClient";

import { appToast } from '@/lib/feedback';
interface WikiCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface WikiArticle {
  id: string;
  category_id: string;
  title: string;
  content: any;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface WikiViewProps {
  teamId: string;
}

export const WikiView: React.FC<WikiViewProps> = ({ teamId }) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<WikiCategory[]>([]);
  const [articles, setArticles] = useState<WikiArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<WikiArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetchWikiData();
  }, [teamId]);

  const fetchWikiData = async () => {
    setLoading(true);
    try {
      const [catsRes, articlesRes] = await Promise.all([
        supabase.from('wiki_categories').select('*').eq('team_id', teamId),
        supabase.from('wiki_articles').select('*').eq('team_id', teamId)
      ]);

      setCategories(catsRes.data || []);
      setArticles(articlesRes.data || []);
    } catch (error) {
      console.error('Error fetching wiki data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateArticle = async (categoryId?: string) => {
    try {
      const { data, error } = await supabase
        .from('wiki_articles')
        .insert({
          team_id: teamId,
          category_id: categoryId,
          title: 'Untitled Article',
          content: { type: 'doc', content: [] },
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;
      setArticles([data, ...articles]);
      setSelectedArticle(data);
      setIsEditing(true);
    } catch (error) {
      console.error('Error creating article:', error);
    }
  };

  const handleSaveArticle = async () => {
    if (!selectedArticle) return;
    try {
      const { error } = await supabase
        .from('wiki_articles')
        .update({
          title: selectedArticle.title,
          content: selectedArticle.content,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedArticle.id);

      if (error) throw error;
      setArticles(articles.map(a => a.id === selectedArticle.id ? selectedArticle : a));
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving article:', error);
    }
  };

  const handleSummarize = async () => {
    if (!selectedArticle) return;
    setAiLoading(true);
    try {
      const ai = (() => { const ai = getGeminiClient(); if (!ai) throw new Error("Gemini API key is missing. AI features are disabled until the key is configured."); return ai; })();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Summarize the following wiki article content in a concise way: ${JSON.stringify(selectedArticle.content)}`,
      });
      
      const summary = response.text;
      // We could add this to a "Summary" field or just show it in a toast/modal
      appToast("AI Summary: " + summary);
    } catch (error) {
      console.error('AI Error:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const filteredArticles = articles.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (selectedArticle) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setSelectedArticle(null);
                setIsEditing(false);
              }}
              className="p-2 hover:bg-white/5 rounded-lg text-gray-400"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            {isEditing ? (
              <input 
                type="text"
                value={selectedArticle.title}
                onChange={(e) => setSelectedArticle({ ...selectedArticle, title: e.target.value })}
                className="bg-transparent text-xl font-bold text-white focus:outline-none border-b border-white/20 px-1"
              />
            ) : (
              <h2 className="text-xl font-bold text-white">{selectedArticle.title}</h2>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleSummarize}
              disabled={aiLoading}
              className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg hover:bg-indigo-500/20 transition-colors flex items-center gap-2 text-sm font-bold"
            >
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              AI Summary
            </button>
            {isEditing ? (
              <button 
                onClick={handleSaveArticle}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors"
              >
                Save Changes
              </button>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="p-2 bg-white/5 text-gray-400 rounded-lg hover:text-white transition-colors"
              >
                <Edit3 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="bg-[#141414] rounded-3xl border border-white/5 p-6">
          <DocumentEditor 
            content={selectedArticle.content}
            onChange={(content) => setSelectedArticle({ ...selectedArticle, content })}
            editable={isEditing}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Book className="w-6 h-6 text-indigo-400" />
            Knowledge Base
          </h2>
          <p className="text-gray-500 text-sm mt-1">Central documentation and SOPs for your team.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <SearchIcon className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search wiki..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#141414] border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-white/10 w-64"
            />
          </div>
          <button 
            onClick={() => handleCreateArticle()}
            className="px-4 py-2 bg-white text-black rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gray-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Article
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="space-y-6">
          <div className="bg-[#141414] rounded-3xl border border-white/5 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Categories</h3>
              <button 
                onClick={() => setShowCategoryModal(true)}
                className="p-1 hover:bg-white/5 rounded text-gray-500 hover:text-white"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 p-2 rounded-xl bg-indigo-500/10 text-indigo-400 text-sm font-bold">
                <Folder className="w-4 h-4" />
                All Articles
              </button>
              {categories.map(cat => (
                <button key={cat.id} className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 text-gray-400 text-sm font-medium transition-colors">
                  <Folder className="w-4 h-4" />
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredArticles.map(article => (
              <div 
                key={article.id}
                onClick={() => setSelectedArticle(article)}
                className="bg-[#141414] p-5 rounded-3xl border border-white/5 hover:border-white/10 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-bold text-white mb-2">{article.title}</h3>
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase tracking-widest">
                    <Clock className="w-3 h-3" />
                    {new Date(article.updated_at).toLocaleDateString()}
                  </div>
                  {article.tags?.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[10px] text-indigo-400 uppercase tracking-widest">
                      <Tag className="w-3 h-3" />
                      {article.tags[0]}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {filteredArticles.length === 0 && (
              <div className="col-span-full py-12 text-center bg-white/5 rounded-3xl border border-white/5 border-dashed">
                <SearchIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500">No articles found matching your search.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
