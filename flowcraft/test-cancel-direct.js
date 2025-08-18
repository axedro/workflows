const { ExecutionEngine } = require('./apps/execution-service/dist/services/ExecutionEngine.js');
const { PrismaClient } = require('@prisma/client');

async function testCancelDirect() {
  console.log('=== Testing Cancel Direct ===');
  
  const prisma = new PrismaClient();
  const executionEngine = new ExecutionEngine();

  try {
    // Find a recent execution that might be running
    const recentExecution = await prisma.execution.findFirst({
      where: {
        status: {
          in: ['PENDING', 'RUNNING']
        }
      },
      orderBy: {
        startedAt: 'desc'
      }
    });

    if (!recentExecution) {
      console.log('No running executions found');
      return;
    }

    console.log('Found execution:', recentExecution.id, 'Status:', recentExecution.status);

    // Try to cancel it
    await executionEngine.cancelExecution(recentExecution.id);

    // Check if it was cancelled
    const updatedExecution = await prisma.execution.findUnique({
      where: { id: recentExecution.id }
    });

    console.log('Updated status:', updatedExecution?.status);

    if (updatedExecution?.status === 'CANCELLED') {
      console.log('✅ Direct cancel test passed');
    } else {
      console.log('❌ Direct cancel test failed');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
    await executionEngine.disconnect();
  }
}

testCancelDirect().catch(console.error);
