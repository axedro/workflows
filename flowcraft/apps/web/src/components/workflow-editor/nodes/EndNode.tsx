import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@reactflow/core';
import { BaseNodeData, getNodePorts, NodeType } from '@flowcraft/shared-types';
import { Tooltip } from '@flowcraft/ui';
import DataPortHandle from './DataPortHandle';

interface EndNodeData extends BaseNodeData {
  resultType?: 'success' | 'error' | 'partial';
  outputData?: Record<string, any>;
}

const EndNode: React.FC<NodeProps<EndNodeData>> = ({ data, selected, dragging, id }) => {
  const isValid = data.validation?.isValid ?? true;
  
  // Get default ports for end node
  const defaultPorts = getNodePorts(NodeType.END);
  const dataPorts = data.inputPorts || defaultPorts;

  const tooltipContent = (
    <div>
      <div className="font-bold mb-1">{data.label || 'End Node'}</div>
      <div className="text-xs">
        <div><strong>Type:</strong> End</div>
        <div><strong>Result:</strong> {data.resultType || 'success'}</div>
        <div><strong>Status:</strong> <span className={isValid ? 'text-green-500' : 'text-red-500'}>{isValid ? 'Valid' : 'Invalid'}</span></div>
        <div><strong>Input Fields:</strong> {dataPorts.length}</div>
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
          relative bg-gradient-to-br from-red-400 to-red-600 
          rounded-lg shadow-lg border-2 p-4 min-w-[120px]
          transition-all duration-200 ease-in-out
          ${selected ? 'border-blue-500 shadow-xl scale-105' : (isValid ? 'border-red-300' : 'border-red-500')}
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
            <span className="text-red-600 text-lg font-bold">⏹</span>
          </div>
        </div>

        {/* Node Label */}
        <div className="text-center">
          <h3 className="text-white font-semibold text-sm mb-1">
            {data.label || 'End'}
          </h3>
          {data.description && (
            <p className="text-red-100 text-xs opacity-80">
              {data.description}
            </p>
          )}
        </div>

        {/* Result Type Badge */}
        {data.resultType && (
          <div className="mt-2 text-center">
            <span className={`inline-block text-white text-xs px-2 py-1 rounded-full ${
              data.resultType === 'success' ? 'bg-green-500' :
              data.resultType === 'error' ? 'bg-red-500' :
              'bg-yellow-500'
            }`}>
              {data.resultType}
            </span>
          </div>
        )}

        {/* Data Ports */}
        {dataPorts.map((port: any) => (
          <DataPortHandle
            key={port.id}
            port={port}
            nodeId={id || 'end-node'}
            isConnected={port.connected}
            validation={port.validation}
            onPortClick={handlePortClick}
            showTooltip={true}
          />
        ))}

        {/* Legacy Input Handle (for backward compatibility) */}
        {dataPorts.length === 0 && (
          <Handle
            type="target"
            position={Position.Left}
            className="w-3 h-3 bg-white border-2 border-red-600"
            style={{ top: '50%', transform: 'translateY(-50%)' }}
          />
        )}

        {/* Node Status Indicator */}
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-red-300 rounded-full"></div>
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
            <div className="w-3 h-3 bg-blue-400 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">📊</span>
            </div>
          </div>
        )}

        {/* Input Ports Indicator */}
        {data.inputPorts && (
          <div className="absolute bottom-2 right-2">
            <div className="w-3 h-3 bg-green-400 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">📤</span>
            </div>
          </div>
        )}

        {/* Output Data Indicator */}
        {data.outputData && Object.keys(data.outputData).length > 0 && (
          <div className="absolute top-2 left-2">
            <div className="w-3 h-3 bg-purple-400 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">📋</span>
            </div>
          </div>
        )}

        {/* Drag Indicator */}
        {dragging && (
          <div className="absolute -top-2 -left-2">
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
              <span className="text-white text-xs">🖱️</span>
            </div>
          </div>
        )}
      </div>
    </Tooltip>
  );
};

export default memo(EndNode);
