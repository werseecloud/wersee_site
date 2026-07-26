import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Shield, Clock, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface ManageRolesModalProps {
  communityId: string;
  user: any;
  onClose: () => void;
}

export function ManageRolesModal({ communityId, user, onClose }: ManageRolesModalProps) {
  const [roles, setRoles] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [temporaryDuration, setTemporaryDuration] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchData();
  }, [communityId, user.id]);

  const fetchData = async () => {
    try {
      const [rolesRes, userRolesRes] = await Promise.all([
        supabase.from('community_roles').select('*').eq('community_id', communityId).order('hierarchy_level', { ascending: false }),
        supabase.from('community_member_roles').select('*').eq('community_id', communityId).eq('user_id', user.id)
      ]);

      if (rolesRes.error) throw rolesRes.error;
      if (userRolesRes.error) throw userRolesRes.error;

      setRoles(rolesRes.data || []);
      setUserRoles(userRolesRes.data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = async (roleId: string, durationHours?: number) => {
    setSaving(true);
    try {
      const hasRole = userRoles.some(ur => ur.role_id === roleId);

      if (hasRole) {
        // Remove role
        const { error } = await supabase
          .from('community_member_roles')
          .delete()
          .eq('community_id', communityId)
          .eq('user_id', user.id)
          .eq('role_id', roleId);

        if (error) throw error;
        setUserRoles(userRoles.filter(ur => ur.role_id !== roleId));
      } else {
        // Add role
        const expiresAt = durationHours ? new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString() : null;
        const { data, error } = await supabase
          .from('community_member_roles')
          .insert({
            community_id: communityId,
            user_id: user.id,
            role_id: roleId,
            expires_at: expiresAt
          })
          .select()
          .single();

        if (error) throw error;
        setUserRoles([...userRoles, data]);
      }
    } catch (error) {
      console.error('Error toggling role:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="bg-[#141414] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden pointer-events-auto shadow-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">Manage Roles</h3>
              <p className="text-sm text-gray-400">Assign roles to {user.name}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : roles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No roles created yet.</p>
              </div>
            ) : (
              roles.map(role => {
                const userRole = userRoles.find(ur => ur.role_id === role.id);
                const hasRole = !!userRole;
                const isTemporary = hasRole && userRole.expires_at;

                return (
                  <div key={role.id} className="p-4 bg-white/5 border border-white/10 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: role.color }} />
                        <span className="text-white font-medium">{role.name}</span>
                        {isTemporary && (
                          <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Temp
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => toggleRole(role.id)}
                        disabled={saving}
                        className={`w-10 h-6 rounded-full transition-colors relative ${hasRole ? 'bg-indigo-500' : 'bg-white/10'}`}
                      >
                        <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${hasRole ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    {!hasRole && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                        <select
                          value={temporaryDuration[role.id] || ''}
                          onChange={(e) => setTemporaryDuration({ ...temporaryDuration, [role.id]: parseInt(e.target.value) })}
                          className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="">Permanent</option>
                          <option value="1">1 Hour</option>
                          <option value="24">24 Hours</option>
                          <option value="168">7 Days</option>
                        </select>
                        <button
                          onClick={() => toggleRole(role.id, temporaryDuration[role.id])}
                          disabled={saving || !temporaryDuration[role.id]}
                          className="px-3 py-1.5 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          Assign Temp
                        </button>
                      </div>
                    )}
                    {isTemporary && (
                      <p className="text-xs text-amber-400/70 mt-2">
                        Expires: {new Date(userRole.expires_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}
