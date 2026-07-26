import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Filter, Loader2, ShieldCheck } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type SharedNode = {
  id: string;
  type: string;
  text: string;
  x: number;
  y: number;
};

type SharedConnection = {
  id: string;
  from_node_id: string;
  to_node_id: string;
};

const nodeColors: Record<string, string> = {
  note: '#FEF08A',
  step: '#BFDBFE',
  action: '#BBF7D0',
  email: '#E9D5FF',
  sms: '#FED7AA',
  delay: '#E2E8F0',
  condition: '#FBCFE8'
};

export function FunnelShareView() {
  const { token = '' } = useParams();
  const [funnel, setFunnel] = useState<{ id: string; name: string } | null>(null);
  const [nodes, setNodes] = useState<SharedNode[]>([]);
  const [connections, setConnections] = useState<SharedConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data: funnelData, error } = await supabase
        .from('funnels')
        .select('id,name')
        .eq('share_token', token)
        .eq('is_public', true)
        .maybeSingle();
      if (cancelled) return;
      if (error || !funnelData) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const [nodesResult, connectionsResult] = await Promise.all([
        supabase.from('funnel_nodes').select('id,type,text,x,y').eq('funnel_id', funnelData.id),
        supabase.from('funnel_connections').select('id,from_node_id,to_node_id').eq('funnel_id', funnelData.id)
      ]);
      if (cancelled) return;
      setFunnel(funnelData);
      setNodes((nodesResult.data || []) as SharedNode[]);
      setConnections((connectionsResult.data || []) as SharedConnection[]);
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const bounds = useMemo(() => {
    if (!nodes.length) return { minX: 0, minY: 0, width: 900, height: 520 };
    const minX = Math.min(...nodes.map(node => Number(node.x))) - 100;
    const minY = Math.min(...nodes.map(node => Number(node.y))) - 100;
    const maxX = Math.max(...nodes.map(node => Number(node.x) + 150)) + 100;
    const maxY = Math.max(...nodes.map(node => Number(node.y) + 150)) + 100;
    return { minX, minY, width: Math.max(700, maxX - minX), height: Math.max(420, maxY - minY) };
  }, [nodes]);

  if (loading) {
    return <div className="min-h-screen bg-[#070707] grid place-items-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-400" /></div>;
  }

  if (notFound || !funnel) {
    return (
      <div className="min-h-screen bg-[#070707] px-6 grid place-items-center text-white">
        <div className="max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">
          <Filter className="mx-auto h-10 w-10 text-gray-600" />
          <h1 className="mt-5 text-2xl font-black">This funnel is not available</h1>
          <p className="mt-3 text-sm leading-6 text-gray-400">The link may be invalid, or the owner has stopped sharing this funnel.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#070707] text-white">
      <header className="border-b border-white/5 bg-black/30 px-5 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-500/10 text-indigo-300"><Filter className="h-5 w-5" /></div>
            <div className="min-w-0">
              <h1 className="truncate font-black">{funnel.name}</h1>
              <p className="text-[10px] font-bold uppercase tracking-[.22em] text-gray-500">Published funnel</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-300"><ShieldCheck className="h-4 w-4" /> Read only</div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl p-4 sm:p-8">
        <div className="overflow-auto rounded-[2rem] border border-white/10 bg-[#0c0c0c] shadow-2xl">
          {nodes.length ? (
            <svg
              className="min-h-[560px] min-w-[760px] w-full"
              viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
              role="img"
              aria-label={`${funnel.name} funnel diagram`}
            >
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="1.2" fill="#333" />
                </pattern>
                <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#6366f1" />
                </marker>
              </defs>
              <rect x={bounds.minX} y={bounds.minY} width={bounds.width} height={bounds.height} fill="url(#grid)" />
              {connections.map(connection => {
                const from = nodes.find(node => node.id === connection.from_node_id);
                const to = nodes.find(node => node.id === connection.to_node_id);
                if (!from || !to) return null;
                const x1 = Number(from.x) + 150;
                const y1 = Number(from.y) + 75;
                const x2 = Number(to.x);
                const y2 = Number(to.y) + 75;
                const bend = Math.max(72, Math.abs(x2 - x1) * 0.45);
                return <path key={connection.id} d={`M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`} fill="none" stroke="#6366f1" strokeWidth="3" markerEnd="url(#arrow)" opacity=".9" />;
              })}
              {nodes.map(node => (
                <g key={node.id} transform={`translate(${Number(node.x)} ${Number(node.y)})`}>
                  <rect width="150" height="150" rx={node.type === 'note' ? 3 : 18} fill={nodeColors[node.type] || '#E5E7EB'} />
                  <circle cx="75" cy="42" r="18" fill="rgba(0,0,0,.06)" />
                  <foreignObject x="12" y="67" width="126" height="48">
                    <div className="flex h-full items-center justify-center text-center text-sm font-black text-[#111]">{node.text}</div>
                  </foreignObject>
                  <text x="75" y="124" textAnchor="middle" fontSize="9" fontWeight="800" letterSpacing="1.4" fill="rgba(0,0,0,.42)">{node.type.toUpperCase()}</text>
                  <circle cx="150" cy="75" r="7" fill="#111" stroke="white" strokeWidth="2" />
                </g>
              ))}
            </svg>
          ) : (
            <div className="grid min-h-[520px] place-items-center text-center">
              <div><ArrowRight className="mx-auto h-8 w-8 text-gray-700" /><p className="mt-4 font-bold text-gray-400">This funnel does not have any steps yet.</p></div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
