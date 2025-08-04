import React, { memo } from 'react';
import { NodeProps } from '@reactflow/core';
import { BaseNodeData, getNodePorts, NodeType } from '@flowcraft/shared-types';
import DataPortHandle from './DataPortHandle';

interface EndNodeData extends BaseNodeData {
  resultType?: 'success' | 'error' | 'partial';
}

const EndNode: React.FC<NodeProps<EndNodeData>> = ({ data, selected }) => {
  const isValid = data.validation?.isValid ?? true;
  const defaultPorts = getNodePorts(NodeType.END);

  return (
    <div
      className={`
        relative bg-gradient-to-br from-red-400 to-red-600 
        rounded-lg shadow-lg border-2 p-4 w-36 h-36
        flex flex-col items-center justify-center
        ${selected ? 'border-blue-500' : (isValid ? 'border-red-300' : 'border-red-500')}
      `}
    >
      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-2">
        <span className="text-red-600 text-2xl font-bold">⏹</span>
      </div>

      <div className="text-center">
        <h3 className="text-white font-semibold text-lg">
          {data.label || 'End'}
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

export default memo(EndNode);
