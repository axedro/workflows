import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@reactflow/core';
import { NodeData } from '@flowcraft/shared-types';
import { Tooltip } from '@flowcraft/ui';

interface ConditionNodeData extends NodeData {
  condition?: {
    variable: string;
    operator: string;
    value: string;
  };
}

const ConditionNode: React.FC<NodeProps<ConditionNodeData>> = ({ data, selected }) => {
  return (
    <div
      className={`
        relative bg-white rounded-lg shadow-md border-2 p-4 w-48
        transition-all duration-200
        ${selected ? 'border-yellow-500 shadow-xl' : 'border-gray-300'}
      `}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-400" />
      
      <div className="flex items-center mb-2">
        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-2">
          <span className="text-yellow-600 text-lg">?</span>
        </div>
        <div>
          <div className="font-semibold text-gray-800">{data.label || 'Condition'}</div>
        </div>
      </div>

      <div className="text-xs text-gray-600 space-y-1">
        {data.condition ? (
          <>
            <div>
              <span className="font-medium">IF:</span> {data.condition.variable || '...'}
            </div>
            <div>
              <span className="font-medium">IS:</span> {data.condition.operator || '...'}
            </div>
            <div>
              <span className="font-medium">TO:</span> {data.condition.value || '...'}
            </div>
          </>
        ) : (
          <p>Click to configure condition.</p>
        )}
      </div>

      <Tooltip content="Output for 'true' condition">
        <Handle 
            id="true" 
            type="source" 
            position={Position.Right} 
            className="w-3 h-3 bg-green-500"
            style={{ top: '35%' }}
        />
      </Tooltip>
      <Tooltip content="Output for 'false' condition">
        <Handle 
            id="false" 
            type="source" 
            position={Position.Right} 
            className="w-3 h-3 bg-red-500"
            style={{ top: '65%' }}
        />
      </Tooltip>
    </div>
  );
};

export default memo(ConditionNode);
