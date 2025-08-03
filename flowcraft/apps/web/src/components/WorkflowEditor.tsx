import React, { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  NodeTypes,
  EdgeTypes,
  OnConnect,
  NodeDragHandler,
  NodeChange,
  OnConnectStart,
  OnConnectEnd,
  ConnectionMode,
  useReactFlow,
} from '@reactflow/core';
import { Background, BackgroundVariant } from '@reactflow/background';
import { MiniMap } from '@reactflow/minimap';
import '@reactflow/core/dist/style.css';

import {
  NodeType,
  EdgeType,
  EditorNode,
  EditorEdge,
  WorkflowEditorConfig,
  NodeCategory,
} from '@flowcraft/shared-types';

// Import node types (to be created)
import StartNode from './workflow-editor/nodes/StartNode';
import EndNode from './workflow-editor/nodes/EndNode';
import ActionNode from './workflow-editor/nodes/ActionNode';

// Import edge types (to be created)
import DefaultEdge from './workflow-editor/edges/DefaultEdge';

// Import panels (to be created)
import NodePalette from './workflow-editor/panels/NodePalette';
import PropertyPanel from './workflow-editor/panels/PropertyPanel';
import EnhancedControls from './workflow-editor/panels/EnhancedControls';

interface WorkflowEditorProps {
  workflowId?: string;
  initialNodes?: EditorNode[];
  initialEdges?: EditorEdge[];
  onSave?: (nodes: EditorNode[], edges: EditorEdge[]) => void;
  readOnly?: boolean;
}

const defaultConfig: WorkflowEditorConfig = {
  snapToGrid: true,
  gridSize: 20,
  minZoom: 0.1,
  maxZoom: 2,
  autoSaveInterval: 30000, // 30 seconds
  maxHistorySteps: 50,
  enableMinimap: true,
  enableControls: true,
};

// Inner component that has access to React Flow context
const WorkflowEditorInner: React.FC<{
  nodes: Node[];
  edges: any[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: any[]) => void;
  onConnect: OnConnect;
  onConnectStart: OnConnectStart;
  onConnectEnd: OnConnectEnd;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  onPaneClick: () => void;
  onNodeDragStart: NodeDragHandler;
  onNodeDrag: NodeDragHandler;
  onNodeDragStop: NodeDragHandler;
  onDragOver: (event: React.DragEvent) => void;
  nodeTypes: NodeTypes;
  edgeTypes: EdgeTypes;
  config: WorkflowEditorConfig;
  isDragging: boolean;
  isConnecting: boolean;
  dropZones: Array<{ x: number; y: number; isValid: boolean }>;
  feedbackMessage: { type: 'success' | 'error' | 'info'; message: string } | null;
  getNodeDimensions: (nodeType: NodeType) => { width: number; height: number };
  getNodeInfo: (nodeType: NodeType) => any;
  setNodes: any;
  showFeedback: any;
  readOnly: boolean;
}> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onConnectStart,
  onConnectEnd,
  onNodeClick,
  onPaneClick,
  onNodeDragStart,
  onNodeDrag,
  onNodeDragStop,
  onDragOver,
  nodeTypes,
  edgeTypes,
  config,
  isDragging,
  isConnecting,
  dropZones,
  feedbackMessage,
  getNodeDimensions,
  getNodeInfo,
  setNodes,
  showFeedback,
  readOnly,
}) => {
  const { project } = useReactFlow();

  // Enhanced drop handler with proper projection
  const handleDrop = useCallback((event: React.DragEvent) => {
    if (readOnly) return;

    event.preventDefault();

    const reactFlowBounds = event.currentTarget.getBoundingClientRect();
    const data = event.dataTransfer.getData('application/reactflow');

    if (!data) return;

    try {
      const { type } = JSON.parse(data);
      const nodeType = type as NodeType;

      // Calculate position relative to the canvas
      const positionX = event.clientX - reactFlowBounds.left;
      const positionY = event.clientY - reactFlowBounds.top;

      // First, project the cursor position to flow coordinates
      const projectedPosition = project({ x: positionX, y: positionY });

      // Get node dimensions for accurate centering
      const nodeDimensions = getNodeDimensions(nodeType);
      
      // Calculate offset to center the node on the cursor
      // The offset needs to be in flow coordinates, not viewport coordinates
      const offsetX = nodeDimensions.width / 2;
      const offsetY = nodeDimensions.height / 2;

      // Apply offset to the projected position
      const finalPosition = {
        x: projectedPosition.x - offsetX,
        y: projectedPosition.y - offsetY,
      };

      // Create new node
      const newNode: EditorNode = {
        id: `node-${Date.now()}`,
        type: nodeType,
        position: finalPosition,
        data: {
          label: getNodeInfo(nodeType).name,
          description: getNodeInfo(nodeType).description,
          validation: {
            isValid: true,
            errors: [],
            warnings: [],
          },
          config: {},
        },
      };

      setNodes((nds: any) => [...nds, newNode]);
      showFeedback('success', `${getNodeInfo(nodeType).name} node added successfully`);
    } catch (error) {
      console.error('Error parsing dropped node data:', error);
      showFeedback('error', 'Failed to add node');
    }
  }, [project, getNodeDimensions, getNodeInfo, setNodes, showFeedback, readOnly]);
  return (
    <div className="flex-1 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onDrop={handleDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        attributionPosition="bottom-left"
      >
        {/* Background Grid */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={config.gridSize}
          size={1}
          color="#e5e7eb"
        />

        {/* Enhanced Controls */}
        {config.enableControls && (
          <EnhancedControls
            showZoom={true}
            showFitView={true}
            showInteractive={true}
            position="top-right"
          />
        )}

        {/* Minimap */}
        {config.enableMinimap && (
          <MiniMap
            nodeColor="#3b82f6"
            nodeStrokeWidth={3}
            zoomable
            pannable
            position="bottom-right"
          />
        )}
      </ReactFlow>

      {/* Drag Status Indicator */}
      {isDragging && (
        <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-md text-sm">
          🖱️ Dragging node...
        </div>
      )}

      {/* Connection Status Indicator */}
      {isConnecting && (
        <div className="absolute top-4 left-4 bg-purple-500 text-white px-3 py-1 rounded-md text-sm">
          🔗 Connecting nodes...
        </div>
      )}

      {/* Drop Zones Visual Feedback */}
      {dropZones.map((zone, index) => (
        <div
          key={index}
          className={`absolute w-4 h-4 rounded-full border-2 pointer-events-none ${
            zone.isValid
              ? 'border-green-500 bg-green-200'
              : 'border-red-500 bg-red-200'
          }`}
          style={{
            left: zone.x - 8,
            top: zone.y - 8,
            zIndex: 1000,
          }}
        />
      ))}

      {/* Feedback Messages */}
      {feedbackMessage && (
        <div
          className={`absolute top-4 right-4 px-4 py-2 rounded-md text-sm text-white shadow-lg transition-all duration-300 ${
            feedbackMessage.type === 'success'
              ? 'bg-green-500'
              : feedbackMessage.type === 'error'
                ? 'bg-red-500'
                : 'bg-blue-500'
          }`}
        >
          {feedbackMessage.type === 'success' && '✅ '}
          {feedbackMessage.type === 'error' && '❌ '}
          {feedbackMessage.type === 'info' && 'ℹ️ '}
          {feedbackMessage.message}
        </div>
      )}
    </div>
  );
};

const WorkflowEditor: React.FC<WorkflowEditorProps> = ({
  initialNodes = [],
  initialEdges = [],
  readOnly = false,
}) => {
  // State management
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [config] = useState<WorkflowEditorConfig>(defaultConfig);
  const [isDragging, setIsDragging] = useState(false);

  // Feedback visual states
  const [isConnecting, setIsConnecting] = useState(false);
  const [dropZones, setDropZones] = useState<
    Array<{ x: number; y: number; isValid: boolean }>
  >([]);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Node types configuration
  const nodeTypes: NodeTypes = useMemo(
    () => ({
      [NodeType.START]: StartNode,
      [NodeType.END]: EndNode,
      [NodeType.ACTION]: ActionNode,
    }),
    []
  );

  // Edge types configuration
  const edgeTypes: EdgeTypes = useMemo(
    () => ({
      [EdgeType.DEFAULT]: DefaultEdge,
    }),
    []
  );

  // Snap to grid function
  const snapToGrid = useCallback(
    (position: { x: number; y: number }) => {
      if (!config.snapToGrid) return position;

      const snappedX =
        Math.round(position.x / config.gridSize) * config.gridSize;
      const snappedY =
        Math.round(position.y / config.gridSize) * config.gridSize;

      return { x: snappedX, y: snappedY };
    },
    [config.snapToGrid, config.gridSize]
  );

  // Validate node position
  const validateNodePosition = useCallback(
    (newPosition: { x: number; y: number }) => {
      // Prevent nodes from going outside the canvas bounds
      const minX = 0;
      const minY = 0;
      const maxX = 2000; // Canvas width
      const maxY = 2000; // Canvas height

      const clampedX = Math.max(minX, Math.min(maxX, newPosition.x));
      const clampedY = Math.max(minY, Math.min(maxY, newPosition.y));

      return { x: clampedX, y: clampedY };
    },
    []
  );

  // Show feedback message
  const showFeedback = useCallback(
    (type: 'success' | 'error' | 'info', message: string) => {
      setFeedbackMessage({ type, message });
      setTimeout(() => setFeedbackMessage(null), 3000);
    },
    []
  );

  // Validate drop zone
  const validateDropZone = useCallback((position: { x: number; y: number }) => {
    // Check if position is within canvas bounds
    const minX = 0;
    const minY = 0;
    const maxX = 2000;
    const maxY = 2000;

    const isValid =
      position.x >= minX &&
      position.x <= maxX &&
      position.y >= minY &&
      position.y <= maxY;

    return isValid;
  }, []);

  // Custom node change handler
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const updatedChanges = changes.map(change => {
        if (
          change.type === 'position' &&
          change.position &&
          change.dragging !== undefined
        ) {
          const node = nodes.find(n => n.id === change.id) as
            | EditorNode
            | undefined;
          if (node) {
            // Validate and snap position
            const validatedPosition = validateNodePosition(change.position);
            const snappedPosition = snapToGrid(validatedPosition);

            // Update drop zones for visual feedback
            const isValidDrop = validateDropZone(snappedPosition);
            setDropZones([
              {
                x: snappedPosition.x,
                y: snappedPosition.y,
                isValid: isValidDrop,
              },
            ]);

            return {
              ...change,
              position: snappedPosition,
            };
          }
        }
        return change;
      });

      onNodesChange(updatedChanges);
    },
    [nodes, onNodesChange, validateNodePosition, snapToGrid, validateDropZone]
  );

  // Node drag handlers
  const onNodeDragStart: NodeDragHandler = useCallback(
    (_event, node) => {
      if (readOnly) return;

      setIsDragging(true);
      console.log('Node drag started:', node.id);
    },
    [readOnly]
  );

  const onNodeDrag: NodeDragHandler = useCallback(
    (_event, node) => {
      if (readOnly) return;

      // Update dragging state for visual feedback
      setNodes(nds =>
        nds.map(n => ({
          ...n,
          dragging: n.id === node.id ? true : n.dragging,
        }))
      );
    },
    [readOnly, setNodes]
  );

  const onNodeDragStop: NodeDragHandler = useCallback(
    (_event, node) => {
      if (readOnly) return;

      setIsDragging(false);
      setDropZones([]);

      // Clear dragging state
      setNodes(nds =>
        nds.map(n => ({
          ...n,
          dragging: false,
        }))
      );

      // Show success feedback
      showFeedback(
        'success',
        `Node "${node.data.label || node.id}" moved successfully`
      );
      console.log('Node drag stopped:', node.id, 'at position:', node.position);
    },
    [readOnly, setNodes, showFeedback]
  );

  // Connection handlers
  const onConnectStart: OnConnectStart = useCallback(
    () => {
      if (readOnly) return;

      setIsConnecting(true);
      showFeedback('info', 'Connecting nodes...');
    },
    [readOnly, showFeedback]
  );

  const onConnectEnd: OnConnectEnd = useCallback(
    () => {
      if (readOnly) return;

      setIsConnecting(false);
    },
    [readOnly]
  );

  // Event handlers
  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (readOnly) return;

      // Validate connection
      if (!connection.source || !connection.target) {
        showFeedback('error', 'Invalid connection');
        return;
      }

      // Check for self-connection
      if (connection.source === connection.target) {
        showFeedback('error', 'Cannot connect node to itself');
        return;
      }

      // Check for duplicate connections
      const existingConnection = edges.find(
        edge =>
          edge.source === connection.source && edge.target === connection.target
      );

      if (existingConnection) {
        showFeedback('error', 'Connection already exists');
        return;
      }

      const newEdge: EditorEdge = {
        id: `edge-${Date.now()}`,
        source: connection.source!,
        target: connection.target!,
        type: EdgeType.DEFAULT,
        data: {
          label: '',
          validation: {
            isValid: true,
            errors: [],
            warnings: [],
          },
        },
      };

      setEdges(eds => addEdge(newEdge, eds));
      showFeedback('success', 'Connection created successfully');
    },
    [setEdges, readOnly, edges, showFeedback]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Helper function to get node info
  const getNodeInfo = (nodeType: NodeType) => {
    const nodeInfo = {
      [NodeType.START]: { name: 'Start', icon: '▶', description: 'Workflow trigger point' },
      [NodeType.END]: { name: 'End', icon: '●', description: 'Workflow completion point' },
      [NodeType.ACTION]: { name: 'Action', icon: '⚡', description: 'Execute an action' },
      [NodeType.CONDITION]: { name: 'Condition', icon: '🧠', description: 'Conditional logic' },
      [NodeType.LOOP]: { name: 'Loop', icon: '🔄', description: 'Repeat actions' },
      [NodeType.HTTP_REQUEST]: { name: 'HTTP Request', icon: '🌐', description: 'Make HTTP requests' },
      [NodeType.EMAIL]: { name: 'Email', icon: '📧', description: 'Send emails' },
      [NodeType.SLACK]: { name: 'Slack', icon: '💬', description: 'Send Slack messages' },
      [NodeType.DATA_TRANSFORM]: { name: 'Data Transform', icon: '⚙️', description: 'Transform data' },
      [NodeType.TIMER]: { name: 'Timer', icon: '⏰', description: 'Delay or schedule' },
      [NodeType.WEBHOOK]: { name: 'Webhook', icon: '🔗', description: 'Receive webhooks' },
    };
    return nodeInfo[nodeType] || { name: nodeType, icon: '❓', description: 'Unknown node type' };
  };

  // Helper function to get node dimensions for accurate positioning
  const getNodeDimensions = (nodeType: NodeType) => {
    const dimensions = {
      [NodeType.START]: { width: 120, height: 100 },
      [NodeType.END]: { width: 120, height: 100 },
      [NodeType.ACTION]: { width: 140, height: 120 },
      [NodeType.CONDITION]: { width: 140, height: 120 },
      [NodeType.LOOP]: { width: 140, height: 120 },
      [NodeType.HTTP_REQUEST]: { width: 160, height: 140 },
      [NodeType.EMAIL]: { width: 140, height: 120 },
      [NodeType.SLACK]: { width: 140, height: 120 },
      [NodeType.DATA_TRANSFORM]: { width: 160, height: 140 },
      [NodeType.TIMER]: { width: 140, height: 120 },
      [NodeType.WEBHOOK]: { width: 160, height: 140 },
    };
    return dimensions[nodeType] || { width: 120, height: 100 };
  };

  // Node categories for palette
  const nodeCategories: NodeCategory[] = useMemo(
    () => [
      {
        id: 'core',
        name: 'Core',
        description: 'Basic workflow nodes',
        icon: '⚡',
        color: '#3b82f6',
        nodes: [NodeType.START, NodeType.END, NodeType.ACTION],
      },
      {
        id: 'connectors',
        name: 'Connectors',
        description: 'External service connections',
        icon: '🔗',
        color: '#10b981',
        nodes: [NodeType.HTTP_REQUEST, NodeType.EMAIL, NodeType.SLACK],
      },
      {
        id: 'logic',
        name: 'Logic',
        description: 'Control flow nodes',
        icon: '🧠',
        color: '#f59e0b',
        nodes: [NodeType.CONDITION, NodeType.LOOP],
      },
      {
        id: 'data',
        name: 'Data',
        description: 'Data processing nodes',
        icon: '📊',
        color: '#8b5cf6',
        nodes: [NodeType.DATA_TRANSFORM, NodeType.TIMER, NodeType.WEBHOOK],
      },
    ],
    []
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Node Palette Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <NodePalette
          categories={nodeCategories}
          onNodeDrag={(nodeType: NodeType) => {
            // Handle node drag from palette
            console.log('Dragging node:', nodeType);
          }}
        />
      </div>

      {/* Main Canvas */}
      <ReactFlowProvider>
        <WorkflowEditorInner
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onNodeDragStart={onNodeDragStart}
          onNodeDrag={onNodeDrag}
          onNodeDragStop={onNodeDragStop}
          onDragOver={(event: React.DragEvent) => {
            if (readOnly) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
          }}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          config={config}
          isDragging={isDragging}
          isConnecting={isConnecting}
          dropZones={dropZones}
          feedbackMessage={feedbackMessage}
          getNodeDimensions={getNodeDimensions}
          getNodeInfo={getNodeInfo}
          setNodes={setNodes}
          showFeedback={showFeedback}
          readOnly={readOnly}
        />
      </ReactFlowProvider>

      {/* Property Panel */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        <PropertyPanel
          selectedNode={
            selectedNode
              ? (nodes.find(n => n.id === selectedNode) as EditorNode)
              : null
          }
          onNodeUpdate={(updatedNode: EditorNode) => {
            setNodes(nds =>
              nds.map(node => (node.id === updatedNode.id ? updatedNode : node))
            );
          }}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
};

export default WorkflowEditor;
