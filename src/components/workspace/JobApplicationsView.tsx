import React, { useState, useEffect } from 'react';
import { supabase, invokeApiRunner } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Briefcase, CheckCircle2, XCircle, Clock, ExternalLink } from 'lucide-react';

export const JobApplicationsView = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*, listing:listings(title, price)')
          .eq('buyer_id', user.id)
          .eq('type', 'job_application')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setApplications(data || []);
      } catch (error) {
        console.error('Error fetching applications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'rejected': 
      case 'declined': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'reviewed': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      default: return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle2 className="w-4 h-4" />;
      case 'rejected':
      case 'declined': return <XCircle className="w-4 h-4" />;
      case 'reviewed': return <CheckCircle2 className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">My Job Applications</h2>
        <p className="text-gray-400">Track the status of your job applications.</p>
      </div>

      {applications.length > 0 ? (
        <div className="grid gap-4">
          {applications.map((app) => (
            <div key={app.id} className="bg-[#141414] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">{app.listings?.title || 'Unknown Job'}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>Applied on {new Date(app.created_at).toLocaleDateString()}</span>
                  {app.listings?.price > 0 && <span>• ${app.listings.price}/hr</span>}
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 text-sm font-medium capitalize ${getStatusColor(app.status)}`}>
                  {getStatusIcon(app.status)}
                  {app.status}
                </div>
                {app.resume_url && (
                  <a 
                    href={app.resume_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-colors"
                    title="View Resume"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-[#141414] border border-white/5 rounded-3xl">
          <Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No applications yet</h3>
          <p className="text-gray-400 mb-6">You haven't applied to any jobs yet.</p>
        </div>
      )}
    </div>
  );
};
