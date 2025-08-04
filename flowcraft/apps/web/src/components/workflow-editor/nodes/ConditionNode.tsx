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
        shadow-lg border-2 w-40 h-40
        flex flex-col items-center justify-center
        ${selected ? 'border-blue-500' : (isValid ? 'border-yellow-300' : 'border-red-500')}
      `}
      style={{
        clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', // Perfect rhombus shape
        transform: 'rotate(45deg)', // Rotate to make it diamond-shaped
      }}
    >
      {/* Contenido del nodo (rotado de vuelta para que se vea normal) */}
      <div 
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ transform: 'rotate(-45deg)' }}
      >
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
          <span className="text-orange-600 text-2xl font-bold">{getConditionIcon()}</span>
        </div>

        <div className="text-center">
          <h3 className="text-white font-semibold text-sm mt-1">
            {getConditionLabel()}
          </h3>
        </div>
      </div>

      {/* Indicadores visuales específicos */}
      <div 
        className="absolute top-2 right-2 flex flex-col gap-1"
        style={{ transform: 'rotate(-45deg)' }}
      >
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

      {/* Etiquetas de ramas - Posicionadas en las esquinas del rombo */}
      <div 
        className="absolute right-2 top-1/2 transform -translate-y-1/2"
        style={{ transform: 'rotate(-45deg) translateX(50%) translateY(-50%)' }}
      >
        <div className="text-xs text-white font-bold bg-green-500 px-1 rounded">T</div>
      </div>
      <div 
        className="absolute left-2 top-1/2 transform -translate-y-1/2"
        style={{ transform: 'rotate(-45deg) translateX(-50%) translateY(-50%)' }}
      >
        <div className="text-xs text-white font-bold bg-red-500 px-1 rounded">F</div>
      </div>

      {/* Indicador de campos de entrada/salida */}
      <div 
        className="absolute bottom-2 left-2 text-xs text-white opacity-75"
        style={{ transform: 'rotate(-45deg)' }}
      >
        {Object.keys(schema.input).length} in / {Object.keys(schema.output).length} out
      </div>

      {/* Visualización de datos - Campo de entrada */}
      <div 
        className="absolute top-2 left-2"
        style={{ transform: 'rotate(-45deg)' }}
      >
        <div className="bg-black bg-opacity-30 rounded px-2 py-1">
          <div className="text-xs text-white font-semibold">Input:</div>
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.keys(schema.input).slice(0, 2).map(fieldKey => (
              <div key={fieldKey} className="text-xs bg-blue-500 bg-opacity-80 text-white px-1 rounded">
                {fieldKey}
              </div>
            ))}
            {Object.keys(schema.input).length > 2 && (
              <div className="text-xs bg-blue-500 bg-opacity-80 text-white px-1 rounded">
                +{Object.keys(schema.input).length - 2}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visualización de datos - Ramas de salida */}
      <div 
        className="absolute bottom-2 right-2"
        style={{ transform: 'rotate(-45deg)' }}
      >
        <div className="bg-black bg-opacity-30 rounded px-2 py-1">
          <div className="text-xs text-white font-semibold">Branches:</div>
          <div className="flex gap-1 mt-1">
            <div className="text-xs bg-green-500 bg-opacity-80 text-white px-1 rounded">
              True
            </div>
            <div className="text-xs bg-red-500 bg-opacity-80 text-white px-1 rounded">
              False
            </div>
          </div>
          {/* Información específica de ramas */}
          {hasTrueBranchConfig && (
            <div className="text-xs text-green-300 mt-1">
              ✓ Configured
            </div>
          )}
          {hasFalseBranchConfig && (
            <div className="text-xs text-red-300 mt-1">
              ✓ Configured
            </div>
          )}
        </div>
      </div>

      {/* Indicador de condición activa */}
      {hasConditionConfig && (
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          style={{ transform: 'rotate(-45deg) translateX(-50%) translateY(-50%)' }}
        >
          <div className="bg-yellow-500 bg-opacity-90 rounded-full w-6 h-6 flex items-center justify-center">
            <span className="text-white text-xs font-bold">?</span>
          </div>
        </div>
      )}

      {/* Información de condición específica */}
      {hasMultipleConditions && (
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 translate-y-8"
          style={{ transform: 'rotate(-45deg) translateX(-50%)' }}
        >
          <div className="bg-black bg-opacity-30 rounded px-2 py-1">
            <div className="text-xs text-white font-semibold">Multi-Condition</div>
            <div className="text-xs text-blue-300">
              {data.conditionConfig?.conditions?.length || 0} rules
            </div>
          </div>
        </div>
      )}

      {/* Información de expresión personalizada */}
      {hasCustomExpression && (
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-8"
          style={{ transform: 'rotate(-45deg) translateX(-50%)' }}
        >
          <div className="bg-black bg-opacity-30 rounded px-2 py-1">
            <div className="text-xs text-white font-semibold">Custom Expr</div>
            <div className="text-xs text-purple-300">
              Active
            </div>
          </div>
        </div>
      )}
      
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
