/**
 * DataPortHandle Component - FlowCraft Workflow Automation Platform
 * 
 * This component renders data ports on workflow nodes, showing field information
 * and providing visual feedback for data flow validation.
 */

import React, { useState } from 'react';
import { Handle, Position } from '@reactflow/core';
import { DataPort } from '@flowcraft/shared-types';
import { Tooltip } from '@flowcraft/ui';

interface DataPortHandleProps {
  port: DataPort;
  nodeId: string;
  isConnected?: boolean;
  validation?: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  onPortClick?: (port: DataPort) => void;
  showTooltip?: boolean;
}

const DataPortHandle: React.FC<DataPortHandleProps> = ({
  port,
  isConnected = false,
  validation,
  onPortClick,
  showTooltip = true
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Get position based on port configuration
  const getPosition = (): Position => {
    switch (port.position) {
      case 'top':
        return Position.Top;
      case 'bottom':
        return Position.Bottom;
      case 'left':
        return Position.Left;
      case 'right':
        return Position.Right;
      default:
        return Position.Right;
    }
  };

  // Get port color based on validation and connection status
  const getPortColor = (): string => {
    if (validation && !validation.isValid) {
      return '#ef4444'; // Red for errors
    }
    if (validation && validation.warnings.length > 0) {
      return '#f59e0b'; // Orange for warnings
    }
    if (isConnected) {
      return '#10b981'; // Green for connected
    }
    if (port.required) {
      return '#3b82f6'; // Blue for required
    }
    return '#6b7280'; // Gray for optional
  };

  // Get port size based on importance
  const getPortSize = (): number => {
    if (port.required) return 12;
    if (isConnected) return 10;
    return 8;
  };

  // Convert port type to React Flow handle type
  const getHandleType = (): 'source' | 'target' => {
    return port.type === 'input' ? 'target' : 'source';
  };

  // Generate tooltip content
  const getTooltipContent = () => {
    if (!showTooltip) return null;

    return (
      <div className="max-w-xs">
        <div className="font-semibold text-sm mb-2">{port.name}</div>
        <div className="text-xs space-y-1">
          <div><strong>Type:</strong> {port.type}</div>
          <div><strong>Required:</strong> {port.required ? 'Yes' : 'No'}</div>
          {port.description && (
            <div><strong>Description:</strong> {port.description}</div>
          )}
          <div className="mt-2">
            <strong>Fields ({port.fields.length}):</strong>
          </div>
          <div className="max-h-32 overflow-y-auto">
            {port.fields.map((field: any) => (
              <div key={field.id} className="flex items-center justify-between py-1">
                <span className="text-xs">{field.name}</span>
                <span className={`text-xs px-1 rounded ${
                  field.required 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {field.type}
                </span>
              </div>
            ))}
          </div>
          {validation && (
            <div className="mt-2">
              {!validation.isValid && validation.errors.length > 0 && (
                <div className="text-red-600 text-xs">
                  <strong>Errors:</strong>
                  {validation.errors.slice(0, 2).map((error, index) => (
                    <div key={index}>• {error}</div>
                  ))}
                  {validation.errors.length > 2 && (
                    <div>• ...and {validation.errors.length - 2} more</div>
                  )}
                </div>
              )}
              {validation.warnings.length > 0 && (
                <div className="text-yellow-600 text-xs">
                  <strong>Warnings:</strong>
                  {validation.warnings.slice(0, 2).map((warning, index) => (
                    <div key={index}>• {warning}</div>
                  ))}
                  {validation.warnings.length > 2 && (
                    <div>• ...and {validation.warnings.length - 2} more</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onPortClick?.(port);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const portColor = getPortColor();
  const portSize = getPortSize();
  const position = getPosition();
  const handleType = getHandleType();

  return (
    <Tooltip content={getTooltipContent()} disabled={!showTooltip}>
      <div
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Handle
          type={handleType}
          position={position}
          id={port.id}
          style={{
            width: portSize,
            height: portSize,
            backgroundColor: portColor,
            border: `2px solid ${isHovered ? '#ffffff' : '#1f2937'}`,
            borderRadius: '50%',
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            transform: isHovered ? 'scale(1.2)' : 'scale(1)',
            boxShadow: isHovered 
              ? '0 0 0 4px rgba(59, 130, 246, 0.3)' 
              : '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}
          onClick={handleClick}
        />
        
        {/* Port label */}
        <div
          className={`absolute text-xs font-medium transition-all duration-200 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          } ${
            position === Position.Top || position === Position.Bottom
              ? 'left-1/2 transform -translate-x-1/2'
              : position === Position.Left
              ? 'right-full mr-2'
              : 'left-full ml-2'
          } ${
            position === Position.Top
              ? 'bottom-full mb-1'
              : position === Position.Bottom
              ? 'top-full mt-1'
              : 'top-1/2 transform -translate-y-1/2'
          }`}
          style={{
            color: portColor,
            backgroundColor: '#ffffff',
            padding: '2px 6px',
            borderRadius: '4px',
            border: `1px solid ${portColor}`,
            whiteSpace: 'nowrap',
            zIndex: 10
          }}
        >
          {port.name}
          {port.required && (
            <span className="ml-1 text-red-500">*</span>
          )}
        </div>

        {/* Connection indicator */}
        {isConnected && (
          <div
            className="absolute inset-0 rounded-full animate-pulse"
            style={{
              backgroundColor: 'transparent',
              border: `2px solid ${portColor}`,
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}
          />
        )}

        {/* Validation indicator */}
        {validation && !validation.isValid && (
          <div
            className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center"
            style={{
              fontSize: '8px',
              color: 'white',
              fontWeight: 'bold'
            }}
          >
            !
          </div>
        )}
      </div>
    </Tooltip>
  );
};

export default DataPortHandle; 