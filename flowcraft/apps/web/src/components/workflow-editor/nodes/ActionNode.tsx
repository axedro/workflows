import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@reactflow/core';
import { BaseNodeData, getNodePorts, NodeType } from '@flowcraft/shared-types';
import { Tooltip } from '@flowcraft/ui';
import DataPortHandle from './DataPortHandle';

interface ActionNodeData extends BaseNodeData {
  actionType?: 'http' | 'email' | 'slack' | 'transform' | 'custom';
  status?: 'idle' | 'running' | 'success' | 'error';
  retryCount?: number;
  maxRetries?: number;
}

const ActionNode: React.FC<NodeProps<ActionNodeData>> = ({ data, selected, dragging, id }) => {
  const isValid = data.validation?.isValid ?? true;
  
  // Get default ports for action node
  const defaultPorts = getNodePorts(NodeType.ACTION);
  const dataPorts = data.inputPorts || data.outputPorts || defaultPorts;

  const tooltipContent = (
    <div>
      <div className="font-bold mb-1">{data.label || 'Action Node'}</div>
      <div className="text-xs">
        <div><strong>Type:</strong> Action</div>
        <div><strong>Action:</strong> {data.actionType || 'Custom'}</div>
        <div><strong>Status:</strong> <span className={isValid ? 'text-green-500' : 'text-red-500'}>{isValid ? 'Valid' : 'Invalid'}</span></div>
        <div><strong>Ports:</strong> {dataPorts.length}</div>
        {data.dataSchema && (
          <div><strong>Data Schema:</strong> Available</div>
        )}
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
          relative bg-gradient-to-br from-blue-400 to-blue-600 
          rounded-lg shadow-lg border-2 p-4 min-w-[120px]
          transition-all duration-200 ease-in-out
          ${selected ? 'border-blue-500 shadow-xl scale-105' : (isValid ? 'border-blue-300' : 'border-red-500')}
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
            <span className="text-blue-600 text-lg font-bold">⚙️</span>
          </div>
        </div>

        {/* Node Label */}
        <div className="text-center">
          <h3 className="text-white font-semibold text-sm mb-1">
            {data.label || 'Action'}
          </h3>
          {data.description && (
            <p className="text-blue-100 text-xs opacity-80">
              {data.description}
            </p>
          )}
        </div>

        {/* Action Type Badge */}
        {data.actionType && (
          <div className="mt-2 text-center">
            <span className="inline-block bg-white bg-opacity-20 text-white text-xs px-2 py-1 rounded-full">
              {data.actionType}
            </span>
          </div>
        )}

        {/* Status Badge */}
        {data.status && data.status !== 'idle' && (
          <div className="mt-1 text-center">
            <span className={`inline-block text-white text-xs px-2 py-1 rounded-full ${
              data.status === 'success' ? 'bg-green-500' :
              data.status === 'error' ? 'bg-red-500' :
              data.status === 'running' ? 'bg-yellow-500' :
              'bg-gray-500'
            }`}>
              {data.status}
            </span>
          </div>
        )}

        {/* Data Ports */}
        {dataPorts.map((port: any) => (
          <DataPortHandle
            key={port.id}
            port={port}
            nodeId={id || 'action-node'}
            isConnected={port.connected}
            validation={port.validation}
            onPortClick={handlePortClick}
            showTooltip={true}
          />
        ))}

        {/* Legacy Handles (for backward compatibility) */}
        {dataPorts.length === 0 && (
          <>
            <Handle
              type="target"
              position={Position.Left}
              className="w-3 h-3 bg-white border-2 border-blue-600"
              style={{ top: '50%', transform: 'translateY(-50%)' }}
            />
            <Handle
              type="source"
              position={Position.Right}
              className="w-3 h-3 bg-white border-2 border-blue-600"
              style={{ top: '50%', transform: 'translateY(-50%)' }}
            />
          </>
        )}

        {/* Node Status Indicator */}
        <div className="absolute top-2 right-2">
          <div className={`w-2 h-2 rounded-full ${
            data.status === 'success' ? 'bg-green-300' :
            data.status === 'error' ? 'bg-red-300' :
            data.status === 'running' ? 'bg-yellow-300 animate-pulse' :
            'bg-blue-300'
          }`}></div>
        </div>

        {/* Validation Status */}
        {data.validation && !data.validation.isValid && (
          <div className="absolute -top-1 -right-1">
            <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">!</span>
            </div>
          </div>
        )}

        {/* Data Schema Indicator */}
        {data.dataSchema && (
          <div className="absolute bottom-2 left-2">
            <div className="w-3 h-3 bg-purple-400 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">🔄</span>
            </div>
          </div>
        )}

        {/* Input/Output Ports Indicator */}
        {(data.inputPorts || data.outputPorts) && (
          <div className="absolute bottom-2 right-2">
            <div className="w-3 h-3 bg-green-400 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">📊</span>
            </div>
          </div>
        )}

        {/* Retry Count Indicator */}
        {data.retryCount && data.retryCount > 0 && (
          <div className="absolute top-2 left-2">
            <div className="w-4 h-4 bg-orange-400 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">{data.retryCount}</span>
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

export default memo(ActionNode);
