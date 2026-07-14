import React, { useState, useRef, useEffect } from 'react';
import { 
  MousePointer2, 
  StickyNote, 
  Share2, 
  Save, 
  Play, 
  Plus, 
  Trash2, 
  Settings, 
  Layers, 
  Move, 
  Filter, 
  Loader2, 
  ArrowLeft, 
  X,
  Mail,
  MessageSquare,
  Clock,
  Split,
  BarChart3,
  Maximize,
  Minimize,
  Eye,
  Zap
} from 'lucide-react';
import { Stage, Layer, Rect, Circle, Text, Group, Arrow } from 'react-konva';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { DatabaseService } from '../../services/databaseService';
import { useAuth } from '../../context/AuthContext';

interface FunnelNode {
  id: string;
  x: number;
  y: number;
  type: 'note' | 'step' | 'action' | 'email' | 'sms' | 'delay' | 'condition';
  text: string;
  color: string;
  stats?: {
    visitors: number;
    conversion: number;
  };
}

interface FunnelConnection {
  id: string;
  from: string;
  to: string;
}

interface Funnel {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

export const FunnelsBuilderView = () => {
  const { user } = useAuth();
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [currentFunnel, setCurrentFunnel] = useState<Funnel | null>(null);
  const [nodes, setNodes] = useState<FunnelNode[]>([]);
  const [connections, setConnections] = useState<FunnelConnection[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const stageRef = useRef<any>(null);
  const [stageSize, setStageSize] = useState({ width: window.innerWidth, height: window.innerHeight - 64 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showAnalytics, setShowAnalytics] = useState(false);

  const FUNNEL_PRESETS = [
    {
      id: 'lead-magnet',
      name: 'Lead Magnet Funnel',
      description: 'Capture leads with a free offer.',
      nodes: [
        { id: '1', x: 100, y: 200, type: 'step', text: 'Landing Page', color: '#BFDBFE' },
        { id: '2', x: 350, y: 200, type: 'action', text: 'Lead Magnet', color: '#BBF7D0' },
        { id: '3', x: 600, y: 200, type: 'step', text: 'Thank You Page', color: '#BFDBFE' }
      ],
      connections: [
        { id: 'c1', from: '1', to: '2' },
        { id: 'c2', from: '2', to: '3' }
      ]
    },
    {
      id: 'sales-funnel',
      name: 'Sales Funnel',
      description: 'Convert visitors into customers.',
      nodes: [
        { id: '1', x: 100, y: 200, type: 'step', text: 'Sales Page', color: '#BFDBFE' },
        { id: '2', x: 350, y: 200, type: 'action', text: 'Checkout', color: '#BBF7D0' },
        { id: '3', x: 600, y: 200, type: 'step', text: 'Upsell Page', color: '#BFDBFE' },
        { id: '4', x: 850, y: 200, type: 'step', text: 'Thank You Page', color: '#BFDBFE' }
      ],
      connections: [
        { id: 'c1', from: '1', to: '2' },
        { id: 'c2', from: '2', to: '3' },
        { id: 'c3', from: '3', to: '4' }
      ]
    },
    {
      id: 'webinar-funnel',
      name: 'Webinar Funnel',
      description: 'Register and host live events.',
      nodes: [
        { id: '1', x: 100, y: 200, type: 'step', text: 'Registration', color: '#BFDBFE' },
        { id: '2', x: 350, y: 200, type: 'step', text: 'Webinar Room', color: '#BFDBFE' },
        { id: '3', x: 600, y: 200, type: 'action', text: 'Offer Click', color: '#BBF7D0' },
        { id: '4', x: 850, y: 200, type: 'step', text: 'Thank You Page', color: '#BFDBFE' }
      ],
      connections: [
        { id: 'c1', from: '1', to: '2' },
        { id: 'c2', from: '2', to: '3' },
        { id: 'c3', from: '3', to: '4' }
      ]
    }
  ];

  const NODE_COLORS = {
    note: '#FEF08A',
    step: '#BFDBFE',
    action: '#BBF7D0',
    email: '#E9D5FF',
    sms: '#FED7AA',
    delay: '#E2E8F0',
    condition: '#FBCFE8'
  };

  const handleApplyPreset = (preset: typeof FUNNEL_PRESETS[0]) => {
    const idMap: Record<string, string> = {};
    const newNodes = preset.nodes.map(n => {
      const newId = crypto.randomUUID();
      idMap[n.id] = newId;
      return { 
        ...n, 
        id: newId,
        stats: { visitors: Math.floor(Math.random() * 1000), conversion: Math.floor(Math.random() * 100) }
      } as FunnelNode;
    });
    const newConnections = preset.connections.map(c => ({
      id: crypto.randomUUID(),
      from: idMap[c.from],
      to: idMap[c.to]
    }));
    setNodes(newNodes);
    setConnections(newConnections);
    setShowPresets(false);
  };

  useEffect(() => {
    if (user) {
      fetchFunnels();
    }
  }, [user]);

  useEffect(() => {
    const handleResize = () => {
      setStageSize({ 
        width: window.innerWidth, 
        height: window.innerHeight - (window.innerWidth < 768 ? 120 : 64) 
      });
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchFunnels = async () => {
    setLoading(true);
    try {
      const data = await DatabaseService.get('funnels', {
        order: { column: 'created_at', ascending: false }
      });
      const uniqueFunnels = Array.from(new Map((data || []).map((f: any) => [f.id, f])).values()) as Funnel[];
      setFunnels(uniqueFunnels);
    } catch (error) {
      console.error('Error fetching funnels:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFunnelData = async (funnelId: string) => {
    try {
      const [nodesData, connectionsData] = await Promise.all([
        DatabaseService.get('funnel_nodes', { eq: { funnel_id: funnelId } }),
        DatabaseService.get('funnel_connections', { eq: { funnel_id: funnelId } })
      ]);

      const uniqueNodes = Array.from(new Map((nodesData as any[])?.map(n => [n.id, n])).values());
      setNodes(uniqueNodes.map(n => ({
        ...n,
        color: NODE_COLORS[n.type as keyof typeof NODE_COLORS] || '#E5E7EB',
        stats: { visitors: Math.floor(Math.random() * 1000), conversion: Math.floor(Math.random() * 100) }
      })) || []);
      
      const uniqueConnections = Array.from(new Map((connectionsData as any[])?.map(c => [c.id, c])).values());
      setConnections(uniqueConnections.map(c => ({
        id: c.id,
        from: c.from_node_id,
        to: c.to_node_id
      })) || []);
    } catch (error) {
      console.error('Error fetching funnel data:', error);
    }
  };

  const handleCreateFunnel = async () => {
    const name = `New Funnel ${funnels.length + 1}`;
    try {
      const newFunnel = await DatabaseService.insert('funnels', { 
        name, 
        user_id: user?.id,
        status: 'draft'
      });
      setFunnels([newFunnel, ...funnels]);
      if (newFunnel) handleSelectFunnel(newFunnel);
    } catch (error) {
      console.error('Error creating funnel:', error);
    }
  };

  const handleSelectFunnel = (funnel: Funnel) => {
    setCurrentFunnel(funnel);
    fetchFunnelData(funnel.id);
  };

  const handleSave = async () => {
    if (!currentFunnel) return;
    setSaving(true);
    try {
      await DatabaseService.delete('funnel_connections', currentFunnel.id, 'funnel_id');
      await DatabaseService.delete('funnel_nodes', currentFunnel.id, 'funnel_id');

      const nodesToInsert = nodes.map(n => ({
        id: n.id.length > 10 ? n.id : undefined,
        funnel_id: currentFunnel.id,
        type: n.type,
        x: n.x,
        y: n.y,
        text: n.text
      }));

      await DatabaseService.insert('funnel_nodes', nodesToInsert);
      
      const connectionsToInsert = connections.map(c => ({
        funnel_id: currentFunnel.id,
        from_node_id: c.from,
        to_node_id: c.to
      }));

      if (connectionsToInsert.length > 0) {
        await DatabaseService.insert('funnel_connections', connectionsToInsert);
      }
      toast.success('Funnel saved successfully!');
    } catch (error) {
      console.error('Error saving funnel:', error);
      toast.error('Failed to save funnel.');
    } finally {
      setSaving(false);
    }
  };

  const addNode = (type: FunnelNode['type']) => {
    const newNode: FunnelNode = {
      id: crypto.randomUUID(),
      x: (stageSize.width / 2 - position.x) / scale - 75,
      y: (stageSize.height / 2 - position.y) / scale - 75,
      type,
      text: type.charAt(0).toUpperCase() + type.slice(1),
      color: NODE_COLORS[type],
      stats: { visitors: 0, conversion: 0 }
    };
    setNodes([...nodes, newNode]);
    setSelectedId(newNode.id);
  };

  const handleDragEnd = (e: any, id: string) => {
    setNodes(nodes.map(node => 
      node.id === id ? { ...node, x: e.target.x(), y: e.target.y() } : node
    ));
  };

  const startConnection = (id: string) => {
    if (isConnecting === id) {
      setIsConnecting(null);
      return;
    }
    if (isConnecting && isConnecting !== id) {
      const newConn: FunnelConnection = {
        id: crypto.randomUUID(),
        from: isConnecting,
        to: id
      };
      setConnections([...connections, newConn]);
      setIsConnecting(null);
    } else {
      setIsConnecting(id);
    }
  };

  const removeNode = (id: string) => {
    setNodes(nodes.filter(n => n.id !== id));
    setConnections(connections.filter(c => c.from !== id && c.to !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const updateNodeText = (id: string, text: string) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, text } : n));
  };

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const mousePointTo = {
      x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
      y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    setScale(newScale);
    setPosition({
      x: -(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale,
      y: -(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale,
    });
  };

  // Generate dots for background
  const dots = [];
  const spacing = 40;
  for (let x = -2000; x < 4000; x += spacing) {
    for (let y = -2000; y < 4000; y += spacing) {
      dots.push(<Circle key={`${x}-${y}`} x={x} y={y} radius={1} fill="#333" />);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!currentFunnel) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
              <Filter className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">My Funnels</h1>
              <p className="text-gray-400">Design and map your conversion paths.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowPresets(true)}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all flex items-center gap-2 border border-white/10"
            >
              <Layers className="w-4 h-4" /> Presets
            </button>
            <button 
              onClick={handleCreateFunnel}
              className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              <Plus className="w-4 h-4" /> Create Funnel
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from(new Map(funnels.map(f => [f.id, f])).values()).map((funnel) => (
            <div 
              key={funnel.id}
              onClick={() => handleSelectFunnel(funnel)}
              className="p-6 bg-[#111] border border-white/5 rounded-3xl hover:border-indigo-500/30 transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:bg-indigo-500/10 transition-colors">
                <Filter className="w-6 h-6 text-gray-400 group-hover:text-indigo-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{funnel.name}</h3>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">{funnel.status}</p>
              <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] text-gray-600 font-bold">Created {new Date(funnel.created_at).toLocaleDateString()}</span>
                <button className="text-indigo-400 text-xs font-bold hover:underline">Edit Funnel</button>
              </div>
            </div>
          ))}
          {funnels.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
              <Filter className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-1">No funnels yet</h3>
              <p className="text-gray-500">Click the button above to create your first funnel.</p>
            </div>
          )}
        </div>

        <AnimatePresence>
          {showPresets && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowPresets(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-4xl bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden"
              >
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Funnel Presets</h2>
                    <p className="text-gray-400">Choose a template to jumpstart your funnel design.</p>
                  </div>
                  <button onClick={() => setShowPresets(false)} className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-all">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {FUNNEL_PRESETS.map((preset) => (
                    <div 
                      key={preset.id}
                      className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-indigo-500/30 transition-all group flex flex-col"
                    >
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Layers className="w-6 h-6 text-indigo-400" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">{preset.name}</h3>
                      <p className="text-sm text-gray-500 mb-6 flex-1">{preset.description}</p>
                      <button 
                        onClick={() => handleApplyPreset(preset)}
                        className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-all"
                      >
                        Use Template
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col bg-[#0A0A0A] overflow-hidden">
      {/* Toolbar */}
      <div className="h-16 md:h-16 border-b border-white/5 bg-[#111] px-4 md:px-6 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={() => setCurrentFunnel(null)}
            className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
            <Filter className="w-4 h-4 md:w-5 md:h-5 text-indigo-400" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm md:text-lg font-bold text-white truncate max-w-[120px] md:max-w-none">{currentFunnel?.name}</h1>
            <p className="text-[8px] md:text-[10px] text-gray-500 uppercase tracking-widest font-bold">Advanced Funnel Builder</p>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-3">
          <button 
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`p-2 md:px-4 md:py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              showAnalytics ? 'bg-indigo-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <BarChart3 className="w-4 h-4" /> <span className="hidden md:inline">{showAnalytics ? 'Hide Stats' : 'Show Stats'}</span>
          </button>
          <button className="p-2 md:px-4 md:py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2">
            <Play className="w-4 h-4" /> <span className="hidden md:inline">Preview</span>
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="p-2 md:px-4 md:py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} <span className="hidden md:inline">Save</span>
          </button>
          <button className="p-2 md:px-4 md:py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20">
            <Share2 className="w-4 h-4" /> <span className="hidden md:inline">Export</span>
          </button>
        </div>
      </div>

      <div className="flex-1 relative">
        {/* Floating Sidebar / Bottom Bar */}
        <div className="absolute bottom-20 md:bottom-auto md:top-6 left-1/2 md:left-6 -translate-x-1/2 md:translate-x-0 z-20 flex flex-row md:flex-col gap-2 w-[90%] md:w-auto">
          <div className="p-1 md:p-2 bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-row md:flex-col gap-1 overflow-x-auto scrollbar-hide flex-1">
            <ToolButton onClick={() => addNode('step')} icon={<Layers className="w-5 h-5" />} label="Page Step" />
            <ToolButton onClick={() => addNode('action')} icon={<Zap className="w-5 h-5" />} label="Action Trigger" />
            <ToolButton onClick={() => addNode('email')} icon={<Mail className="w-5 h-5" />} label="Email Sequence" />
            <ToolButton onClick={() => addNode('sms')} icon={<MessageSquare className="w-5 h-5" />} label="SMS Alert" />
            <ToolButton onClick={() => addNode('delay')} icon={<Clock className="w-5 h-5" />} label="Wait/Delay" />
            <ToolButton onClick={() => addNode('condition')} icon={<Split className="w-5 h-5" />} label="Split Test" />
            <div className="hidden md:block h-px bg-white/5 my-1" />
            <ToolButton onClick={() => addNode('note')} icon={<StickyNote className="w-5 h-5" />} label="Sticky Note" />
          </div>
          
          <div className="p-1 md:p-2 bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-row md:flex-col gap-1">
            <ToolButton onClick={() => setScale(s => s * 1.2)} icon={<Maximize className="w-5 h-5" />} label="Zoom In" />
            <ToolButton onClick={() => setScale(s => s / 1.2)} icon={<Minimize className="w-5 h-5" />} label="Zoom Out" />
            <ToolButton onClick={() => { setScale(1); setPosition({ x: 0, y: 0 }); }} icon={<Move className="w-5 h-5" />} label="Reset View" />
          </div>
        </div>

        {/* Canvas Stage */}
        <Stage 
          width={stageSize.width} 
          height={stageSize.height}
          ref={stageRef}
          scaleX={scale}
          scaleY={scale}
          x={position.x}
          y={position.y}
          draggable
          onWheel={handleWheel}
          onClick={() => setSelectedId(null)}
          onDragEnd={(e) => setPosition({ x: e.target.x(), y: e.target.y() })}
        >
          <Layer>
            {dots}
            
            {/* Connections */}
            {Array.from(new Map(connections.map(c => [c.id, c])).values()).map(conn => {
              const from = nodes.find(n => n.id === conn.from);
              const to = nodes.find(n => n.id === conn.to);
              if (!from || !to) return null;
              
              const dx = to.x - from.x;
              const dy = to.y - from.y;
              const midX = from.x + dx / 2;
              
              return (
                <Group key={conn.id}>
                  <Arrow
                    points={[from.x + 150, from.y + 75, to.x, to.y + 75]}
                    stroke="#4F46E5"
                    strokeWidth={2}
                    fill="#4F46E5"
                    tension={0.5}
                    opacity={0.6}
                  />
                  {showAnalytics && (
                    <Group x={midX + 75} y={from.y + dy / 2 + 75}>
                      <Rect width={40} height={20} fill="#111" cornerRadius={4} stroke="#4F46E5" strokeWidth={1} />
                      <Text text={`${Math.floor(Math.random() * 100)}%`} fontSize={10} fill="#4F46E5" width={40} align="center" padding={5} />
                    </Group>
                  )}
                </Group>
              );
            })}

            {/* Nodes */}
            {Array.from(new Map(nodes.map(n => [n.id, n])).values()).map(node => (
              <Group
                key={node.id}
                x={node.x}
                y={node.y}
                draggable
                onDragEnd={(e) => handleDragEnd(e, node.id)}
                onClick={(e) => {
                  e.cancelBubble = true;
                  setSelectedId(node.id);
                }}
              >
                <Rect
                  width={150}
                  height={150}
                  fill={node.color}
                  cornerRadius={node.type === 'note' ? 0 : 16}
                  shadowBlur={selectedId === node.id ? 25 : 10}
                  shadowColor="black"
                  shadowOpacity={0.4}
                  stroke={isConnecting === node.id ? '#4F46E5' : selectedId === node.id ? '#4F46E5' : 'transparent'}
                  strokeWidth={2}
                />
                
                <Circle x={75} y={45} radius={20} fill="rgba(0,0,0,0.05)" />
                
                <Text
                  text={node.text}
                  fontSize={14}
                  fontFamily="Inter"
                  fontStyle="bold"
                  y={75}
                  width={150}
                  align="center"
                  fill="#111"
                />

                <Text
                  text={node.type.toUpperCase()}
                  fontSize={8}
                  fontFamily="Inter"
                  fontStyle="bold"
                  y={100}
                  width={150}
                  align="center"
                  fill="rgba(0,0,0,0.4)"
                  letterSpacing={1}
                />

                {showAnalytics && node.type !== 'note' && (
                  <Group y={160} x={0}>
                    <Rect width={150} height={40} fill="#111" cornerRadius={8} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
                    <Text 
                      text={`${node.stats?.visitors} visitors • ${node.stats?.conversion}% conv.`} 
                      fontSize={10} 
                      fill="#888" 
                      width={150} 
                      align="center" 
                      padding={15} 
                    />
                  </Group>
                )}
                
                <Circle
                  x={150}
                  y={75}
                  radius={8}
                  fill={isConnecting === node.id ? '#4F46E5' : '#111'}
                  stroke="white"
                  strokeWidth={2}
                  onClick={(e) => {
                    e.cancelBubble = true;
                    startConnection(node.id);
                  }}
                />
              </Group>
            ))}
          </Layer>
        </Stage>

        {/* Properties Panel / Bottom Sheet */}
        <AnimatePresence>
          {selectedId && (
            <motion.div
              initial={window.innerWidth < 768 ? { y: '100%' } : { x: 300, opacity: 0 }}
              animate={window.innerWidth < 768 ? { y: 0 } : { x: 0, opacity: 1 }}
              exit={window.innerWidth < 768 ? { y: '100%' } : { x: 300, opacity: 0 }}
              className={`fixed md:absolute bottom-0 md:bottom-auto md:top-6 right-0 md:right-6 w-full md:w-80 bg-[#111] border-t md:border border-white/10 md:rounded-3xl shadow-2xl p-6 z-40 backdrop-blur-xl max-h-[80vh] overflow-y-auto`}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <Settings className="w-4 h-4 text-indigo-400" />
                  </div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Step Settings</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => removeNode(selectedId)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setSelectedId(null)} className="md:hidden p-2 text-gray-400 hover:bg-white/5 rounded-lg transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Label</label>
                  <input 
                    type="text"
                    value={nodes.find(n => n.id === selectedId)?.text}
                    onChange={(e) => updateNodeText(selectedId, e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-sm focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
                <div className="pt-6 border-t border-white/5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white/5 rounded-2xl text-center">
                      <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Visitors</p>
                      <p className="text-lg font-bold text-white">{nodes.find(n => n.id === selectedId)?.stats?.visitors}</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-2xl text-center">
                      <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Conv.</p>
                      <p className="text-lg font-bold text-white">{nodes.find(n => n.id === selectedId)?.stats?.conversion}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute bottom-6 right-6 md:bottom-6 md:left-6 px-4 py-2 bg-[#111]/80 backdrop-blur-md border border-white/5 rounded-xl text-[10px] font-bold text-gray-500 uppercase tracking-widest z-10">
          Zoom: {Math.round(scale * 100)}%
        </div>
      </div>
    </div>
  );
};

const ToolButton = ({ onClick, icon, label }: { onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className="p-3 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all group relative"
  >
    {icon}
    <span className="absolute left-full ml-3 px-2 py-1 bg-black border border-white/10 text-[10px] text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-xl">
      {label}
    </span>
  </button>
);
