const axios = require('axios');

const API_BASE = 'http://localhost:3000';
const EXECUTION_SERVICE_BASE = 'http://localhost:3001/api';

async function testExecutionIdIssue() {
  console.log('🔍 Testing Execution ID Issue...\n');

  try {
    // 1. Login to get auth token
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'axedro@gmail.com',
      password: 'maricuchi'
    });

    const token = loginResponse.data.tokens.accessToken;
    console.log('✅ Login successful\n');

    // 2. Create a simple workflow
    console.log('2. Creating test workflow...');
    const workflowData = {
      name: 'Test Execution ID Workflow',
      description: 'Workflow to test execution ID issue',
      definition: {
        nodes: [
          {
            id: 'start-1',
            type: 'start',
            position: { x: 100, y: 100 },
            data: { label: 'Start' }
          },
          {
            id: 'http-1',
            type: 'http_request',
            position: { x: 300, y: 100 },
            data: {
              label: 'HTTP Request',
              url: 'https://httpbin.org/get',
              method: 'GET',
              headers: {},
              timeout: 30000
            }
          },
          {
            id: 'end-1',
            type: 'end',
            position: { x: 500, y: 100 },
            data: { label: 'End' }
          }
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'start-1',
            target: 'http-1',
            type: 'default'
          },
          {
            id: 'edge-2',
            source: 'http-1',
            target: 'end-1',
            type: 'default'
          }
        ]
      }
    };

    const createWorkflowResponse = await axios.post(
      `${API_BASE}/workflows`,
      workflowData,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    const workflowId = createWorkflowResponse.data.id;
    console.log(`✅ Workflow created with ID: ${workflowId}\n`);

    // 3. Execute the workflow
    console.log('3. Executing workflow...');
    const executeResponse = await axios.post(
      `${API_BASE}/workflows/${workflowId}/execute`,
      { input: {} },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    const executionId = executeResponse.data.executionId;
    console.log(`✅ Execution started with ID: ${executionId}\n`);

    // 4. Check execution status via API
    console.log('4. Checking execution status via API...');
    let statusResponse;
    try {
      statusResponse = await axios.get(
        `${API_BASE}/executions/${executionId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      console.log('✅ API Status Response:', JSON.stringify(statusResponse.data, null, 2));
    } catch (error) {
      console.log('❌ API Status Error:', error.response?.data || error.message);
    }

    // 5. Check execution status via Execution Service
    console.log('\n5. Checking execution status via Execution Service...');
    let executionServiceResponse;
    try {
      executionServiceResponse = await axios.get(
        `${EXECUTION_SERVICE_BASE}/executions/${executionId}`
      );
      console.log('✅ Execution Service Response:', JSON.stringify(executionServiceResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Execution Service Error:', error.response?.data || error.message);
    }

    // 6. Check queue stats
    console.log('\n6. Checking queue stats...');
    try {
      const queueStatsResponse = await axios.get(`${EXECUTION_SERVICE_BASE}/queue/stats`);
      console.log('✅ Queue Stats:', JSON.stringify(queueStatsResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Queue Stats Error:', error.response?.data || error.message);
    }

    // 7. Wait a bit and check again
    console.log('\n7. Waiting 5 seconds and checking again...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    try {
      const finalStatusResponse = await axios.get(
        `${API_BASE}/executions/${executionId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      console.log('✅ Final API Status:', JSON.stringify(finalStatusResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Final API Status Error:', error.response?.data || error.message);
    }

    // 8. Check database directly
    console.log('\n8. Checking database directly...');
    try {
      const dbCheckResponse = await axios.get(
        `${API_BASE}/executions`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      console.log('✅ All Executions:', JSON.stringify(dbCheckResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Database Check Error:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testExecutionIdIssue();
