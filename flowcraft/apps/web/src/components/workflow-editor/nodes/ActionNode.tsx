import React, { memo } from 'react';
import { NodeProps } from '@reactflow/core';
import { BaseNodeData, getNodePorts, NodeType } from '@flowcraft/shared-types';
import DataPortHandle from './DataPortHandle';

interface ActionNodeData extends BaseNodeData {
  actionType?: 'http' | 'email' | 'slack' | 'transform' | 'custom';
}

const ActionNode: React.FC<NodeProps<ActionNodeData>> = ({ data, selected }) => {
  const isValid = data.validation?.isValid ?? true;
  const defaultPorts = getNodePorts(NodeType.ACTION);

  return (
    <div
      className={`
        relative bg-gradient-to-br from-blue-400 to-blue-600 
        rounded-lg shadow-lg border-2 p-4 w-36 h-36
        ${selected ? 'border-blue-500' : (isValid ? 'border-blue-300' : 'border-red-500')}
      `}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-2">
          <span className="text-blue-600 text-2xl font-bold">⚙️</span>
        </div>

        <div className="text-center">
          <h3 className="text-white font-semibold text-lg">
            {data.label || 'Action'}
          </h3>
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

export default memo(ActionNode);
