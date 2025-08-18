# Execution Examples

This document provides practical examples of workflow execution scenarios.

## Basic HTTP Request Workflow

### Workflow Definition
```json
{
  "id": "basic-http-workflow",
  "name": "Basic HTTP Request",
  "nodes": [
    {
      "id": "start",
      "type": "start",
      "position": { "x": 100, "y": 100 },
      "data": { "label": "Start" }
    },
    {
      "id": "http_request",
      "type": "action",
      "position": { "x": 300, "y": 100 },
      "data": {
        "label": "HTTP Request",
        "connector": "http",
        "config": {
          "method": "GET",
          "url": "https://httpbin.org/get",
          "headers": {
            "Content-Type": "application/json"
          }
        }
      }
    },
    {
      "id": "end",
      "type": "end",
      "position": { "x": 500, "y": 100 },
      "data": { "label": "End" }
    }
  ],
  "edges": [
    {
      "id": "start-to-http",
      "source": "start",
      "target": "http_request"
    },
    {
      "id": "http-to-end",
      "source": "http_request",
      "target": "end"
    }
  ]
}
```

### Execution Steps

1. **Start Execution**
```bash
curl -X POST http://localhost:3000/workflows/basic-http-workflow/execute \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

2. **Monitor Progress**
```bash
curl -X GET http://localhost:3000/executions/<execution_id> \
  -H "Authorization: Bearer <token>"
```

3. **Expected Result**
```json
{
  "id": "exec_123",
  "status": "COMPLETED",
  "summary": {
    "totalNodes": 3,
    "completedNodes": 3,
    "failedNodes": 0,
    "executionTime": 1500
  },
  "nodes": {
    "http_request": {
      "status": "COMPLETED",
      "outputData": {
        "status": 200,
        "data": {
          "url": "https://httpbin.org/get",
          "headers": { ... }
        }
      }
    }
  }
}
```

## Conditional Workflow

### Workflow Definition
```json
{
  "id": "conditional-workflow",
  "name": "Conditional Processing",
  "nodes": [
    {
      "id": "start",
      "type": "start",
      "position": { "x": 100, "y": 100 },
      "data": { "label": "Start" }
    },
    {
      "id": "condition",
      "type": "condition",
      "position": { "x": 300, "y": 100 },
      "data": {
        "label": "Check Value",
        "condition": "input.value > 10"
      }
    },
    {
      "id": "success_action",
      "type": "action",
      "position": { "x": 500, "y": 50 },
      "data": {
        "label": "Success Action",
        "connector": "http",
        "config": {
          "method": "POST",
          "url": "https://httpbin.org/post",
          "body": { "status": "success" }
        }
      }
    },
    {
      "id": "failure_action",
      "type": "action",
      "position": { "x": 500, "y": 150 },
      "data": {
        "label": "Failure Action",
        "connector": "http",
        "config": {
          "method": "POST",
          "url": "https://httpbin.org/post",
          "body": { "status": "failure" }
        }
      }
    },
    {
      "id": "end",
      "type": "end",
      "position": { "x": 700, "y": 100 },
      "data": { "label": "End" }
    }
  ],
  "edges": [
    {
      "id": "start-to-condition",
      "source": "start",
      "target": "condition"
    },
    {
      "id": "condition-to-success",
      "source": "condition",
      "target": "success_action",
      "condition": "true"
    },
    {
      "id": "condition-to-failure",
      "source": "condition",
      "target": "failure_action",
      "condition": "false"
    },
    {
      "id": "success-to-end",
      "source": "success_action",
      "target": "end"
    },
    {
      "id": "failure-to-end",
      "source": "failure_action",
      "target": "end"
    }
  ]
}
```

### Execution with Success Path
```bash
curl -X POST http://localhost:3000/workflows/conditional-workflow/execute \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"input": {"value": 15}}'
```

### Execution with Failure Path
```bash
curl -X POST http://localhost:3000/workflows/conditional-workflow/execute \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"input": {"value": 5}}'
```

## Data Transformation Workflow

### Workflow Definition
```json
{
  "id": "data-transform-workflow",
  "name": "Data Transformation",
  "nodes": [
    {
      "id": "start",
      "type": "start",
      "position": { "x": 100, "y": 100 },
      "data": { "label": "Start" }
    },
    {
      "id": "fetch_data",
      "type": "action",
      "position": { "x": 300, "y": 100 },
      "data": {
        "label": "Fetch Data",
        "connector": "http",
        "config": {
          "method": "GET",
          "url": "https://jsonplaceholder.typicode.com/users/1"
        }
      }
    },
    {
      "id": "transform",
      "type": "action",
      "position": { "x": 500, "y": 100 },
      "data": {
        "label": "Transform Data",
        "connector": "data-transform",
        "config": {
          "transformations": [
            {
              "type": "map",
              "source": "fetch_data.data",
              "target": "user",
              "mapping": {
                "name": "name",
                "email": "email",
                "city": "address.city"
              }
            }
          ]
        }
      }
    },
    {
      "id": "save_result",
      "type": "action",
      "position": { "x": 700, "y": 100 },
      "data": {
        "label": "Save Result",
        "connector": "http",
        "config": {
          "method": "POST",
          "url": "https://httpbin.org/post",
          "body": "{{transform.output}}"
        }
      }
    },
    {
      "id": "end",
      "type": "end",
      "position": { "x": 900, "y": 100 },
      "data": { "label": "End" }
    }
  ],
  "edges": [
    {
      "id": "start-to-fetch",
      "source": "start",
      "target": "fetch_data"
    },
    {
      "id": "fetch-to-transform",
      "source": "fetch_data",
      "target": "transform"
    },
    {
      "id": "transform-to-save",
      "source": "transform",
      "target": "save_result"
    },
    {
      "id": "save-to-end",
      "source": "save_result",
      "target": "end"
    }
  ]
}
```

## Error Handling and Recovery

### Failed Execution Example
```bash
# Execute workflow with invalid configuration
curl -X POST http://localhost:3000/workflows/invalid-workflow/execute \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Resume Failed Execution
```bash
# Resume from specific node
curl -X POST http://localhost:3000/executions/failed_execution_id/resume \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"nodeId": "failed_node_id"}'
```

### Cancel Running Execution
```bash
# Cancel execution
curl -X POST http://localhost:3000/executions/running_execution_id/cancel \
  -H "Authorization: Bearer <token>"
```

## Monitoring and Observability

### Get Execution History
```bash
# Get all executions for a workflow
curl -X GET "http://localhost:3000/workflows/workflow_id/executions" \
  -H "Authorization: Bearer <token>"

# Filter by status
curl -X GET "http://localhost:3000/workflows/workflow_id/executions?status=COMPLETED" \
  -H "Authorization: Bearer <token>"

# Paginated results
curl -X GET "http://localhost:3000/workflows/workflow_id/executions?page=1&limit=10" \
  -H "Authorization: Bearer <token>"
```

### Worker Health Check
```bash
# Check execution service health
curl -X GET http://localhost:3001/health

# Get detailed worker stats
curl -X GET http://localhost:3001/api/worker/stats
```

## Performance Considerations

### Large Data Handling
- Use data truncation for large payloads
- Implement streaming for large datasets
- Monitor memory usage during execution

### Rate Limiting
- Respect API rate limits
- Implement exponential backoff for retries
- Use connection pooling for HTTP requests

### Monitoring
- Track execution time per node
- Monitor queue depth and worker health
- Set up alerts for failed executions

## Best Practices

1. **Input Validation**: Always validate input data before execution
2. **Error Handling**: Implement proper error handling and logging
3. **Resource Management**: Clean up resources after execution
4. **Monitoring**: Monitor execution performance and health
5. **Testing**: Test workflows with various input scenarios
6. **Documentation**: Document workflow behavior and requirements
