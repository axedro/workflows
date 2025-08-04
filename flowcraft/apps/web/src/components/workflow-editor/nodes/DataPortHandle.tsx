/**
 * DataPortHandle Component - FlowCraft Workflow Automation Platform
 * 
 * This component renders data ports on workflow nodes. It simplifies positioning
 * by relying entirely on React Flow's Handle component, which ensures correct
 * placement regardless of node size, zoom, or pan.
 */

import React from 'react';
import { Handle } from '@reactflow/core';
import { Position } from 'reactflow';
import { DataPort } from '@flowcraft/shared-types';

interface DataPortHandleProps {
  port: DataPort;
  isConnected?: boolean;
}

const DataPortHandle: React.FC<DataPortHandleProps> = ({ port, isConnected = false }) => {
  
  const getPosition = (): Position => {
    switch (port.position) {
      case 'top': return Position.Top;
      case 'bottom': return Position.Bottom;
      case 'left': return Position.Left;
      case 'right': return Position.Right;
      default: return Position.Right;
    }
  };
  
  const getPortColor = (): string => {
    if (isConnected) return '#10b981'; // Green
    if (port.required) return '#3b82f6'; // Blue
    return '#6b7280'; // Gray
  };

  const position = getPosition();
  const portColor = getPortColor();
  const handleType = port.type === 'input' ? 'target' : 'source';

  // Debug: log what position is being passed to Handle
  console.log('DataPortHandle - Port position:', port.position, 'Mapped to:', position, 'Port ID:', port.id);

  return (
    <Handle
      type={handleType}
      position={position}
      id={port.id}
      isConnectable={true}
      style={{
        width: '12px',
        height: '12px',
        backgroundColor: portColor,
        border: '2px solid white',
        borderRadius: '50%'
      }}
    />
  );
};

export default DataPortHandle;
