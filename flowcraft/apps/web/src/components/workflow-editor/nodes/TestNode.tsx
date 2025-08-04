import React from 'react';
import { NodeProps } from '@reactflow/core';
import DataPortHandle from './DataPortHandle';

const TestNode: React.FC<NodeProps> = ({ data, selected }) => {
  return (
    <div
      style={{
        width: 224,
        height: 224,
        borderRadius: 16,
        position: 'relative',
        background: 'linear-gradient(135deg, #4ade80 0%, #22d3ee 100%)',
        boxShadow: '0 4px 16px 0 rgba(0,0,0,0.10)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        border: `3px solid ${selected ? '#3b82f6' : '#d1d5db'}`,
        padding: 16
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8
        }}
      >
        <span style={{ color: '#22c55e', fontSize: 32, fontWeight: 'bold' }}>▶</span>
      </div>
      <span style={{ color: 'white', fontWeight: 'bold', fontSize: 24 }}>
        {data?.label || 'Test'}
      </span>
      {data?.description && (
        <span style={{ color: 'white', fontSize: 14, marginTop: 8, opacity: 0.8 }}>{data.description}</span>
      )}
      <DataPortHandle
        port={{
          id: 'test-output',
          name: 'Output',
          type: 'output',
          position: 'right',
          fields: [],
          required: false,
          description: 'Test output port'
        }}
      />
    </div>
  );
};

export default TestNode;