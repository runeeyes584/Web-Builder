# Web-Builder API

Simple REST API endpoints for testing.

## Base URL
```
http://localhost:4000
```

## Endpoints

### Health Check
```http
GET /health
```

Response:
```json
{
  "status": "ok",
  "uptime": 123.456
}
```

### Root
```http
GET /
```

Response:
```json
{
  "ok": true,
  "service": "web-builder-server"
}
```

### Example API

#### Get Example Data
```http
GET /api/example
```

Response:
```json
{
  "message": "Example API endpoint",
  "timestamp": "2025-10-11T13:39:04.000Z",
  "data": {
    "sample": "data"
  }
}
```

#### Create Example Item
```http
POST /api/example
Content-Type: application/json

{
  "name": "Test Item",
  "description": "Optional description"
}
```

Response:
```json
{
  "id": "abc123",
  "name": "Test Item", 
  "description": "Optional description",
  "createdAt": "2025-10-11T13:39:04.000Z"
}
```

## Error Responses

All endpoints return consistent error format:

```json
{
  "error": {
    "message": "Error description",
    "status": 400
  }
}
```

In development mode, error responses also include stack trace.