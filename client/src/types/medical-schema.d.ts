/**
 * @file TypeScript definitions for medical safety system
 * Phase 9: Medical Safety Guidelines - Type definitions
 */

// Safety Rules Types
export interface EmergencySymptom {
  pattern: string;
  category: 'cardiovascular' | 'respiratory' | 'neurological' | 'mental_health' | 'trauma';
  urgency: 'emergency';
  description: string;
}

export interface UrgentSymptom {
  pattern: string;
  category: string;
  urgency: 'urgent';
  description: string;
}

export interface MentalHealthTrigger {
  pattern: string;
  severity: 'high' | 'medium';
  response: string;
}

export interface ConservativeBiasRule {
  condition: string;
  biasRule: string;
  action: 'escalate' | 'flag';
}

export interface EmergencyContact {
  emergency: string;
  crisis: string;
  poison: string;
}

export interface SafetyDisclaimer {
  general: string;
  emergency: string;
  mental_health: string;
  medication: string;
  fallback: string;
}

// Triage Engine Types
export interface DetectedSymptom {
  name: string;
  severity: 'mild' | 'moderate' | 'severe' | 'emergency';
  category: string;
}

export interface SeverityAssessment {
  emergencyCount: number;
  severeCount: number;
  moderateCount: number;
  totalSymptoms: number;
  highestSeverity: 'mild' | 'moderate' | 'severe' | 'emergency';
}

export interface EnhancedTriageResult {
  level: 'NON_URGENT' | 'URGENT' | 'EMERGENCY';
  reasons: string[];
  symptomNames: string[];
  severityAssessment: SeverityAssessment;
  safetyFlags: string[];
  emergencyProtocol: boolean;
  mentalHealthCrisis: boolean;
  detectedSymptoms: DetectedSymptom[];
  conservativeBiasApplied: boolean;
}

export interface TriageSummary {
  triageLevel: 'NON_URGENT' | 'URGENT' | 'EMERGENCY';
  emergencyProtocol: boolean;
  mentalHealthCrisis: boolean;
  safetyFlags: string[];
  flaggedSymptoms: string[];
  severityBreakdown: SeverityAssessment;
  recommendedActions: string[];
  riskFactors: string[];
  conservativeBias: boolean;
  timestamp: string;
  inputSanitized: string;
}

// Emergency Detector Types
export interface EmergencyDetectionResult {
  isEmergency: boolean;
  emergencyType: 'medical' | 'mental_health' | 'trauma' | null;
  severity: string;
  triggeredPatterns: string[];
  emergencyContacts: EmergencyContact;
  immediateActions: string;
  requiresEmergencyServices: boolean;
  emergencyMessage: string;
}

export interface CrisisInterventionResource {
  name: string;
  number?: string;
  text?: string;
  url?: string;
  available: string;
}

export interface EmergencyChecklistItem {
  step: number;
  action: string;
  priority: 'critical' | 'high' | 'medium';
  completed: boolean;
}

// Fallback Engine Types
export interface FallbackContext {
  originalQuery: string;
  reason: 'ai_failure' | 'safety_concern' | 'ambiguous_input' | 'technical_error';
  triageLevel?: string;
  isEmergency?: boolean;
  isMentalHealth?: boolean;
}

export interface FallbackResponse {
  response: string;
  type: 'general' | 'emergency' | 'mental_health' | 'medication' | 'technical_error';
  disclaimer: string;
  requiresHumanIntervention: boolean;
  recommendedActions: string[];
  fallbackReason: string;
}

export interface ResponseValidation {
  isValid: boolean;
  violations: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

// ATD Router Types
export interface Demographics {
  age?: number;
  sex?: 'male' | 'female' | 'other';
  sessionId?: string;
}

export interface ATDRoutingResult {
  routeToProvider: boolean;
  providerType: 'emergency' | 'urgent' | 'routine' | 'mental_health';
  structuredData: StructuredMedicalData;
  providerMessage: string;
  patientGuidance: string;
  clinicalFlags: string[];
  priorityScore: number;
}

export interface PatientInfo {
  age: number | null;
  sex: string | null;
  queryTimestamp: string;
  sessionId: string;
}

export interface ChiefComplaint {
  originalQuery: string;
  sanitizedQuery: string;
  queryLength: number;
  keySymptoms: string[];
}

export interface SymptomAnalysis {
  detected: DetectedSymptom[];
  severity: SeverityAssessment;
  categories: Record<string, string[]>;
  timeline: TimelineEntry[];
}

export interface TimelineEntry {
  type: string;
  matches: RegExpMatchArray[];
}

export interface EmergencyAssessment {
  isEmergency: boolean;
  emergencyType: 'medical' | 'mental_health' | 'trauma' | null;
  severity: string;
  triggeredPatterns: string[];
  requiresEmergencyServices: boolean;
}

export interface RiskAssessment {
  overallRisk: 'LOW' | 'MODERATE' | 'HIGH';
  specificRisks: string[];
  followUpUrgency: 'IMMEDIATE' | 'WITHIN_24_HOURS' | 'ROUTINE';
}

export interface SystemContext {
  aiTriageVersion: string;
  processingTimestamp: string;
  reliabilityScore: number;
}

export interface StructuredMedicalData {
  patient: PatientInfo;
  chiefComplaint: ChiefComplaint;
  triage: EnhancedTriageResult;
  symptoms: SymptomAnalysis;
  emergency: EmergencyAssessment;
  clinicalFlags: string[];
  recommendedActions: string[];
  riskAssessment: RiskAssessment;
  systemContext: SystemContext;
}

// React Component Props Types
export interface FeedbackNoticeProps {
  type?: 'general' | 'emergency' | 'mental_health' | 'medication';
  message: string;
  isVisible?: boolean;
  recommendedActions?: string[];
  emergencyContacts?: EmergencyContact | null;
  onDismiss?: () => void;
}

export interface TriageWarningProps {
  triageLevel: 'EMERGENCY' | 'URGENT' | 'NON_URGENT';
  reasons?: string[];
  safetyFlags?: string[];
  emergencyProtocol?: boolean;
  mentalHealthCrisis?: boolean;
  recommendedActions?: string[];
  emergencyContacts?: EmergencyContact | null;
  onEmergencyCall?: () => void;
  showActions?: boolean;
}

// Medical Safety System Integration Types
export interface MedicalSafetyContext {
  triageResult: EnhancedTriageResult;
  emergencyDetection: EmergencyDetectionResult;
  atdRouting: ATDRoutingResult;
  fallbackResponse?: FallbackResponse;
  demographics: Demographics;
  region: string;
}

export interface SafetyProcessingResult {
  processedResponse: string;
  safetyNotices: FeedbackNoticeProps[];
  triageWarning: TriageWarningProps | null;
  requiresHumanReview: boolean;
  routeToProvider: boolean;
  emergencyProtocol: boolean;
}