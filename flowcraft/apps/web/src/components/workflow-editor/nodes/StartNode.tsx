import React, { memo } from 'react';
import { NodeProps } from '@reactflow/core';
import { BaseNodeData, getNodePorts, NodeType } from '@flowcraft/shared-types';
import DataPortHandle from './DataPortHandle';

interface StartNodeData extends BaseNodeData {
  triggerType?: 'manual' | 'scheduled' | 'webhook';
}

const StartNode: React.FC<NodeProps<StartNodeData>> = ({ data, selected }) => {
  const isValid = data.validation?.isValid ?? true;
  const defaultPorts = getNodePorts(NodeType.START);

  return (
    <div
      className={`
        relative bg-gradient-to-br from-green-400 to-green-600 
        rounded-lg shadow-lg border-2 p-4 w-36 h-36
        flex flex-col items-center justify-center
        ${selected ? 'border-blue-500' : (isValid ? 'border-green-300' : 'border-red-500')}
      `}
    >
      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-2">
        <span className="text-green-600 text-2xl font-bold">▶</span>
      </div>
      
      <div className="text-center">
        <h3 className="text-white font-semibold text-lg">
          {data.label || 'Start'}
        </h3>
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
