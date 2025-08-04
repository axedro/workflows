import React, { memo } from 'react';
import { NodeProps } from '@reactflow/core';
import { BaseNodeData, getNodePorts, NodeType } from '@flowcraft/shared-types';
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


  return (
    <div
      className={`
        relative bg-gradient-to-br ${getConditionColor()}
        rounded-lg shadow-lg border-2 w-48 h-48
        flex flex-col items-center justify-center
        ${selected ? 'border-blue-500' : (isValid ? 'border-yellow-300' : 'border-red-500')}
      `}
      style={{
        transform: 'rotate(45deg)', // Rotar 45 grados en sentido horario
      }}
    >
      {/* Contenido del nodo (rotado de vuelta para que se vea normal) */}
      <div 
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ transform: 'rotate(-45deg)' }}
      >
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
          <span className="text-orange-600 text-3xl font-bold">{getConditionIcon()}</span>
        </div>

        <div className="text-center">
          <h3 className="text-white font-semibold text-base mt-2">
            {getConditionLabel()}
          </h3>
        </div>
      </div>

      {/* Indicadores visuales específicos */}
      <div 
        className="absolute top-3 right-3 flex flex-col gap-1"
        style={{ transform: 'rotate(-45deg)' }}
      >
        {hasConditionConfig && (
          <div className="w-4 h-4 bg-green-400 rounded-full border border-white shadow-sm" />
        )}
        {hasMultipleConditions && (
          <div className="w-4 h-4 bg-blue-400 rounded-full border border-white shadow-sm" />
        )}
        {hasCustomExpression && (
          <div className="w-4 h-4 bg-purple-400 rounded-full border border-white shadow-sm" />
        )}
        {hasOutputConfig && (
          <div className="w-4 h-4 bg-yellow-400 rounded-full border border-white shadow-sm" />
        )}
      </div>

      {/* Etiquetas de ramas en los vértices */}
      <div 
        className="absolute"
        style={{
          top: '-30px',
          right: '-20px',
          transform: 'rotate(-45deg) translate(50%, -50%)'
        }}
      >
        <div className="text-sm text-white font-bold bg-green-500 px-2 py-1 rounded">T</div>
      </div>
      <div 
        className="absolute"
        style={{
          bottom: '0%',
          left: '-40px',
          transform: 'rotate(-45deg) translate(-50%, 50%)'
        }}
      >
        <div className="text-sm text-white font-bold bg-red-500 px-2 py-1 rounded">F</div>
      </div>







      {/* Indicador de condición activa */}
      {hasConditionConfig && (
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          style={{ transform: 'rotate(-45deg)' }}
        >
          <div className="bg-yellow-500 bg-opacity-90 rounded-full w-8 h-8 flex items-center justify-center">
            <span className="text-white text-sm font-bold">?</span>
          </div>
        </div>
      )}


      
      {/* Conectores con posicionamiento personalizado */}
      {defaultPorts.map(port => {
        if (port.position === 'top') {
          // Conector de entrada en el vértice izquierdo superior
          return (
            <div
              key={port.id}
              className="absolute"
              style={{
                top: '0%',
                left: '0%',
                transform: 'translate(-50%, -50%)'
              }}
            >
              <DataPortHandle port={port} />
            </div>
          );
        }
        
        if (port.position === 'left') {
          // Conector False en el vértice inferior izquierdo
          return (
            <div
              key={port.id}
              className="absolute"
              style={{
                bottom: '0%',
                left: '0%',
                transform: 'translate(-50%, 50%)'
              }}
            >
              <DataPortHandle port={port} />
            </div>
          );
        }
        
        if (port.position === 'right') {
          // Conector True en el vértice superior derecho
          return (
            <div
              key={port.id}
              className="absolute"
              style={{
                top: '0%',
                right: '0%',
                transform: 'translate(50%, -50%)'
              }}
            >
              <DataPortHandle port={port} />
            </div>
          );
        }
        
        // Otros conectores en sus posiciones estándar
        return (
          <DataPortHandle
            key={port.id}
            port={port}
          />
        );
      })}
    </div>
  );
};

export default memo(ConditionNode);
