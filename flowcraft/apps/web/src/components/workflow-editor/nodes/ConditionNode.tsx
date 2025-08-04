import React, { memo } from 'react';
import { NodeProps } from '@reactflow/core';
import { BaseNodeData, getNodePorts, NodeType, getNodeSchema } from '@flowcraft/shared-types';
import DataPortHandle from './DataPortHandle';

interface ConditionNodeData extends BaseNodeData {
  condition?: {
    variable: string;
    operator: string;
    value: string;
  };
  conditionConfig?: {
    type?: 'simple' | 'complex' | 'regex' | 'custom';
    conditions?: Array<{
      field: string;
      operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'regex' | 'custom';
      value: any;
      logicalOperator?: 'AND' | 'OR';
    }>;
    customExpression?: string;
    caseSensitive?: boolean;
  };
  outputConfig?: {
    trueBranch?: {
      includeFields?: string[];
      excludeFields?: string[];
      transformFields?: Record<string, string>;
    };
    falseBranch?: {
      includeFields?: string[];
      excludeFields?: string[];
      transformFields?: Record<string, string>;
    };
  };
}

const ConditionNode: React.FC<NodeProps<ConditionNodeData>> = ({ data, selected }) => {
  const isValid = data.validation?.isValid ?? true;
  const defaultPorts = getNodePorts(NodeType.CONDITION);
  const schema = getNodeSchema(NodeType.CONDITION);
  
  // Configuración específica por tipo de condición
  const getConditionIcon = () => {
    const conditionType = data.conditionConfig?.type;
    switch (conditionType) {
      case 'complex':
        return '🔀';
      case 'regex':
        return '🔍';
      case 'custom':
        return '⚙️';
      default:
        return '?';
    }
  };

  const getConditionColor = () => {
    const conditionType = data.conditionConfig?.type;
    switch (conditionType) {
      case 'complex':
        return 'from-purple-400 to-purple-600';
      case 'regex':
        return 'from-indigo-400 to-indigo-600';
      case 'custom':
        return 'from-gray-400 to-gray-600';
      default:
        return 'from-yellow-400 to-orange-600';
    }
  };

  const getConditionLabel = () => {
    const conditionType = data.conditionConfig?.type;
    switch (conditionType) {
      case 'complex':
        return 'Complex Condition';
      case 'regex':
        return 'Regex Condition';
      case 'custom':
        return 'Custom Condition';
      default:
        return data.label || 'Condition';
    }
  };

  // Indicadores visuales específicos
  const hasConditionConfig = data.conditionConfig && Object.keys(data.conditionConfig).length > 0;
  const hasMultipleConditions = data.conditionConfig?.conditions && data.conditionConfig.conditions.length > 1;
  const hasCustomExpression = data.conditionConfig?.customExpression;
  const hasOutputConfig = data.outputConfig && (data.outputConfig.trueBranch || data.outputConfig.falseBranch);
  const hasTrueBranchConfig = data.outputConfig?.trueBranch && Object.keys(data.outputConfig.trueBranch).length > 0;
  const hasFalseBranchConfig = data.outputConfig?.falseBranch && Object.keys(data.outputConfig.falseBranch).length > 0;

  return (
    <div
      className={`
        relative bg-gradient-to-br ${getConditionColor()}
        shadow-lg border-2 w-36 h-36
        flex flex-col items-center justify-center
        ${selected ? 'border-blue-500' : (isValid ? 'border-yellow-300' : 'border-red-500')}
      `}
      style={{
        clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', // Rhombus shape
      }}
    >
      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
        <span className="text-orange-600 text-2xl font-bold">{getConditionIcon()}</span>
      </div>

      <div className="text-center">
        <h3 className="text-white font-semibold text-sm mt-1">
          {getConditionLabel()}
        </h3>
      </div>

      {/* Indicadores visuales específicos */}
      <div className="absolute top-2 right-2 flex flex-col gap-1">
        {hasConditionConfig && (
          <div className="w-3 h-3 bg-green-400 rounded-full border border-white shadow-sm" />
        )}
        {hasMultipleConditions && (
          <div className="w-3 h-3 bg-blue-400 rounded-full border border-white shadow-sm" />
        )}
        {hasCustomExpression && (
          <div className="w-3 h-3 bg-purple-400 rounded-full border border-white shadow-sm" />
        )}
        {hasOutputConfig && (
          <div className="w-3 h-3 bg-yellow-400 rounded-full border border-white shadow-sm" />
        )}
      </div>

      {/* Etiquetas de ramas */}
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
        <div className="text-xs text-white font-bold bg-green-500 px-1 rounded">T</div>
      </div>
      <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
        <div className="text-xs text-white font-bold bg-red-500 px-1 rounded">F</div>
      </div>

      {/* Indicador de campos de entrada/salida */}
      <div className="absolute bottom-2 left-2 text-xs text-white opacity-75">
        {Object.keys(schema.input).length} in / {Object.keys(schema.output).length} out
      </div>
      
      {defaultPorts.map(port => (
        <DataPortHandle
          key={port.id}
          port={port}
        />
      ))}
    </div>
  );
};

export default memo(ConditionNode);
