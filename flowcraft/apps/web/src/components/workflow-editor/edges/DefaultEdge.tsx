import React, { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  EdgeProps,
} from '@reactflow/core';

interface DefaultEdgeProps extends EdgeProps {
  data?: {
    label?: string;
    condition?: string;
    validation?: {
      isValid: boolean;
      errors: string[];
      warnings: string[];
    };
  };
}

const DefaultEdge: React.FC<DefaultEdgeProps> = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  data,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const getEdgeColor = () => {
    if (data?.validation && !data.validation.isValid) {
      return '#ef4444'; // red
    }
    if (data?.validation && data.validation.warnings.length > 0) {
      return '#f59e0b'; // yellow
    }
    if (selected) {
      return '#3b82f6'; // blue
    }
    return '#6b7280'; // gray
  };

  const getEdgeWidth = () => {
    if (selected) return 3;
    if (data?.validation && !data.validation.isValid) return 2;
    return 2;
  };

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: getEdgeColor(),
          strokeWidth: getEdgeWidth(),
          strokeDasharray: data?.condition ? '5,5' : undefined,
        }}
      />

      {/* Edge Label */}
      {(data?.label || data?.condition) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 12,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <div className="bg-white border border-gray-300 rounded px-2 py-1 shadow-sm">
              {data.label && (
                <div className="text-gray-700 font-medium text-xs">
                  {data.label}
                </div>
              )}
              {data.condition && (
                <div className="text-blue-600 text-xs">{data.condition}</div>
              )}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}

      {/* Validation Indicator */}
      {data?.validation &&
        (!data.validation.isValid || data.validation.warnings.length > 0) && (
          <EdgeLabelRenderer>
            <div
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY - 20}px)`,
                pointerEvents: 'all',
              }}
              className="nodrag nopan"
            >
              <div className="bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                {!data.validation.isValid ? '!' : '⚠'}
              </div>
            </div>
          </EdgeLabelRenderer>
        )}
    </>
  );
};

export default memo(DefaultEdge);
