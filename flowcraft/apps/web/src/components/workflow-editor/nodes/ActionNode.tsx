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
          <div className="w-3 h-3 bg-green-400 rounded-full" title="Action configured" />
        )}
        {hasRetryConfig && (
          <div className="w-3 h-3 bg-yellow-400 rounded-full" title="Retry configured" />
        )}
        {hasHttpConfig && (
          <div className="w-3 h-3 bg-blue-400 rounded-full" title="HTTP configured" />
        )}
        {hasEmailConfig && (
          <div className="w-3 h-3 bg-green-400 rounded-full" title="Email configured" />
        )}
        {hasSlackConfig && (
          <div className="w-3 h-3 bg-purple-400 rounded-full" title="Slack configured" />
        )}
        {hasTransformConfig && (
          <div className="w-3 h-3 bg-orange-400 rounded-full" title="Transform configured" />
        )}
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

export default memo(ActionNode);
