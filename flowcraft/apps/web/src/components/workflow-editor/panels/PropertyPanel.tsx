import React, { useState, useEffect } from 'react';
import { EditorNode, NodeType, EditorEdge, DataFlow, DataType, DataField, getNodeInputSchema, getNodeOutputSchema } from '@flowcraft/shared-types';

import ConnectorValidationService from '../../../services/connectorValidation.service';
import ConditionEditor from './ConditionEditor';
import DataConfigPanel from './DataConfigPanel';

interface PropertyPanelProps {
  selectedNode: EditorNode | null;
  selectedEdge: EditorEdge | null;
  nodes: EditorNode[];
  edges: EditorEdge[];
  onNodeUpdate: (node: EditorNode) => void;
  onEdgeUpdate: (edge: EditorEdge) => void;
  readOnly?: boolean;
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selectedNode,
  selectedEdge,
  nodes,
  edges,
  onNodeUpdate,
  onEdgeUpdate,
  readOnly = false,
}) => {
  const [localNode, setLocalNode] = useState<EditorNode | null>(selectedNode);
  const [localEdge, setLocalEdge] = useState<EditorEdge | null>(selectedEdge);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [validationWarnings, setValidationWarnings] = useState<Record<string, string[]>>({});

  // Función para generar campos anidados para objetos JSON
  const generateNestedFields = (fields: Record<string, DataField>): Record<string, DataField> => {
    const nestedFields: Record<string, DataField> = { ...fields };
    
    // Buscar campos de tipo JSON y generar campos anidados
    Object.entries(fields).forEach(([fieldName, field]) => {
      if (field.type === DataType.JSON || field.type === DataType.OBJECT) {
        // Generar campos anidados comunes para el objeto data
        if (fieldName === 'data') {
          nestedFields['data.status'] = {
            id: 'data.status',
            name: 'data.status',
            type: DataType.STRING,
            required: false,
            description: 'Status field within data object',
            example: 'active'
          };
          nestedFields['data.count'] = {
            id: 'data.count',
            name: 'data.count',
            type: DataType.NUMBER,
            required: false,
            description: 'Count field within data object',
            example: 42
          };
          nestedFields['data.name'] = {
            id: 'data.name',
            name: 'data.name',
            type: DataType.STRING,
            required: false,
            description: 'Name field within data object',
            example: 'John Doe'
          };
          nestedFields['data.email'] = {
            id: 'data.email',
            name: 'data.email',
            type: DataType.EMAIL,
            required: false,
            description: 'Email field within data object',
            example: 'john@example.com'
          };
          nestedFields['data.success'] = {
            id: 'data.success',
            name: 'data.success',
            type: DataType.BOOLEAN,
            required: false,
            description: 'Success flag within data object',
            example: true
          };
        }
      }
    });
    
    return nestedFields;
  };

  // Función para validar campos en tiempo real
  const validateField = (fieldName: string, value: any, nodeType: NodeType) => {
    if (!nodeType) return;

    try {
      // Mapear el tipo de nodo al tipo de conector esperado por el servicio de validación
      const connectorTypeMap: Record<NodeType, string> = {
        [NodeType.HTTP_REQUEST]: 'HTTP_REQUEST',
        [NodeType.EMAIL]: 'EMAIL',
        [NodeType.SLACK]: 'SLACK',
        [NodeType.TIMER]: 'TIMER',
        [NodeType.WEBHOOK]: 'WEBHOOK',
        [NodeType.DATA_TRANSFORM]: 'DATA_TRANSFORM',
        [NodeType.START]: '',
        [NodeType.END]: '',
        [NodeType.ACTION]: '',
        [NodeType.CONDITION]: '',
        [NodeType.LOOP]: '',
        [NodeType.TEST]: '',
      };

      const connectorType = connectorTypeMap[nodeType];
      if (!connectorType) return; // No hay validación para este tipo de nodo

      const validationConfig = {
        connectorType,
        fields: { [fieldName]: value },
        schema: {} // Por ahora usamos un schema vacío, podríamos obtenerlo del nodo
      };

      const result = ConnectorValidationService.validateConnector(validationConfig);
      
      // Filtrar errores y warnings para el campo específico
      const fieldErrors = result.errors.filter(error => 
        error.toLowerCase().includes(fieldName.toLowerCase()) ||
        error.toLowerCase().includes('url') && fieldName === 'url'
      );
      const fieldWarnings = result.warnings.filter(warning => 
        warning.toLowerCase().includes(fieldName.toLowerCase())
      );

      setValidationErrors(prev => ({
        ...prev,
        [fieldName]: fieldErrors
      }));
      
      setValidationWarnings(prev => ({
        ...prev,
        [fieldName]: fieldWarnings
      }));

      // La validación visual se aplicará cuando se guarde el nodo

    } catch (error) {
      console.error('Validation error:', error);
    }
  };

  // Función helper para renderizar campos con validación
  const renderFieldWithValidation = (
    fieldName: string,
    value: any,
    onChange: (value: any) => void,
    type: 'text' | 'url' | 'number' | 'textarea' | 'select',
    placeholder?: string,
    options?: { value: string; label: string }[],
    rows?: number
  ) => {
    const errors = validationErrors[fieldName] || [];
    const warnings = validationWarnings[fieldName] || [];
    const hasError = errors.length > 0;
    const hasWarning = warnings.length > 0;

    const getInputClassName = () => {
      let baseClass = "w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-gray-100";
      
      if (hasError) {
        baseClass += " border-red-300 focus:ring-red-500";
      } else if (hasWarning) {
        baseClass += " border-yellow-300 focus:ring-yellow-500";
      } else {
        baseClass += " border-gray-300 focus:ring-blue-500";
      }
      
      return baseClass;
    };

    return (
      <div className="space-y-1">
        {type === 'select' ? (
          <select
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            disabled={readOnly}
            className={getInputClassName()}
          >
            {options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : type === 'textarea' ? (
          <textarea
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows || 3}
            disabled={readOnly}
            className={getInputClassName()}
          />
        ) : (
          <input
            type={type}
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={readOnly}
            className={getInputClassName()}
          />
        )}
        
        {/* Mostrar errores */}
        {hasError && (
          <div className="text-red-600 text-xs">
            {errors.map((error, index) => (
              <div key={index} className="flex items-center">
                <span className="mr-1">⚠️</span>
                {error}
              </div>
            ))}
          </div>
        )}
        
        {/* Mostrar warnings */}
        {hasWarning && !hasError && (
          <div className="text-yellow-600 text-xs">
            {warnings.map((warning, index) => (
              <div key={index} className="flex items-center">
                <span className="mr-1">⚠️</span>
                {warning}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Update local state when selected node or edge changes
  useEffect(() => {
    setLocalNode(selectedNode);
    setLocalEdge(selectedEdge);
    setHasUnsavedChanges(false);
    setSaveStatus('idle');
    // Limpiar validaciones al cambiar de nodo
    setValidationErrors({});
    setValidationWarnings({});
    
    // Re-validar todos los campos del nodo seleccionado
    if (selectedNode) {
      // Usar setTimeout para asegurar que el nodo local se haya actualizado
      setTimeout(() => {
        const nodeData = selectedNode.data as any;
        Object.entries(nodeData).forEach(([field, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            validateField(field, value, selectedNode.type);
          }
        });
      }, 0);
    }
  }, [selectedNode, selectedEdge]);

  // If an edge is selected, show the data configuration panel
  if (selectedEdge && localEdge) {
    // Get source and target nodes
    const sourceNode = nodes.find(node => node.id === localEdge.source);
    const targetNode = nodes.find(node => node.id === localEdge.target);
    
    // Get dynamic schemas from nodes
    const rawSourceSchema = sourceNode ? getNodeOutputSchema(sourceNode.id, nodes, edges) : {};
    const rawTargetSchema = targetNode ? getNodeInputSchema(targetNode.id, nodes, edges) : {};
    
    // Debug: Log raw schemas
    console.log('PropertyPanel - sourceNode:', sourceNode);
    console.log('PropertyPanel - targetNode:', targetNode);
    console.log('PropertyPanel - rawSourceSchema:', rawSourceSchema);
    console.log('PropertyPanel - rawTargetSchema:', rawTargetSchema);
    
    // Generate nested fields for JSON/OBJECT types
    const sourceSchema = generateNestedFields(rawSourceSchema);
    const targetSchema = generateNestedFields(rawTargetSchema);
    
    // Debug: Log processed schemas
    console.log('PropertyPanel - sourceSchema:', sourceSchema);
    console.log('PropertyPanel - targetSchema:', targetSchema);
    
    // Create a default data flow if none exists
          const dataFlow: DataFlow = localEdge.dataFlow || {
        id: `flow_${localEdge.id}`,
        sourcePortId: localEdge.source || '',
        targetPortId: localEdge.target || '',
      fieldMappings: [],
      transformations: [],
      validation: {
        isValid: true,
        errors: [],
        warnings: [],
        portsCompatible: true,
        requiredFieldsMapped: true,
        typeCompatible: true,
      },
      enabled: true,
    };

    const handleDataFlowChange = (updatedDataFlow: DataFlow) => {
      const updatedEdge: EditorEdge = {
        ...localEdge,
        dataFlow: updatedDataFlow,
      };
      setLocalEdge(updatedEdge);
      onEdgeUpdate(updatedEdge);
    };

    return (
      <DataConfigPanel
        sourceSchema={sourceSchema}
        targetSchema={targetSchema}
        dataFlow={dataFlow}
        onDataFlowChange={handleDataFlowChange}
        readOnly={readOnly}
      />
    );
  }

  // If no node is selected, show the default message
  if (!selectedNode || !localNode) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Properties</h2>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">📋</div>
            <div>Select a node or connection to view properties</div>
          </div>
        </div>
      </div>
    );
  }

  const handleInputChange = (field: string, value: any) => {
    if (!localNode) return;

    const updatedNode = {
      ...localNode,
      data: {
        ...localNode.data,
        [field]: value
      }
    };

    setLocalNode(updatedNode);
    setHasUnsavedChanges(true);
    setSaveStatus('idle');

    // Validar el campo en tiempo real
    validateField(field, value, localNode.type);
  };

  const handleSave = async () => {
    if (readOnly || !localNode) return;
    
    try {
      setSaveStatus('saving');
      
      // Simulate save operation
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Aplicar validación visual al nodo antes de guardarlo
      const hasValidationErrors = Object.values(validationErrors).some(errors => errors.length > 0);
      const allErrors = Object.values(validationErrors).flat();
      const allWarnings = Object.values(validationWarnings).flat();
      
      console.log('handleSave validation debug:', {
        nodeId: localNode.id,
        validationErrors,
        validationWarnings,
        hasValidationErrors,
        allErrors,
        allWarnings
      });
      
      const nodeWithValidation = {
        ...localNode,
        data: {
          ...localNode.data,
          validation: {
            isValid: !hasValidationErrors,
            errors: allErrors,
            warnings: allWarnings
          }
        }
      };
      
      console.log('nodeWithValidation:', nodeWithValidation.data.validation);
      
      onNodeUpdate(nodeWithValidation);
      setLocalNode(nodeWithValidation);
      setHasUnsavedChanges(false);
      setSaveStatus('saved');
      
      // Reset status after 2 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
      
    } catch (error) {
      setSaveStatus('error');
      console.error('Error saving node:', error);
      
      // Reset error status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    }
  };

  const getNodeSchemaInfo = () => {
    if (!localNode) return null;

    try {
      // Get dynamic schemas based on actual connections
      const inputSchema = getNodeInputSchema(localNode.id, nodes, edges);
      const outputSchema = getNodeOutputSchema(localNode.id, nodes, edges);
      const inputFields = Object.values(inputSchema);
      const outputFields = Object.values(outputSchema);

      return (
        <div className="space-y-4 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              📥 Input Fields ({inputFields.length})
            </h3>
            <div className="space-y-2">
              {inputFields.length > 0 ? (
                inputFields.map((field) => (
                  <div key={field.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                    <span className="text-gray-700">{field.name}</span>
                    <div className="flex items-center space-x-1">
                      <span className={`px-1 py-0.5 rounded text-xs ${
                        field.required 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {field.required ? 'Required' : 'Optional'}
                      </span>
                      <span className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                        {field.type}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-xs italic">No input fields</div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              📤 Output Fields ({outputFields.length})
            </h3>
            <div className="space-y-2">
              {outputFields.length > 0 ? (
                outputFields.map((field) => (
                  <div key={field.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                    <span className="text-gray-700">{field.name}</span>
                    <span className="px-1 py-0.5 bg-green-100 text-green-800 rounded text-xs">
                      {field.type}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-xs italic">No output fields</div>
              )}
            </div>
          </div>
        </div>
      );
    } catch (error) {
      return (
        <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <div className="text-sm text-yellow-800">
            ⚠️ Schema information not available for this node type
          </div>
        </div>
      );
    }
  };

  const getNodeSpecificFields = () => {
    if (!localNode) return null;

    switch (localNode.type) {
      case NodeType.START:
        const startData = localNode.data as any; // Cast to any for now
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trigger Type
              </label>
              <select
                value={startData.triggerType || 'manual'}
                onChange={e => handleInputChange('triggerType', e.target.value)}
                disabled={readOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="manual">Manual</option>
                <option value="scheduled">Scheduled</option>
                <option value="webhook">Webhook</option>
              </select>
            </div>

            {startData.triggerType === 'scheduled' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schedule (Cron)
                </label>
                <input
                  type="text"
                  value={startData.schedule || ''}
                  onChange={e => handleInputChange('schedule', e.target.value)}
                  placeholder="0 0 * * *"
                  disabled={readOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
            )}

            {startData.triggerType === 'webhook' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Webhook URL
                </label>
                <input
                  type="text"
                  value={startData.webhookUrl || ''}
                  onChange={e =>
                    handleInputChange('webhookUrl', e.target.value)
                  }
                  placeholder="https://..."
                  disabled={readOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
            )}
          </div>
        );

      case NodeType.ACTION:
        const actionData = localNode.data as any; // Cast to any for now
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action Type
              </label>
              <select
                value={actionData.actionType || 'custom'}
                onChange={e => handleInputChange('actionType', e.target.value)}
                disabled={readOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="http">HTTP Request</option>
                <option value="email">Email</option>
                <option value="slack">Slack</option>
                <option value="transform">Data Transform</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Retries
              </label>
              <input
                type="number"
                value={actionData.maxRetries || 3}
                onChange={e => handleInputChange('maxRetries', parseInt(e.target.value))}
                min="0"
                max="10"
                disabled={readOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>
          </div>
        );

      case NodeType.CONDITION:
        const conditionData = localNode.data as any; // Cast to any for now
        const conditionInputSchema = getNodeInputSchema(localNode.id, nodes, edges);
        const availableFields = generateNestedFields(conditionInputSchema);
        
        return (
          <div className="space-y-3">
            <ConditionEditor
              conditions={conditionData.dataConditions || []}
              availableFields={availableFields}
              onConditionsChange={(newConditions) => 
                handleInputChange('dataConditions', newConditions)
              }
              className=""
            />
          </div>
        );

      case NodeType.END:
        const endData = localNode.data as any; // Cast to any for now
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Result Type
              </label>
              <select
                value={endData.resultType || 'success'}
                onChange={e => handleInputChange('resultType', e.target.value)}
                disabled={readOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="success">Success</option>
                <option value="error">Error</option>
                <option value="partial">Partial Success</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>
        );

      case NodeType.HTTP_REQUEST:
        const httpData = localNode.data as any; // Cast to any for now
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Method
              </label>
              {renderFieldWithValidation(
                'method',
                httpData.method || 'GET',
                (value) => handleInputChange('method', value),
                'select',
                undefined,
                [
                  { value: 'GET', label: 'GET' },
                  { value: 'POST', label: 'POST' },
                  { value: 'PUT', label: 'PUT' },
                  { value: 'DELETE', label: 'DELETE' },
                  { value: 'PATCH', label: 'PATCH' }
                ]
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL
              </label>
              {renderFieldWithValidation(
                'url',
                httpData.url || '',
                (value) => handleInputChange('url', value),
                'url',
                'https://api.example.com/endpoint'
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Headers
              </label>
              <textarea
                value={httpData.headers ? JSON.stringify(httpData.headers, null, 2) : '{\n  "Content-Type": "application/json"\n}'}
                onChange={e => {
                  try {
                    const headers = JSON.parse(e.target.value);
                    handleInputChange('headers', headers);
                  } catch (error) {
                    // Keep the raw text if it's not valid JSON
                    handleInputChange('headers', e.target.value);
                  }
                }}
                placeholder='{\n  "Content-Type": "application/json",\n  "Authorization": "Bearer token"\n}'
                rows={4}
                disabled={readOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Body
              </label>
              <textarea
                value={httpData.body ? JSON.stringify(httpData.body, null, 2) : ''}
                onChange={e => {
                  try {
                    const body = JSON.parse(e.target.value);
                    handleInputChange('body', body);
                  } catch (error) {
                    // Keep the raw text if it's not valid JSON
                    handleInputChange('body', e.target.value);
                  }
                }}
                placeholder='{\n  "key": "value",\n  "data": "example"\n}'
                rows={4}
                disabled={readOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Retries
              </label>
              {renderFieldWithValidation(
                'maxRetries',
                httpData.maxRetries || 3,
                (value) => handleInputChange('maxRetries', parseInt(value)),
                'number',
                undefined,
                undefined
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timeout (ms)
              </label>
              {renderFieldWithValidation(
                'timeout',
                httpData.timeout || 30000,
                (value) => handleInputChange('timeout', parseInt(value)),
                'number',
                undefined,
                undefined
              )}
            </div>
          </div>
        );

      case NodeType.EMAIL:
        const emailData = localNode.data as any; // Cast to any for now
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To
              </label>
              <textarea
                value={emailData.to ? JSON.stringify(emailData.to, null, 2) : ''}
                onChange={e => {
                  try {
                    const to = JSON.parse(e.target.value);
                    handleInputChange('to', to);
                  } catch (error) {
                    // Keep the raw text if it's not valid JSON
                    handleInputChange('to', e.target.value);
                  }
                }}
                placeholder='[\n  "recipient@example.com",\n  "another@example.com"\n]'
                rows={3}
                disabled={readOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CC
              </label>
              <textarea
                value={emailData.cc ? JSON.stringify(emailData.cc, null, 2) : ''}
                onChange={e => {
                  try {
                    const cc = JSON.parse(e.target.value);
                    handleInputChange('cc', cc);
                  } catch (error) {
                    handleInputChange('cc', e.target.value);
                  }
                }}
                placeholder='[\n  "cc@example.com"\n]'
                rows={2}
                disabled={readOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={emailData.subject || ''}
                onChange={e => handleInputChange('subject', e.target.value)}
                placeholder="Email subject"
                disabled={readOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Body
              </label>
              <textarea
                value={emailData.emailBody || ''}
                onChange={e => handleInputChange('emailBody', e.target.value)}
                placeholder="Email body content..."
                rows={6}
                disabled={readOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Retries
              </label>
              <input
                type="number"
                value={emailData.maxRetries || 3}
                onChange={e => handleInputChange('maxRetries', parseInt(e.target.value))}
                min="0"
                max="10"
                disabled={readOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>
          </div>
        );

      case NodeType.SLACK:
        const slackData = localNode.data as any; // Cast to any for now
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Channel
              </label>
              <input
                type="text"
                value={slackData.channel || ''}
                onChange={e => handleInputChange('channel', e.target.value)}
                placeholder="#general"
                disabled={readOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                value={slackData.message || ''}
                onChange={e => handleInputChange('message', e.target.value)}
                placeholder="Your Slack message here..."
                rows={4}
                disabled={readOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attachments
              </label>
              <textarea
                value={slackData.attachments ? JSON.stringify(slackData.attachments, null, 2) : ''}
                onChange={e => {
                  try {
                    const attachments = JSON.parse(e.target.value);
                    handleInputChange('attachments', attachments);
                  } catch (error) {
                    handleInputChange('attachments', e.target.value);
                  }
                }}
                placeholder='[\n  {\n    "title": "Attachment Title",\n    "text": "Attachment text",\n    "color": "good"\n  }\n]'
                rows={4}
                disabled={readOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Retries
              </label>
              <input
                type="number"
                value={slackData.maxRetries || 3}
                onChange={e => handleInputChange('maxRetries', parseInt(e.target.value))}
                min="0"
                max="10"
                disabled={readOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Calcular número total de errores de validación
  const totalErrors = Object.values(validationErrors).reduce((sum, errors) => sum + errors.length, 0);
  const totalWarnings = Object.values(validationWarnings).reduce((sum, warnings) => sum + warnings.length, 0);
  const totalIssues = totalErrors + totalWarnings;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-semibold text-gray-800">Properties</h2>
            {totalIssues > 0 && (
              <div className="relative">
                <div className="bg-yellow-100 border border-yellow-300 rounded-lg px-3 py-1 flex items-center space-x-2">
                  <span className="text-yellow-600">⚠️</span>
                  <span className="text-sm font-medium text-yellow-800">
                    {totalIssues} Issue{totalIssues > 1 ? 's' : ''}
                  </span>
                  <button className="text-yellow-600 hover:text-yellow-800">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
          {!readOnly && (
            <div className="flex items-center space-x-2">
              {hasUnsavedChanges && (
                <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                  Unsaved changes
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={saveStatus === 'saving'}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  saveStatus === 'saving'
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : saveStatus === 'saved'
                    ? 'bg-green-500 text-white'
                    : saveStatus === 'error'
                    ? 'bg-red-500 text-white'
                    : hasUnsavedChanges
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                }`}
              >
                {saveStatus === 'saving' && 'Saving...'}
                {saveStatus === 'saved' && 'Saved!'}
                {saveStatus === 'error' && 'Error'}
                {saveStatus === 'idle' && (hasUnsavedChanges ? 'Save' : 'Saved')}
              </button>
            </div>
          )}
        </div>
        {selectedNode && (
          <div className="mt-2 text-sm text-gray-600">
            {selectedNode.type} Node
          </div>
        )}
      </div>

      {/* Properties Form */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {/* Basic Properties */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-1">
              Basic Properties
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Label
              </label>
              <input
                type="text"
                value={localNode.data.label || ''}
                onChange={e => handleInputChange('label', e.target.value)}
                disabled={readOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={localNode.data.description || ''}
                onChange={e => handleInputChange('description', e.target.value)}
                disabled={readOnly}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>
          </div>

          {/* Data Schema Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-1">
              Data Schema
            </h3>
            {getNodeSchemaInfo()}
          </div>

          {/* Node-Specific Properties */}
          {getNodeSpecificFields() && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-1">
                Node Configuration
              </h3>
              {getNodeSpecificFields()}
            </div>
          )}

          {/* Validation Status */}
          {localNode.data.validation && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-1">
                Validation
              </h3>

              <div
                className={`p-3 rounded-md ${
                  localNode.data.validation.isValid
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex items-center">
                  <span
                    className={`w-2 h-2 rounded-full mr-2 ${
                      localNode.data.validation.isValid
                        ? 'bg-green-500'
                        : 'bg-red-500'
                    }`}
                  ></span>
                  <span className="text-sm font-medium">
                    {localNode.data.validation.isValid ? 'Valid' : 'Invalid'}
                  </span>
                </div>

                {localNode.data.validation.errors.length > 0 && (
                  <div className="mt-2">
                    <div className="text-sm font-medium text-red-700 mb-1">
                      Errors:
                    </div>
                    <ul className="text-sm text-red-600 space-y-1">
                      {localNode.data.validation.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {localNode.data.validation.warnings.length > 0 && (
                  <div className="mt-2">
                    <div className="text-sm font-medium text-yellow-700 mb-1">
                      Warnings:
                    </div>
                    <ul className="text-sm text-yellow-600 space-y-1">
                      {localNode.data.validation.warnings.map(
                        (warning, index) => (
                          <li key={index}>• {warning}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyPanel;
