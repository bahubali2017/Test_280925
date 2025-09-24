# PHASE 6.8: STATE PROPAGATION AUDIT

## Executive Summary

**CRITICAL FINDING CONFIRMED:** The `metadata.queryIntent.disclaimers` are being **dropped in the ChatPage onStreamingUpdate callback**. While the SSE handler in llm-api.jsx correctly forwards metadata to the UI layer, the onStreamingUpdate callback only updates content, isStreaming, and status fields - it **completely ignores metadata** during streaming updates.

## Flow Diagram

```
Server (routes.js)
├── selectDisclaimers() generates 3 disclaimers ✅
└── SSE "done" event sends metadata.queryIntent.disclaimers ✅
    ↓
Client SSE Handler (llm-api.jsx:209-213)
├── Receives metadata correctly ✅
└── Calls onUpdate('', { streaming: false, fullContent, metadata }) ✅
    ↓
State Update (ChatPage.jsx:312-324) ❌ DROPS METADATA
├── onStreamingUpdate only updates: content, isStreaming, status
└── IGNORES: metadata field completely ❌
    ↓
MessageBubble.jsx
├── Receives message props without metadata ❌
└── metadata?.queryIntent?.disclaimers is undefined ❌
```

## Exact File + Line References Where Metadata Is Lost

### ❌ Primary Breakpoint: ChatPage.jsx Lines 312-324

**File:** `client/src/pages/ChatPage.jsx`
**Lines:** 312-324 (onStreamingUpdate callback in handleRetryMessage)
**Lines:** 538-546 (onStreamingUpdate callback in handleSubmit)

```javascript
// BROKEN - Only updates content/streaming/status, DROPS metadata
onStreamingUpdate: (chunk, info) => {
  setMessages(prev => prev.map(msg =>
    msg.id === assistantMessageId
      ? {
          ...msg,
          content: info.fullContent || msg.content + chunk,
          isStreaming: true,
          status: 'streaming'
          // ❌ MISSING: metadata: { ...msg.metadata, ...info.metadata }
        }
      : msg
  ));
}
```

### ❌ Secondary Breakpoint: ChatPage.jsx Lines 332-342

**File:** `client/src/pages/ChatPage.jsx` 
**Lines:** 332-342 (Final completion update)

```javascript
// PARTIAL FIX - Updates metadata on completion but streaming updates still drop it
setMessages(prev => prev.map(msg =>
  msg.id === `${retryId}_response`
    ? {
        ...msg,
        content: result.content,
        isStreaming: false,
        status: 'delivered',
        metadata: { ...msg.metadata, ...result.metadata } // ✅ This works
      }
    : msg
));
```

**Status:** The completion handler correctly merges metadata, but streaming updates drop it.

## Root Cause Analysis

### Issue 1: Streaming Updates Drop Metadata
The `onStreamingUpdate` callback receives metadata from the SSE handler but only uses `chunk` and `info.fullContent`. It completely ignores `info.metadata`, causing disclaimers to be lost during real-time streaming updates.

### Issue 2: Inconsistent Metadata Handling
- **Streaming updates:** Ignore metadata ❌
- **Final completion:** Merge metadata correctly ✅

This creates a race condition where disclaimers may briefly appear on completion but are never visible during streaming.

## Evidence from Code Analysis

### ✅ Server Generation (Working)
```javascript
// server/routes.js:897-899
const disclaimers = selectDisclaimers('non_urgent', ['general']).disclaimers;
// Generates 3 disclaimers correctly
```

### ✅ SSE Transport (Working)  
```javascript
// server/routes.js:1183-1188
metadata: {
  queryIntent: {
    disclaimers: disclaimers // ✅ Properly nested
  }
}
```

### ✅ Client Reception (Working)
```javascript
// client/src/lib/llm-api.jsx:209-213
if (data.metadata) {
  onUpdate('', { streaming: false, fullContent, metadata: data.metadata });
}
```

### ❌ State Update (BROKEN)
```javascript
// client/src/pages/ChatPage.jsx:312-324
onStreamingUpdate: (chunk, info) => {
  // info.metadata exists but is ignored
  setMessages(prev => prev.map(msg => ({
    ...msg,
    content: info.fullContent || msg.content + chunk,
    // Missing: metadata: { ...msg.metadata, ...info.metadata }
  })));
}
```

## Minimal Fix Recommendation

### Fix 1: Update Streaming Callbacks
**File:** `client/src/pages/ChatPage.jsx`
**Lines:** 312-324 and 538-546

```javascript
// BEFORE (Broken):
onStreamingUpdate: (chunk, info) => {
  setMessages(prev => prev.map(msg =>
    msg.id === assistantMessageId
      ? {
          ...msg,
          content: info.fullContent || msg.content + chunk,
          isStreaming: true,
          status: 'streaming'
        }
      : msg
  ));
}

// AFTER (Fixed):
onStreamingUpdate: (chunk, info) => {
  setMessages(prev => prev.map(msg =>
    msg.id === assistantMessageId
      ? {
          ...msg,
          content: info.fullContent || msg.content + chunk,
          isStreaming: true,
          status: 'streaming',
          metadata: { ...msg.metadata, ...(info.metadata || {}) }
        }
      : msg
  ));
}
```

### Impact Assessment
- **Risk:** Very Low - Only adds metadata merging to existing flow
- **Complexity:** Minimal - Single line addition in 2 locations  
- **Testing:** Aspirin query should immediately show disclaimers

## Verification Plan

1. Apply the fix to both onStreamingUpdate callbacks
2. Test aspirin query: `"what is the dosage of aspirin?"`  
3. Expected result: Disclaimer block appears **during streaming** (not just on completion)
4. Verify 3 disclaimer items are displayed in UI

## Alternative Investigation

If the primary fix doesn't work, investigate whether the SSE "done" event timing allows metadata to reach the streaming callback, or if completion-only metadata forwarding is the intended design.

## Summary

The disclaimer pipeline breaks at the **ChatPage onStreamingUpdate callback level** due to incomplete metadata propagation. The server, transport, and client reception layers all function correctly. A minimal fix to include `metadata: { ...msg.metadata, ...(info.metadata || {}) }` in the streaming update callbacks will restore complete disclaimer delivery functionality.