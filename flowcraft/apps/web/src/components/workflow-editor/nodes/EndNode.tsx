import React, { memo } from 'react';
import { NodeProps } from '@reactflow/core';
import { BaseNodeData, getNodePorts, NodeType } from '@flowcraft/shared-types';
import DataPortHandle from './DataPortHandle';

interface EndNodeData extends BaseNodeData {
  resultType?: 'success' | 'error' | 'partial';
  outputConfig?: {
    format?: 'json' | 'xml' | 'csv' | 'custom';
    includeMetadata?: boolean;
    includeTimestamps?: boolean;
    customFormat?: {
      template?: string;
      variables?: Record<string, string>;
    };
  };
  notificationConfig?: {
    email?: {
      enabled?: boolean;
      recipients?: string[];
      template?: string;
    };
    slack?: {
      enabled?: boolean;
      channel?: string;
      message?: string;
    };
    webhook?: {
      enabled?: boolean;
      endpoint?: string;
      method?: string;
      headers?: Record<string, string>;
    };
  };
  dataRetention?: {
    enabled?: boolean;
    duration?: number; // days
    archiveTo?: 'database' | 'file' | 'cloud';
  };
}

const EndNode: React.FC<NodeProps<EndNodeData>> = ({ data, selected }) => {
  const isValid = data.validation?.isValid ?? true;
  const defaultPorts = getNodePorts(NodeType.END);

  
  // Configuración específica por tipo de resultado
  const getEndIcon = () => {
    switch (data.resultType) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'partial':
        return '⚠️';
      default:
        return '⏹';
    }
  };

  const getEndColor = () => {
    switch (data.resultType) {
      case 'success':
        return 'from-green-400 to-green-600';
      case 'error':
        return 'from-red-400 to-red-600';
      case 'partial':
        return 'from-yellow-400 to-yellow-600';
      default:
        return 'from-red-400 to-red-600';
    }
  };

  const getEndLabel = () => {
    switch (data.resultType) {
      case 'success':
        return 'Success End';
      case 'error':
        return 'Error End';
      case 'partial':
        return 'Partial End';
      default:
        return data.label || 'End';
    }
  };

  // Indicadores visuales específicos
  const hasOutputConfig = data.outputConfig && Object.keys(data.outputConfig).length > 0;
  const hasNotificationConfig = data.notificationConfig && Object.keys(data.notificationConfig).length > 0;
  const hasDataRetention = data.dataRetention && data.dataRetention.enabled;
  const hasEmailNotification = data.notificationConfig?.email && data.notificationConfig.email.enabled;
  const hasSlackNotification = data.notificationConfig?.slack && data.notificationConfig.slack.enabled;
  const hasWebhookNotification = data.notificationConfig?.webhook && data.notificationConfig.webhook.enabled;
  const hasCustomFormat = data.outputConfig?.customFormat && data.outputConfig.customFormat.template;

  return (
    <div
      className={`
        relative bg-gradient-to-br ${getEndColor()}
        rounded-lg shadow-lg border-2 p-4 w-36 h-36
        flex flex-col items-center justify-center
        ${selected ? 'border-blue-500' : (isValid ? 'border-red-300' : 'border-red-500')}
      `}
    >
      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-2">
        <span className="text-red-600 text-2xl font-bold">{getEndIcon()}</span>
      </div>

      <div className="text-center">
        <h3 className="text-white font-semibold text-lg">
          {getEndLabel()}
        </h3>
      </div>

      {/* Indicadores visuales específicos */}
      <div className="absolute top-2 right-2 flex flex-col gap-1">
        {hasOutputConfig && (
          <div className="w-3 h-3 bg-blue-400 rounded-full border border-white shadow-sm" />
        )}
        {hasNotificationConfig && (
          <div className="w-3 h-3 bg-green-400 rounded-full border border-white shadow-sm" />
        )}
        {hasDataRetention && (
          <div className="w-3 h-3 bg-purple-400 rounded-full border border-white shadow-sm" />
        )}
        {hasEmailNotification && (
          <div className="w-3 h-3 bg-green-400 rounded-full border border-white shadow-sm" />
        )}
        {hasSlackNotification && (
          <div className="w-3 h-3 bg-purple-400 rounded-full border border-white shadow-sm" />
        )}
        {hasWebhookNotification && (
          <div className="w-3 h-3 bg-indigo-400 rounded-full border border-white shadow-sm" />
        )}
        {hasCustomFormat && (
          <div className="w-3 h-3 bg-orange-400 rounded-full border border-white shadow-sm" />
        )}
      </div>





      {/* Indicador de resultado final */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className={`rounded-full w-8 h-8 flex items-center justify-center ${
          data.resultType === 'success' ? 'bg-green-500' :
          data.resultType === 'error' ? 'bg-red-500' :
          data.resultType === 'partial' ? 'bg-yellow-500' :
          'bg-gray-500'
        } bg-opacity-90`}>
          <span className="text-white text-xs font-bold">
            {data.resultType === 'success' ? '✓' :
             data.resultType === 'error' ? '✗' :
             data.resultType === 'partial' ? '!' : '●'}
          </span>
        </div>
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

export default memo(EndNode);
