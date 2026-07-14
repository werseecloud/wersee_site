import React, { useState, useEffect } from 'react';
import { PortalSidebar } from './PortalSidebar';
import { PortalOverview } from './PortalOverview';
import { PortalCalendar } from './PortalCalendar';
import { PortalDocs } from './PortalDocs';
import { PortalTasks } from './PortalTasks';
import { PortalCalls } from './PortalCalls';
import { supabase } from '../../../lib/supabase';
import { Loader2 } from 'lucide-react';

interface TeamPortalLayoutProps {
  business: any;
  user: any;
}

export const TeamPortalLayout: React.FC<TeamPortalLayoutProps> = ({ business, user }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({ tasks: 0, docs: 0, events: 0, members: 0 });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('Member');

  useEffect(() => {
    if (business && user) {
      fetchPortalData();

      // Real-time subscription for stats and activity
      const channels = [
        supabase.channel(`portal-tasks-stats-${business.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'portal_tasks', filter: `business_id=eq.${business.id}` }, () => fetchPortalData()),
        supabase.channel(`portal-docs-stats-${business.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'portal_docs', filter: `business_id=eq.${business.id}` }, () => fetchPortalData()),
        supabase.channel(`portal-events-stats-${business.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'portal_events', filter: `business_id=eq.${business.id}` }, () => fetchPortalData()),
        supabase.channel(`portal-members-stats-${business.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'portal_members', filter: `business_id=eq.${business.id}` }, () => fetchPortalData()),
      ];

      channels.forEach(channel => channel.subscribe());

      return () => {
        channels.forEach(channel => supabase.removeChannel(channel));
      };
    }
  }, [business, user]);

  const fetchPortalData = async () => {
    try {
      // Fetch Stats
      const [tasksCount, docsCount, eventsCount, membersCount] = await Promise.all([
        supabase.from('portal_tasks').select('*', { count: 'exact', head: true }).eq('business_id', business.id).eq('is_done', false),
        supabase.from('portal_docs').select('*', { count: 'exact', head: true }).eq('business_id', business.id),
        supabase.from('portal_events').select('*', { count: 'exact', head: true }).eq('business_id', business.id),
        supabase.from('portal_members').select('*', { count: 'exact', head: true }).eq('business_id', business.id),
      ]);

      setStats({
        tasks: tasksCount.count || 0,
        docs: docsCount.count || 0,
        events: eventsCount.count || 0,
        members: (membersCount.count || 0) + 1, // +1 for owner
      });

      // Fetch Team Members
      const { data: members } = await supabase
        .from('portal_members')
        .select('*')
        .eq('business_id', business.id);
      
      // Add owner to members list for display
      const ownerMember = { user_id: business.user_id, user_name: 'Owner', role: 'admin' };
      setTeamMembers([ownerMember, ...(members || [])]);

      // Check user role
      if (user.id === business.user_id) {
        setUserRole('Administrator');
      } else {
        const member = members?.find(m => m.user_id === user.id);
        setUserRole(member?.role === 'admin' ? 'Administrator' : 'Team Member');
      }

      // Fetch Recent Activity from multiple sources
      const [recentTasks, recentDocs, recentEvents] = await Promise.all([
        supabase.from('portal_tasks').select('title, created_at').eq('business_id', business.id).order('created_at', { ascending: false }).limit(3),
        supabase.from('portal_docs').select('title, created_at').eq('business_id', business.id).order('created_at', { ascending: false }).limit(3),
        supabase.from('portal_events').select('title, created_at').eq('business_id', business.id).order('created_at', { ascending: false }).limit(3),
      ]);

      const activities = [
        ...(recentTasks.data || []).map(t => ({ title: `New task: ${t.title}`, time: new Date(t.created_at).toLocaleDateString(), rawTime: new Date(t.created_at) })),
        ...(recentDocs.data || []).map(d => ({ title: `New document: ${d.title}`, time: new Date(d.created_at).toLocaleDateString(), rawTime: new Date(d.created_at) })),
        ...(recentEvents.data || []).map(e => ({ title: `New event: ${e.title}`, time: new Date(e.created_at).toLocaleDateString(), rawTime: new Date(e.created_at) })),
      ].sort((a, b) => b.rawTime.getTime() - a.rawTime.getTime()).slice(0, 5);

      setRecentActivity(activities);

    } catch (error) {
      console.error('Error fetching portal data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <PortalOverview business={business} stats={stats} recentActivity={recentActivity} />;
      case 'calendar':
        return <PortalCalendar businessId={business.id} user={user} />;
      case 'docs':
        return <PortalDocs businessId={business.id} user={user} teamMembers={teamMembers} />;
      case 'tasks':
        return <PortalTasks businessId={business.id} user={user} teamMembers={teamMembers} />;
      case 'calls':
        return <PortalCalls businessId={business.id} user={user} />;
      default:
        return <PortalOverview business={business} stats={stats} recentActivity={recentActivity} />;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      <PortalSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        business={business} 
        userRole={userRole}
      />
      <main className="flex-1 overflow-y-auto scrollbar-hide bg-[#050505] relative">
        <div className="max-w-6xl mx-auto p-8 md:p-12">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};
