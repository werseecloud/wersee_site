import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react';

export const CustomAppLP: React.FC = () => {
  const { appId } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (appId) {
      fetchApp();
    }
  }, [appId]);

  const fetchApp = async () => {
    try {
      const { data: appData, error: appError } = await supabase
        .from('apps')
        .select('*')
        .eq('slug', appId)
        .maybeSingle();

      if (appError) throw appError;

      if (!appData) {
        setError('The app you are looking for does not exist or is private.');
        return;
      }

      const { data: versionData, error: versionError } = await supabase
        .from('app_versions')
        .select('compiled_code')
        .eq('app_id', appData.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (versionError) throw versionError;

      setApp({ ...appData, code: versionData?.compiled_code || '' });
    } catch (err: any) {
      console.error('Error fetching app:', err);
      setError(err.message || 'Failed to load app');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">App Not Found</h1>
        <p className="text-gray-400 mb-6">{error || 'The app you are looking for does not exist.'}</p>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white w-full h-screen overflow-hidden relative">
      {/* Inject the custom code via iframe for isolation */}
      <iframe
        title={app.name}
        srcDoc={app.code}
        className="w-full h-full border-none"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
      
      {/* Floating back button */}
      <button
        onClick={() => navigate(-1)}
        className="fixed bottom-6 right-6 p-4 bg-black/80 backdrop-blur-md text-white rounded-full shadow-2xl hover:bg-black hover:scale-110 transition-all z-50 group flex items-center justify-center"
        title="Back to Dashboard"
      >
        <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
      </button>
    </div>
  );
};
