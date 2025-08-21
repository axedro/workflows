import React, { useState, useEffect } from 'react';
import { DataCondition, ConditionOperator, DataField, DataType } from '@flowcraft/shared-types';
import { Plus, Minus, FolderOpen, FolderClosed, Eye, EyeOff, Settings, Copy, Trash2 } from 'lucide-react';

// Advanced condition group interface
export interface ConditionGroup {
  id: string;
  name: string;
  operator: 'AND' | 'OR';
  conditions: DataCondition[];
  groups: ConditionGroup[];
  enabled: boolean;
  description?: string;
  collapsed?: boolean;
}

// Advanced condition structure
export interface AdvancedConditionStructure {
  rootGroup: ConditionGroup;
  availableFields: Record<string, DataField>;
}

interface AdvancedConditionEditorProps {
  conditionStructure: AdvancedConditionStructure;
  onConditionStructureChange: (structure: AdvancedConditionStructure) => void;
  className?: string;
  showDataPreview?: boolean;
  sampleData?: Record<string, any>;
}

// Component for individual condition
const ConditionItem: React.FC<{
  condition: DataCondition;
  availableFields: Record<string, DataField>;
  onUpdate: (updates: Partial<DataCondition>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  isEvaluated: boolean;
  evaluationResult: boolean;
}> = ({ condition, availableFields, onUpdate, onRemove, onDuplicate, isEvaluated, evaluationResult }) => {
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

  const getFieldType = (fieldName: string): DataType => {
    return availableFields[fieldName]?.type || DataType.STRING;
  };

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={condition.enabled}
            onChange={(e) => onUpdate({ enabled: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Condition</span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={onDuplicate}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            title="Duplicate condition"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            onClick={onRemove}
            className="p-1 text-red-400 hover:text-red-600 rounded"
            title="Remove condition"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Field */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Field</label>
          <select
            value={condition.field}
            onChange={(e) => onUpdate({ field: e.target.value })}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select field</option>
            {Object.keys(availableFields).map(fieldName => (
              <option key={fieldName} value={fieldName}>
                {fieldName} ({availableFields[fieldName].type})
              </option>
            ))}
          </select>
        </div>

        {/* Operator */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Operator</label>
          <select
            value={condition.operator}
            onChange={(e) => onUpdate({ operator: e.target.value as ConditionOperator })}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {condition.field && getOperatorsForType(getFieldType(condition.field)).map(operator => (
              <option key={operator} value={operator}>
                {operator.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Value */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Value</label>
          <input
            type="text"
            value={condition.value}
            onChange={(e) => onUpdate({ value: e.target.value })}
            placeholder="Enter value"
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Result */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Result</label>
          <div className={`px-2 py-1 rounded text-xs font-medium text-center ${
            isEvaluated
              ? evaluationResult
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {isEvaluated ? (evaluationResult ? 'True' : 'False') : 'Pending'}
          </div>
        </div>
      </div>

      {/* Description */}
      {condition.description && (
        <div className="mt-2">
          <input
            type="text"
            value={condition.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Optional description"
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )}
    </div>
  );
};

// Component for condition group
const ConditionGroupItem: React.FC<{
  group: ConditionGroup;
  availableFields: Record<string, DataField>;
  onUpdate: (groupId: string, updates: Partial<ConditionGroup>) => void;
  onAddCondition: (groupId: string) => void;
  onAddGroup: (parentGroupId: string) => void;
  onRemoveGroup: (groupId: string) => void;
  onDuplicateGroup: (groupId: string) => void;
  onConditionUpdate: (groupId: string, conditionId: string, updates: Partial<DataCondition>) => void;
  onConditionRemove: (groupId: string, conditionId: string) => void;
  onConditionDuplicate: (groupId: string, conditionId: string) => void;
  sampleData?: Record<string, any>;
  level?: number;
}> = ({
  group,
  availableFields,
  onUpdate,
  onAddCondition,
  onAddGroup,
  onRemoveGroup,
  onDuplicateGroup,
  onConditionUpdate,
  onConditionRemove,
  onConditionDuplicate,
  sampleData,
  level = 0
}) => {
  const [isCollapsed, setIsCollapsed] = useState(group.collapsed || false);

  // Evaluate condition
  const evaluateCondition = (condition: DataCondition): boolean => {
    if (!condition.field || !condition.enabled || !sampleData) return true;

    const fieldValue = sampleData[condition.field];
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

  // Evaluate group
  const evaluateGroup = (group: ConditionGroup): boolean => {
    if (!group.enabled) return true;

    const conditionResults = group.conditions
      .filter(c => c.enabled)
      .map(evaluateCondition);

    const groupResults = group.groups
      .filter(g => g.enabled)
      .map(evaluateGroup);

    const allResults = [...conditionResults, ...groupResults];

    if (allResults.length === 0) return true;

    return group.operator === 'AND' 
      ? allResults.every(result => result)
      : allResults.some(result => result);
  };

  const groupResult = evaluateGroup(group);

  return (
    <div className={`border border-gray-300 rounded-lg ${level > 0 ? 'ml-4' : ''}`}>
      {/* Group Header */}
      <div className={`flex items-center justify-between p-3 ${
        groupResult ? 'bg-green-50 border-b border-green-200' : 'bg-red-50 border-b border-red-200'
      }`}>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-gray-500 hover:text-gray-700"
          >
            {isCollapsed ? <FolderClosed className="w-4 h-4" /> : <FolderOpen className="w-4 h-4" />}
          </button>
          
          <input
            type="checkbox"
            checked={group.enabled}
            onChange={(e) => onUpdate(group.id, { enabled: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          
          <input
            type="text"
            value={group.name}
            onChange={(e) => onUpdate(group.id, { name: e.target.value })}
            className="text-sm font-medium bg-transparent border-none focus:outline-none focus:ring-0"
            placeholder="Group name"
          />
          
          <select
            value={group.operator}
            onChange={(e) => onUpdate(group.id, { operator: e.target.value as 'AND' | 'OR' })}
            className="text-xs border border-gray-300 rounded px-2 py-1"
          >
            <option value="AND">AND</option>
            <option value="OR">OR</option>
          </select>
          
          <div className={`px-2 py-1 rounded text-xs font-medium ${
            groupResult ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
          }`}>
            {groupResult ? 'True' : 'False'}
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onAddCondition(group.id)}
            className="p-1 text-blue-500 hover:text-blue-700 rounded"
            title="Add condition"
          >
            <Plus className="w-3 h-3" />
          </button>
          <button
            onClick={() => onAddGroup(group.id)}
            className="p-1 text-green-500 hover:text-green-700 rounded"
            title="Add group"
          >
            <FolderOpen className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDuplicateGroup(group.id)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            title="Duplicate group"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            onClick={() => onRemoveGroup(group.id)}
            className="p-1 text-red-400 hover:text-red-600 rounded"
            title="Remove group"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Group Content */}
      {!isCollapsed && (
        <div className="p-3 space-y-3">
          {/* Conditions */}
          {group.conditions.map((condition) => (
            <ConditionItem
              key={condition.id}
              condition={condition}
              availableFields={availableFields}
              onUpdate={(updates) => onConditionUpdate(group.id, condition.id, updates)}
              onRemove={() => onConditionRemove(group.id, condition.id)}
              onDuplicate={() => onConditionDuplicate(group.id, condition.id)}
              isEvaluated={!!sampleData}
              evaluationResult={evaluateCondition(condition)}
            />
          ))}

          {/* Nested Groups */}
          {group.groups.map((nestedGroup) => (
            <ConditionGroupItem
              key={nestedGroup.id}
              group={nestedGroup}
              availableFields={availableFields}
              onUpdate={onUpdate}
              onAddCondition={onAddCondition}
              onAddGroup={onAddGroup}
              onRemoveGroup={onRemoveGroup}
              onDuplicateGroup={onDuplicateGroup}
              onConditionUpdate={onConditionUpdate}
              onConditionRemove={onConditionRemove}
              onConditionDuplicate={onConditionDuplicate}
              sampleData={sampleData}
              level={level + 1}
            />
          ))}

          {/* Empty state */}
          {group.conditions.length === 0 && group.groups.length === 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              No conditions or groups. Add a condition or group to get started.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Main Advanced Condition Editor Component
export const AdvancedConditionEditor: React.FC<AdvancedConditionEditorProps> = ({
  conditionStructure,
  onConditionStructureChange,
  className = '',
  showDataPreview = true,
  sampleData
}) => {
  const [localStructure, setLocalStructure] = useState<AdvancedConditionStructure>(conditionStructure);
  const [previewData, setPreviewData] = useState<Record<string, any>>(sampleData || {});

  // Generate sample data for preview
  const generateSampleData = () => {
    const data: Record<string, any> = {};
    Object.entries(localStructure.availableFields).forEach(([fieldName, field]) => {
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
    if (!sampleData) {
      generateSampleData();
    }
  }, [localStructure.availableFields, sampleData]);

  // Helper functions for managing groups and conditions
  const addCondition = (groupId: string) => {
    const newCondition: DataCondition = {
      id: `condition_${Date.now()}_${Math.random()}`,
      field: '',
      operator: ConditionOperator.EQUALS,
      value: '',
      enabled: true,
      description: ''
    };

    const addConditionToGroup = (group: ConditionGroup): ConditionGroup => {
      if (group.id === groupId) {
        return { ...group, conditions: [...group.conditions, newCondition] };
      }
      return {
        ...group,
        groups: group.groups.map(addConditionToGroup)
      };
    };

    const updatedStructure = {
      ...localStructure,
      rootGroup: addConditionToGroup(localStructure.rootGroup)
    };

    setLocalStructure(updatedStructure);
    onConditionStructureChange(updatedStructure);
  };

  const addGroup = (parentGroupId: string) => {
    const newGroup: ConditionGroup = {
      id: `group_${Date.now()}_${Math.random()}`,
      name: `Group ${Date.now()}`,
      operator: 'AND',
      conditions: [],
      groups: [],
      enabled: true,
      collapsed: false
    };

    const addGroupToParent = (group: ConditionGroup): ConditionGroup => {
      if (group.id === parentGroupId) {
        return { ...group, groups: [...group.groups, newGroup] };
      }
      return {
        ...group,
        groups: group.groups.map(addGroupToParent)
      };
    };

    const updatedStructure = {
      ...localStructure,
      rootGroup: addGroupToParent(localStructure.rootGroup)
    };

    setLocalStructure(updatedStructure);
    onConditionStructureChange(updatedStructure);
  };

  const updateGroup = (groupId: string, updates: Partial<ConditionGroup>) => {
    const updateGroupById = (group: ConditionGroup): ConditionGroup => {
      if (group.id === groupId) {
        return { ...group, ...updates };
      }
      return {
        ...group,
        groups: group.groups.map(updateGroupById)
      };
    };

    const updatedStructure = {
      ...localStructure,
      rootGroup: updateGroupById(localStructure.rootGroup)
    };

    setLocalStructure(updatedStructure);
    onConditionStructureChange(updatedStructure);
  };

  const removeGroup = (groupId: string) => {
    const removeGroupById = (group: ConditionGroup): ConditionGroup => {
      return {
        ...group,
        groups: group.groups.filter(g => g.id !== groupId).map(removeGroupById)
      };
    };

    const updatedStructure = {
      ...localStructure,
      rootGroup: removeGroupById(localStructure.rootGroup)
    };

    setLocalStructure(updatedStructure);
    onConditionStructureChange(updatedStructure);
  };

  const duplicateGroup = (groupId: string) => {
    const duplicateGroupById = (group: ConditionGroup): ConditionGroup => {
      if (group.id === groupId) {
        const duplicatedGroup: ConditionGroup = {
          ...group,
          id: `group_${Date.now()}_${Math.random()}`,
          name: `${group.name} (Copy)`,
          conditions: group.conditions.map(c => ({
            ...c,
            id: `condition_${Date.now()}_${Math.random()}`
          })),
          groups: group.groups.map(g => ({
            ...g,
            id: `group_${Date.now()}_${Math.random()}`
          }))
        };
        return { ...group, groups: [...group.groups, duplicatedGroup] };
      }
      return {
        ...group,
        groups: group.groups.map(duplicateGroupById)
      };
    };

    const updatedStructure = {
      ...localStructure,
      rootGroup: duplicateGroupById(localStructure.rootGroup)
    };

    setLocalStructure(updatedStructure);
    onConditionStructureChange(updatedStructure);
  };

  const updateCondition = (groupId: string, conditionId: string, updates: Partial<DataCondition>) => {
    const updateConditionInGroup = (group: ConditionGroup): ConditionGroup => {
      if (group.id === groupId) {
        return {
          ...group,
          conditions: group.conditions.map(c =>
            c.id === conditionId ? { ...c, ...updates } : c
          )
        };
      }
      return {
        ...group,
        groups: group.groups.map(updateConditionInGroup)
      };
    };

    const updatedStructure = {
      ...localStructure,
      rootGroup: updateConditionInGroup(localStructure.rootGroup)
    };

    setLocalStructure(updatedStructure);
    onConditionStructureChange(updatedStructure);
  };

  const removeCondition = (groupId: string, conditionId: string) => {
    const removeConditionFromGroup = (group: ConditionGroup): ConditionGroup => {
      if (group.id === groupId) {
        return {
          ...group,
          conditions: group.conditions.filter(c => c.id !== conditionId)
        };
      }
      return {
        ...group,
        groups: group.groups.map(removeConditionFromGroup)
      };
    };

    const updatedStructure = {
      ...localStructure,
      rootGroup: removeConditionFromGroup(localStructure.rootGroup)
    };

    setLocalStructure(updatedStructure);
    onConditionStructureChange(updatedStructure);
  };

  const duplicateCondition = (groupId: string, conditionId: string) => {
    const duplicateConditionInGroup = (group: ConditionGroup): ConditionGroup => {
      if (group.id === groupId) {
        const condition = group.conditions.find(c => c.id === conditionId);
        if (condition) {
          const duplicatedCondition: DataCondition = {
            ...condition,
            id: `condition_${Date.now()}_${Math.random()}`,
            description: condition.description ? `${condition.description} (Copy)` : 'Copy'
          };
          return {
            ...group,
            conditions: [...group.conditions, duplicatedCondition]
          };
        }
      }
      return {
        ...group,
        groups: group.groups.map(duplicateConditionInGroup)
      };
    };

    const updatedStructure = {
      ...localStructure,
      rootGroup: duplicateConditionInGroup(localStructure.rootGroup)
    };

    setLocalStructure(updatedStructure);
    onConditionStructureChange(updatedStructure);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Advanced Condition Editor</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => addCondition(localStructure.rootGroup.id)}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
          >
            <Plus className="w-3 h-3 mr-1 inline" />
            Add Condition
          </button>
          <button
            onClick={() => addGroup(localStructure.rootGroup.id)}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
          >
            <FolderOpen className="w-3 h-3 mr-1 inline" />
            Add Group
          </button>
        </div>
      </div>

      {/* Main Condition Structure */}
      <div className="space-y-3">
        <ConditionGroupItem
          group={localStructure.rootGroup}
          availableFields={localStructure.availableFields}
          onUpdate={updateGroup}
          onAddCondition={addCondition}
          onAddGroup={addGroup}
          onRemoveGroup={removeGroup}
          onDuplicateGroup={duplicateGroup}
          onConditionUpdate={updateCondition}
          onConditionRemove={removeCondition}
          onConditionDuplicate={duplicateCondition}
          sampleData={previewData}
        />
      </div>

      {/* Data Preview */}
      {showDataPreview && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Data Preview</h4>
            <button
              onClick={generateSampleData}
              className="px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-xs"
            >
              Regenerate
            </button>
          </div>
          <div className="bg-white border border-gray-200 rounded p-3">
            <pre className="text-xs overflow-auto max-h-32">{JSON.stringify(previewData, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedConditionEditor;
