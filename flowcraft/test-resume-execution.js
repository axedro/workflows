const axios = require('axios');

const API_BASE = 'http://localhost:3000';

async function login() {
  const res = await axios.post(`${API_BASE}/auth/login`, {
    email: 'axedro@gmail.com',
    password: 'maricuchi',
  });
  return res.data.tokens.accessToken;
}

async function createWorkflow(token, definition, name = 'Resume Test') {
  const res = await axios.post(
    `${API_BASE}/workflows`,
    { name, description: 'Test workflow for resume', definition },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data.id;
}

async function updateWorkflow(token, workflowId, definition) {
  const res = await axios.put(
    `${API_BASE}/workflows/${workflowId}`,
    { definition },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

async function executeWorkflow(token, workflowId) {
  const res = await axios.post(
    `${API_BASE}/workflows/${workflowId}/execute`,
    { input: {} },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data.executionId;
}

async function getExecutionStatus(token, executionId) {
  const res = await axios.get(
    `${API_BASE}/executions/${executionId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

async function resumeExecution(token, executionId, nodeId) {
  const res = await axios.post(
    `${API_BASE}/executions/${executionId}/resume`,
    { nodeId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

async function deleteWorkflow(token, workflowId, forceDelete = false) {
  const url = forceDelete ? `${API_BASE}/workflows/${workflowId}?forceDelete=true` : `${API_BASE}/workflows/${workflowId}`;
  const res = await axios.delete(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

async function pollUntil(fn, predicate, { timeoutMs = 120000, intervalMs = 2000 } = {}) {
  const start = Date.now();
  while (true) {
    const data = await fn();
    if (predicate(data)) return data;
    if (Date.now() - start > timeoutMs) {
      throw new Error('Timeout while polling');
    }
    await new Promise(r => setTimeout(r, intervalMs));
  }
}

async function listWorkflowExecutions(token, workflowId, { page = 1, limit = 5, status } = {}) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (status) params.set('status', status);
  const res = await axios.get(
    `${API_BASE}/workflows/${workflowId}/executions?${params.toString()}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data.executions;
}

async function testResumeExecution() {
  console.log('=== Testing Resume Execution ===');

  let workflowId;
  try {
    const token = await login();
    console.log('✅ Logged in successfully');

    // 1) Create workflow that will FAIL at http node
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

    workflowId = await createWorkflow(token, failingDefinition, 'Resume Test Workflow');
    console.log('✅ Created workflow:', workflowId);

    // 2) Execute and wait for FAILED
    let executionId;
    try {
      executionId = await executeWorkflow(token, workflowId);
      console.log('✅ Executed workflow:', executionId);
    } catch (e) {
      console.log('ℹ️ Execute returned error (expected for failing node). Fetching latest execution...');
      const executions = await listWorkflowExecutions(token, workflowId, { page: 1, limit: 1 });
      if (!executions || executions.length === 0) {
        throw new Error('No executions found after execute failure');
      }
      executionId = executions[0].id;
      console.log('✅ Found execution:', executionId);
    }

    const failedExec = await pollUntil(
      () => getExecutionStatus(token, executionId),
      (s) => s.status === 'FAILED' || s.status === 'COMPLETED',
      { timeoutMs: 180000, intervalMs: 2000 }
    );

    if (failedExec.status !== 'FAILED') {
      console.log('❌ Expected FAILED, got:', failedExec.status);
      return;
    }

    console.log('✅ Execution failed as expected. Preparing to resume from node http-1');

    // 3) Update workflow so that http node succeeds
    const succeedingDefinition = {
      nodes: [
        { id: 'start-1', type: 'start', position: { x: 100, y: 100 }, data: { label: 'Start' } },
        { id: 'http-1', type: 'http_request', position: { x: 300, y: 100 }, data: { label: 'HTTP', url: 'https://httpbin.org/json', method: 'GET', timeout: 10000 } },
        { id: 'end-1', type: 'end', position: { x: 500, y: 100 }, data: { label: 'End' } },
      ],
      edges: [
        { id: 'e1', source: 'start-1', target: 'http-1', type: 'default' },
        { id: 'e2', source: 'http-1', target: 'end-1', type: 'default' },
      ],
    };

    await updateWorkflow(token, workflowId, succeedingDefinition);
    console.log('✅ Workflow updated with successful HTTP node');

    // 4) Resume execution from http-1
    await resumeExecution(token, executionId, 'http-1');
    console.log('✅ Resume requested');

    // 5) Wait for COMPLETED
    const completedExec = await pollUntil(
      () => getExecutionStatus(token, executionId),
      (s) => s.status === 'COMPLETED',
      { timeoutMs: 180000, intervalMs: 2000 }
    );

    console.log('✅ Execution completed after resume. Output preview:', JSON.stringify((completedExec.outputData || completedExec.summary || {}), null, 2).slice(0, 200));

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  } finally {
    try {
      if (workflowId) {
        const token = await login();
        await deleteWorkflow(token, workflowId, true);
        console.log('🧹 Cleaned up workflow');
      }
    } catch (e) {
      console.warn('⚠️ Cleanup failed:', e.response?.data || e.message);
    }
  }
}

if (require.main === module) {
  testResumeExecution().catch(console.error);
}
