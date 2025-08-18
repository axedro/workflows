const axios = require('axios');

const API_BASE = 'http://localhost:3000';

// Use a token from a previous successful test
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWVneWx6b3EwMDR4aXczOHM4Mm4yYTM5IiwiaWF0IjoxNzM0NTQ5NzYwLCJleHAiOjE3MzQ1NTMzNjB9.placeholder';

async function createWorkflow(token, definition, name = 'Cancel Test') {
  const res = await axios.post(
    `${API_BASE}/workflows`,
    { name, description: 'Cancel test flow', definition },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data.id;
}

async function executeWorkflow(token, workflowId) {
  const res = await axios.post(
    `${API_BASE}/workflows/${workflowId}/execute`,
    { input: {} },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data.executionId;
}

async function getStatus(token, executionId) {
  const res = await axios.get(`${API_BASE}/executions/${executionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

async function cancelExecution(token, executionId) {
  const res = await axios.post(
    `${API_BASE}/executions/${executionId}/cancel`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

async function testCancel() {
  console.log('=== Testing Cancel Endpoint ===');

  const definition = {
    nodes: [
      { id: 'start-1', type: 'start', position: { x: 100, y: 100 }, data: { label: 'Start' } },
      { id: 'http-1', type: 'http_request', position: { x: 300, y: 100 }, data: { label: 'HTTP Delay', url: 'https://httpbin.org/delay/15', method: 'GET', timeout: 60000 } },
      { id: 'end-1', type: 'end', position: { x: 500, y: 100 }, data: { label: 'End' } },
    ],
    edges: [
      { id: 'e1', source: 'start-1', target: 'http-1', type: 'default' },
      { id: 'e2', source: 'http-1', target: 'end-1', type: 'default' },
    ],
  };

  try {
    const workflowId = await createWorkflow(TOKEN, definition, 'Cancel Test');
    const executionId = await executeWorkflow(TOKEN, workflowId);
    console.log('Started execution:', executionId);

    // Poll until execution is RUNNING
    let status;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      status = await getStatus(TOKEN, executionId);
      console.log(`Attempt ${attempts + 1}: Status = ${status.status}`);
      
      if (status.status === 'RUNNING' || status.status === 'PENDING') {
        break;
      }
      
      if (status.status === 'COMPLETED' || status.status === 'FAILED') {
        console.log('❌ Execution completed before we could cancel it');
        return;
      }
      
      await new Promise(r => setTimeout(r, 1000));
      attempts++;
    }

    if (status.status !== 'RUNNING' && status.status !== 'PENDING') {
      console.log('❌ Execution never reached RUNNING state');
      return;
    }

    console.log('✅ Execution is RUNNING, attempting to cancel...');

    // Try to cancel
    try {
      const cancelResult = await cancelExecution(TOKEN, executionId);
      console.log('Cancel result:', cancelResult);
    } catch (error) {
      console.error('Cancel failed:', error.response?.data || error.message);
    }

    // Check status after cancel
    await new Promise(r => setTimeout(r, 3000));
    const finalStatus = await getStatus(TOKEN, executionId);
    console.log('Final status:', finalStatus.status);

    if (finalStatus.status === 'CANCELLED') {
      console.log('✅ Cancel test passed');
    } else {
      console.log('❌ Cancel test failed - status is:', finalStatus.status);
    }
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testCancel().catch(console.error);
