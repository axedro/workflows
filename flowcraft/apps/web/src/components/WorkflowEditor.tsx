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
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useNotificationStore } from '../stores/notificationStore';
import { apiService, ValidationResult } from '../services/api';
import UnifiedValidationService, { UnifiedValidationResult } from '../services/unifiedValidation.service';
import { useExecuteWorkflow } from '../hooks/useExecuteWorkflow';


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
  reactFlowRef: React.MutableRefObject<any>;
}> = (props) => {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onNodeClick, onEdgeClick, onPaneClick, setNodes, nodeTypes, edgeTypes, reactFlowRef } = props;
  const reactFlowWrapperRef = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useReactFlow();
  const { screenToFlowPosition } = useReactFlow();
  
  // Asignar la instancia de ReactFlow a la referencia del componente padre
  React.useEffect(() => {
    reactFlowRef.current = reactFlowInstance;
  }, [reactFlowInstance, reactFlowRef]);

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
        fitViewOptions={{ padding: 0.2, minZoom: 0.1, maxZoom: 1.5 }}
      >
        <Background variant={BackgroundVariant.Dots} />
        <MiniMap className="bg-white border border-gray-200 rounded-md shadow-sm" />
        <EnhancedControls />
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
  const { addNotification } = useNotificationStore();
  
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
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [unifiedValidation, setUnifiedValidation] = useState<UnifiedValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showValidationPanel, setShowValidationPanel] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const validationTimeoutRef = useRef<NodeJS.Timeout>();
  const lastValidationHashRef = useRef<string>('');
  const isUpdatingWorkflow = useRef(false);

  // Execution hook
  const executeWorkflowMutation = useExecuteWorkflow();

  // Función para volver al dashboard
  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  // Función para ejecutar el workflow
  const handleExecuteWorkflow = async () => {
    if (!id || id === 'new') {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Cannot execute unsaved workflow'
      });
      return;
    }

    // Check if workflow has validation errors
    if (unifiedValidation && unifiedValidation.errors.length > 0) {
      addNotification({
        type: 'error',
        title: 'Validation Errors',
        message: `Cannot execute workflow with ${unifiedValidation.errors.length} validation errors`
      });
      return;
    }

    try {
      // For now, use a test user ID - in production this would come from auth context
      const userId = 'cmebtcz040002o9ejakyud82g'; // Test user from database
      
      await executeWorkflowMutation.mutateAsync({
        workflowId: id,
        userId,
        input: {}
      });

      addNotification({
        type: 'success',
        title: 'Workflow Execution Started',
        message: 'Your workflow is now being executed'
      });
    } catch (error) {
      console.error('Failed to execute workflow:', error);
      addNotification({
        type: 'error',
        title: 'Execution Failed',
        message: error instanceof Error ? error.message : 'Failed to execute workflow'
      });
    }
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

  // Función para validar el workflow usando el sistema unificado
  const validateWorkflowUnified = useCallback(() => {
    if (nodes.length === 0) {
      setUnifiedValidation(null);
      return;
    }

    try {
      setIsValidating(true);
      
      // Crear hash del estado actual para evitar validaciones duplicadas
      const currentHash = JSON.stringify({ 
        nodesCount: nodes.length, 
        edgesCount: edges.length, 
        nodeIds: nodes.map(n => n.id).sort(),
        nodeData: nodes.map(n => ({ id: n.id, data: n.data }))
      });
      
      if (currentHash === lastValidationHashRef.current) {
        setIsValidating(false);
        return; // Skip validation if nothing changed
      }
      
      const result = UnifiedValidationService.validateWorkflow(nodes as EditorNode[], edges as EditorEdge[]);
      lastValidationHashRef.current = currentHash;
      setUnifiedValidation(result);

      // Update nodes with validation results
      setNodes((nds) => 
        nds.map((node) => {
          const nodeValidation = result.nodeValidations.get(node.id);
          if (nodeValidation) {
            return UnifiedValidationService.updateNodeValidation(node as EditorNode, nodeValidation) as Node;
          }
          return node;
        })
      );

    } catch (error) {
      console.error('Unified validation error:', error);
      setUnifiedValidation(null);
    } finally {
      setIsValidating(false);
    }
  }, [nodes, edges, setNodes]);

  // Función para validar el workflow usando el servicio API (legacy)
  const validateWorkflow = useCallback(async () => {
    if (!id || id === 'new' || nodes.length === 0) {
      setValidationResult(null);
      return;
    }

    try {
      setIsValidating(true);
      const definition = { nodes, edges };
      
      // Crear hash del estado actual para evitar validaciones duplicadas
      const currentHash = JSON.stringify({ nodesCount: nodes.length, edgesCount: edges.length, nodeIds: nodes.map(n => n.id).sort() });
      
      if (currentHash === lastValidationHashRef.current) {
        setIsValidating(false);
        return; // Skip validation if nothing changed
      }
      
      const result = await apiService.validateWorkflow(id, definition);
      lastValidationHashRef.current = currentHash;
      setValidationResult(result);
    } catch (error) {
      console.error('Validation error:', error);
      setValidationResult(null);
    } finally {
      setIsValidating(false);
    }
  }, [id, nodes, edges]);

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
        
        // Show success notification for new workflow creation
        addNotification({
          type: 'success',
          title: 'Workflow Saved',
          message: `New workflow "${workflowName}" has been created and saved.`,
        });
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
  }, [id, nodes, edges, currentWorkflow, updateWorkflow, createWorkflow, navigate, workflowName, workflowDescription, t, addNotification]);

  // Enable editor keyboard shortcuts
  const { showShortcutsHelp } = useKeyboardShortcuts({ 
    enableEditorShortcuts: true,
    onSave: saveWorkflow,
    onExport: () => setShowExportModal(true),
  });

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

  // Auto-validate on changes using unified validation
  useEffect(() => {
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    // Always validate when there are nodes (unified validation works locally)
    if (nodes.length > 0) {
      validationTimeoutRef.current = setTimeout(validateWorkflowUnified, 1000); // Faster since it's local
    }

    // Also keep legacy validation for workflows that are saved
    if (nodes.length > 0 && id && id !== 'new') {
      setTimeout(validateWorkflow, 2000);
    }

    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, [nodes.length, edges.length, id, validateWorkflowUnified, validateWorkflow]);

  // Trigger validation when node data changes (for field validation)
  useEffect(() => {
    // Small delay to ensure validation happens after node data changes
    const timeout = setTimeout(() => {
      if (nodes.length > 0) {
        validateWorkflowUnified();
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [nodes.map(n => JSON.stringify(n.data)).join('|')]);  // Monitor node data changes

  // Referencia para la instancia de ReactFlow que se obtendrá desde el componente interno
  const reactFlowRef = useRef<any>(null);

  // Función para navegar a un error específico
  const navigateToIssue = useCallback((issue: any) => {
    // Cerrar el dropdown primero
    setShowValidationPanel(false);
    
    if (issue.nodeId) {
      // Encontrar el nodo
      const node = nodes.find(n => n.id === issue.nodeId);
      if (node) {
        // Seleccionar el nodo
        onNodesChange([
          ...nodes.map(n => ({ ...n, selected: n.id === issue.nodeId }))
        ]);
        
        // Centrar la vista en el nodo si tenemos la instancia
        if (reactFlowRef.current && node.position) {
          try {
            const viewport = reactFlowRef.current.getViewport();
            reactFlowRef.current.setCenter(
              node.position.x + (node.width || 200) / 2,
              node.position.y + (node.height || 100) / 2,
              { zoom: Math.max(viewport.zoom, 1.0) }
            );
          } catch (error) {
            console.log('Could not center view on node:', error);
          }
        }
        
        // Abrir PropertyPanel si no está abierto
        setSelectedNode(node);
        
        // Si hay un campo específico, podemos agregarlo al estado para resaltarlo
        if (issue.field) {
          // Agregar un pequeño delay para que el PropertyPanel se renderice primero
          setTimeout(() => {
            // Buscar el campo en el PropertyPanel y hacer scroll hacia él
            const fieldElement = document.querySelector(`[data-field="${issue.field}"]`);
            if (fieldElement) {
              fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              // Agregar clase de resaltado temporalmente
              fieldElement.classList.add('ring-2', 'ring-red-500', 'ring-opacity-75');
              setTimeout(() => {
                fieldElement.classList.remove('ring-2', 'ring-red-500', 'ring-opacity-75');
              }, 3000);
            }
          }, 100);
        }
      }
    } else if (issue.edgeId) {
      // Para errores de edges, podemos resaltar la conexión
      const edge = edges.find(e => e.id === issue.edgeId);
      if (edge) {
        // Seleccionar el edge
        onEdgesChange([
          ...edges.map(e => ({ ...e, selected: e.id === issue.edgeId }))
        ]);
        
        // Abrir PropertyPanel para el edge
        setSelectedEdge(edge);
        
        // Encontrar los nodos conectados para centrar la vista
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        
        if (sourceNode && targetNode && reactFlowRef.current) {
          try {
            // Centrar entre los dos nodos
            const centerX = (sourceNode.position.x + targetNode.position.x) / 2;
            const centerY = (sourceNode.position.y + targetNode.position.y) / 2;
            const viewport = reactFlowRef.current.getViewport();
            
            reactFlowRef.current.setCenter(
              centerX,
              centerY,
              { zoom: Math.max(viewport.zoom, 1.0) }
            );
          } catch (error) {
            console.log('Could not center view on edge:', error);
          }
        }
      }
    }
  }, [nodes, edges, onNodesChange, onEdgesChange, setSelectedNode, setSelectedEdge]);

  // Función para actualizar estilos de nodos basados en validaciones
  const updateNodeStyles = useCallback(() => {
    if (!validationResult) return;
    
    setNodes((nds) => 
      nds.map((node) => {
        const hasErrors = validationResult.errors.some(error => error.nodeId === node.id);
        const hasWarnings = validationResult.warnings.some(warning => warning.nodeId === node.id);
        
        // Obtener estilos actuales del nodo
        const currentStyle = node.style || {};
        const newStyle = { ...currentStyle };
        
        // Limpiar estilos de validación previos
        delete newStyle.border;
        delete newStyle.boxShadow;
        
        // Aplicar nuevos estilos de validación si existen
        if (hasErrors) {
          newStyle.border = '4px solid #ef4444';
          newStyle.boxShadow = '0 0 15px rgba(239, 68, 68, 0.4)';
        } else if (hasWarnings) {
          newStyle.border = '4px solid #f59e0b';
          newStyle.boxShadow = '0 0 15px rgba(245, 158, 11, 0.4)';
        }
        
        // Verificar si hay cambios reales antes de actualizar
        const styleChanged = JSON.stringify(currentStyle) !== JSON.stringify(newStyle);
        
        const newValidationErrors = validationResult.errors.filter(error => error.nodeId === node.id);
        const newValidationWarnings = validationResult.warnings.filter(warning => warning.nodeId === node.id);
          
        const currentErrors = (node.data as any)?.validationErrors || [];
        const currentWarnings = (node.data as any)?.validationWarnings || [];
        
        const errorsChanged = JSON.stringify(currentErrors) !== JSON.stringify(newValidationErrors);
        const warningsChanged = JSON.stringify(currentWarnings) !== JSON.stringify(newValidationWarnings);
        
        // Solo retornar nodo modificado si hay cambios reales
        if (!styleChanged && !errorsChanged && !warningsChanged) {
          return node;
        }
        
        return {
          ...node,
          style: newStyle,
          data: {
            ...node.data,
            validationErrors: newValidationErrors,
            validationWarnings: newValidationWarnings,
          }
        };
      })
    );
  }, [validationResult, setNodes]);

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

  // Actualizar estilos de nodos cuando cambie el resultado de validación
  // Usar debounce para evitar actualizaciones excesivas
  useEffect(() => {
    if (validationResult) {
      const timeout = setTimeout(() => {
        updateNodeStyles();
      }, 100); // Pequeño delay para agrupar cambios
      
      return () => clearTimeout(timeout);
    }
  }, [validationResult]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      {/* Workflow Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b sticky top-16 z-40">
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
                        className="text-xl font-bold text-gray-900 dark:text-white bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none"
                        autoFocus
                      />
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
                  ) : (
                    <div className="flex items-center space-x-2">
                      <h1 className="text-xl font-bold text-gray-900 dark:text-white">
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
              <div className="mt-1">
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

      {/* Editor Toolbar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 sticky top-32 z-30">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            {/* Save Status */}
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {isSaving ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('saving') || 'Guardando...'}
                </span>
              ) : lastSaved ? (
                <span>{t('last_saved') || 'Último guardado'}: {lastSaved.toLocaleTimeString()}</span>
              ) : (
                <span>{t('not_saved') || 'No guardado'}</span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Save Button */}
            <button
              onClick={saveWorkflow}
              disabled={isSaving}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Save workflow (Ctrl/Cmd+S) - Auto-saves every 2 seconds"
            >
              {isSaving ? (
                <svg className="animate-spin -ml-1 mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="-ml-1 mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
              )}
              Save
            </button>

            {/* Execute Button */}
            {id && id !== 'new' && (
              <button
                onClick={handleExecuteWorkflow}
                disabled={executeWorkflowMutation.isPending || (unifiedValidation && unifiedValidation.errors.length > 0)}
                className="inline-flex items-center px-3 py-1.5 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Execute workflow (Ctrl/Cmd+E) - Run the workflow now"
              >
                {executeWorkflowMutation.isPending ? (
                  <svg className="animate-spin -ml-1 mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="-ml-1 mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {executeWorkflowMutation.isPending ? 'Executing...' : 'Execute'}
              </button>
            )}

            {/* Export Button */}
            {id && id !== 'new' && (
              <button
                onClick={() => setShowExportModal(true)}
                className="inline-flex items-center px-3 py-1.5 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Export workflow (Ctrl/Cmd+E) - Download as JSON or YAML"
              >
                <svg className="-ml-1 mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                Export
              </button>
            )}

            {/* Issues/Validation Button */}
            {unifiedValidation && (unifiedValidation.errors.length > 0 || unifiedValidation.warnings.length > 0) && (
              <div className="relative">
                <button
                  onClick={() => setShowValidationPanel(!showValidationPanel)}
                  className={`inline-flex items-center px-3 py-1.5 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    unifiedValidation.errors.length > 0 
                      ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100' 
                      : 'border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100'
                  }`}
                  title={`${unifiedValidation.errors.length + unifiedValidation.warnings.length} validation issues found`}
                >
                  {unifiedValidation.errors.length > 0 ? (
                    <span className="text-red-500 text-lg mr-1">🔴</span>
                  ) : (
                    <span className="text-amber-500 text-lg mr-1">⚠️</span>
                  )}
                  {unifiedValidation.errors.length + unifiedValidation.warnings.length} Issue{unifiedValidation.errors.length + unifiedValidation.warnings.length !== 1 ? 's' : ''}
                  <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showValidationPanel ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} />
                  </svg>
                </button>

                {/* Validation Dropdown Menu */}
                {showValidationPanel && (
                  <>
                    {/* Overlay to close menu when clicking outside */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowValidationPanel(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 flex flex-col">
                      <div className="p-4 flex-shrink-0">
                        <h3 className="text-lg font-medium text-gray-900 mb-3">Validation Issues</h3>
                      </div>
                      
                      {/* Scrollable content area */}
                      <div className="flex-1 overflow-y-auto px-4">
                        {/* Errors Section */}
                        {unifiedValidation.errors.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-red-700 mb-2 flex items-center">
                              <span className="text-red-500 mr-1">🔴</span>
                              Errors ({unifiedValidation.errors.length})
                            </h4>
                            <div className="space-y-2">
                              {unifiedValidation.errors.map((error, index) => (
                                <div 
                                  key={index} 
                                  className={`bg-red-50 border border-red-200 rounded p-2 transition-colors duration-150 ${
                                    (error.nodeId || error.edgeId) 
                                      ? 'cursor-pointer hover:bg-red-100 hover:border-red-300' 
                                      : ''
                                  }`}
                                  onClick={() => (error.nodeId || error.edgeId) && navigateToIssue(error)}
                                  title={(error.nodeId || error.edgeId) ? 'Click to navigate to this issue' : undefined}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <p className="text-sm text-red-800">{error.message}</p>
                                      <div className="flex items-center text-xs text-red-600 mt-1 space-x-2">
                                        {error.nodeId && <span>Node: {error.nodeId}</span>}
                                        {error.edgeId && <span>Edge: {error.edgeId}</span>}
                                        {error.field && <span>Field: {error.field}</span>}
                                        <span className="px-1.5 py-0.5 bg-red-100 rounded text-xs">{error.category}</span>
                                        {error.edgeId && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">CONNECTION</span>}
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <span className="text-xs text-red-500 font-mono">{error.code}</span>
                                      {(error.nodeId || error.edgeId) && (
                                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Warnings Section */}
                        {unifiedValidation.warnings.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-amber-700 mb-2 flex items-center">
                              <span className="text-amber-500 mr-1">⚠️</span>
                              Warnings ({unifiedValidation.warnings.length})
                            </h4>
                            <div className="space-y-2">
                              {unifiedValidation.warnings.map((warning, index) => (
                                <div 
                                  key={index} 
                                  className={`bg-amber-50 border border-amber-200 rounded p-2 transition-colors duration-150 ${
                                    (warning.nodeId || warning.edgeId) 
                                      ? 'cursor-pointer hover:bg-amber-100 hover:border-amber-300' 
                                      : ''
                                  }`}
                                  onClick={() => (warning.nodeId || warning.edgeId) && navigateToIssue(warning)}
                                  title={(warning.nodeId || warning.edgeId) ? 'Click to navigate to this issue' : undefined}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <p className="text-sm text-amber-800">{warning.message}</p>
                                      <div className="flex items-center text-xs text-amber-600 mt-1 space-x-2">
                                        {warning.nodeId && <span>Node: {warning.nodeId}</span>}
                                        {warning.edgeId && <span>Edge: {warning.edgeId}</span>}
                                        {warning.field && <span>Field: {warning.field}</span>}
                                        <span className="px-1.5 py-0.5 bg-amber-100 rounded text-xs">{warning.category}</span>
                                        {warning.edgeId && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">CONNECTION</span>}
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <span className="text-xs text-amber-500 font-mono">{warning.code}</span>
                                      {(warning.nodeId || warning.edgeId) && (
                                        <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Fixed footer with validation status and summary */}
                      <div className="flex-shrink-0 p-4 border-t bg-gray-50">
                        {/* Validation Status */}
                        {isValidating && (
                          <div className="flex items-center text-xs text-gray-500 mb-2">
                            <svg className="animate-spin -ml-1 mr-2 h-3 w-3" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Validating...
                          </div>
                        )}

                        {/* Validation Summary */}
                        <div className="text-xs text-gray-600 flex items-center justify-between">
                            <span>Total Issues: {unifiedValidation.issues.length}</span>
                            <span className={unifiedValidation.isValid ? 'text-green-600' : 'text-red-600'}>
                              {unifiedValidation.isValid ? '✓ Valid' : '✗ Invalid'}
                            </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Help Button */}
            <button
              onClick={showShortcutsHelp}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Show keyboard shortcuts (H or ?)"
            >
              <svg className="-ml-1 mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Help
            </button>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex h-[calc(100vh-220px)] bg-gray-100 relative">
        <NodePalette categories={nodeCategories} onNodeDragStart={onNodeDragStart} />
        <div className="flex flex-1">
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
              reactFlowRef={reactFlowRef}
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
