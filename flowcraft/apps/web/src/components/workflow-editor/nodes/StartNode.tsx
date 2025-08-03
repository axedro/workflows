import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@reactflow/core';
import { BaseNodeData, getNodePorts, NodeType } from '@flowcraft/shared-types';
import { Tooltip } from '@flowcraft/ui';
import DataPortHandle from './DataPortHandle';

interface StartNodeData extends BaseNodeData {
  triggerType?: 'manual' | 'scheduled' | 'webhook';
  schedule?: string;
  webhookUrl?: string;
}

const StartNode: React.FC<NodeProps<StartNodeData>> = ({ data, selected, dragging, id }) => {
  const isValid = data.validation?.isValid ?? true;
  
  // Get default ports for start node
  const defaultPorts = getNodePorts(NodeType.START);
  const dataPorts = data.outputPorts || defaultPorts;

  const tooltipContent = (
    <div>
      <div className="font-bold mb-1">{data.label || 'Start Node'}</div>
      <div className="text-xs">
        <div><strong>Type:</strong> Start</div>
        <div><strong>Trigger:</strong> {data.triggerType || 'Manual'}</div>
        <div><strong>Status:</strong> <span className={isValid ? 'text-green-500' : 'text-red-500'}>{isValid ? 'Valid' : 'Invalid'}</span></div>
        <div><strong>Output Fields:</strong> {dataPorts.length}</div>
      </div>
    </div>
  );

  const handlePortClick = (port: any) => {
    console.log('Port clicked:', port);
    // TODO: Implement port configuration modal
  };

  return (
    <Tooltip content={tooltipContent}>
      <div
        className={`
          relative bg-gradient-to-br from-green-400 to-green-600 
          rounded-lg shadow-lg border-2 p-4 min-w-[120px]
          transition-all duration-200 ease-in-out
          ${selected ? 'border-blue-500 shadow-xl scale-105' : (isValid ? 'border-green-300' : 'border-red-500')}
          ${dragging ? 'opacity-80 shadow-2xl scale-110 z-50' : 'hover:shadow-xl hover:scale-105'}
          ${dragging ? 'cursor-grabbing' : 'cursor-grab'}
        `}
        style={{
          transform: dragging ? 'rotate(2deg)' : 'rotate(0deg)',
        }}
      >
        {/* Node Header */}
        <div className="flex items-center justify-center mb-2">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <span className="text-green-600 text-lg font-bold">▶</span>
          </div>
        </div>

        {/* Node Label */}
        <div className="text-center">
          <h3 className="text-white font-semibold text-sm mb-1">
            {data.label || 'Start'}
          </h3>
          {data.description && (
            <p className="text-green-100 text-xs opacity-80">
              {data.description}
            </p>
          )}
        </div>

        {/* Trigger Type Badge */}
        {data.triggerType && (
          <div className="mt-2 text-center">
            <span className="inline-block bg-white bg-opacity-20 text-white text-xs px-2 py-1 rounded-full">
              {data.triggerType}
            </span>
          </div>
        )}

        {/* Data Ports */}
        {dataPorts.map((port: any) => (
          <DataPortHandle
            key={port.id}
            port={port}
            nodeId={id || 'start-node'}
            isConnected={port.connected}
            validation={port.validation}
            onPortClick={handlePortClick}
            showTooltip={true}
          />
        ))}

        {/* Legacy Output Handle (for backward compatibility) */}
        {dataPorts.length === 0 && (
          <Handle
            type="source"
            position={Position.Right}
            className="w-3 h-3 bg-white border-2 border-green-600"
            style={{ top: '50%', transform: 'translateY(-50%)' }}
          />
        )}

        {/* Node Status Indicator */}
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
        </div>

        {/* Validation Status */}
        {data.validation && !data.validation.isValid && (
          <div className="absolute -top-1 -right-1">
            <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">!</span>
            </div>
          </div>
        )}

        {/* Data Flow Indicator */}
        {data.dataSchema && Object.keys(data.dataSchema).length > 0 && (
          <div className="absolute bottom-2 left-2">
            <div className="w-3 h-3 bg-blue-400 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">📊</span>
            </div>
          </div>
        )}

        {/* Drag Indicator */}
        {dragging && (
          <div className="absolute -top-2 -left-2">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
              <span className="text-white text-xs">🖱️</span>
            </div>
          </div>
        )}
      </div>
    </Tooltip>
  );
};

export default memo(StartNode);
