import React, { memo } from 'react';
import { NodeProps } from '@reactflow/core';
import { BaseNodeData, getNodePorts, NodeType, getNodeSchema } from '@flowcraft/shared-types';
import DataPortHandle from './DataPortHandle';

interface ActionNodeData extends BaseNodeData {
  actionType?: 'http' | 'email' | 'slack' | 'transform' | 'custom';
  actionConfig?: {
    http?: {
      url?: string;
      method?: string;
      headers?: Record<string, string>;
      body?: any;
    };
    email?: {
      to?: string;
      subject?: string;
      template?: string;
    };
    slack?: {
      channel?: string;
      message?: string;
      attachments?: any[];
    };
    transform?: {
      operation?: 'map' | 'filter' | 'reduce' | 'custom';
      expression?: string;
    };
    custom?: {
      script?: string;
      language?: 'javascript' | 'python';
    };
  };
  retryConfig?: {
    maxRetries?: number;
    retryDelay?: number;
    backoffMultiplier?: number;
  };
}

const ActionNode: React.FC<NodeProps<ActionNodeData>> = ({ data, selected }) => {
  const isValid = data.validation?.isValid ?? true;
  const defaultPorts = getNodePorts(NodeType.ACTION);
  const schema = getNodeSchema(NodeType.ACTION);
  
  // Configuración específica por tipo de acción
  const getActionIcon = () => {
    switch (data.actionType) {
      case 'http':
        return '🌐';
      case 'email':
        return '📧';
      case 'slack':
        return '💬';
      case 'transform':
        return '🔄';
      case 'custom':
        return '⚙️';
      default:
        return '⚙️';
    }
  };

  const getActionColor = () => {
    switch (data.actionType) {
      case 'http':
        return 'from-blue-400 to-blue-600';
      case 'email':
        return 'from-green-400 to-green-600';
      case 'slack':
        return 'from-purple-400 to-purple-600';
      case 'transform':
        return 'from-orange-400 to-orange-600';
      case 'custom':
        return 'from-gray-400 to-gray-600';
      default:
        return 'from-blue-400 to-blue-600';
    }
  };

  const getActionLabel = () => {
    switch (data.actionType) {
      case 'http':
        return 'HTTP Request';
      case 'email':
        return 'Send Email';
      case 'slack':
        return 'Slack Message';
      case 'transform':
        return 'Transform Data';
      case 'custom':
        return 'Custom Action';
      default:
        return data.label || 'Action';
    }
  };

  // Indicadores visuales específicos
  const hasActionConfig = data.actionConfig && Object.keys(data.actionConfig).length > 0;
  const hasRetryConfig = data.retryConfig && (data.retryConfig.maxRetries || data.retryConfig.retryDelay);
  const hasHttpConfig = data.actionConfig?.http && data.actionConfig.http.url;
  const hasEmailConfig = data.actionConfig?.email && data.actionConfig.email.to;
  const hasSlackConfig = data.actionConfig?.slack && data.actionConfig.slack.channel;
  const hasTransformConfig = data.actionConfig?.transform && data.actionConfig.transform.operation;

  return (
    <div
      className={`
        relative bg-gradient-to-br ${getActionColor()}
        rounded-lg shadow-lg border-2 p-4 w-36 h-36
        ${selected ? 'border-blue-500' : (isValid ? 'border-blue-300' : 'border-red-500')}
      `}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-2">
          <span className="text-blue-600 text-2xl font-bold">{getActionIcon()}</span>
        </div>

        <div className="text-center">
          <h3 className="text-white font-semibold text-lg">
            {getActionLabel()}
          </h3>
        </div>
      </div>

      {/* Indicadores visuales específicos */}
      <div className="absolute top-2 right-2 flex flex-col gap-1">
        {hasActionConfig && (
          <div className="w-3 h-3 bg-green-400 rounded-full border border-white shadow-sm" />
        )}
        {hasRetryConfig && (
          <div className="w-3 h-3 bg-yellow-400 rounded-full border border-white shadow-sm" />
        )}
        {hasHttpConfig && (
          <div className="w-3 h-3 bg-blue-400 rounded-full border border-white shadow-sm" />
        )}
        {hasEmailConfig && (
          <div className="w-3 h-3 bg-green-400 rounded-full border border-white shadow-sm" />
        )}
        {hasSlackConfig && (
          <div className="w-3 h-3 bg-purple-400 rounded-full border border-white shadow-sm" />
        )}
        {hasTransformConfig && (
          <div className="w-3 h-3 bg-orange-400 rounded-full border border-white shadow-sm" />
        )}
      </div>

      {/* Indicador de campos de entrada/salida */}
      <div className="absolute bottom-2 left-2 text-xs text-white opacity-75">
        {Object.keys(schema.input).length} in / {Object.keys(schema.output).length} out
      </div>

      {/* Visualización de datos - Campos de entrada */}
      <div className="absolute top-2 left-2">
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

      {/* Visualización de datos - Campos de salida */}
      <div className="absolute bottom-2 right-2">
        <div className="bg-black bg-opacity-30 rounded px-2 py-1">
          <div className="text-xs text-white font-semibold">Output:</div>
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.keys(schema.output).slice(0, 2).map(fieldKey => (
              <div key={fieldKey} className="text-xs bg-green-500 bg-opacity-80 text-white px-1 rounded">
                {fieldKey}
              </div>
            ))}
            {Object.keys(schema.output).length > 2 && (
              <div className="text-xs bg-green-500 bg-opacity-80 text-white px-1 rounded">
                +{Object.keys(schema.output).length - 2}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Indicador de transformación */}
      {hasTransformConfig && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="bg-orange-500 bg-opacity-90 rounded-full w-8 h-8 flex items-center justify-center">
            <span className="text-white text-xs font-bold">T</span>
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

export default memo(ActionNode);
