const axios = require('axios');

const API_BASE = 'http://localhost:3000';
const EXECUTION_SERVICE_BASE = 'http://localhost:3001/api';

async function debugExecutionId() {
  console.log('🔍 Debugging Execution ID Issue...\n');

  try {
    // 1. Login
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'axedro@gmail.com',
      password: 'maricuchi'
    });
    const token = loginResponse.data.tokens.accessToken;
    console.log('✅ Login successful\n');

    // 2. Create simple workflow
    console.log('2. Creating test workflow...');
    const workflowData = {
      name: 'Debug Workflow',
      description: 'Simple workflow for debugging',
      definition: {
        nodes: [
          {
            id: 'start-1',
            type: 'start',
            position: { x: 100, y: 100 },
            data: { label: 'Start' }
          },
          {
            id: 'end-1',
            type: 'end',
            position: { x: 300, y: 100 },
            data: { label: 'End' }
          }
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'start-1',
            target: 'end-1',
            type: 'default'
          }
        ]
      }
    };

    const createWorkflowResponse = await axios.post(
      `${API_BASE}/workflows`,
      workflowData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const workflowId = createWorkflowResponse.data.id;
    console.log(`✅ Workflow created: ${workflowId}\n`);

    // 3. Execute workflow
    console.log('3. Executing workflow...');
    const executeResponse = await axios.post(
      `${API_BASE}/workflows/${workflowId}/execute`,
      { input: {} },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const executionId = executeResponse.data.executionId;
    console.log(`✅ Execution ID returned: ${executionId}\n`);

    // 4. Check if execution service is running
    console.log('4. Checking execution service health...');
    try {
      const healthResponse = await axios.get(`${EXECUTION_SERVICE_BASE.replace('/api', '')}/health`);
      console.log('✅ Execution service health:', healthResponse.data);
    } catch (error) {
      console.log('❌ Execution service not responding:', error.message);
    }

    // 5. Check queue status
    console.log('\n5. Checking queue status...');
    try {
      const queueResponse = await axios.get(`${EXECUTION_SERVICE_BASE}/queue/stats`);
      console.log('✅ Queue stats:', queueResponse.data);
    } catch (error) {
      console.log('❌ Queue stats error:', error.response?.data || error.message);
    }

    // 6. Check if execution exists in database via API
    console.log('\n6. Checking execution in database...');
    try {
      // Try to get all executions for the workflow
      const executionsResponse = await axios.get(
        `${API_BASE}/workflows/${workflowId}/executions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('✅ Workflow executions:', executionsResponse.data);
    } catch (error) {
      console.log('❌ Workflow executions error:', error.response?.data || error.message);
    }

    // 7. Check execution service directly
    console.log('\n7. Checking execution service directly...');
    try {
      const execServiceResponse = await axios.get(`${EXECUTION_SERVICE_BASE}/executions/${executionId}`);
      console.log('✅ Execution service response:', execServiceResponse.data);
    } catch (error) {
      console.log('❌ Execution service error:', error.response?.data || error.message);
    }

    // 8. Wait and check again
    console.log('\n8. Waiting 10 seconds and checking again...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    try {
      const finalResponse = await axios.get(`${EXECUTION_SERVICE_BASE}/executions/${executionId}`);
      console.log('✅ Final execution service response:', finalResponse.data);
    } catch (error) {
      console.log('❌ Final execution service error:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.response?.data || error.message);
  }
}

debugExecutionId();
