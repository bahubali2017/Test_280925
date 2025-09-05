# Admin Dashboard Integration Guide

## Overview

The Anamnesis Medical AI Assistant now includes comprehensive external admin dashboard integration capabilities, enabling real-time monitoring, session tracking, and system oversight for healthcare administrators and technical teams.

## Authentication

All admin endpoints require Bearer token authentication using the `ADMIN_API_TOKEN` environment variable.

```bash
curl -H "Authorization: Bearer $ADMIN_API_TOKEN" http://localhost:5000/api/system/status
```

## API Endpoints

### System Status - `/api/system/status`
Returns overall system health and metrics.

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 16342,
  "ai_active_sessions": 1,
  "flagged_sessions": 0,
  "latency_ms": 150,
  "timestamp": "2025-08-30T13:36:31.055Z"
}
```

### AI Metrics - `/api/admin/ai-metrics`
Comprehensive AI performance analytics.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_sessions": 25,
    "avg_session_duration": 45000,
    "success_rate": 98.5,
    "error_rate": 1.5,
    "flagged_sessions": 2,
    "high_risk_queries": 5,
    "atd_escalations": 1,
    "response_times": {
      "p50": 2500,
      "p95": 8000,
      "p99": 15000
    },
    "time_window_hours": 24,
    "current_active_sessions": 3,
    "timestamp": "2025-08-30T13:36:38.235Z"
  }
}
```

### Active Sessions - `/api/admin/sessions`
Real-time session monitoring.

**Response:**
```json
{
  "success": true,
  "data": {
    "active_sessions": [
      {
        "sessionId": "streaming_test_456",
        "startTime": 1756561061831,
        "messageCount": 1,
        "flagged": false,
        "flagReasons": [],
        "userRole": "general_public",
        "status": "active",
        "avgLatency": 2500
      }
    ],
    "count": 1,
    "timestamp": "2025-08-30T13:37:57.436Z"
  }
}
```

## WebSocket Real-time Monitoring

Connect to the admin WebSocket for live updates:

```javascript
const ws = new WebSocket(`ws://localhost:5000/ws/admin?token=${ADMIN_TOKEN}`);

ws.on('message', (data) => {
  const event = JSON.parse(data);
  console.log('Admin event:', event.type, event.data);
});
```

**Event Types:**
- `connection_established` - Initial connection with system summary
- `session_started` - New chat session began
- `session_flagged` - Session flagged for review
- `session_ended` - Session completed
- `system_alert` - Critical system notifications

## Security Features

### Rate Limiting
- System status endpoint: 10 requests per minute per IP
- Admin endpoints: Standard rate limits with authenticated bypass
- Automatic retry-after headers included

### Access Logging
All admin endpoint access is logged with:
- Timestamp and IP address
- Endpoint accessed and response code
- Authentication status and partial token hash
- Request duration

### CORS Configuration
Admin endpoints support CORS for external dashboard integration:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`
- `Access-Control-Allow-Headers: Authorization, Content-Type`

## Session Tracking

### Session Lifecycle
1. **Start**: Session begins with user role detection
2. **Monitoring**: Real-time message count and latency tracking
3. **Flagging**: Automatic flagging for high-risk queries or unusual patterns
4. **Completion**: Session ends with final metrics recording

### Flagging System
Sessions can be flagged for:
- `high_risk_query` - Medical emergency indicators
- `suspicious_activity` - Unusual usage patterns
- `policy_violation` - Content policy breaches
- `technical_error` - System errors during processing

### User Role Detection
Automatic classification of users:
- `general_public` - Standard users
- `healthcare_professional` - Medical professionals
- `student` - Medical students or researchers
- `emergency` - Users in potential emergency situations

## Integration Examples

### External Dashboard Connection
```javascript
// Connect to admin WebSocket
const adminWS = new WebSocket(`ws://yourdomain.com/ws/admin?token=${token}`);

// Fetch current system status
const status = await fetch('/api/system/status', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Monitor active sessions
const sessions = await fetch('/api/admin/sessions', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Monitoring Dashboard Setup
```javascript
class AdminDashboard {
  constructor(token, baseUrl) {
    this.token = token;
    this.baseUrl = baseUrl;
    this.ws = null;
    this.connect();
  }

  async connect() {
    this.ws = new WebSocket(`${this.baseUrl}/ws/admin?token=${this.token}`);
    this.ws.on('message', (data) => this.handleEvent(JSON.parse(data)));
  }

  async getMetrics() {
    const response = await fetch(`${this.baseUrl}/api/admin/ai-metrics`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    return response.json();
  }

  handleEvent(event) {
    switch(event.type) {
      case 'session_flagged':
        this.alertHighRiskSession(event.data);
        break;
      case 'system_alert':
        this.showSystemAlert(event.data);
        break;
    }
  }
}
```

## Deployment Notes

1. **Environment Variables**: Ensure `ADMIN_API_TOKEN` is set securely
2. **Network Security**: Admin endpoints should be accessible only to authorized networks
3. **Monitoring**: Set up alerts for high error rates or flagged sessions
4. **Scaling**: WebSocket connections scale with server instances

## Troubleshooting

### Connection Issues
- Verify `ADMIN_API_TOKEN` is correctly set
- Check network connectivity to admin endpoints
- Ensure CORS headers are properly configured

### Authentication Failures
- Confirm Bearer token format: `Authorization: Bearer <token>`
- Check token validity and permissions
- Review server logs for authentication attempts

### WebSocket Problems
- Verify WebSocket URL format: `ws://domain/ws/admin?token=<token>`
- Check for network proxy issues
- Monitor connection stability and reconnection logic

## Support

For technical support or integration assistance, refer to the main project documentation or contact the development team.