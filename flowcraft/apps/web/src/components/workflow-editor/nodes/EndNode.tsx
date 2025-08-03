import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@reactflow/core';
import { NodeData } from '@flowcraft/shared-types';
import { Tooltip } from '@flowcraft/ui';

interface EndNodeData extends NodeData {
  resultType?: 'success' | 'error' | 'partial';
  outputData?: Record<string, any>;
}

const EndNode: React.FC<NodeProps<EndNodeData>> = ({ data, selected, dragging }) => {
  const getResultColor = () => {
    switch (data.resultType) {
      case 'success':
        return 'from-green-400 to-green-600';
      case 'error':
        return 'from-red-400 to-red-600';
      case 'partial':
        return 'from-yellow-400 to-yellow-600';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

  const getResultIcon = () => {
    switch (data.resultType) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'partial':
        return '⚠';
      default:
        return '●';
    }
  };

  const isValid = data.validation?.isValid ?? true;
  const tooltipContent = (
    <div>
      <div className="font-bold mb-1">{data.label || 'End Node'}</div>
      <div className="text-xs">
        <div><strong>Type:</strong> End</div>
        <div><strong>Result:</strong> {data.resultType || 'Not set'}</div>
        <div><strong>Status:</strong> <span className={isValid ? 'text-green-500' : 'text-red-500'}>{isValid ? 'Valid' : 'Invalid'}</span></div>
      </div>
    </div>
  );

  return (
    <Tooltip content={tooltipContent}>
      <div
        className={`
          relative bg-gradient-to-br ${getResultColor()}
          rounded-lg shadow-lg border-2 p-4 min-w-[120px]
          transition-all duration-200 ease-in-out
          ${selected ? 'border-blue-500 shadow-xl scale-105' : 'border-gray-300'}
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
            <span className="text-gray-600 text-lg font-bold">
              {getResultIcon()}
            </span>
          </div>
        </div>

        {/* Node Label */}
        <div className="text-center">
          <h3 className="text-white font-semibold text-sm mb-1">
            {data.label || 'End'}
          </h3>
          {data.description && (
            <p className="text-white text-xs opacity-80">{data.description}</p>
          )}
        </div>

        {/* Result Type Badge */}
        {data.resultType && (
          <div className="mt-2 text-center">
            <span className="inline-block bg-white bg-opacity-20 text-white text-xs px-2 py-1 rounded-full">
              {data.resultType}
            </span>
          </div>
        )}

        {/* Input Handle */}
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 bg-white border-2 border-gray-600"
          style={{ top: '50%', transform: 'translateY(-50%)' }}
        />

        {/* Node Status Indicator */}
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-white rounded-full opacity-60"></div>
        </div>

        {/* Validation Status */}
        {data.validation && !data.validation.isValid && (
          <div className="absolute -top-1 -right-1">
            <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">!</span>
            </div>
          </div>
        )}

        {/* Output Data Indicator */}
        {data.outputData && Object.keys(data.outputData).length > 0 && (
          <div className="absolute bottom-2 right-2">
            <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center">
              <span className="text-gray-600 text-xs">📊</span>
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

export default memo(EndNode);
