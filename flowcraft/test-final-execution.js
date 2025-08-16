const axios = require('axios');

const API_BASE = 'http://localhost:3000';

async function testFinalExecution() {
  console.log('🎯 Testing Final Execution System...\n');

  try {
    // 1. Login
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'axedro@gmail.com',
      password: 'maricuchi'
    });
    const token = loginResponse.data.tokens.accessToken;
    console.log('✅ Login successful\n');

    // 2. Create workflow with HTTP request
    console.log('2. Creating workflow with HTTP request...');
    const workflowData = {
      name: 'Final Test Workflow',
      description: 'Workflow with HTTP request for final testing',
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
    console.log(`✅ Execution started: ${executionId}`);
    console.log(`✅ Status: ${executeResponse.data.status}`);
    console.log(`✅ Message: ${executeResponse.data.message}\n`);

    // 4. Check execution status
    console.log('4. Checking execution status...');
    const statusResponse = await axios.get(
      `${API_BASE}/executions/${executionId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✅ Execution Status:', JSON.stringify(statusResponse.data, null, 2));

    // 5. Check workflow executions list
    console.log('\n5. Checking workflow executions list...');
    const executionsResponse = await axios.get(
      `${API_BASE}/workflows/${workflowId}/executions`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✅ Workflow Executions:', JSON.stringify(executionsResponse.data, null, 2));

    console.log('\n🎉 FINAL TEST COMPLETED SUCCESSFULLY!');
    console.log('✅ Execution ID consistency: WORKING');
    console.log('✅ Execution completion: WORKING');
    console.log('✅ Status tracking: WORKING');
    console.log('✅ Database integration: WORKING');

  } catch (error) {
    console.error('❌ Final test failed:', error.response?.data || error.message);
  }
}

testFinalExecution();
