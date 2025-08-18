# Execution API Documentation

## Overview
The Execution API provides endpoints for managing workflow executions, including starting, monitoring, canceling, and resuming executions.

## Base URLs
- **API Gateway**: `http://localhost:3000`
- **Execution Service**: `http://localhost:3001`

## Authentication
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Endpoints

### 1. Execute Workflow
**POST** `/workflows/:id/execute`

Executes a workflow and returns an execution ID.

#### Request Body
```json
{
  "input": {
    "key1": "value1",
    "key2": "value2"
  }
}
```

#### Response
```json
{
  "executionId": "clx1234567890abcdef",
  "status": "queued",
  "message": "Workflow execution started successfully"
}
```

#### Example
```bash
curl -X POST http://localhost:3000/workflows/clx1234567890abcdef/execute \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"input": {"test": "data"}}'
```

### 2. Get Execution Status
**GET** `/executions/:id`

Retrieves the current status and details of an execution.

#### Response
```json
{
  "id": "clx1234567890abcdef",
  "status": "RUNNING",
  "startedAt": "2024-01-15T10:30:00Z",
  "completedAt": null,
  "progress": 50,
  "currentNode": "node_2",
  "error": null,
  "logs": [
    {
      "id": "log_1",
      "timestamp": "2024-01-15T10:30:05Z",
      "level": "INFO",
      "message": "Starting workflow execution",
      "nodeId": null
    }
  ],
  "summary": {
    "totalNodes": 3,
    "completedNodes": 1,
    "failedNodes": 0,
    "executionTime": 5000
  },
  "dataFlow": {
    "node_1": {
      "output": {"result": "success"}
    }
  },
  "nodes": {
    "node_1": {
      "status": "COMPLETED",
      "inputData": {"input": "test"},
      "outputData": {"result": "success"},
      "performance": {
        "executionTime": 1000,
        "memoryUsage": 1024
      }
    }
  }
}
```

#### Example
```bash
curl -X GET http://localhost:3000/executions/clx1234567890abcdef \
  -H "Authorization: Bearer <token>"
```

### 3. Cancel Execution
**POST** `/executions/:id/cancel`

Cancels a running or pending execution.

#### Response
```json
{
  "message": "Execution cancelled successfully",
  "status": "cancelled"
}
```

#### Example
```bash
curl -X POST http://localhost:3000/executions/clx1234567890abcdef/cancel \
  -H "Authorization: Bearer <token>"
```

### 4. Resume Execution
**POST** `/executions/:id/resume`

Resumes a failed execution from a specific node.

#### Request Body
```json
{
  "nodeId": "node_2"
}
```

#### Response
```json
{
  "message": "Execution resumed successfully",
  "executionId": "clx1234567890abcdef",
  "nodeId": "node_2"
}
```

#### Example
```bash
curl -X POST http://localhost:3000/executions/clx1234567890abcdef/resume \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"nodeId": "node_2"}'
```

### 5. Get Workflow Executions
**GET** `/workflows/:id/executions`

Retrieves a list of executions for a specific workflow.

#### Query Parameters
- `status` (optional): Filter by execution status (`PENDING`, `RUNNING`, `COMPLETED`, `FAILED`, `CANCELLED`)
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of executions per page (default: 20)

#### Response
```json
{
  "executions": [
    {
      "id": "clx1234567890abcdef",
      "status": "COMPLETED",
      "startedAt": "2024-01-15T10:30:00Z",
      "completedAt": "2024-01-15T10:30:10Z",
      "executionTimeMs": 10000,
      "errorDetails": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

#### Example
```bash
curl -X GET "http://localhost:3000/workflows/clx1234567890abcdef/executions?status=COMPLETED&page=1&limit=10" \
  -H "Authorization: Bearer <token>"
```

### 6. Cancel All Workflow Executions
**POST** `/workflows/:id/executions/cancel`

Cancels all running and pending executions for a workflow.

#### Response
```json
{
  "cancelled": ["exec_1", "exec_2", "exec_3"]
}
```

#### Example
```bash
curl -X POST http://localhost:3000/workflows/clx1234567890abcdef/executions/cancel \
  -H "Authorization: Bearer <token>"
```

## Execution Service Endpoints

### Health Check
**GET** `/health`

Returns the health status of the execution service.

#### Response
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "service": "execution-service",
  "version": "1.0.0",
  "queue": {
    "waiting": 0,
    "active": 1,
    "completed": 10,
    "failed": 0
  }
}
```

### Detailed Health Check
**GET** `/health/detailed`

Returns detailed health information including worker stats.

#### Response
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "service": "execution-service",
  "version": "1.0.0",
  "queue": {
    "waiting": 0,
    "active": 1,
    "completed": 10,
    "failed": 0
  },
  "worker": {
    "isHealthy": true,
    "activeJobs": 1,
    "maxConcurrentJobs": 5,
    "uptime": 3600
  },
  "uptime": 3600,
  "memory": {
    "rss": 1024000,
    "heapTotal": 512000,
    "heapUsed": 256000
  }
}
```

### Worker Stats
**GET** `/api/worker/stats`

Returns detailed worker statistics.

#### Response
```json
{
  "worker": {
    "isHealthy": true,
    "activeJobs": 1,
    "maxConcurrentJobs": 5,
    "uptime": 3600
  },
  "queue": {
    "waiting": 0,
    "active": 1,
    "completed": 10,
    "failed": 0
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required fields: workflowId, userId",
  "message": "Missing required fields: workflowId, userId"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required",
  "message": "Please log in again"
}
```

### 404 Not Found
```json
{
  "error": "Execution not found",
  "message": "Execution not found"
}
```

### 409 Conflict
```json
{
  "error": "Cannot delete workflow with existing executions",
  "message": "Cannot delete workflow with existing executions"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to execute workflow",
  "message": "Failed to execute workflow",
  "details": "Connection timeout"
}
```

## Status Codes

| Status | Description |
|--------|-------------|
| `PENDING` | Execution is queued and waiting to start |
| `RUNNING` | Execution is currently running |
| `COMPLETED` | Execution completed successfully |
| `FAILED` | Execution failed with an error |
| `CANCELLED` | Execution was cancelled by user |

## Log Levels

| Level | Description |
|-------|-------------|
| `INFO` | General information messages |
| `WARN` | Warning messages |
| `ERROR` | Error messages |
| `DEBUG` | Debug information |

## Rate Limiting

The API implements rate limiting to prevent abuse:
- **Authentication endpoints**: 5 requests per minute
- **Execution endpoints**: 10 requests per minute
- **Status check endpoints**: 30 requests per minute

## Examples

### Complete Workflow Execution Flow

1. **Start Execution**
```bash
curl -X POST http://localhost:3000/workflows/clx1234567890abcdef/execute \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"input": {"test": "data"}}'
```

2. **Monitor Progress**
```bash
curl -X GET http://localhost:3000/executions/clx1234567890abcdef \
  -H "Authorization: Bearer <token>"
```

3. **Cancel if Needed**
```bash
curl -X POST http://localhost:3000/executions/clx1234567890abcdef/cancel \
  -H "Authorization: Bearer <token>"
```

4. **Resume if Failed**
```bash
curl -X POST http://localhost:3000/executions/clx1234567890abcdef/resume \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"nodeId": "node_2"}'
```

5. **View History**
```bash
curl -X GET "http://localhost:3000/workflows/clx1234567890abcdef/executions?status=COMPLETED" \
  -H "Authorization: Bearer <token>"
```
