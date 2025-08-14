import React from 'react';

console.log('🧪 DEBUG: TestWorkflowEditor.tsx file loaded');

const TestWorkflowEditor: React.FC = () => {
  console.log('🧪 DEBUG: TestWorkflowEditor component function called');
  
  React.useEffect(() => {
    console.log('🧪 DEBUG: TestWorkflowEditor useEffect triggered');
    alert('🧪 TestWorkflowEditor component is working!');
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#e0f2fe', 
      border: '2px solid #0284c7',
      margin: '20px',
      borderRadius: '8px'
    }}>
      <h2>🧪 Test WorkflowEditor Component</h2>
      <p>This is a test component to verify lazy loading works.</p>
      <p>If you can see this, the lazy loading mechanism is working.</p>
      <p>Current time: {new Date().toLocaleTimeString()}</p>
    </div>
  );
};

export default TestWorkflowEditor;
