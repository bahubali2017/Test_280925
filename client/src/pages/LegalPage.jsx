import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Download, FileText, Shield } from 'lucide-react';

export default function LegalPage() {
  const [termsContent, setTermsContent] = useState('');
  const [licenseContent, setLicenseContent] = useState('');
  const [activeTab, setActiveTab] = useState('terms');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLegalDocuments = async () => {
      try {
        // Load embedded legal documents
        const termsContent = `# Terms of Service - Anamnesis Medical AI Assistant

**Effective Date:** September 2025  
**Last Updated:** September 2025

---

## ⚖️ ACCEPTANCE OF TERMS

By accessing or using the Anamnesis Medical AI Assistant ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.

---

## 🏥 MEDICAL DISCLAIMER

### NOT MEDICAL ADVICE
**IMPORTANT:** Anamnesis is an AI-powered health information tool and is **NOT** a substitute for professional medical advice, diagnosis, or treatment. 

- **Always consult qualified healthcare providers** for medical concerns
- **Never delay seeking medical care** based on AI responses
- **Emergency situations require immediate medical attention** - call emergency services
- AI responses are **informational only** and may contain errors

### NO DOCTOR-PATIENT RELATIONSHIP
Use of this Service does not create a doctor-patient relationship between you and Anamnesis or any healthcare provider.

---

## 🛡️ ACCEPTABLE USE POLICY

### PERMITTED USES
- Personal health information research
- Educational purposes about medical topics
- General wellness guidance
- Non-commercial use only

### PROHIBITED USES
You agree **NOT** to:
- **Reverse engineer** or attempt to extract AI models or algorithms
- **Scrape, crawl, or systematically download** content
- **Use outputs to train other AI systems** or language models
- **Resell, redistribute, or commercialize** AI-generated content
- **Provide false or misleading information** to the AI system
- **Attempt to circumvent** security measures or rate limiting
- **Use for illegal purposes** or to harm others
- **Impersonate healthcare professionals** using AI responses

---

## 🔒 PRIVACY AND DATA PROTECTION

### DATA COLLECTION
- We collect minimal data necessary for service operation
- **No Protected Health Information (PHI)** is permanently stored
- Session data is encrypted and automatically purged
- Anonymous usage analytics for service improvement

### DATA SECURITY
- End-to-end encryption for all communications
- Regular security audits and monitoring
- Compliance with international privacy standards
- No data sharing with third parties for marketing

### YOUR RIGHTS
- Right to access your data
- Right to request deletion
- Right to data portability
- Right to opt-out of analytics

---

## 🧬 INTELLECTUAL PROPERTY

### AI OUTPUT OWNERSHIP
- All AI responses contain **cryptographic watermarks**
- Outputs subject to **usage tracking and audit trails**
- Commercial use requires explicit written permission
- Training other AI systems is strictly prohibited

### PLATFORM TECHNOLOGY
- All AI models, algorithms, and medical knowledge bases are proprietary
- Unauthorized copying or reverse engineering is prohibited
- Platform protected by patents, copyrights, and trade secrets

---

## ⚡ SERVICE AVAILABILITY

### NO UPTIME GUARANTEE
- Service provided "as is" without availability guarantees
- Maintenance, updates, or technical issues may cause interruptions
- No liability for service downtime or data loss

### RATE LIMITING
- Usage subject to reasonable rate limits
- Excessive usage may result in temporary or permanent restrictions

---

## 🚨 EMERGENCY SITUATIONS

### IMMEDIATE MEDICAL ATTENTION
If you are experiencing a medical emergency:
- **Call emergency services immediately** (911, 112, etc.)
- **Do not rely on AI responses** for emergency care
- **Seek immediate professional medical help**

Common emergency signs include:
- Chest pain or difficulty breathing
- Severe bleeding or trauma
- Loss of consciousness
- Severe allergic reactions
- Thoughts of self-harm

---

## 🌍 INTERNATIONAL COMPLIANCE

### REGIONAL ADAPTATIONS
- Medical terminology adapted for local regions (US/UK/EU/AU/CA)
- Emergency contact information localized by region
- Cultural considerations in health recommendations

### REGULATORY COMPLIANCE
- Service designed to comply with applicable health regulations
- Not approved as a medical device in any jurisdiction
- Intended for informational purposes only

---

## ⚖️ LEGAL TERMS

### LIMITATION OF LIABILITY
Anamnesis and its affiliates shall not be liable for:
- Medical decisions made based on AI responses
- Damages resulting from service use or reliance
- Indirect, incidental, or consequential damages
- Service interruptions or data loss

### INDEMNIFICATION
You agree to indemnify Anamnesis against any claims arising from:
- Your use of the Service
- Violation of these Terms
- Infringement of intellectual property rights

### GOVERNING LAW
These Terms are governed by Czech Republic law. Disputes subject to Prague jurisdiction unless otherwise required by local law.

### MODIFICATIONS
We reserve the right to modify these Terms at any time. Continued use constitutes acceptance of changes.

---

## 📞 CONTACT INFORMATION

### SUPPORT
- **General Support:** support@anamnesis.health
- **Legal Inquiries:** legal@anamnesis.health
- **Security Issues:** security@anamnesis.health
- **Privacy Concerns:** privacy@anamnesis.health

### REPORTING VIOLATIONS
Report Terms violations or intellectual property infringement to: violations@anamnesis.health

---

## 🔗 RELATED DOCUMENTS

- [Privacy Policy](./privacy)
- [Software License](./LICENSE.txt)
- [Security Policy](./security)

---

**By using Anamnesis, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.**

*This is a legally binding agreement. If you do not agree to these terms, please discontinue use of the Service immediately.*`;

        const licenseContent = `ANAMNESIS MEDICAL AI ASSISTANT - PROPRIETARY LICENSE
================================================================

Copyright (c) 2025 Anamnesis Health Technologies
All Rights Reserved

IMPORTANT: This software contains proprietary AI technology, medical algorithms, 
and intellectual property. READ CAREFULLY BEFORE USE.

LICENSE TERMS AND CONDITIONS
============================

1. GRANT OF LIMITED LICENSE
   This license grants you a limited, non-exclusive, non-transferable right to 
   use the Anamnesis Medical AI Assistant ("Software") for personal, 
   non-commercial purposes only.

2. RESTRICTIONS
   You MAY NOT:
   - Reverse engineer, decompile, disassemble, or attempt to derive source code
   - Create derivative works, modifications, or improvements
   - Distribute, sublicense, rent, lease, or sell the Software
   - Use the Software for commercial purposes without explicit written consent
   - Extract, copy, or reproduce AI training data or algorithms
   - Use AI-generated outputs to train other AI systems or language models
   - Remove or alter any proprietary notices, watermarks, or identification

3. AI OUTPUT RESTRICTIONS
   All AI-generated content contains cryptographic watermarks and is subject to:
   - Prohibition on use for training machine learning models
   - Requirement to maintain attribution to Anamnesis platform
   - Restriction on commercial redistribution or resale
   - Audit trail logging for compliance verification

4. MEDICAL DISCLAIMER
   This Software is NOT a substitute for professional medical advice, diagnosis, 
   or treatment. Always seek advice from qualified healthcare providers.

5. INTELLECTUAL PROPERTY
   All algorithms, models, medical knowledge bases, and AI technologies remain 
   the exclusive property of Anamnesis Health Technologies. Any unauthorized 
   use constitutes intellectual property theft.

6. MONITORING AND ENFORCEMENT
   Usage is monitored via automated systems. Violations will result in:
   - Immediate license termination
   - Legal action for damages and injunctive relief
   - Reporting to relevant authorities

7. TERMINATION
   This license terminates immediately upon violation of any terms. Upon 
   termination, you must cease all use and destroy all copies.

8. GOVERNING LAW
   This license is governed by Czech Republic law and international 
   intellectual property treaties. Legal disputes subject to Prague jurisdiction.

9. NO WARRANTY
   Software provided "AS IS" without warranty. Use at your own risk.

10. CONTACT
    For licensing inquiries: legal@anamnesis.health
    For violations: security@anamnesis.health

BY USING THIS SOFTWARE, YOU ACKNOWLEDGE THAT YOU HAVE READ AND AGREE 
TO BE BOUND BY THESE TERMS.

VIOLATION OF THIS LICENSE CONSTITUTES COPYRIGHT INFRINGEMENT AND 
TRADE SECRET MISAPPROPRIATION SUBJECT TO CIVIL AND CRIMINAL PENALTIES.

Last Updated: September 2025`;

        setTermsContent(termsContent);
        setLicenseContent(licenseContent);
      } catch (error) {
        console.error('Error loading legal documents:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLegalDocuments();
  }, []);

  const formatMarkdown = (content) => {
    // Basic markdown formatting for display
    // @param {string} content
    return content
      .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold mb-4 text-blue-600 dark:text-blue-400">$1</h1>')
      .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-semibold mb-3 mt-6 text-blue-500 dark:text-blue-300">$1</h2>')
      .replace(/^### (.+)$/gm, '<h3 class="text-xl font-medium mb-2 mt-4 text-blue-400 dark:text-blue-200">$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-gray-100">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
      .replace(/^- (.+)$/gm, '<li class="ml-4 mb-1 list-disc">$1</li>')
      .replace(/\n\n/g, '</p><p class="mb-3">')
      .replace(/^(?!<[h1-6]|<li|<p)(.+)$/gm, '<p class="mb-3">$1</p>');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 flex items-center justify-center">
        <div className="animate-pulse text-blue-600 dark:text-blue-400 text-lg">Loading legal documents...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/login">
              <button className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Legal Information</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Terms of Service and Software License</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href="/TERMS.md"
              download="Anamnesis_Terms.md"
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Download Terms
            </a>
            <a
              href="/LICENSE.txt"
              download="Anamnesis_License.txt"
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Download License
            </a>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('terms')}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'terms'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <FileText className="h-4 w-4" />
                Terms of Service
              </button>
              <button
                onClick={() => setActiveTab('license')}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'license'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <Shield className="h-4 w-4" />
                Software License
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          {activeTab === 'terms' && (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4 text-blue-600 dark:text-blue-400">
                <FileText className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Terms of Service</h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Please read these terms carefully before using Anamnesis. These terms include important medical disclaimers and usage restrictions.
              </p>
              <div className="max-h-[600px] overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                <div 
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: formatMarkdown(termsContent) }}
                />
              </div>
            </div>
          )}

          {activeTab === 'license' && (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4 text-blue-600 dark:text-blue-400">
                <Shield className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Software License</h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                This proprietary license governs your use of the Anamnesis software and AI technology.
              </p>
              <div className="max-h-[600px] overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                <pre className="whitespace-pre-wrap text-sm font-mono text-gray-800 dark:text-gray-200">
                  {licenseContent}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Important Notice */}
        <div className="mt-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">Important Legal Notice</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                By using Anamnesis, you acknowledge that you have read, understood, and agree to be bound by both the Terms of Service and Software License. 
                This software is for informational purposes only and is not a substitute for professional medical advice.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>© 2025 Anamnesis Health Technologies. All rights reserved.</p>
          <p className="mt-1">
            Questions? Contact us at{' '}
            <a href="mailto:legal@anamnesis.health" className="text-blue-600 dark:text-blue-400 hover:underline">
              legal@anamnesis.health
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}