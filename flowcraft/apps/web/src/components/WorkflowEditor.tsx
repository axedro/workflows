import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  Node,
  NodeTypes,
  EdgeTypes,
  ConnectionMode,
  useReactFlow,
  NodeChange,
  OnConnect,
  addEdge,
  Connection,
} from '@reactflow/core';
import '@reactflow/core/dist/style.css';

import { NodeType, EditorNode, EditorEdge, EdgeType, NodeCategory } from '@flowcraft/shared-types';
import StartNode from './workflow-editor/nodes/StartNode';
import EndNode from './workflow-editor/nodes/EndNode';
import ActionNode from './workflow-editor/nodes/ActionNode';
import ConditionNode from './workflow-editor/nodes/ConditionNode';
import DefaultEdge from './workflow-editor/edges/DefaultEdge';
import { Background, BackgroundVariant } from '@reactflow/background';
import { MiniMap } from '@reactflow/minimap';
import { getNodeDimensions, getNodeInfo } from './workflow-editor/utils';
import NodePalette, { OnNodeDragStart } from './workflow-editor/panels/NodePalette';
import PropertyPanel from './workflow-editor/panels/PropertyPanel';
import EnhancedControls from './workflow-editor/panels/EnhancedControls';


interface WorkflowEditorProps {
  initialNodes?: EditorNode[];
  initialEdges?: EditorEdge[];
}

const EditorCanvas: React.FC<{
  nodes: Node[];
  edges: any[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: OnConnect;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  onPaneClick: () => void;
  setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
  nodeTypes: NodeTypes;
  edgeTypes: EdgeTypes;
}> = (props) => {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onNodeClick, onPaneClick, setNodes, nodeTypes, edgeTypes } = props;
  const reactFlowWrapperRef = useRef<HTMLDivElement>(null);
  const { project } = useReactFlow();

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    if (!reactFlowWrapperRef.current) return;

    const reactFlowBounds = reactFlowWrapperRef.current.getBoundingClientRect();
    const type = event.dataTransfer.getData('application/reactflow') as NodeType;
    if (!type) return;
    
    const position = project({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    });
    const nodeDimensions = getNodeDimensions(type);

    const newNode: Node = {
      id: `node-${Date.now()}`,
      type,
      position: {
        x: position.x - nodeDimensions.width / 2,
        y: position.y - nodeDimensions.height / 2,
      },
      data: { label: getNodeInfo(type).name },
    };

    setNodes((nds) => [...nds, newNode]);
  }, [project, setNodes]);

  return (
    <div className="flex-1 h-full" ref={reactFlowWrapperRef}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} />
        <MiniMap className="bg-white border border-gray-200 rounded-md shadow-sm" />
        <EnhancedControls />
      </ReactFlow>
    </div>
  );
};

const WorkflowEditor: React.FC<WorkflowEditorProps> = ({ initialNodes = [], initialEdges = [] }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const nodeTypes: NodeTypes = useMemo(() => ({
    [NodeType.START]: StartNode,
    [NodeType.END]: EndNode,
    [NodeType.ACTION]: ActionNode,
    [NodeType.CONDITION]: ConditionNode,
  }), []);

  const edgeTypes: EdgeTypes = useMemo(() => ({
    [EdgeType.DEFAULT]: DefaultEdge,
  }), []);

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => setSelectedNode(node), []);
  const onPaneClick = useCallback(() => setSelectedNode(null), []);

  const onNodeUpdate = (updatedNode: Node) => {
    setNodes((nds) => nds.map((n) => (n.id === updatedNode.id ? updatedNode : n)));
  };

  const nodeCategories: NodeCategory[] = useMemo(() => [
    { id: 'core', name: 'Core', description: 'Basic nodes', icon: '⚡', color: '', nodes: [NodeType.START, NodeType.END, NodeType.ACTION] },
    { id: 'logic', name: 'Logic', description: 'Control flow', icon: '🧠', color: '', nodes: [NodeType.CONDITION, NodeType.LOOP] },
    { id: 'connectors', name: 'Connectors', description: 'Integrations', icon: '🔗', color: '', nodes: [NodeType.HTTP_REQUEST, NodeType.EMAIL, NodeType.SLACK] },
    { id: 'data', name: 'Data', description: 'Data processing', icon: '📊', color: '', nodes: [NodeType.DATA_TRANSFORM, NodeType.TIMER, NodeType.WEBHOOK] },
  ], []);

  const onNodeDragStart: OnNodeDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <NodePalette categories={nodeCategories} onNodeDragStart={onNodeDragStart} />
      <ReactFlowProvider>
        <EditorCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          setNodes={setNodes}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
        />
      </ReactFlowProvider>
      <PropertyPanel selectedNode={selectedNode as EditorNode | null} onNodeUpdate={onNodeUpdate as any} />
    </div>
  );
};

export default WorkflowEditor;
