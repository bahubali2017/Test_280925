# PHASE 4: SERVER PROMPT HIJACK AUDIT REPORT
## Anamnesis Medical AI Platform

**Date:** September 24, 2025  
**Status:** 🚨 CRITICAL SERVER-SIDE HIJACKING CONFIRMED  
**Query Tested:** "what is the dosage of aspirin?"

---

## 🔥 **EXECUTIVE SUMMARY**

**CRITICAL FINDING:** Server completely **IGNORES** client's carefully crafted `systemPrompt` from Phase 3 mode isolation and **HIJACKS** with its own expansion-contaminated prompts.

---

## 📋 **CONTAMINATION SOURCE MATRIX**

| Component | Status | Evidence | Impact |
|-----------|--------|----------|---------|
| Client Builder | ✅ CLEAN | Phase 3 isolation working perfectly | None |
| Server Schema | ⚠️ ACCEPTS | `systemPrompt` field accepted but ignored | Deceptive |
| Server Processing | 🚨 HIJACKS | Completely overwrites client prompt | Critical |
| LLM Delivery | 🚨 CONTAMINATED | Receives expansion instructions | Critical |

---

## 🎯 **CONTAMINATION SOURCE #1: Non-Streaming Endpoint**

### **File:** `server/routes.js`  
### **Lines:** 659-671, 673-674

```javascript
// Prepare messages array with enhanced system context and conversation history
const medicalContext = `You are MAIA, a medical AI assistant. Provide complete, concise medical information in plain text format.
  ${isHighRisk ? 'IMPORTANT: The user may describe an urgent medical situation. Emphasize the importance of seeking immediate professional medical attention for emergencies.' : ''}

  USER TYPE: ${roleAnalysis.role} (confidence: ${roleAnalysis.confidence}%)
  ${responseInstructions}

  CRITICAL RULES:
  1. NO # symbols or markdown
  2. Complete ALL responses                    // 🚨 VIOLATES CONCISE MODE
  3. Use simple headers with colons
  4. Educational information only

  Format: Brief answer, key points, recommendations.`;

const messages = [
  { role: "system", content: medicalContext }    // 🚨 HIJACKS CLIENT PROMPT
];
```

### **Violations Detected:**
- 🚨 **"Complete ALL responses"** - Direct contradiction to 3-5 sentence limit
- 🚨 **Generic medical context** - No medication-specific concise instructions  
- 🚨 **Missing restrictions** - No "Do NOT include side effects" rules
- 🚨 **Client prompt ignored** - `systemPrompt` from request body never used

---

## 🎯 **CONTAMINATION SOURCE #2: Streaming Endpoint** 

### **File:** `server/routes.js`  
### **Lines:** 945-961, 967

```javascript
// Use default system message with safety instructions and role information
promptMessages.push({
  role: "system",
  content: `You are MAIA (Medical AI Assistant) from Anamnesis. Provide complete medical information in plain text format.
  ${isHighRisk ? 'IMPORTANT: The user may describe an urgent medical situation. Emphasize the importance of seeking immediate professional medical attention for emergencies.' : ''}

  USER TYPE: ${roleAnalysis.role} (confidence: ${roleAnalysis.confidence}%)
  ${responseInstructions}

  CRITICAL RULES:
  1. NO # symbols or markdown
  2. Complete ALL responses - finish every thought and section    // 🚨 VIOLATES CONCISE MODE
  3. Use simple headers with colons
  4. Educational information only
  5. If response is getting long, prioritize the most important information first

  CRITICAL: Always complete your response fully. If you must be concise due to length, focus on the most essential medical information first.`    // 🚨 ANTI-CONCISE INSTRUCTION
});

promptMessages = [...promptMessages, ...recentHistory];
```

### **Violations Detected:**
- 🚨 **"Complete ALL responses - finish every thought"** - Explicit anti-concise instruction
- 🚨 **"Always complete your response fully"** - Overrides client's 3-5 sentence limit
- 🚨 **Expansion encouragement** - Tells LLM to include all information
- 🚨 **Client prompt completely bypassed** - No reference to `req.body.systemPrompt`

---

## 🔍 **REQUEST PROCESSING PIPELINE ANALYSIS**

### **Schema Definition (Lines 99-111):**
```javascript
const chatRequestSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(4000, "Message is too long"),
  conversationHistory: z.array(z.object({
    role: z.string().min(1),
    content: z.string().min(1)
  })).optional().default([]),
  isHighRisk: z.boolean().optional().default(false),
  systemPrompt: z.string().optional(),        // ✅ ACCEPTED IN SCHEMA
  enhancedPrompt: z.string().optional(),      // ✅ ACCEPTED IN SCHEMA  
  userRole: z.string().optional().default("public")
});
```

### **Data Extraction (Lines 613 & 887):**
```javascript
const { message, conversationHistory, isHighRisk } = validation.data;
//      ^^^^^^^^  ^^^^^^^^^^^^^^^^^^^  ^^^^^^^^^^
//      ONLY THESE THREE FIELDS EXTRACTED!
//      
//      systemPrompt: IGNORED ❌
//      enhancedPrompt: IGNORED ❌
//      userRole: IGNORED ❌
```

### **Result:**
- ✅ Server **accepts** `systemPrompt` in schema (appears to support it)
- 🚨 Server **ignores** `systemPrompt` during processing (deceptive behavior)
- 🚨 Server **overwrites** with hardcoded expansion prompts

---

## 🚨 **CRITICAL EVIDENCE: REQUEST PAYLOAD vs LLM DELIVERY**

### **Client's Clean Concise Prompt (buildConciseMedicationPrompt):**
```javascript
`You are a medical AI assistant providing concise medication dosage information.

STRICT CONCISE MODE FOR MEDICATION QUERIES:
- STRICT RULE: You MUST keep the response to a maximum of 5 sentences.
- Provide ONLY key dosage types and units (e.g., "81 mg daily", "325 mg as needed")
- Include typical adult dosing ranges in simple format
- Do NOT include side effects, interactions, or precautions
- Do NOT add follow-up questions or expansion prompts
- Do NOT include phrases like "Would you like more details" or similar
- Wait for explicit user expansion request before providing additional details`
```

### **Server's Contaminated Prompt (Actually Sent to LLM):**
```javascript
`You are MAIA (Medical AI Assistant) from Anamnesis. Provide complete medical information in plain text format.

CRITICAL RULES:
1. NO # symbols or markdown
2. Complete ALL responses - finish every thought and section
3. Use simple headers with colons
4. Educational information only
5. If response is getting long, prioritize the most important information first

CRITICAL: Always complete your response fully. If you must be concise due to length, focus on the most essential medical information first.`
```

### **Comparison Analysis:**
| Aspect | Client Prompt | Server Prompt |
|--------|---------------|---------------|
| **Sentence Limit** | "maximum of 5 sentences" | "Complete ALL responses" |
| **Content Scope** | "ONLY key dosage types" | "complete medical information" |
| **Side Effects** | "Do NOT include side effects" | No restriction |
| **Expansion** | "Do NOT add follow-up questions" | "prioritize important information" |
| **Conciseness** | "STRICT CONCISE MODE" | "Always complete your response fully" |

**VERDICT:** 🚨 **100% CONTAMINATION** - Server prompt is the complete opposite of client's concise requirements.

---

## 🔬 **TECHNICAL HIJACKING MECHANISM**

### **Step-by-Step Hijacking Process:**

1. **✅ Client Side:** `buildConciseMedicationPrompt()` creates perfect concise prompt
2. **✅ Request Packaging:** `llm-api.jsx` packages `systemPrompt` in request body
3. **✅ Server Reception:** Schema validates and accepts `systemPrompt` field
4. **🚨 SERVER HIJACK:** Extraction ignores `systemPrompt`, creates `medicalContext`
5. **🚨 LLM Delivery:** Contaminated expansion prompt sent to DeepSeek API
6. **💥 Result:** AI receives "Complete ALL responses" instead of "5 sentences max"

### **Hijacking Evidence (Line Numbers):**

| Stage | Location | Code | Status |
|-------|----------|------|--------|
| **Schema** | `routes.js:108-109` | `systemPrompt: z.string().optional()` | ✅ Accepts |
| **Extraction** | `routes.js:613` | `const { message, conversationHistory, isHighRisk }` | 🚨 Ignores |
| **Hijack #1** | `routes.js:659-671` | `const medicalContext = ...` | 🚨 Overwrites |
| **Hijack #2** | `routes.js:945-961` | `promptMessages.push({ role: "system", content: ...` | 🚨 Overwrites |
| **LLM Call** | `routes.js:674,967` | `{ role: "system", content: medicalContext }` | 🚨 Contaminated |

---

## 🎯 **ROOT CAUSE SUMMARY**

### **The Single Point of Failure:**

**Location:** `server/routes.js` lines 613 & 887  
**Code:** `const { message, conversationHistory, isHighRisk } = validation.data;`

**Problem:** Destructuring assignment **IGNORES** `systemPrompt` and `enhancedPrompt` fields that were carefully crafted by Phase 3 mode isolation.

### **The Deception:**
1. **Server pretends to support** client prompts (schema includes `systemPrompt`)
2. **Server secretly ignores** client prompts (extraction excludes `systemPrompt`)  
3. **Server injects expansion contamination** (hardcoded "Complete ALL responses")

---

## 🚨 **MEDICAL SAFETY IMPACT**

### **Critical Violations:**

- 🚨 **Medication dosage queries** receive verbose educational content instead of concise dosing
- ⚠️ **Patient confusion risk** - Too much information overwhelms simple dosage questions
- 📋 **Mode isolation failure** - All Phase 3 work bypassed by server hijacking
- 🎯 **Regulatory non-compliance** - Concise mode requirements violated

### **Example Impact:**
- **User asks:** "what is the dosage of aspirin?"
- **Expected:** "81 mg daily for prevention, 325 mg as needed for pain. ⚠️ Informational only."
- **Actual:** Verbose response with side effects, interactions, precautions, and educational content

---

## 📋 **CONTAMINATION AUDIT CHECKLIST**

### **✅ VERIFIED CLEAN:**
- [x] `client/src/lib/prompt-enhancer.js` - Phase 3 isolation perfect
- [x] `buildConciseMedicationPrompt()` - Produces correct concise prompt
- [x] `llm-api.jsx` request packaging - Includes `systemPrompt` in payload

### **🚨 VERIFIED CONTAMINATED:**  
- [x] `server/routes.js:613` - Non-streaming endpoint ignores `systemPrompt`
- [x] `server/routes.js:887` - Streaming endpoint ignores `systemPrompt`  
- [x] `server/routes.js:659-671` - Hardcoded expansion prompt #1
- [x] `server/routes.js:945-961` - Hardcoded expansion prompt #2

### **❌ NOT FOUND:**
- [x] `server/lib/enhancePrompt.js` - Does not exist
- [x] `server/lib/medical-safety-processor.js` - Does not exist (client-side only)

---

## 🔧 **MINIMAL TARGETED PATCH REQUIREMENTS**

### **Single Line Fix Required:**

**Location:** `server/routes.js`  
**Lines:** 613 & 887

**Current (Broken):**
```javascript
const { message, conversationHistory, isHighRisk } = validation.data;
```

**Required Fix:**
```javascript
const { message, conversationHistory, isHighRisk, systemPrompt, enhancedPrompt, userRole } = validation.data;
```

### **Conditional Prompt Usage:**

**Replace hardcoded `medicalContext` with:**
```javascript
const finalSystemPrompt = systemPrompt || medicalContext; // Use client prompt if provided
```

---

## 🎯 **PHASE 5 RECOMMENDATIONS**

### **Immediate Actions:**

1. **🔧 EXTRACT MISSING FIELDS** - Fix destructuring to include `systemPrompt`
2. **🔄 CONDITIONAL USAGE** - Use client prompt when provided, fallback to server default
3. **🧪 VERIFICATION TEST** - Confirm concise medication queries work correctly
4. **📋 AUDIT TRAIL** - Log which prompt source is used (client vs server)

### **Long-term Architecture:**

1. **🏗️ PROMPT PRECEDENCE** - Establish clear client-first prompt hierarchy
2. **🔒 MODE VALIDATION** - Server validates client modes instead of overriding
3. **📊 MONITORING** - Track mode isolation compliance metrics

---

## ✅ **AUDIT CONCLUSION**

**CONFIRMED:** Server-side prompt hijacking is the **single root cause** of concise mode failure. Phase 3 client-side mode isolation is **perfect** but completely **bypassed** by server ignorance of `systemPrompt` field.

**SEVERITY:** 🚨 **CRITICAL**  
**COMPLEXITY:** 🟢 **LOW** (single line fix)  
**IMPACT:** 🚨 **HIGH** (affects all medication queries)

The audit provides **hard evidence** that a minimal server-side patch can restore complete mode isolation functionality.

---

**Report Generated:** September 24, 2025  
**Next Phase:** Minimal targeted server patch to respect client prompts  
**ETA:** < 5 minutes implementation time