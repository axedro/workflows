import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@reactflow/core';
import { BaseNodeData, getNodePorts, NodeType } from '@flowcraft/shared-types';
import { Tooltip } from '@flowcraft/ui';
import DataPortHandle from './DataPortHandle';

interface ConditionNodeData extends BaseNodeData {
  condition?: {
    variable: string;
    operator: string;
    value: string;
  };
}

const ConditionNode: React.FC<NodeProps<ConditionNodeData>> = ({ data, selected, dragging, id }) => {
  const isValid = data.validation?.isValid ?? true;
  
  // Get default ports for condition node
  const defaultPorts = getNodePorts(NodeType.CONDITION);
  const dataPorts = data.inputPorts || data.outputPorts || defaultPorts;

  const tooltipContent = (
    <div>
      <div className="font-bold mb-1">{data.label || 'Condition Node'}</div>
      <div className="text-xs">
        <div><strong>Type:</strong> Condition</div>
        <div><strong>Variable:</strong> {data.condition?.variable || 'Not set'}</div>
        <div><strong>Operator:</strong> {data.condition?.operator || 'Not set'}</div>
        <div><strong>Value:</strong> {data.condition?.value || 'Not set'}</div>
        <div><strong>Status:</strong> <span className={isValid ? 'text-green-500' : 'text-red-500'}>{isValid ? 'Valid' : 'Invalid'}</span></div>
        <div><strong>Ports:</strong> {dataPorts.length}</div>
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
          relative bg-gradient-to-br from-yellow-400 to-orange-600 
          shadow-lg border-2 p-4 min-w-[120px] min-h-[80px]
          transition-all duration-200 ease-in-out
          ${selected ? 'border-blue-500 shadow-xl scale-105' : (isValid ? 'border-yellow-300' : 'border-red-500')}
          ${dragging ? 'opacity-80 shadow-2xl scale-110 z-50' : 'hover:shadow-xl hover:scale-105'}
          ${dragging ? 'cursor-grabbing' : 'cursor-grab'}
        `}
        style={{
          transform: dragging ? 'rotate(2deg)' : 'rotate(0deg)',
          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', // Rhombus shape
        }}
      >
        {/* Node Header */}
        <div className="flex items-center justify-center mb-2">
          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
            <span className="text-orange-600 text-sm font-bold">?</span>
          </div>
        </div>

        {/* Node Label */}
        <div className="text-center">
          <h3 className="text-white font-semibold text-xs mb-1">
            {data.label || 'Condition'}
          </h3>
          {data.description && (
            <p className="text-yellow-100 text-xs opacity-80">
              {data.description}
            </p>
          )}
        </div>

        {/* Condition Display */}
        {data.condition && (
          <div className="mt-1 text-center">
            <div className="text-white text-xs">
              <span className="font-medium">{data.condition.variable}</span>
              <span className="mx-1">{data.condition.operator}</span>
              <span className="font-medium">{data.condition.value}</span>
            </div>
          </div>
        )}

        {/* Data Ports */}
        {dataPorts.map((port: any) => (
          <DataPortHandle
            key={port.id}
            port={port}
            nodeId={id || 'condition-node'}
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
              position={Position.Top}
              className="w-3 h-3 bg-white border-2 border-orange-600"
              style={{ left: '50%', transform: 'translateX(-50%)' }}
            />
            <Handle
              type="source"
              position={Position.Right}
              className="w-3 h-3 bg-white border-2 border-green-600"
              style={{ top: '30%', transform: 'translateY(-50%)' }}
            />
            <Handle
              type="source"
              position={Position.Bottom}
              className="w-3 h-3 bg-white border-2 border-red-600"
              style={{ left: '50%', transform: 'translateX(-50%)' }}
            />
          </>
        )}

        {/* Node Status Indicator */}
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-yellow-300 rounded-full"></div>
        </div>

        {/* Validation Status */}
        {data.validation && !data.validation.isValid && (
          <div className="absolute -top-1 -right-1">
            <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">!</span>
            </div>
          </div>
        )}

        {/* True/False Branch Indicators */}
        <div className="absolute top-1/2 left-2 transform -translate-y-1/2">
          <div className="text-white text-xs font-bold">T</div>
        </div>
        <div className="absolute top-1/2 right-2 transform -translate-y-1/2">
          <div className="text-white text-xs font-bold">F</div>
        </div>

        {/* Data Schema Indicator */}
        {data.dataSchema && (
          <div className="absolute bottom-2 left-2">
            <div className="w-3 h-3 bg-purple-400 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">🔍</span>
            </div>
          </div>
        )}

        {/* Input/Output Ports Indicator */}
        {(data.inputPorts || data.outputPorts) && (
          <div className="absolute bottom-2 right-2">
            <div className="w-3 h-3 bg-blue-400 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">📊</span>
            </div>
          </div>
        )}

        {/* Drag Indicator */}
        {dragging && (
          <div className="absolute -top-2 -left-2">
            <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center animate-pulse">
              <span className="text-white text-xs">🖱️</span>
            </div>
          </div>
        )}
      </div>
    </Tooltip>
  );
};

export default memo(ConditionNode);
