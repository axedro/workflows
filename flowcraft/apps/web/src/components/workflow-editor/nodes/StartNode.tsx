import React, { memo } from 'react';
import { NodeProps } from '@reactflow/core';
import { BaseNodeData, getNodePorts, NodeType, getNodeSchema } from '@flowcraft/shared-types';
import DataPortHandle from './DataPortHandle';

interface StartNodeData extends BaseNodeData {
  triggerType?: 'manual' | 'scheduled' | 'webhook';
  initialData?: Record<string, any>;
  scheduleConfig?: {
    cron?: string;
    interval?: number;
    timezone?: string;
  };
  webhookConfig?: {
    endpoint?: string;
    method?: string;
    headers?: Record<string, string>;
  };
}

const StartNode: React.FC<NodeProps<StartNodeData>> = ({ data, selected }) => {
  const isValid = data.validation?.isValid ?? true;
  const defaultPorts = getNodePorts(NodeType.START);
  const schema = getNodeSchema(NodeType.START);
  
  // Configuración específica por tipo de trigger
  const getTriggerIcon = () => {
    switch (data.triggerType) {
      case 'scheduled':
        return '⏰';
      case 'webhook':
        return '🌐';
      default:
        return '▶';
    }
  };

  const getTriggerColor = () => {
    switch (data.triggerType) {
      case 'scheduled':
        return 'from-purple-400 to-purple-600';
      case 'webhook':
        return 'from-indigo-400 to-indigo-600';
      default:
        return 'from-green-400 to-green-600';
    }
  };

  const getTriggerLabel = () => {
    switch (data.triggerType) {
      case 'scheduled':
        return 'Scheduled Start';
      case 'webhook':
        return 'Webhook Start';
      default:
        return data.label || 'Start';
    }
  };

  // Indicadores visuales específicos
  const hasInitialData = data.initialData && Object.keys(data.initialData).length > 0;
  const hasScheduleConfig = data.scheduleConfig && (data.scheduleConfig.cron || data.scheduleConfig.interval);
  const hasWebhookConfig = data.webhookConfig && data.webhookConfig.endpoint;

  return (
    <div
      className={`
        relative bg-gradient-to-br ${getTriggerColor()}
        rounded-lg shadow-lg border-2 p-4 w-36 h-36
        flex flex-col items-center justify-center
        ${selected ? 'border-blue-500' : (isValid ? 'border-green-300' : 'border-red-500')}
      `}
    >
      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-2">
        <span className="text-green-600 text-2xl font-bold">{getTriggerIcon()}</span>
      </div>
      
      <div className="text-center">
        <h3 className="text-white font-semibold text-lg">
          {getTriggerLabel()}
        </h3>
      </div>

      {/* Indicadores visuales específicos */}
      <div className="absolute top-2 right-2 flex flex-col gap-1">
        {hasInitialData && (
          <div className="w-3 h-3 bg-blue-400 rounded-full border border-white shadow-sm" />
        )}
        {hasScheduleConfig && (
          <div className="w-3 h-3 bg-purple-400 rounded-full border border-white shadow-sm" />
        )}
        {hasWebhookConfig && (
          <div className="w-3 h-3 bg-indigo-400 rounded-full border border-white shadow-sm" />
        )}
      </div>

      {/* Indicador de campos de salida */}
      <div className="absolute bottom-2 left-2 text-xs text-white opacity-75">
        {Object.keys(schema.output).length} fields
      </div>

      {/* Visualización de datos - Campos disponibles */}
      <div className="absolute top-2 left-2">
        <div className="bg-black bg-opacity-30 rounded px-2 py-1">
          <div className="text-xs text-white font-semibold">Output Fields:</div>
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.keys(schema.output).slice(0, 3).map(fieldKey => (
              <div key={fieldKey} className="text-xs bg-white bg-opacity-20 text-white px-1 rounded">
                {fieldKey}
              </div>
            ))}
            {Object.keys(schema.output).length > 3 && (
              <div className="text-xs bg-white bg-opacity-20 text-white px-1 rounded">
                +{Object.keys(schema.output).length - 3}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Indicador de tipos de datos */}
      <div className="absolute bottom-2 right-2">
        <div className="bg-black bg-opacity-30 rounded px-2 py-1">
          <div className="text-xs text-white font-semibold">Types:</div>
          <div className="flex gap-1 mt-1">
            {Object.values(schema.output).slice(0, 2).map((field, index) => (
              <div key={index} className="text-xs bg-white bg-opacity-20 text-white px-1 rounded">
                {field.type}
              </div>
            ))}
            {Object.values(schema.output).length > 2 && (
              <div className="text-xs bg-white bg-opacity-20 text-white px-1 rounded">
                +{Object.values(schema.output).length - 2}
              </div>
            )}
          </div>
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

export default memo(StartNode);
