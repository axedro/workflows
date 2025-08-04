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

import { NodeType, EditorNode, EditorEdge, EdgeType, NodeCategory, getNodePorts } from '@flowcraft/shared-types';
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
import TestNode from './workflow-editor/nodes/TestNode';


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
  onEdgeClick: (event: React.MouseEvent, edge: any) => void;
  onPaneClick: () => void;
  setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
  nodeTypes: NodeTypes;
  edgeTypes: EdgeTypes;
}> = (props) => {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onNodeClick, onEdgeClick, onPaneClick, setNodes, nodeTypes, edgeTypes } = props;
  const reactFlowWrapperRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    const type = event.dataTransfer.getData('application/reactflow') as NodeType;
    if (!type) return;
    
    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
    const nodeDimensions = getNodeDimensions(type);

    // Get node ports and separate input/output
    const allPorts = getNodePorts(type);
    const inputPorts = allPorts.filter(port => port.type === 'input');
    const outputPorts = allPorts.filter(port => port.type === 'output');

    const newNode: Node = {
      id: `node-${Date.now()}`,
      type,
      position: {
        x: position.x - nodeDimensions.width / 2,
        y: position.y - nodeDimensions.height / 2,
      },
      data: { 
        label: getNodeInfo(type).name,
        inputPorts,
        outputPorts,
        validation: { isValid: true, errors: [], warnings: [] }
      },
    };

    setNodes((nds) => [...nds, newNode]);
  }, [screenToFlowPosition, setNodes]);

  return (
    <div className="flex-1 h-full" ref={reactFlowWrapperRef}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
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
  const [selectedEdge, setSelectedEdge] = useState<any>(null);

  const nodeTypes: NodeTypes = useMemo(() => ({
    [NodeType.START]: StartNode,
    [NodeType.END]: EndNode,
    [NodeType.ACTION]: ActionNode,
    [NodeType.CONDITION]: ConditionNode,
    [NodeType.TEST]: TestNode, // <-- nuevo nodo
  }), []);

  const edgeTypes: EdgeTypes = useMemo(() => ({
    [EdgeType.DEFAULT]: DefaultEdge,
  }), []);

  const onConnect = useCallback((params: Connection) => {
    // Validar que la conexión sea direccional (output -> input)
    const sourceNode = nodes.find(node => node.id === params.source);
    const targetNode = nodes.find(node => node.id === params.target);
    
    if (!sourceNode || !targetNode) {
      console.error('Invalid connection: source or target node not found');
      return;
    }

    // Obtener los puertos de origen y destino
    const sourcePort = sourceNode.data?.outputPorts?.find(port => port.id === params.sourceHandle);
    const targetPort = targetNode.data?.inputPorts?.find(port => port.id === params.targetHandle);

    // Validar que sea una conexión válida (output -> input)
    if (!sourcePort || !targetPort) {
      console.error('Invalid connection: source must be output port, target must be input port');
      alert('Invalid connection: Can only connect output ports to input ports');
      return;
    }

    // Validar que no se conecte un nodo consigo mismo
    if (params.source === params.target) {
      console.error('Invalid connection: Cannot connect a node to itself');
      alert('Invalid connection: Cannot connect a node to itself');
      return;
    }

    // Validar que no haya conexión duplicada
    const existingConnection = edges.find(edge => 
      edge.source === params.source && 
      edge.target === params.target &&
      edge.sourceHandle === params.sourceHandle &&
      edge.targetHandle === params.targetHandle
    );

    if (existingConnection) {
      console.error('Invalid connection: Connection already exists');
      alert('Invalid connection: Connection already exists');
      return;
    }

    // Si todas las validaciones pasan, crear la conexión
    console.log('Valid connection created:', params);
    setEdges((eds) => addEdge(params, eds));
  }, [nodes, edges, setEdges]);
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setSelectedEdge(null); // Clear edge selection when node is clicked
  }, []);
  
  const onEdgeClick = useCallback((_: React.MouseEvent, edge: any) => {
    setSelectedEdge(edge);
    setSelectedNode(null); // Clear node selection when edge is clicked
  }, []);
  
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  const onNodeUpdate = (updatedNode: Node) => {
    setNodes((nds) => nds.map((n) => (n.id === updatedNode.id ? updatedNode : n)));
  };

  const onEdgeUpdate = (updatedEdge: any) => {
    setEdges((eds) => eds.map((e) => (e.id === updatedEdge.id ? updatedEdge : e)));
  };

  const nodeCategories: NodeCategory[] = useMemo(() => [
    { id: 'core', name: 'Core', description: 'Basic nodes', icon: '⚡', color: '', nodes: [NodeType.START, NodeType.END, NodeType.ACTION, NodeType.TEST] },
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
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          setNodes={setNodes}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
        />
      </ReactFlowProvider>
      <PropertyPanel 
        selectedNode={selectedNode as EditorNode | null} 
        selectedEdge={selectedEdge as EditorEdge | null}
        onNodeUpdate={onNodeUpdate as any} 
        onEdgeUpdate={onEdgeUpdate as any}
      />
    </div>
  );
};

export default WorkflowEditor;
