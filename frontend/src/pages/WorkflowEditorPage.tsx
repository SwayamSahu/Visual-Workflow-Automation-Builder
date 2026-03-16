import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  Node,
  Edge as RFEdge,
} from 'reactflow';

import { NodeData } from '../types';
import { useWorkflowStore } from '../store/workflowStore';
import { useExecutionStore } from '../store/executionStore';
import { useWorkflow } from '../hooks/useWorkflow';
import { useExecution } from '../hooks/useExecution';

import CanvasToolbar from '../components/canvas/CanvasToolbar';
import NodePalette from '../components/canvas/NodePalette';
import WorkflowCanvas from '../components/canvas/WorkflowCanvas';
import ConfigPanel from '../components/panels/ConfigPanel';
import TriggerPanel from '../components/panels/TriggerPanel';
import ResultsPanel from '../components/panels/ResultsPanel';

// ─── Tab bar in right panel ───────────────────────────────────────────────────
type Tab = 'config' | 'run' | 'results';

function RightPanelTabs({
  activeTab,
  onTabChange,
  configDisabled,
  resultsDisabled,
}: {
  activeTab: Tab;
  onTabChange: (t: Tab) => void;
  configDisabled: boolean;
  resultsDisabled: boolean;
}) {
  const tabs: { id: Tab; label: string; disabled: boolean }[] = [
    { id: 'config', label: 'Config', disabled: configDisabled },
    { id: 'run', label: 'Run', disabled: false },
    { id: 'results', label: 'Results', disabled: resultsDisabled },
  ];
  return (
    <div className="flex border-b border-gray-100 flex-shrink-0">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => !t.disabled && onTabChange(t.id)}
          disabled={t.disabled}
          className={`
            flex-1 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors
            ${t.disabled ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer'}
            ${activeTab === t.id && !t.disabled
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-400 hover:text-gray-600'}
          `}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── Editor inner (must be inside ReactFlowProvider) ─────────────────────────

function EditorInner({ workflowId }: { workflowId: string }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [saving, setSaving] = useState(false);

  const { selectedNodeId, setSelectedNodeId, activeTab, setActiveTab, reset } =
    useWorkflowStore();
  const { status: execStatus, visitedNodeIds, executionId } = useExecutionStore();
  const { load, save } = useWorkflow();
  const { buildHighlightedEdges } = useExecution();

  // Load workflow on mount
  useEffect(() => {
    reset();
    load(workflowId, setNodes as never, setEdges);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId]);

  // Highlight edges after execution completes
  useEffect(() => {
    if (execStatus === 'completed' || execStatus === 'failed') {
      setEdges((prev) => buildHighlightedEdges(prev, visitedNodeIds) as RFEdge[]);
    }
  }, [execStatus, visitedNodeIds, buildHighlightedEdges, setEdges]);

  // Reset edge styles when a new execution starts
  useEffect(() => {
    if (execStatus === 'running') {
      setEdges((prev) =>
        prev.map((e) => ({ ...e, animated: false, style: undefined }))
      );
    }
  }, [execStatus, setEdges]);

  const handleSave = async () => {
    setSaving(true);
    await save(workflowId, nodes, edges);
    setSaving(false);
  };

  // Auto-save the current canvas before execution so the backend always has the latest definition
  const handleSaveBeforeRun = useCallback(async () => {
    await save(workflowId, nodes, edges);
  }, [save, workflowId, nodes, edges]);

  const handleNodeConfigChange = useCallback(
    (config: Record<string, unknown>) => {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === selectedNodeId
            ? { ...n, data: { ...n.data, config } }
            : n
        )
      );

      // When a condition node's branch value is set for the first time, any edge
      // drawn before branches were configured will still carry sourceHandle:
      // "__default__". Remap it to the actual branch value so serializeFlow
      // writes the correct `condition` field and the executor can route properly.
      const node = nodes.find((n) => n.id === selectedNodeId);
      if (node?.type === 'condition') {
        type Branch = { operator: string; value: string };
        const branches = (config.branches as Branch[]) ?? [];
        if (branches.length === 1 && branches[0].value) {
          setEdges((prev) =>
            prev.map((e) =>
              e.source === selectedNodeId && e.sourceHandle === '__default__'
                ? { ...e, sourceHandle: branches[0].value }
                : e
            )
          );
        }
      }
    },
    [selectedNodeId, setNodes, setEdges, nodes]
  );

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) as
    | Node<NodeData>
    | undefined;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top bar */}
      <CanvasToolbar
        workflowId={workflowId}
        onSave={handleSave}
        saving={saving}
        onRun={() => setActiveTab('run')}
      />

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Node Palette */}
        <NodePalette />

        {/* Center: Canvas */}
        <WorkflowCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          setNodes={setNodes as never}
          setEdges={setEdges}
          onNodeSelect={(id) => {
            setSelectedNodeId(id);
            if (id) setActiveTab('config');
          }}
        />

        {/* Right: Panel */}
        <aside className="w-80 flex-shrink-0 border-l border-gray-200 bg-white flex flex-col overflow-hidden">
          <RightPanelTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            configDisabled={!selectedNodeId}
            resultsDisabled={!executionId}
          />

          <div className="flex-1 overflow-y-auto">
            {activeTab === 'config' && selectedNode && (
              <ConfigPanel
                node={selectedNode}
                onConfigChange={handleNodeConfigChange}
              />
            )}
            {activeTab === 'config' && !selectedNode && (
              <div className="p-4 text-center text-gray-400 text-sm mt-8">
                <p>Click a node to configure it</p>
              </div>
            )}
            {activeTab === 'run' && <TriggerPanel onBeforeRun={handleSaveBeforeRun} />}
            {activeTab === 'results' && <ResultsPanel />}
          </div>
        </aside>
      </div>
    </div>
  );
}

// ─── Public page (wraps with ReactFlowProvider) ───────────────────────────────

export default function WorkflowEditorPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <p className="p-8 text-red-500">Missing workflow ID</p>;

  return (
    <ReactFlowProvider>
      <EditorInner workflowId={id} />
    </ReactFlowProvider>
  );
}
