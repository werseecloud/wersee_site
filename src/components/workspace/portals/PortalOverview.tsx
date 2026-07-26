import React from 'react';
import { motion } from 'motion/react';
import { Calendar, FileText, CheckSquare, Users, MessageSquare, TrendingUp, Clock } from 'lucide-react';

interface PortalOverviewProps {
  business: any;
  stats: any;
  recentActivity: any[];
}

export const PortalOverview: React.FC<PortalOverviewProps> = ({ business, stats, recentActivity }) => {
  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative p-8 rounded-[3rem] bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-white/10 overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity">
          <TrendingUp className="w-48 h-48 text-indigo-400" />
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Welcome to {business?.name} Portal</h1>
          <p className="text-gray-400 max-w-md">Your central hub for team collaboration, document sharing, and project management.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Active Tasks', value: stats.tasks, icon: CheckSquare, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
          { label: 'Documents', value: stats.docs, icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Events', value: stats.events, icon: Calendar, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Team Members', value: stats.members, icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl hover:border-white/10 transition-all"
          >
            <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-4`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <h3 className="text-3xl font-black text-white mb-1">{stat.value}</h3>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-white">Recent Activity</h2>
            <button className="text-xs font-bold text-indigo-400 hover:underline">View All</button>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity, i) => (
              <div key={i} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-4 group hover:border-white/10 transition-all">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">{activity.title}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
                <button className="p-2 text-gray-500 hover:text-white transition-colors">
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <div className="py-12 text-center bg-white/[0.01] border border-dashed border-white/5 rounded-3xl">
                <p className="text-gray-500 text-sm">No recent activity found.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4">
            <button className="w-full p-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2">
              <CheckSquare className="w-4 h-4" /> Create New Task
            </button>
            <button className="w-full p-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold text-sm transition-all border border-white/10 flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" /> Upload Document
            </button>
            <button className="w-full p-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold text-sm transition-all border border-white/10 flex items-center justify-center gap-2">
              <Calendar className="w-4 h-4" /> Schedule Event
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
