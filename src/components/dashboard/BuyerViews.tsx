import React, { useState, useEffect } from 'react';
import { Package, Briefcase, Users, CreditCard, Truck, Clock, Download, FileText, ChevronRight, PlayCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const StatWidget = ({ title, value, subtext, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-2xl ${color} bg-opacity-10`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
    </div>
    <h3 className="text-3xl font-bold text-[#1D1D1F] mb-1">{value}</h3>
    <p className="text-sm text-gray-500 font-medium">{title}</p>
    {subtext && <p className="text-xs text-gray-400 mt-2">{subtext}</p>}
  </div>
);

const ActionList = ({ title, items, type }: any) => (
  <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
    <div className="p-6 border-b border-black/5 flex justify-between items-center">
      <h3 className="font-bold text-[#1D1D1F] text-lg">{title}</h3>
      <button className="text-sm font-medium text-blue-600 hover:text-blue-700">View All</button>
    </div>
    <div className="divide-y divide-black/5">
      {items.map((item: any, i: number) => (
        <div key={i} className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            type === 'shipping' ? 'bg-orange-50 text-orange-600' :
            type === 'job' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
          }`}>
            {type === 'shipping' ? <Truck className="w-5 h-5" /> :
             type === 'job' ? <Clock className="w-5 h-5" /> : <Download className="w-5 h-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-[#1D1D1F] truncate">{item.title}</h4>
            <p className="text-sm text-gray-500 truncate">{item.subtitle}</p>
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              item.status === 'shipped' || item.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
              'bg-green-100 text-green-800'
            }`}>
              {item.status}
            </span>
          </div>
        </div>
      ))}
      {items.length === 0 && (
        <div className="p-8 text-center text-gray-400">
          <p>No active items found.</p>
        </div>
      )}
    </div>
  </div>
);

export const BuyerOverview = ({ user }: { user: any }) => {
  const [stats, setStats] = useState({ courses: 0, orders: 0, activeJobs: 0 });
  const [orders, setOrders] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*, listing:listings(title)')
        .eq('buyer_id', user.id)
        .eq('type', 'product')
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: jobsData } = await supabase
        .from('orders')
        .select('*, listing:listings(title)')
        .eq('buyer_id', user.id)
        .in('type', ['service', 'job'])
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: coursesData } = await supabase
        .from('orders')
        .select('id')
        .eq('buyer_id', user.id)
        .eq('type', 'digital');

      setStats({
        courses: coursesData?.length || 0,
        orders: ordersData?.filter(o => o.status !== 'delivered').length || 0,
        activeJobs: jobsData?.filter(j => j.status !== 'completed').length || 0,
      });

      setOrders(ordersData?.map(o => ({
        id: o.id,
        title: o.listing?.title || 'Unknown Product',
        subtitle: `Order #${o.id.substring(0,8)}`,
        status: o.status
      })) || []);

      setJobs(jobsData?.map(j => ({
        id: j.id,
        title: j.listing?.title || 'Unknown Job',
        subtitle: `Order #${j.id.substring(0,8)}`,
        status: j.status
      })) || []);
    };

    fetchData();
  }, [user]);

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatWidget title="My Courses" value={stats.courses} subtext="In progress" icon={Users} color="bg-purple-500" />
        <StatWidget title="Orders" value={stats.orders} subtext="On the way" icon={Truck} color="bg-orange-500" />
        <StatWidget title="Active Jobs" value={stats.activeJobs} subtext="Waiting for approval" icon={Briefcase} color="bg-blue-500" />
      </div>

      {/* Action Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ActionList 
          title="Recent Purchases" 
          type="shipping"
          items={orders} 
        />
        <ActionList 
          title="My Projects" 
          type="job"
          items={jobs} 
        />
      </div>
    </div>
  );
};

export const BuyerLibrary = ({ user }: { user: any }) => {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const fetchLibrary = async () => {
      if (!user) return;
      
      // Fetch digital orders
      const { data: orders } = await supabase
        .from('orders')
        .select('*, listing:listings(id, title, images, metadata)')
        .eq('buyer_id', user.id)
        .eq('type', 'digital')
        .order('created_at', { ascending: false });
      
      if (!orders) {
        setItems([]);
        return;
      }

      // Fetch progress for these listings
      const listingIds = orders.map(o => o.listing?.id).filter(Boolean);
      let progressMap: Record<string, number> = {};
      
      if (listingIds.length > 0) {
        const { data: progressData } = await supabase
          .from('course_progress')
          .select('listing_id, completed_lessons')
          .eq('user_id', user.id)
          .in('listing_id', listingIds);
          
        if (progressData) {
          progressData.forEach(p => {
            progressMap[p.listing_id] = p.completed_lessons?.length || 0;
          });
        }
      }

      const itemsWithProgress = orders.map(item => {
        const totalLessons = item.listing?.metadata?.curriculum?.reduce((acc: number, mod: any) => acc + (mod.lessons?.length || 0), 0) || 0;
        const completedLessons = progressMap[item.listing?.id] || 0;
        const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
        
        return {
          ...item,
          progressPercent
        };
      });

      setItems(itemsWithProgress);
    };
    fetchLibrary();
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
        <h2 className="text-2xl font-bold text-[#1D1D1F] mb-6">My Library</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.id} className="border border-black/5 rounded-2xl overflow-hidden hover:shadow-md transition-shadow group">
              <div className="aspect-video bg-gray-100 relative">
                {item.listing?.images?.[0] ? (
                  <img src={item.listing.images[0]} alt={item.listing.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="w-10 h-10 text-gray-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <PlayCircle className="w-12 h-12 text-white" />
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-[#1D1D1F] mb-2 truncate">{item.listing?.title}</h3>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${item.progressPercent}%` }}></div>
                </div>
                <p className="text-xs text-gray-500 flex justify-between">
                  <span>{item.progressPercent}% Complete</span>
                  <button className="text-blue-600 font-medium hover:underline">Continue</button>
                </p>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="col-span-full p-12 text-center text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-[#1D1D1F]">Your library is empty</p>
              <p>Purchase digital products or courses to see them here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
