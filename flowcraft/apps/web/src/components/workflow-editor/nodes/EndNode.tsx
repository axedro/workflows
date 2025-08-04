import React, { memo } from 'react';
import { NodeProps } from '@reactflow/core';
import { BaseNodeData, getNodePorts, NodeType, getNodeSchema } from '@flowcraft/shared-types';
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
  const schema = getNodeSchema(NodeType.END);
  
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
          <div className="w-3 h-3 bg-blue-400 rounded-full" title="Output configured" />
        )}
        {hasNotificationConfig && (
          <div className="w-3 h-3 bg-green-400 rounded-full" title="Notifications configured" />
        )}
        {hasDataRetention && (
          <div className="w-3 h-3 bg-purple-400 rounded-full" title="Data retention enabled" />
        )}
        {hasEmailNotification && (
          <div className="w-3 h-3 bg-green-400 rounded-full" title="Email notifications" />
        )}
        {hasSlackNotification && (
          <div className="w-3 h-3 bg-purple-400 rounded-full" title="Slack notifications" />
        )}
        {hasWebhookNotification && (
          <div className="w-3 h-3 bg-indigo-400 rounded-full" title="Webhook notifications" />
        )}
        {hasCustomFormat && (
          <div className="w-3 h-3 bg-orange-400 rounded-full" title="Custom format" />
        )}
      </div>

      {/* Indicador de campos de entrada */}
      <div className="absolute bottom-2 left-2 text-xs text-white opacity-75">
        {Object.keys(schema.input).length} fields in
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
