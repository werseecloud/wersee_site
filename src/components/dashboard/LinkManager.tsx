import React, { useState, useEffect } from 'react';
import { 
  Link as LinkIcon, Plus, Trash2, 
  CheckCircle, FileText, Folder, Book,
  Loader2, Search
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface EntityLink {
  id: string;
  source_id: string;
  source_type: string;
  target_id: string;
  target_type: string;
  link_type: string;
  target_title?: string;
}

interface LinkManagerProps {
  sourceId: string;
  sourceType: string;
  teamId: string;
}

export const LinkManager: React.FC<LinkManagerProps> = ({ sourceId, sourceType, teamId }) => {
  const [links, setLinks] = useState<EntityLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchLinks();
  }, [sourceId]);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('entity_links')
        .select('*')
        .or(`source_id.eq.${sourceId},target_id.eq.${sourceId}`);
      
      if (error) throw error;

      // For each link, we need to fetch the title of the OTHER entity
      const linksWithTitles = await Promise.all((data || []).map(async (link) => {
        const otherId = link.source_id === sourceId ? link.target_id : link.source_id;
        const otherType = link.source_id === sourceId ? link.target_type : link.source_type;
        
        let title = 'Unknown Entity';
        if (otherType === 'task') {
          const { data: t } = await supabase.from('team_tasks').select('title').eq('id', otherId).single();
          title = t?.title || title;
        } else if (otherType === 'project') {
          const { data: p } = await supabase.from('projects').select('name').eq('id', otherId).single();
          title = p?.name || title;
        } else if (otherType === 'document') {
          const { data: d } = await supabase.from('team_documents').select('title').eq('id', otherId).single();
          title = d?.title || title;
        } else if (otherType === 'wiki') {
          const { data: w } = await supabase.from('wiki_articles').select('title').eq('id', otherId).single();
          title = w?.title || title;
        }

        return { ...link, target_title: title, target_id: otherId, target_type: otherType };
      }));

      setLinks(linksWithTitles);
    } catch (error) {
      console.error('Error fetching links:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const [tasks, projects, docs, wiki] = await Promise.all([
        supabase.from('team_tasks').select('id, title').eq('team_id', teamId).ilike('title', `%${query}%`).limit(3),
        supabase.from('projects').select('id, name').eq('team_id', teamId).ilike('name', `%${query}%`).limit(3),
        supabase.from('team_documents').select('id, title').eq('team_id', teamId).ilike('title', `%${query}%`).limit(3),
        supabase.from('wiki_articles').select('id, title').eq('team_id', teamId).ilike('title', `%${query}%`).limit(3)
      ]);

      const results = [
        ...(tasks.data || []).map(t => ({ id: t.id, type: 'task', title: t.title })),
        ...(projects.data || []).map(p => ({ id: p.id, type: 'project', title: p.name })),
        ...(docs.data || []).map(d => ({ id: d.id, type: 'document', title: d.title })),
        ...(wiki.data || []).map(w => ({ id: w.id, type: 'wiki', title: w.title }))
      ].filter(r => r.id !== sourceId);

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateLink = async (targetId: string, targetType: string) => {
    try {
      const { error } = await supabase
        .from('entity_links')
        .insert({
          source_id: sourceId,
          source_type: sourceType,
          target_id: targetId,
          target_type: targetType,
          link_type: 'relates_to'
        });

      if (error) throw error;
      fetchLinks();
      setShowAdd(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error creating link:', error);
    }
  };

  const handleDeleteLink = async (id: string) => {
    try {
      const { error } = await supabase
        .from('entity_links')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setLinks(links.filter(l => l.id !== id));
    } catch (error) {
      console.error('Error deleting link:', error);
    }
  };

  if (loading) return <Loader2 className="w-4 h-4 animate-spin text-gray-500 mx-auto" />;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
          <LinkIcon className="w-3 h-3" />
          Linked Items
        </h4>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="p-1 hover:bg-white/5 rounded text-gray-500 hover:text-white transition-colors"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {showAdd && (
        <div className="relative">
          <Search className="w-3 h-3 text-gray-500 absolute left-2 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search to link..."
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/20"
          />
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#1A1A1A] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
              {searchResults.map(result => (
                <button 
                  key={result.id}
                  onClick={() => handleCreateLink(result.id, result.type)}
                  className="w-full text-left px-3 py-2 hover:bg-white/5 flex items-center gap-2"
                >
                  <div className="p-1 bg-white/5 rounded text-gray-400">
                    {result.type === 'task' ? <CheckCircle className="w-3 h-3" /> :
                     result.type === 'project' ? <Folder className="w-3 h-3" /> :
                     result.type === 'document' ? <FileText className="w-3 h-3" /> :
                     <Book className="w-3 h-3" />}
                  </div>
                  <span className="text-xs text-white truncate">{result.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {links.map(link => (
          <div 
            key={link.id}
            className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-lg border border-white/5 group hover:border-white/10 transition-all"
          >
            <div className="text-indigo-400">
              {link.target_type === 'task' ? <CheckCircle className="w-3 h-3" /> :
               link.target_type === 'project' ? <Folder className="w-3 h-3" /> :
               link.target_type === 'document' ? <FileText className="w-3 h-3" /> :
               <Book className="w-3 h-3" />}
            </div>
            <span className="text-[10px] font-medium text-gray-300 max-w-[100px] truncate">{link.target_title}</span>
            <button 
              onClick={() => handleDeleteLink(link.id)}
              className="p-0.5 hover:bg-red-500/20 text-gray-600 hover:text-red-400 rounded transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-2.5 h-2.5" />
            </button>
          </div>
        ))}
        {links.length === 0 && !showAdd && (
          <p className="text-[10px] text-gray-600 italic">No links yet.</p>
        )}
      </div>
    </div>
  );
};
