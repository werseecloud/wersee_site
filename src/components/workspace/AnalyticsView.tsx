import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';
import { BarChart3, Users, Clock, MousePointerClick, Loader2, ArrowUpRight, ArrowDownRight, Globe } from 'lucide-react';
import { useParams } from 'react-router-dom';

export const AnalyticsView = () => {
  const { businessId } = useParams();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalViews: 0,
    uniqueVisitors: 0,
    avgDuration: 0,
    totalClicks: 0,
  });
  const [topClicks, setTopClicks] = useState<{element_id: string, count: number}[]>([]);
  const [recentViews, setRecentViews] = useState<any[]>([]);
  const [appAnalytics, setAppAnalytics] = useState<any>(null);

  useEffect(() => {
    fetchAnalytics();
    fetchAppAnalytics();
  }, [businessId]);

  const fetchAppAnalytics = async () => {
    try {
      // Fetch global app analytics from Supabase
      const { data, error } = await supabase
        .from('analytics_events')
        .select('event_type, created_at')
        .limit(1000);
        
      if (error) throw error;
      
      if (data) {
        setAppAnalytics({
          totalEvents: data.length,
          recentEvents: data.slice(0, 10)
        });
      }
    } catch (err) {
      console.error('Error fetching global app analytics:', err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Get business ID
      let bId = businessId;
      if (!bId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: bData } = await supabase.from('businesses').select('id').eq('user_id', user.id).limit(1).maybeSingle();
          if (bData) bId = bData.id;
        }
      } else {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(businessId || '');
        let query = supabase.from('businesses').select('id');
        if (isUUID) {
          query = query.or(`slug.eq.${businessId},id.eq.${businessId}`);
        } else {
          query = query.eq('slug', businessId);
        }
        const { data: bData } = await query.maybeSingle();
        if (bData) bId = bData.id;
      }

      if (!bId) return;

      // Fetch page views
      const { data: viewsData, error: viewsError } = await supabase
        .from('page_views')
        .select('*')
        .eq('business_id', bId)
        .order('created_at', { ascending: false });

      if (viewsError && viewsError.code !== '42P01') throw viewsError;

      // Fetch clicks
      const { data: clicksData, error: clicksError } = await supabase
        .from('clicks')
        .select('*')
        .eq('business_id', bId);

      if (clicksError && clicksError.code !== '42P01') throw clicksError;

      const views = viewsData || [];
      const clicks = clicksData || [];

      // Calculate stats
      const uniqueVisitors = new Set(views.map(v => v.visitor_id)).size;
      const totalDuration = views.reduce((sum, v) => sum + (v.duration_seconds || 0), 0);
      const avgDuration = views.length > 0 ? Math.round(totalDuration / views.length) : 0;

      setStats({
        totalViews: views.length,
        uniqueVisitors,
        avgDuration,
        totalClicks: clicks.length,
      });

      // Calculate top clicks
      const clickCounts = clicks.reduce((acc: any, click) => {
        acc[click.element_id] = (acc[click.element_id] || 0) + 1;
        return acc;
      }, {});

      const sortedClicks = Object.entries(clickCounts)
        .map(([element_id, count]) => ({ element_id, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setTopClicks(sortedClicks);
      setRecentViews(views.slice(0, 10));

    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Analytics Overview</h2>
        <p className="text-gray-400">Track your business performance and customer engagement.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#111] p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-full -mr-8 -mt-8" />
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400">
              <BarChart3 className="w-6 h-6" />
            </div>
          </div>
          <p className="text-sm text-gray-400 font-medium mb-1">Total Page Views</p>
          <h3 className="text-3xl font-black text-white">{stats.totalViews}</h3>
        </div>

        <div className="bg-[#111] p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-bl-full -mr-8 -mt-8" />
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <p className="text-sm text-gray-400 font-medium mb-1">Unique Visitors</p>
          <h3 className="text-3xl font-black text-white">{stats.uniqueVisitors}</h3>
        </div>

        <div className="bg-[#111] p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full -mr-8 -mt-8" />
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <p className="text-sm text-gray-400 font-medium mb-1">Avg. Time on Page</p>
          <h3 className="text-3xl font-black text-white">{formatDuration(stats.avgDuration)}</h3>
        </div>

        <div className="bg-[#111] p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-bl-full -mr-8 -mt-8" />
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-400">
              <MousePointerClick className="w-6 h-6" />
            </div>
          </div>
          <p className="text-sm text-gray-400 font-medium mb-1">Total Clicks</p>
          <h3 className="text-3xl font-black text-white">{stats.totalClicks}</h3>
        </div>
      </div>

      {/* Global App Insights */}
      {appAnalytics && (
        <div className="mt-12 pt-12 border-t border-white/10">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              <Globe className="w-6 h-6 text-indigo-400" />
              Global App Insights
            </h2>
            <p className="text-gray-400 text-sm">Aggregated platform statistics (Privacy-preserving)</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-[#141414] p-5 rounded-2xl border border-white/5">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Total Users</p>
              <h3 className="text-2xl font-bold text-white">{appAnalytics.usersCount}</h3>
            </div>
            <div className="bg-[#141414] p-5 rounded-2xl border border-white/5">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Teams</p>
              <h3 className="text-2xl font-bold text-white">{appAnalytics.teamsCount}</h3>
            </div>
            <div className="bg-[#141414] p-5 rounded-2xl border border-white/5">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Custom Apps</p>
              <h3 className="text-2xl font-bold text-white">{appAnalytics.appsCount}</h3>
            </div>
            <div className="bg-[#141414] p-5 rounded-2xl border border-white/5">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Products</p>
              <h3 className="text-2xl font-bold text-white">{appAnalytics.productsCount}</h3>
            </div>
            <div className="bg-[#141414] p-5 rounded-2xl border border-white/5">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Platform Volume</p>
              <h3 className="text-2xl font-bold text-emerald-400">€{(appAnalytics.totalRevenue / 100).toFixed(2)}</h3>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Clicks */}
        <div className="bg-[#111] p-8 rounded-3xl border border-white/5 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-6">Most Clicked Elements</h3>
          {topClicks.length === 0 ? (
            <div className="text-center py-10 text-gray-500">No click data available yet.</div>
          ) : (
            <div className="space-y-4">
              {topClicks.map((click, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-gray-400">
                      {i + 1}
                    </div>
                    <span className="font-medium text-white truncate max-w-[200px] sm:max-w-xs">
                      {click.element_id.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-lg">
                    {click.count} clicks
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Visitors */}
        <div className="bg-[#111] p-8 rounded-3xl border border-white/5 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-6">Recent Visitors</h3>
          {recentViews.length === 0 ? (
            <div className="text-center py-10 text-gray-500">No visitor data available yet.</div>
          ) : (
            <div className="space-y-4">
              {recentViews.map((view, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                  <div>
                    <div className="font-medium text-white text-sm truncate max-w-[150px] sm:max-w-[200px]">
                      Visitor: {view.visitor_id.substring(0, 8)}...
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(view.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-medium text-gray-400">
                      {view.path}
                    </div>
                    <div className="text-sm font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">
                      {formatDuration(view.duration_seconds)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
