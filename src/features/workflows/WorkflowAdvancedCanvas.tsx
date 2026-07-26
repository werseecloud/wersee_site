import React, { useCallback, useEffect, useMemo } from 'react';
import {
  addEdge, Background, BackgroundVariant, Controls, Handle, MiniMap, Panel, Position,
  ReactFlow, useEdgesState, useNodesState, type Connection, type Edge, type Node, type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Bot, Braces, CheckCircle2, Clock3, GitBranch, Globe2, Mail, Plus, ShieldCheck, Trash2, Wrench, Zap } from 'lucide-react';
import type { WorkflowDefinition, WorkflowNodeType } from './types';

interface NodeData extends Record<string, unknown> { title: string; type: WorkflowNodeType; description?: string }

const iconByType: Record<string, React.ComponentType<{ className?: string }>> = {
  trigger: Zap, email: Mail, notification: CheckCircle2, ai: Bot, http: Globe2, mcp: Wrench,
  condition: GitBranch, delay: Clock3, approval: ShieldCheck, loop: Braces, transform: Braces, note: Braces,
};

const WorkflowCanvasNode: React.FC<NodeProps<Node<NodeData>>> = ({ data, selected }) => {
  const Icon = iconByType[data.type] || Zap;
  return <div className={`min-w-56 rounded-2xl border bg-[#171717] p-4 shadow-2xl transition ${selected ? 'border-violet-400 ring-4 ring-violet-400/10' : 'border-white/10'}`}>
    {data.type !== 'trigger' && <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-2 !border-[#171717] !bg-violet-400" />}
    <div className="flex items-center gap-3"><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${data.type === 'trigger' ? 'bg-violet-400 text-black' : 'bg-white/5 text-white/60'}`}><Icon className="h-4 w-4" /></span><div className="min-w-0"><div className="text-[9px] font-black uppercase tracking-[0.18em] text-white/30">{data.type.replaceAll('_', ' ')}</div><div className="mt-0.5 max-w-40 truncate text-sm font-bold text-white">{data.title}</div></div></div>
    <Handle type="source" position={Position.Right} className="!h-3 !w-3 !border-2 !border-[#171717] !bg-violet-400" />
  </div>;
};

const nodeTypes = { workflow: WorkflowCanvasNode };

interface Props {
  definition: WorkflowDefinition;
  onChange: (definition: WorkflowDefinition) => void;
  onSelectNode: (nodeId: string | null) => void;
  onAddNode: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const WorkflowAdvancedCanvas: React.FC<Props> = ({ definition, onChange, onSelectNode, onAddNode, onUndo, onRedo, canUndo, canRedo }) => {
  const initialNodes = useMemo<Node<NodeData>[]>(() => definition.nodes.map((node) => ({ id: node.id, type: 'workflow', position: node.position, data: { title: node.title, type: node.type, description: node.description } })), []);
  const initialEdges = useMemo<Edge[]>(() => definition.edges.map((edge) => ({ id: edge.id, source: edge.source, target: edge.target, sourceHandle: edge.sourceHandle, label: edge.label, animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } })), []);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes((current) => definition.nodes.map((node) => {
      const existing = current.find((item) => item.id === node.id);
      return { id: node.id, type: 'workflow', position: existing?.position || node.position, selected: existing?.selected, data: { title: node.title, type: node.type, description: node.description } };
    }));
    setEdges(definition.edges.map((edge) => ({ id: edge.id, source: edge.source, target: edge.target, sourceHandle: edge.sourceHandle, label: edge.label, animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } })));
  }, [definition.nodes.map((node) => `${node.id}:${node.title}:${node.type}`).join('|'), definition.edges.map((edge) => `${edge.id}:${edge.source}:${edge.target}`).join('|')]);

  const sync = useCallback((nextNodes: Node<NodeData>[], nextEdges: Edge[]) => {
    const byId = new Map(nextNodes.map((node) => [node.id, node]));
    onChange({
      ...definition,
      nodes: definition.nodes.filter((node) => byId.has(node.id)).map((node) => ({ ...node, position: byId.get(node.id)!.position })),
      edges: nextEdges.map((edge) => ({ id: edge.id, source: edge.source, target: edge.target, sourceHandle: edge.sourceHandle || undefined, label: typeof edge.label === 'string' ? edge.label : undefined })),
    });
  }, [definition, onChange]);

  const onConnect = useCallback((connection: Connection) => {
    const next = addEdge({ ...connection, id: `edge_${crypto.randomUUID()}`, animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } }, edges);
    setEdges(next); sync(nodes, next);
  }, [edges, nodes, setEdges, sync]);

  const autoLayout = () => {
    const trigger = definition.nodes.find((node) => node.type === 'trigger');
    const ordered = trigger ? [trigger, ...definition.nodes.filter((node) => node.id !== trigger.id)] : definition.nodes;
    const next = nodes.map((node) => ({ ...node, position: { x: 80 + ordered.findIndex((item) => item.id === node.id) * 310, y: 180 + (ordered.findIndex((item) => item.id === node.id) % 2) * 80 } }));
    setNodes(next); sync(next, edges);
  };

  return <div className="h-[620px] overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0d0d0d]" aria-label="Advanced workflow canvas">
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={(_event, node) => onSelectNode(node.id)}
      onPaneClick={() => onSelectNode(null)}
      onNodeDragStop={() => sync(nodes, edges)}
      onNodesDelete={(deleted) => {
        const deletedIds = new Set(deleted.map((node) => node.id));
        const nextNodes = nodes.filter((node) => !deletedIds.has(node.id));
        const nextEdges = edges.filter((edge) => !deletedIds.has(edge.source) && !deletedIds.has(edge.target));
        sync(nextNodes, nextEdges);
      }}
      onEdgesDelete={(deleted) => {
        const deletedIds = new Set(deleted.map((edge) => edge.id));
        sync(nodes, edges.filter((edge) => !deletedIds.has(edge.id)));
      }}
      fitView
      snapToGrid
      snapGrid={[20, 20]}
      minZoom={0.25}
      maxZoom={1.8}
      deleteKeyCode={['Backspace', 'Delete']}
      multiSelectionKeyCode={['Control', 'Meta']}
      selectionOnDrag
      panOnScroll
      colorMode="dark"
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1.2} color="rgba(255,255,255,.1)" />
      <Controls className="!overflow-hidden !rounded-xl !border !border-white/10 !bg-[#171717] !shadow-xl [&_button]:!border-white/10 [&_button]:!bg-[#171717] [&_button]:!fill-white/70" />
      <MiniMap pannable zoomable className="!rounded-xl !border !border-white/10 !bg-[#171717]" nodeColor={(node) => node.data.type === 'trigger' ? '#8b5cf6' : '#3f3f46'} maskColor="rgba(0,0,0,.55)" />
      <Panel position="top-left" className="!m-3 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-[#171717]/95 p-2 shadow-xl backdrop-blur">
        <button onClick={onAddNode} className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-white px-3 text-xs font-bold text-black"><Plus className="h-3.5 w-3.5" /> Add step</button>
        <button onClick={autoLayout} className="min-h-9 rounded-xl px-3 text-xs font-semibold text-white/55 hover:bg-white/10 hover:text-white">Auto-layout</button>
        <button onClick={onUndo} disabled={!canUndo} className="min-h-9 rounded-xl px-3 text-xs text-white/45 hover:bg-white/10 disabled:opacity-25">Undo</button>
        <button onClick={onRedo} disabled={!canRedo} className="min-h-9 rounded-xl px-3 text-xs text-white/45 hover:bg-white/10 disabled:opacity-25">Redo</button>
      </Panel>
      <Panel position="bottom-center" className="!m-3 rounded-full border border-white/10 bg-[#171717]/95 px-4 py-2 text-[10px] text-white/35 shadow-xl">Drag to move · Connect the handles · Delete to remove</Panel>
    </ReactFlow>
  </div>;
};
