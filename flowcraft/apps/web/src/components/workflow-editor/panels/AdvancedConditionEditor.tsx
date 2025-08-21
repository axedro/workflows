import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  Folder,
  FileText,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import { DataCondition, ConditionOperator, DataField, DataType } from '@flowcraft/shared-types';

// Tipos para condiciones avanzadas
export interface ConditionGroup {
  id: string;
  type: 'group';
  operator: 'AND' | 'OR';
  children: (ConditionGroup | DataCondition)[];
  enabled: boolean;
  description?: string;
}

export interface ConditionItem extends DataCondition {
  type: 'condition';
}

export type ConditionNode = ConditionGroup | ConditionItem;

interface AdvancedConditionEditorProps {
  conditions: DataCondition[];
  availableFields: Record<string, DataField>;
  onConditionsChange: (conditions: DataCondition[]) => void;
  className?: string;
}

const AdvancedConditionEditor: React.FC<AdvancedConditionEditorProps> = ({
  conditions,
  availableFields,
  onConditionsChange,
  className = ''
}) => {
  const [conditionTree, setConditionTree] = useState<ConditionNode[]>([]);
  const [previewData, setPreviewData] = useState<Record<string, any>>({});
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Convertir condiciones simples a árbol de condiciones - solo al montar el componente
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    if (isInitialized) return; // Evitar reinicialización
    
    if (conditions.length > 0) {
      // Si ya hay condiciones, convertirlas a un grupo AND
      const rootGroup: ConditionGroup = {
        id: 'root',
        type: 'group',
        operator: 'AND',
        children: conditions.map(cond => ({ ...cond, type: 'condition' as const })),
        enabled: true
      };
      setConditionTree([rootGroup]);
      setExpandedGroups(new Set(['root']));
    } else {
      setConditionTree([]);
    }
    
    setIsInitialized(true);
  }, [conditions, isInitialized]); // Depender de conditions pero controlar con isInitialized

  // Convertir árbol de condiciones a formato simple para el backend
  const flattenConditions = (nodes: ConditionNode[]): DataCondition[] => {
    const result: DataCondition[] = [];

    const processNode = (node: ConditionNode) => {
      if (node.type === 'condition') {
        result.push({
          id: node.id,
          field: node.field,
          operator: node.operator,
          value: node.value,
          enabled: node.enabled,
          description: node.description
        });
      } else if (node.type === 'group') {
        node.children.forEach(processNode);
      }
    };

    nodes.forEach(processNode);
    return result;
  };

  // Notificar cambios al componente padre - solo cuando hay cambios reales
  useEffect(() => {
    // No notificar hasta que esté inicializado
    if (!isInitialized) {
      return;
    }
    
    const flattened = flattenConditions(conditionTree);
    onConditionsChange(flattened);
  }, [conditionTree, isInitialized]); // Remover onConditionsChange de las dependencias

  // Generar ID único
  const generateId = () => `condition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Agregar nueva condición
  const addCondition = useCallback((parentId?: string) => {
    const newCondition: ConditionItem = {
      id: generateId(),
      type: 'condition',
      field: '',
      operator: ConditionOperator.EQUALS,
      value: '',
      enabled: true,
      description: ''
    };

    if (parentId) {
      setConditionTree(prev => updateNodeInTree(prev, parentId, (node) => {
        if (node.type === 'group') {
          return { ...node, children: [...node.children, newCondition] };
        }
        return node;
      }));
    } else {
      setConditionTree(prev => [...prev, newCondition]);
    }
  }, []);

  // Agregar nuevo grupo
  const addGroup = useCallback((parentId?: string) => {
    const newGroup: ConditionGroup = {
      id: generateId(),
      type: 'group',
      operator: 'AND',
      children: [],
      enabled: true,
      description: ''
    };

    if (parentId) {
      setConditionTree(prev => updateNodeInTree(prev, parentId, (node) => {
        if (node.type === 'group') {
          return { ...node, children: [...node.children, newGroup] };
        }
        return node;
      }));
    } else {
      setConditionTree(prev => [...prev, newGroup]);
    }
    setExpandedGroups(prev => new Set([...prev, newGroup.id]));
  }, []);

  // Actualizar nodo en el árbol
  const updateNodeInTree = (
    nodes: ConditionNode[],
    targetId: string,
    updater: (node: ConditionNode) => ConditionNode
  ): ConditionNode[] => {
    return nodes.map(node => {
      if (node.id === targetId) {
        return updater(node);
      }
      if (node.type === 'group') {
        return { ...node, children: updateNodeInTree(node.children, targetId, updater) };
      }
      return node;
    });
  };

  // Eliminar nodo del árbol
  const removeNode = (nodeId: string) => {
    console.log('AdvancedConditionEditor - removeNode called with nodeId:', nodeId);
    
    // Encontrar el nodo para mostrar información en la confirmación
    const findNode = (nodes: ConditionNode[]): ConditionNode | null => {
      for (const node of nodes) {
        if (node.id === nodeId) {
          return node;
        }
        if (node.type === 'group') {
          const found = findNode(node.children);
          if (found) return found;
        }
      }
      return null;
    };

    const nodeToRemove = findNode(conditionTree);
    console.log('AdvancedConditionEditor - nodeToRemove:', nodeToRemove);
    
    const nodeType = nodeToRemove?.type === 'group' ? 'group' : 'condition';
    const nodeName = nodeToRemove?.type === 'group' 
      ? `Group (${(nodeToRemove as ConditionGroup).operator})`
      : `Condition ${(nodeToRemove as ConditionItem).field || 'unnamed'}`;

    console.log('AdvancedConditionEditor - About to remove:', { nodeType, nodeName });

    // Confirmar antes de eliminar
    if (window.confirm(`¿Estás seguro de que quieres eliminar este ${nodeType}?\n\n${nodeName}\n\nEsta acción no se puede deshacer.`)) {
      const removeFromNodes = (nodes: ConditionNode[]): ConditionNode[] => {
        console.log('AdvancedConditionEditor - removeFromNodes called with nodes:', nodes);
        
        const result = nodes.filter(node => {
          if (node.id === nodeId) {
            console.log('AdvancedConditionEditor - Found node to remove:', node);
            return false;
          }
          if (node.type === 'group') {
            // Actualizar los hijos del grupo recursivamente
            const updatedChildren = removeFromNodes(node.children);
            node.children = updatedChildren;
          }
          return true;
        });
        
        console.log('AdvancedConditionEditor - removeFromNodes result:', result);
        return result;
      };

      setConditionTree(prev => {
        const newTree = removeFromNodes(prev);
        console.log('AdvancedConditionEditor - New condition tree after removal:', newTree);
        return newTree;
      });
    }
  };

  // Actualizar nodo
  const updateNode = (nodeId: string, updates: Partial<ConditionNode>) => {
    setConditionTree(prev => updateNodeInTree(prev, nodeId, (node) => ({ ...node, ...updates })));
  };

  // Toggle expansión de grupo
  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  // Evaluar condición individual
  const evaluateCondition = (condition: ConditionItem): boolean => {
    if (!condition.field || !condition.enabled) return true;

    const fieldValue = previewData[condition.field];
    const conditionValue = condition.value;

    switch (condition.operator) {
      case ConditionOperator.EQUALS:
        return fieldValue === conditionValue;
      case ConditionOperator.NOT_EQUALS:
        return fieldValue !== conditionValue;
      case ConditionOperator.GREATER_THAN:
        return Number(fieldValue) > Number(conditionValue);
      case ConditionOperator.LESS_THAN:
        return Number(fieldValue) < Number(conditionValue);
      case ConditionOperator.GREATER_EQUAL:
        return Number(fieldValue) >= Number(conditionValue);
      case ConditionOperator.LESS_EQUAL:
        return Number(fieldValue) <= Number(conditionValue);
      case ConditionOperator.CONTAINS:
        return String(fieldValue).includes(String(conditionValue));
      case ConditionOperator.NOT_CONTAINS:
        return !String(fieldValue).includes(String(conditionValue));
      case ConditionOperator.STARTS_WITH:
        return String(fieldValue).startsWith(String(conditionValue));
      case ConditionOperator.ENDS_WITH:
        return String(fieldValue).endsWith(String(conditionValue));
      case ConditionOperator.IS_EMPTY:
        return !fieldValue || String(fieldValue).length === 0;
      case ConditionOperator.IS_NOT_EMPTY:
        return fieldValue && String(fieldValue).length > 0;
      case ConditionOperator.IS_NULL:
        return fieldValue === null || fieldValue === undefined;
      case ConditionOperator.IS_NOT_NULL:
        return fieldValue !== null && fieldValue !== undefined;
      default:
        return true;
    }
  };

  // Evaluar grupo de condiciones
  const evaluateGroup = (group: ConditionGroup): boolean => {
    if (!group.enabled) return true;

    const results = group.children.map(child =>
      child.type === 'condition' ? evaluateCondition(child) : evaluateGroup(child)
    );

    if (group.operator === 'AND') {
      return results.every(result => result);
    } else {
      return results.some(result => result);
    }
  };

  // Evaluar todo el árbol
  const evaluateTree = (): boolean => {
    if (conditionTree.length === 0) return true;

    const results = conditionTree.map(node =>
      node.type === 'condition' ? evaluateCondition(node) : evaluateGroup(node)
    );

    return results.every(result => result);
  };

  // Obtener operadores por tipo de campo
  const getOperatorsForType = (fieldType: DataType): ConditionOperator[] => {
    switch (fieldType) {
      case DataType.STRING:
        return [
          ConditionOperator.EQUALS,
          ConditionOperator.NOT_EQUALS,
          ConditionOperator.CONTAINS,
          ConditionOperator.NOT_CONTAINS,
          ConditionOperator.STARTS_WITH,
          ConditionOperator.ENDS_WITH,
          ConditionOperator.IS_EMPTY,
          ConditionOperator.IS_NOT_EMPTY,
          ConditionOperator.IS_NULL,
          ConditionOperator.IS_NOT_NULL
        ];
      case DataType.NUMBER:
        return [
          ConditionOperator.EQUALS,
          ConditionOperator.NOT_EQUALS,
          ConditionOperator.GREATER_THAN,
          ConditionOperator.LESS_THAN,
          ConditionOperator.GREATER_EQUAL,
          ConditionOperator.LESS_EQUAL,
          ConditionOperator.IS_NULL,
          ConditionOperator.IS_NOT_NULL
        ];
      case DataType.BOOLEAN:
        return [
          ConditionOperator.EQUALS,
          ConditionOperator.NOT_EQUALS,
          ConditionOperator.IS_NULL,
          ConditionOperator.IS_NOT_NULL
        ];
      case DataType.ARRAY:
        return [
          ConditionOperator.CONTAINS,
          ConditionOperator.NOT_CONTAINS,
          ConditionOperator.IS_EMPTY,
          ConditionOperator.IS_NOT_EMPTY,
          ConditionOperator.IS_NULL,
          ConditionOperator.IS_NOT_NULL
        ];
      default:
        return [
          ConditionOperator.EQUALS,
          ConditionOperator.NOT_EQUALS,
          ConditionOperator.IS_NULL,
          ConditionOperator.IS_NOT_NULL
        ];
    }
  };

  // Obtener tipo de campo
  const getFieldType = (fieldName: string): DataType => {
    return availableFields[fieldName]?.type || DataType.STRING;
  };

  // Generar datos de preview
  const generatePreviewData = () => {
    const data: Record<string, any> = {};
    Object.entries(availableFields).forEach(([fieldName, field]) => {
      switch (field.type) {
        case DataType.STRING:
          data[fieldName] = field.example || 'example string';
          break;
        case DataType.NUMBER:
          data[fieldName] = field.example || 42;
          break;
        case DataType.BOOLEAN:
          data[fieldName] = field.example || true;
          break;
        case DataType.ARRAY:
          data[fieldName] = field.example || ['item1', 'item2'];
          break;
        default:
          data[fieldName] = field.example || null;
      }
    });
    setPreviewData(data);
  };

  useEffect(() => {
    generatePreviewData();
  }, [availableFields]);

  // Renderizar condición individual
  const renderCondition = (condition: ConditionItem, depth: number = 0) => {
    const isExpanded = true; // Las condiciones siempre están expandidas
    const result = evaluateCondition(condition);

    return (
      <div key={condition.id} className="border border-gray-200 rounded-lg bg-white">
        <div
          className="flex items-center justify-between p-3"
          style={{ paddingLeft: `${depth * 20 + 12}px` }}
        >
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-900">Condition</span>
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              result ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {result ? 'True' : 'False'}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={condition.enabled}
                onChange={(e) => updateNode(condition.id, { enabled: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-gray-600">Enabled</span>
            </label>
            <button
              onClick={() => removeNode(condition.id)}
              className="text-red-500 hover:text-red-700 p-1"
              title="Delete condition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="px-3 pb-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Campo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Field</label>
                <select
                  value={condition.field}
                  onChange={(e) => updateNode(condition.id, { field: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a field</option>
                  {Object.keys(availableFields).map(fieldName => (
                    <option key={fieldName} value={fieldName}>
                      {fieldName} ({availableFields[fieldName].type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Operador */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Operator</label>
                <select
                  value={condition.operator}
                  onChange={(e) => updateNode(condition.id, { operator: e.target.value as ConditionOperator })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {condition.field && getOperatorsForType(getFieldType(condition.field)).map(operator => (
                    <option key={operator} value={operator}>
                      {operator.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Valor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                <input
                  type="text"
                  value={condition.value}
                  onChange={(e) => updateNode(condition.id, { value: e.target.value })}
                  placeholder="Enter value"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Preview del valor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preview</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                  {condition.field ? previewData[condition.field] : 'No field selected'}
                </div>
              </div>
            </div>

            {/* Descripción */}
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={condition.description || ''}
                onChange={(e) => updateNode(condition.id, { description: e.target.value })}
                placeholder="Optional description"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  // Renderizar grupo de condiciones
  const renderGroup = (group: ConditionGroup, depth: number = 0) => {
    const isExpanded = expandedGroups.has(group.id);
    const result = evaluateGroup(group);

    return (
      <div key={group.id} className="border border-gray-200 rounded-lg bg-gray-50">
        <div
          className="flex items-center justify-between p-3"
          style={{ paddingLeft: `${depth * 20 + 12}px` }}
        >
          <div className="flex items-center space-x-2">
            <button
              onClick={() => toggleGroupExpansion(group.id)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              )}
            </button>
            <Folder className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium text-gray-900">Group ({group.operator})</span>
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              result ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {result ? 'True' : 'False'}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={group.enabled}
                onChange={(e) => updateNode(group.id, { enabled: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-gray-600">Enabled</span>
            </label>
            <button
              onClick={() => addCondition(group.id)}
              className="text-blue-500 hover:text-blue-700 p-1"
              title="Add condition"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => addGroup(group.id)}
              className="text-purple-500 hover:text-purple-700 p-1"
              title="Add group"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
            <button
              onClick={() => removeNode(group.id)}
              className="text-red-500 hover:text-red-700 p-1"
              title="Delete group"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="px-3 pb-3">
            {/* Configuración del grupo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Operator</label>
                <select
                  value={group.operator}
                  onChange={(e) => updateNode(group.id, { operator: e.target.value as 'AND' | 'OR' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="AND">AND (All conditions must be true)</option>
                  <option value="OR">OR (Any condition can be true)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={group.description || ''}
                  onChange={(e) => updateNode(group.id, { description: e.target.value })}
                  placeholder="Group description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Hijos del grupo */}
            <div className="space-y-2">
              {group.children.map(child =>
                child.type === 'condition'
                  ? renderCondition(child, depth + 1)
                  : renderGroup(child, depth + 1)
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Advanced Condition Editor</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => addCondition()}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Add Condition</span>
          </button>
          <button
            onClick={() => addGroup()}
            className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors flex items-center space-x-1"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Add Group</span>
          </button>
        </div>
      </div>

      {/* Árbol de condiciones */}
      <div className="space-y-2">
        {conditionTree.map(node =>
          node.type === 'condition'
            ? renderCondition(node)
            : renderGroup(node)
        )}

        {conditionTree.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No conditions defined. Click "Add Condition" or "Add Group" to get started.</p>
          </div>
        )}
      </div>

      {/* Preview de evaluación */}
      {conditionTree.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-3">Evaluation Preview</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Sample Data</h5>
              <div className="bg-white border border-gray-200 rounded p-3 text-sm">
                <pre className="whitespace-pre-wrap">{JSON.stringify(previewData, null, 2)}</pre>
              </div>
            </div>
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Overall Result</h5>
              <div className={`px-4 py-3 rounded-md text-lg font-medium text-center ${
                evaluateTree()
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {evaluateTree() ? 'ALL CONDITIONS PASS' : 'SOME CONDITIONS FAIL'}
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Complex condition evaluation with nested groups
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedConditionEditor;
