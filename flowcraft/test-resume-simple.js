const axios = require('axios');

const EXECUTION_SERVICE_BASE = 'http://localhost:3001';
const API_BASE = 'http://localhost:3000';

async function login() {
  const res = await axios.post(`${API_BASE}/auth/login`, {
    email: 'axedro@gmail.com',
    password: 'maricuchi',
  });
  return res.data.tokens.accessToken;
}

async function getUserId(token) {
  // Decode JWT to get userId (this is a simple approach)
  const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
  return payload.userId;
}

async function createWorkflow(token, definition, name = 'Resume Simple Test') {
  const res = await axios.post(
    `${API_BASE}/workflows`,
    { name, description: 'Test workflow for resume', definition },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data.id;
}

async function executeWorkflowDirect(token, workflowId) {
  const userId = await getUserId(token);
  const res = await axios.post(
    `${EXECUTION_SERVICE_BASE}/api/workflows/execute`,
    { 
      workflowId, 
      userId,
      input: {} 
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data.executionId;
}

async function getExecutionStatusDirect(executionId) {
  const res = await axios.get(`${EXECUTION_SERVICE_BASE}/api/executions/${executionId}`);
  return res.data;
}

async function testResumeSimple() {
  console.log('=== Testing Resume Execution (Direct) ===');

  try {
    const token = await login();
    console.log('✅ Logged in successfully');

    // Create a simple workflow that will fail
    const failingDefinition = {
      nodes: [
        { id: 'start-1', type: 'start', position: { x: 100, y: 100 }, data: { label: 'Start' } },
        { id: 'http-1', type: 'http_request', position: { x: 300, y: 100 }, data: { label: 'HTTP', url: 'https://httpbin.org/status/500', method: 'GET', timeout: 5000 } },
        { id: 'end-1', type: 'end', position: { x: 500, y: 100 }, data: { label: 'End' } },
      ],
      edges: [
        { id: 'e1', source: 'start-1', target: 'http-1', type: 'default' },
        { id: 'e2', source: 'http-1', target: 'end-1', type: 'default' },
      ],
    };

    const workflowId = await createWorkflow(token, failingDefinition);
    console.log('✅ Created workflow:', workflowId);

    // Execute directly via execution-service
    let executionId;
    try {
      executionId = await executeWorkflowDirect(token, workflowId);
      console.log('✅ Executed workflow:', executionId);
    } catch (e) {
      console.log('ℹ️ Execute returned error (expected for failing node):', e.response?.data?.details);
      // Try to get the execution ID from the error or create a test one
      if (e.response?.data?.executionId) {
        executionId = e.response.data.executionId;
      } else {
        console.log('❌ No execution ID in error response');
        return;
      }
    }

    // Wait a bit and check status
    await new Promise(r => setTimeout(r, 3000));
    
    try {
      const status = await getExecutionStatusDirect(executionId);
      console.log('✅ Execution status:', status.status);

      if (status.status === 'FAILED') {
        console.log('✅ Execution failed as expected. Testing resume...');
        
        // Test resume
        const resumeRes = await axios.post(
          `${EXECUTION_SERVICE_BASE}/api/executions/${executionId}/resume`,
          { nodeId: 'http-1' },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('✅ Resume response:', resumeRes.data);
      } else {
        console.log('❌ Expected FAILED, got:', status.status);
      }
    } catch (e) {
      console.log('❌ Failed to get execution status:', e.response?.data || e.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testResumeSimple().catch(console.error);
