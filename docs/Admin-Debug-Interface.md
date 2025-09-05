# Anamnesis Medical AI Assistant - Admin Debug Interface

## Overview

The Admin Debug Interface is a sophisticated visual debugging tool designed for the Anamnesis Medical AI Assistant system. It provides comprehensive insights into the medical query processing pipeline, allowing developers, medical professionals, and system administrators to trace and analyze how medical queries are processed through various stages.

## Access Information

**Endpoint:** `http://localhost:5000/admin/debug/:sessionId`

**Method:** GET

**Authentication:** None required (development environment)

## Usage

### Basic Access

To access the debug interface, navigate to:

```
http://localhost:5000/admin/debug/[SESSION_ID]
```

Replace `[SESSION_ID]` with any session identifier. For testing purposes, you can use:

```
http://localhost:5000/admin/debug/test123
http://localhost:5000/admin/debug/demo-session
http://localhost:5000/admin/debug/chest-pain-analysis
```

### Sample Session Data

The interface currently displays mock medical data for demonstration purposes, showing:

- **User Input:** "I've been having chest pain for 2 days"
- **Processing Stages:** Complete pipeline visualization
- **Medical Analysis:** Triage level, risk assessment, and recommendations

## Interface Features

### 1. Header Section
- **Professional Medical AI Branding** with neural gradient theme
- **Session Information** displaying session ID and timestamp
- **Visual Identity** with 🧠 medical brain emoji

### 2. Processing Timeline
Visual representation of the medical query pipeline:

- **Parse Intent** (Cyan) - Analyzing medical query structure
- **Triage** (Orange) - Assessing urgency and risk level
- **Enhance Prompt** (Purple) - Preparing specialized medical guidance
- **LLM Response** (Green) - Generating final medical response

### 3. Performance Metrics Dashboard

Four key metrics displayed in a responsive grid:

| Metric | Description |
|--------|-------------|
| **Total Time** | Complete processing duration in milliseconds |
| **Processing Stages** | Number of pipeline stages executed |
| **Tokens Used** | LLM token consumption for the query |
| **Triage Level** | Medical urgency classification (URGENT, ROUTINE, etc.) |

### 4. Detailed Stage Analysis

Each processing stage displays:
- **Stage Header** with color-coded background and timing
- **JSON Data Display** with syntax highlighting
- **Processing Results** including medical analysis outputs

### 5. LLM Response Section
- **Model Information** (e.g., "deepseek-chat")
- **Token Usage** statistics
- **Complete Response Content** with scrollable preview
- **Performance Timing** for the LLM generation phase

## Technical Implementation

### Data Structure

The debug interface expects the following data structure:

```json
{
  "sessionId": "string",
  "userInput": "string", 
  "timestamp": "ISO string",
  "processingStages": {
    "parseIntent": {
      "duration": "number (ms)",
      "result": {
        "symptoms": ["array of strings"],
        "bodyLocation": "string",
        "duration": "string",
        "intentConfidence": "number (0-1)"
      }
    },
    "triage": {
      "duration": "number (ms)", 
      "result": {
        "triageLevel": "string",
        "isHighRisk": "boolean",
        "redFlags": ["array of strings"]
      }
    },
    "enhancePrompt": {
      "duration": "number (ms)",
      "result": {
        "enhancedPrompt": "string",
        "disclaimers": ["array of strings"],
        "atd": {
          "atdReason": "string"
        }
      }
    }
  },
  "llmResponse": {
    "duration": "number (ms)",
    "content": "string",
    "modelUsed": "string", 
    "tokensUsed": "number"
  },
  "totalProcessingTime": "number (ms)"
}
```

### Color Coding System

The interface uses a consistent color scheme for different processing stages:

- **Parse Intent:** `#06b6d4` (Cyan) - Initial analysis and understanding
- **Triage:** `#f97316` (Orange) - Risk assessment and urgency evaluation  
- **Enhance Prompt:** `#8b5cf6` (Purple) - Medical context enhancement
- **LLM Response:** `#10b981` (Green) - Final response generation

### Responsive Design

The interface is fully responsive and includes:
- **Mobile-first approach** with breakpoint optimizations
- **Hover effects** for interactive elements
- **Smooth animations** and transitions
- **Professional typography** using system fonts

## Use Cases

### 1. Medical Query Analysis
- **Symptom Recognition:** Verify how user symptoms are parsed and categorized
- **Triage Accuracy:** Review urgency level assignments and risk flags
- **Response Quality:** Analyze the medical guidance provided

### 2. Performance Monitoring
- **Processing Speed:** Monitor stage-by-stage execution times
- **Resource Usage:** Track token consumption and model efficiency
- **System Health:** Identify bottlenecks or processing delays

### 3. Quality Assurance
- **Medical Accuracy:** Review AI responses for medical appropriateness
- **Safety Validation:** Ensure proper risk assessment and warnings
- **Compliance Checking:** Verify adherence to medical guidelines

### 4. Development & Testing
- **Debug Medical Layer:** Troubleshoot medical processing logic
- **Performance Optimization:** Identify slow processing stages
- **Integration Testing:** Validate end-to-end pipeline functionality

## Development Integration

### Server Implementation

The debug endpoint is implemented in `server/routes.js`:

```javascript
debugRouter.get('/debug/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  // ... processing logic
  res.setHeader('Content-Type', 'text/html');
  res.send(htmlResponse);
});
```

### Future Enhancements

Planned improvements for the debug interface:

1. **Live Session Data Integration**
   - Connect to actual session storage
   - Real-time processing trace capture

2. **Advanced Filtering**
   - Filter by triage level, processing time, or error conditions
   - Search functionality for specific sessions

3. **Export Capabilities**
   - JSON export of session data
   - PDF report generation
   - CSV metrics export

4. **Comparative Analysis**
   - Side-by-side session comparisons  
   - Performance trend analysis
   - A/B testing support

## Security Considerations

### Development Environment Only

⚠️ **Important:** This debug interface is designed for development environments only and should not be exposed in production without proper authentication and access controls.

### Data Privacy

- Medical query data should be anonymized before debugging
- Session IDs should not contain personally identifiable information
- Consider HIPAA compliance requirements for medical data handling

## Troubleshooting

### Common Issues

1. **404 Error on Access**
   - Ensure server is running on port 5000
   - Verify the correct URL format: `/admin/debug/[sessionId]`

2. **Missing Data Display**
   - Currently shows mock data for demonstration
   - Future versions will connect to live session storage

3. **Styling Issues**
   - The interface uses inline CSS for portability
   - All styling is self-contained in the HTML response

### Browser Compatibility

The interface is tested and supported on:
- Chrome 90+
- Firefox 88+  
- Safari 14+
- Edge 90+

## API Reference

### GET /admin/debug/:sessionId

Retrieves and displays debug information for a medical query session.

**Parameters:**
- `sessionId` (string, required) - Unique identifier for the session

**Response:**
- Content-Type: `text/html`
- Status: 200 OK
- Body: Complete HTML page with debug visualization

**Error Responses:**
- 500 Internal Server Error - If session processing fails

## Conclusion

The Admin Debug Interface provides powerful insights into the Anamnesis Medical AI Assistant's processing pipeline, enabling effective debugging, performance monitoring, and quality assurance. Its visual design and comprehensive data presentation make it an essential tool for system administrators and medical professionals working with the AI assistant.

For additional support or feature requests, please consult the main project documentation or contact the development team.

---

**Document Version:** 1.0  
**Last Updated:** August 23, 2025  
**Implementation Phase:** Phase 7 - UI Integration & Real-Time Implementation  
**Status:** Completed ✅