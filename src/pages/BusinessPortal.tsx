import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { TeamPortalLayout } from '../components/workspace/portals/TeamPortalLayout';

interface Business {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  description?: string;
  user_id: string;
}

export const BusinessPortal = () => {
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (businessSlug) {
      fetchBusiness();
    }
  }, [businessSlug]);

  const fetchBusiness = async () => {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(businessSlug || '');
      const query = supabase.from('businesses').select('*');
      const { data, error } = isUuid
        ? await query.eq('id', businessSlug).maybeSingle()
        : await query.eq('slug', businessSlug).maybeSingle();

      if (error) throw error;
      if (!data) {
        navigate('/404');
        return;
      }

      setBusiness(data);
    } catch (error) {
      console.error('Error fetching business:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!business || !user) return null;

  return <TeamPortalLayout business={business} user={user} />;
};
