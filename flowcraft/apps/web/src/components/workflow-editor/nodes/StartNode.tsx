import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@reactflow/core';
import { NodeData } from '@flowcraft/shared-types';

interface StartNodeData extends NodeData {
  triggerType?: 'manual' | 'scheduled' | 'webhook';
  schedule?: string;
  webhookUrl?: string;
}

interface StartNodeProps extends NodeProps<StartNodeData> {
  data: StartNodeData;
}

const StartNode: React.FC<StartNodeProps> = ({ data, selected, dragging }) => {
  return (
    <div
      className={`
        relative bg-gradient-to-br from-green-400 to-green-600 
        rounded-lg shadow-lg border-2 p-4 min-w-[120px]
        transition-all duration-200 ease-in-out
        ${selected ? 'border-blue-500 shadow-xl scale-105' : 'border-green-300'}
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

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-white border-2 border-green-600"
        style={{ top: '50%', transform: 'translateY(-50%)' }}
      />

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

      {/* Drag Indicator */}
      {dragging && (
        <div className="absolute -top-2 -left-2">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
            <span className="text-white text-xs">🖱️</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(StartNode);
