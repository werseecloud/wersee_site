import { supabase } from '../lib/supabase';

export interface SearchResult {
  id: string;
  type: 'task' | 'project' | 'document' | 'wiki';
  title: string;
  subtitle?: string;
  team_id: string;
}

export const globalSearch = async (teamId: string, query: string): Promise<SearchResult[]> => {
  if (!query.trim()) return [];

  const [tasks, projects, docs, wiki] = await Promise.all([
    supabase.from('team_tasks').select('id, title, team_id').eq('team_id', teamId).ilike('title', `%${query}%`).limit(5),
    supabase.from('projects').select('id, name, team_id').eq('team_id', teamId).ilike('name', `%${query}%`).limit(5),
    supabase.from('team_documents').select('id, title, team_id').eq('team_id', teamId).ilike('title', `%${query}%`).limit(5),
    supabase.from('wiki_articles').select('id, title, team_id').eq('team_id', teamId).ilike('title', `%${query}%`).limit(5)
  ]);

  const results: SearchResult[] = [
    ...(tasks.data || []).map(t => ({ id: t.id, type: 'task' as const, title: t.title, team_id: t.team_id })),
    ...(projects.data || []).map(p => ({ id: p.id, type: 'project' as const, title: p.name, team_id: p.team_id })),
    ...(docs.data || []).map(d => ({ id: d.id, type: 'document' as const, title: d.title, team_id: d.team_id })),
    ...(wiki.data || []).map(w => ({ id: w.id, type: 'wiki' as const, title: w.title, team_id: w.team_id }))
  ];

  return results;
};
