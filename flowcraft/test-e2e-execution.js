const axios = require('axios');

const API_BASE = 'http://localhost:3000';

async function login() {
  const res = await axios.post(`${API_BASE}/auth/login`, {
    email: 'axedro@gmail.com',
    password: 'maricuchi',
  });
  return res.data.tokens.accessToken;
}

async function createWorkflow(token, definition, name = 'E2E Test Workflow') {
  const res = await axios.post(
    `${API_BASE}/workflows`,
    { name, description: 'E2E test flow', definition },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data.id;
}

async function executeWorkflow(token, workflowId, input = {}) {
  const res = await axios.post(
    `${API_BASE}/workflows/${workflowId}/execute`,
    { input },
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

async function pollUntil(token, executionId, predicate, timeoutMs = 15000, intervalMs = 1000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const status = await getStatus(token, executionId);
    if (predicate(status)) return status;
    await new Promise(r => setTimeout(r, intervalMs));
  }
  throw new Error('Timeout waiting for condition');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function runSuccessFlow() {
  console.log('=== E2E: Success flow ===');
  const token = await login();

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

  const workflowId = await createWorkflow(token, definition, 'E2E Success Flow');
  const executionId = await executeWorkflow(token, workflowId);
  console.log('Started execution:', executionId);

  const final = await pollUntil(
    token,
    executionId,
    s => s.status === 'COMPLETED' || s.status === 'FAILED',
    20000,
    1000
  );

  console.log('Final status:', final.status);
  assert(final.status === 'COMPLETED', 'Execution should complete successfully');
  assert(final.summary, 'Summary should be present');
  assert(final.nodes && Array.isArray(final.nodes) && final.nodes.length >= 3, 'Nodes data should be present');
  assert(final.dataFlow, 'Data flow should be present');
  console.log('E2E success flow: OK');
}

async function runCancelFlow() {
  console.log('=== E2E: Cancel flow ===');
  const token = await login();

  const definition = {
    nodes: [
      { id: 'start-1', type: 'start', position: { x: 100, y: 100 }, data: { label: 'Start' } },
      // Use httpbin delay to keep RUNNING state long enough to cancel
      { id: 'http-1', type: 'http_request', position: { x: 300, y: 100 }, data: { label: 'HTTP Delay', url: 'https://httpbin.org/delay/10', method: 'GET', timeout: 30000 } },
      { id: 'end-1', type: 'end', position: { x: 500, y: 100 }, data: { label: 'End' } },
    ],
    edges: [
      { id: 'e1', source: 'start-1', target: 'http-1', type: 'default' },
      { id: 'e2', source: 'http-1', target: 'end-1', type: 'default' },
    ],
  };

  const workflowId = await createWorkflow(token, definition, 'E2E Cancel Flow');
  const executionId = await executeWorkflow(token, workflowId);
  console.log('Started execution (cancel test):', executionId);

  // Wait until RUNNING then cancel
  await pollUntil(token, executionId, s => s.status === 'RUNNING' || s.status === 'PENDING', 5000, 500);
  await cancelExecution(token, executionId);

  const final = await pollUntil(
    token,
    executionId,
    s => s.status === 'CANCELLED' || s.status === 'FAILED' || s.status === 'COMPLETED',
    15000,
    1000
  );

  console.log('Final status after cancel:', final.status);
  assert(final.status === 'CANCELLED', 'Execution should be cancelled');
  console.log('E2E cancel flow: OK');
}

(async () => {
  try {
    await runSuccessFlow();
    await runCancelFlow();
    console.log('\nAll E2E tests passed ✅');
    process.exit(0);
  } catch (err) {
    console.error('E2E test failed ❌:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
