import React, { memo } from 'react';
import { NodeProps } from '@reactflow/core';
import { BaseNodeData, getNodePorts, NodeType } from '@flowcraft/shared-types';
import DataPortHandle from './DataPortHandle';

interface ConditionNodeData extends BaseNodeData {
  condition?: {
    variable: string;
    operator: string;
    value: string;
  };
}

const ConditionNode: React.FC<NodeProps<ConditionNodeData>> = ({ data, selected }) => {
  const isValid = data.validation?.isValid ?? true;
  const defaultPorts = getNodePorts(NodeType.CONDITION);

  return (
    <div
      className={`
        relative bg-gradient-to-br from-yellow-400 to-orange-600 
        shadow-lg border-2 w-36 h-36
        flex flex-col items-center justify-center
        ${selected ? 'border-blue-500' : (isValid ? 'border-yellow-300' : 'border-red-500')}
      `}
      style={{
        clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', // Rhombus shape
      }}
    >
      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
        <span className="text-orange-600 text-2xl font-bold">?</span>
      </div>

      <div className="text-center">
        <h3 className="text-white font-semibold text-sm mt-1">
          {data.label || 'Condition'}
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

export default memo(ConditionNode);
