const axios = require('axios');

const API_BASE = 'http://localhost:3000';

async function login() {
  const res = await axios.post(`${API_BASE}/auth/login`, {
    email: 'axedro@gmail.com',
    password: 'maricuchi',
  });
  return res.data.tokens.accessToken;
}

async function createWorkflow(token, definition, name = 'Delete Test') {
  const res = await axios.post(
    `${API_BASE}/workflows`,
    { name, description: 'Test workflow for deletion', definition },
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

async function deleteWorkflow(token, workflowId, forceDelete = false) {
  const url = forceDelete ? `${API_BASE}/workflows/${workflowId}?forceDelete=true` : `${API_BASE}/workflows/${workflowId}`;
  const res = await axios.delete(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

async function testDeleteWorkflow() {
  console.log('=== Testing Workflow Deletion ===');
  
  try {
    const token = await login();
    console.log('✅ Logged in successfully');

    // Create a workflow
    const definition = {
      nodes: [
        { id: 'start-1', type: 'start', position: { x: 100, y: 100 }, data: { label: 'Start' } },
        { id: 'http-1', type: 'http_request', position: { x: 300, y: 100 }, data: { label: 'HTTP', url: 'https://httpbin.org/json', method: 'GET' } },
        { id: 'end-1', type: 'end', position: { x: 500, y: 100 }, data: { label: 'End' } },
      ],
      edges: [
        { id: 'e1', source: 'start-1', target: 'http-1', type: 'default' },
        { id: 'e2', source: 'http-1', target: 'end-1', type: 'default' },
      ],
    };

    const workflowId = await createWorkflow(token, definition, 'Delete Test Workflow');
    console.log('✅ Created workflow:', workflowId);

    // Execute the workflow to create execution history
    const executionId = await executeWorkflow(token, workflowId);
    console.log('✅ Executed workflow:', executionId);

    // Wait a bit for execution to complete
    await new Promise(r => setTimeout(r, 3000));

    // Try to delete without forceDelete (should fail with 409)
    console.log('\n🔍 Testing delete without forceDelete...');
    try {
      await deleteWorkflow(token, workflowId, false);
      console.log('❌ Unexpected success - should have failed with 409');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('✅ Correctly got 409 Conflict - workflow has executions');
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
      }
    }

    // Try to delete with forceDelete (should succeed)
    console.log('\n🔍 Testing delete with forceDelete...');
    try {
      await deleteWorkflow(token, workflowId, true);
      console.log('✅ Successfully deleted workflow with forceDelete');
    } catch (error) {
      console.log('❌ Failed to delete with forceDelete:', error.response?.status, error.response?.data);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testDeleteWorkflow().catch(console.error);
