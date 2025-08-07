import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { useWorkflowStore } from '../stores/workflowStore';
import { Header } from './Header';
import { useTranslation } from '../hooks/i18n';
import { WorkflowExportModal } from './WorkflowExportModal';


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
  onSave: () => void;
  onExport: () => void;
  isSaving: boolean;
  lastSaved: Date | null;
}> = (props) => {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onNodeClick, onEdgeClick, onPaneClick, setNodes, nodeTypes, edgeTypes, onSave, onExport, isSaving, lastSaved } = props;
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
        <EnhancedControls
          onSave={onSave}
          onExport={onExport}
          isSaving={isSaving}
          lastSaved={lastSaved}
        />
      </ReactFlow>
    </div>
  );
};

const WorkflowEditor: React.FC<WorkflowEditorProps> = ({ initialNodes = [], initialEdges = [] }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('workflows');
  const { t: tCommon } = useTranslation('common');
  const { currentWorkflow, fetchWorkflow, updateWorkflow, createWorkflow } = useWorkflowStore();
  
  // Estados para campos editables
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<any>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const isUpdatingWorkflow = useRef(false);

  // Función para volver al dashboard
  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  // Función para guardar cambios en nombre y descripción
  const handleSaveWorkflowInfo = async () => {
    if (!id || id === 'new') return;

    try {
      await updateWorkflow(id, {
        name: workflowName,
        description: workflowDescription
      });
      setIsEditingName(false);
      setIsEditingDescription(false);
    } catch (error) {
      console.error('Failed to save workflow info:', error);
    }
  };

  // Función para cancelar edición
  const handleCancelEdit = () => {
    setWorkflowName(currentWorkflow?.name || '');
    setWorkflowDescription(currentWorkflow?.description || '');
    setIsEditingName(false);
    setIsEditingDescription(false);
  };

  const nodeTypes: NodeTypes = useMemo(() => ({
    [NodeType.START]: StartNode,
    [NodeType.END]: EndNode,
    [NodeType.ACTION]: ActionNode,
    [NodeType.CONDITION]: ConditionNode,
    [NodeType.LOOP]: ActionNode,
    [NodeType.HTTP_REQUEST]: ActionNode,
    [NodeType.EMAIL]: ActionNode,
    [NodeType.SLACK]: ActionNode,
    [NodeType.DATA_TRANSFORM]: ActionNode,
    [NodeType.TIMER]: ActionNode,
    [NodeType.WEBHOOK]: ActionNode,
    [NodeType.TEST]: TestNode,
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

  // Load workflow data
  useEffect(() => {
    if (id && id !== 'new') {
      fetchWorkflow(id);
    }
  }, [id, fetchWorkflow]);

  // Update local state when workflow is loaded
  useEffect(() => {
    if (currentWorkflow && currentWorkflow.definition && !isUpdatingWorkflow.current) {
      const serverNodes = (currentWorkflow.definition.nodes || []) as Node<any, string | undefined>[];
      const serverEdges = currentWorkflow.definition.edges || [];
      
      if (serverNodes.length > 0) {
        setNodes(serverNodes);
        setEdges(serverEdges);
      }
    } else if (isUpdatingWorkflow.current) {
      isUpdatingWorkflow.current = false;
    }
  }, [currentWorkflow, setNodes, setEdges]);

  // Update editable fields when workflow data changes
  useEffect(() => {
    if (currentWorkflow) {
      setWorkflowName(currentWorkflow.name || '');
      setWorkflowDescription(currentWorkflow.description || '');
    }
  }, [currentWorkflow]);

  // Auto-save functionality
  const saveWorkflow = useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const definition = {
        nodes,
        edges,
        metadata: currentWorkflow?.definition?.metadata || {
          author: 'System',
          tags: [],
          difficulty: 'beginner'
        }
      };
      

      // For new workflows, create them first
      if (id === 'new') {
        const newWorkflow = await createWorkflow({
          name: workflowName || t('untitled_workflow') || 'Untitled Workflow',
          description: workflowDescription || '',
          definition
        });
        
        // Update the URL to reflect the new workflow ID
        navigate(`/editor/${newWorkflow.id}`, { replace: true });
        setLastSaved(new Date());
      } else if (id) {
        // Update existing workflow
        isUpdatingWorkflow.current = true; // Prevent overwriting nodes after save
        await updateWorkflow(id, { definition });
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error('Failed to save workflow:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save workflow');
    } finally {
      setIsSaving(false);
    }
  }, [id, nodes, edges, currentWorkflow, updateWorkflow, createWorkflow, navigate, workflowName, workflowDescription, t]);

  // Auto-save on changes
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Auto-save when there are nodes (both new and existing workflows)
    if (nodes.length > 0) {
      autoSaveTimeoutRef.current = setTimeout(saveWorkflow, 2000); // Save after 2 seconds of inactivity
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [nodes, edges, saveWorkflow]);

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      {/* Workflow Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <button
              onClick={handleBackToDashboard}
              className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('back_to_dashboard') || 'Volver al Dashboard'}
            </button>

            {/* Workflow Info */}
            <div className="flex-1 mx-8">
              <div className="flex items-center space-x-4">
                {/* Workflow Name */}
                <div className="flex-1">
                  {isEditingName ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={workflowName}
                        onChange={(e) => setWorkflowName(e.target.value)}
                        className="text-2xl font-bold text-gray-900 dark:text-white bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveWorkflowInfo}
                        className="text-green-600 hover:text-green-700"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="text-red-600 hover:text-red-700"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {workflowName || t('untitled_workflow') || 'Workflow sin título'}
                      </h1>
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Workflow Description */}
              <div className="mt-2">
                {isEditingDescription ? (
                  <div className="flex items-start space-x-2">
                    <textarea
                      value={workflowDescription}
                      onChange={(e) => setWorkflowDescription(e.target.value)}
                      className="flex-1 text-gray-600 dark:text-gray-400 bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none resize-none"
                      rows={2}
                      placeholder={t('workflow_description_placeholder') || 'Describe el propósito de este workflow...'}
                      autoFocus
                    />
                    <div className="flex space-x-1">
                      <button
                        onClick={handleSaveWorkflowInfo}
                        className="text-green-600 hover:text-green-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="text-red-600 hover:text-red-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start space-x-2">
                    <p className="text-gray-600 dark:text-gray-400">
                      {workflowDescription || t('no_description') || 'Sin descripción'}
                    </p>
                    <button
                      onClick={() => setIsEditingDescription(true)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Save Status */}
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {isSaving ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {tCommon('saving') || 'Guardando...'}
                </span>
              ) : saveError ? (
                <span className="flex items-center text-red-500">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Error al guardar
                </span>
              ) : lastSaved ? (
                <span className="flex items-center text-green-600">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {t('last_saved') || 'Guardado'}: {lastSaved.toLocaleTimeString()}
                </span>
              ) : (
                <span>{t('not_saved') || 'No guardado'}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex h-[calc(100vh-120px)] bg-gray-100">
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
            onSave={saveWorkflow}
            onExport={() => setShowExportModal(true)}
            isSaving={isSaving}
            lastSaved={lastSaved}
          />
        </ReactFlowProvider>
        <PropertyPanel 
          selectedNode={selectedNode as EditorNode | null} 
          selectedEdge={selectedEdge as EditorEdge | null}
          nodes={nodes as EditorNode[]}
          edges={edges as EditorEdge[]}
          onNodeUpdate={onNodeUpdate as any} 
          onEdgeUpdate={onEdgeUpdate as any}
        />
      </div>

      {/* Export Modal */}
      {id && id !== 'new' && (
        <WorkflowExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          workflowId={id}
        />
      )}
    </div>
  );
};

export default WorkflowEditor;
