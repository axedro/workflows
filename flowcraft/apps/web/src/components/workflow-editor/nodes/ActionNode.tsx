import React, { memo } from 'react';
import { NodeProps } from '@reactflow/core';
import { BaseNodeData, getNodePorts, NodeType } from '@flowcraft/shared-types';
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

const ActionNode: React.FC<NodeProps<ActionNodeData>> = ({ data, selected, type }) => {
  const isValid = data.validation?.isValid ?? true;
  
  // Usar los puertos que se pasan en data, o obtenerlos del tipo de nodo como fallback
  const nodeType = type as NodeType;
  const inputPorts = data.inputPorts || getNodePorts(nodeType)?.filter(port => port.type === 'input') || [];
  const outputPorts = data.outputPorts || getNodePorts(nodeType)?.filter(port => port.type === 'output') || [];
  const defaultPorts = [...inputPorts, ...outputPorts];

  
  // Configuración específica por tipo de acción
  const getActionIcon = () => {
    // Primero verificar el tipo de nodo real
    switch (nodeType) {
      case NodeType.HTTP_REQUEST:
        return '🌐';
      case NodeType.EMAIL:
        return '📧';
      case NodeType.SLACK:
        return '💬';
      case NodeType.DATA_TRANSFORM:
        return '🔄';
      case NodeType.TIMER:
        return '⏰';
      case NodeType.WEBHOOK:
        return '🔗';
      case NodeType.LOOP:
        return '🔄';
      default:
        // Fallback a actionType si es un ACTION genérico
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
    }
  };

  const getActionColor = () => {
    // Primero verificar el tipo de nodo real
    switch (nodeType) {
      case NodeType.HTTP_REQUEST:
        return 'from-blue-400 to-blue-600';
      case NodeType.EMAIL:
        return 'from-green-400 to-green-600';
      case NodeType.SLACK:
        return 'from-purple-400 to-purple-600';
      case NodeType.DATA_TRANSFORM:
        return 'from-orange-400 to-orange-600';
      case NodeType.TIMER:
        return 'from-yellow-400 to-yellow-600';
      case NodeType.WEBHOOK:
        return 'from-indigo-400 to-indigo-600';
      case NodeType.LOOP:
        return 'from-pink-400 to-pink-600';
      default:
        // Fallback a actionType si es un ACTION genérico
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
    }
  };

  const getActionLabel = () => {
    // Primero verificar el tipo de nodo real
    switch (nodeType) {
      case NodeType.HTTP_REQUEST:
        return 'HTTP Request';
      case NodeType.EMAIL:
        return 'Send Email';
      case NodeType.SLACK:
        return 'Slack Message';
      case NodeType.DATA_TRANSFORM:
        return 'Transform Data';
      case NodeType.TIMER:
        return 'Timer';
      case NodeType.WEBHOOK:
        return 'Webhook';
      case NodeType.LOOP:
        return 'Loop';
      default:
        // Fallback a actionType si es un ACTION genérico
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
        relative rounded-lg shadow-lg border-2 p-4 w-36 h-36
        ${!isValid ? 
          (selected ? 'border-red-500 border-4 bg-red-100 ring-4 ring-blue-300' : 'border-red-500 border-4 bg-red-100 ring-2 ring-red-300') :
          (selected ? 'border-blue-500 bg-gradient-to-br ' + getActionColor() + ' ring-2 ring-blue-300' : 
           'border-blue-300 bg-gradient-to-br ' + getActionColor())}
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
