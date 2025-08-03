import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@reactflow/core';
import { NodeData } from '@flowcraft/shared-types';
import { Tooltip } from '@flowcraft/ui';

interface ActionNodeData extends NodeData {
  actionType?: 'http' | 'email' | 'slack' | 'transform' | 'custom';
  status?: 'idle' | 'running' | 'success' | 'error';
  retryCount?: number;
  maxRetries?: number;
}

const ActionNode: React.FC<NodeProps<ActionNodeData>> = ({
  data,
  selected,
  dragging,
}) => {
  const getActionColor = () => {
    switch (data.actionType) {
      case 'http':
        return 'from-blue-400 to-blue-600';
      case 'email':
        return 'from-purple-400 to-purple-600';
      case 'slack':
        return 'from-pink-400 to-pink-600';
      case 'transform':
        return 'from-indigo-400 to-indigo-600';
      case 'custom':
        return 'from-orange-400 to-orange-600';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

  const getActionIcon = () => {
    switch (data.actionType) {
      case 'http':
        return '🌐';
      case 'email':
        return '📧';
      case 'slack':
        return '💬';
      case 'transform':
        return '⚙️';
      case 'custom':
        return '🔧';
      default:
        return '⚡';
    }
  };

  const getStatusColor = () => {
    switch (data.status) {
      case 'running':
        return 'bg-yellow-400';
      case 'success':
        return 'bg-green-400';
      case 'error':
        return 'bg-red-400';
      default:
        return 'bg-gray-400';
    }
  };

  const isValid = data.validation?.isValid ?? true;
  const tooltipContent = (
    <div>
      <div className="font-bold mb-1">{data.label || 'Action Node'}</div>
      <div className="text-xs">
        <div><strong>Type:</strong> Action</div>
        <div><strong>Action:</strong> {data.actionType || 'Not set'}</div>
        <div><strong>Status:</strong> <span className={isValid ? 'text-green-500' : 'text-red-500'}>{isValid ? 'Valid' : 'Invalid'}</span></div>
      </div>
    </div>
  );

  return (
    <Tooltip content={tooltipContent}>
      <div
        className={`
          relative bg-gradient-to-br ${getActionColor()}
          rounded-lg shadow-lg border-2 p-4 min-w-[140px]
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
            <span className="text-lg">{getActionIcon()}</span>
          </div>
        </div>

        {/* Node Label */}
        <div className="text-center">
          <h3 className="text-white font-semibold text-sm mb-1">
            {data.label || 'Action'}
          </h3>
          {data.description && (
            <p className="text-white text-xs opacity-80">{data.description}</p>
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

        {/* Input Handle */}
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 bg-white border-2 border-gray-600"
          style={{ top: '50%', transform: 'translateY(-50%)' }}
        />

        {/* Output Handle */}
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 bg-white border-2 border-gray-600"
          style={{ top: '50%', transform: 'translateY(-50%)' }}
        />

        {/* Status Indicator */}
        <div className="absolute top-2 right-2">
          <div
            className={`w-2 h-2 ${getStatusColor()} rounded-full ${data.status === 'running' ? 'animate-pulse' : ''}`}
          ></div>
        </div>

        {/* Retry Indicator */}
        {data.retryCount && data.maxRetries && data.retryCount > 0 && (
          <div className="absolute bottom-2 left-2">
            <div className="bg-white bg-opacity-20 text-white text-xs px-1 py-0.5 rounded">
              {data.retryCount}/{data.maxRetries}
            </div>
          </div>
        )}

        {/* Validation Status */}
        {data.validation && !data.validation.isValid && (
          <div className="absolute -top-1 -right-1">
            <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">!</span>
            </div>
          </div>
        )}

        {/* Configuration Indicator */}
        {data.config && Object.keys(data.config).length > 0 && (
          <div className="absolute bottom-2 right-2">
            <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center">
              <span className="text-gray-600 text-xs">⚙️</span>
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
