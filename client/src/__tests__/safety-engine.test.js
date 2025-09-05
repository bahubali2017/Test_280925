/**
 * @file Unit tests for medical safety engine
 * Phase 9: Medical Safety Guidelines - Test suite for safety components
 */

// @ts-ignore - Jest globals are available in test environment
import { describe, it, expect, beforeEach } from '@jest/globals';
import { isEmergencySymptom, assessMentalHealthCrisis, applyConservativeBias } from '../lib/config/safety-rules.js';
import { performEnhancedTriage } from '../lib/medical-layer/triage-engine.js';
import { detectEmergency } from '../lib/medical-layer/emergency-detector.js';
import { routeToProvider } from '../lib/medical-layer/atd-router.js';
import { processAIResponseForSafety } from '../lib/medical-layer/fallback-engine.js';
import { processMedicalSafety } from '../lib/medical-safety-processor.js';

describe('Safety Rules', () => {
  describe('isEmergencySymptom', () => {
    it('should detect chest pain as emergency', () => {
      expect(isEmergencySymptom('I have chest pain')).toBe(true);
      expect(isEmergencySymptom('experiencing chest pain right now')).toBe(true);
    });

    it('should detect breathing issues as emergency', () => {
      expect(isEmergencySymptom('I cannot breathe')).toBe(true);
      expect(isEmergencySymptom('having difficulty breathing')).toBe(true);
    });

    it('should not flag non-emergency symptoms', () => {
      expect(isEmergencySymptom('I have a headache')).toBe(false);
      expect(isEmergencySymptom('feeling tired today')).toBe(false);
    });
  });

  describe('assessMentalHealthCrisis', () => {
    it('should detect high-severity suicidal ideation', () => {
      const result = assessMentalHealthCrisis('I want to kill myself');
      expect(result.isCrisis).toBe(true);
      expect(result.severity).toBe('high');
      expect(result.triggers).toContain('kill myself');
    });

    it('should detect medium-severity hopelessness', () => {
      const result = assessMentalHealthCrisis('I feel hopeless');
      expect(result.isCrisis).toBe(true);
      expect(result.severity).toBe('medium');
      expect(result.triggers).toContain('hopeless');
    });

    it('should not flag normal emotional expressions', () => {
      const result = assessMentalHealthCrisis('I am sad today');
      expect(result.isCrisis).toBe(false);
    });
  });

  describe('applyConservativeBias', () => {
    it('should escalate for pediatric patients', () => {
      const result = applyConservativeBias('NON_URGENT', 'headache', { age: 8 });
      expect(result).toBe('URGENT');
    });

    it('should escalate for elderly patients with multiple symptoms', () => {
      const result = applyConservativeBias('NON_URGENT', 'headache and dizziness', { age: 70, symptomCount: 2 });
      expect(result).toBe('URGENT');
    });

    it('should not escalate for young adults with single symptom', () => {
      const result = applyConservativeBias('NON_URGENT', 'headache', { age: 25, symptomCount: 1 });
      expect(result).toBe('NON_URGENT');
    });
  });
});

describe('Enhanced Triage Engine', () => {
  let mockContext;

  beforeEach(() => {
    mockContext = {
      userInput: '',
      symptoms: [],
      demographics: {}
    };
  });

  describe('performEnhancedTriage', () => {
    it('should classify chest pain as emergency', () => {
      mockContext.userInput = 'I have severe chest pain';
      const result = performEnhancedTriage(mockContext);
      
      expect(result.level).toBe('EMERGENCY');
      expect(result.emergencyProtocol).toBe(true);
      expect(result.safetyFlags).toContain('EMERGENCY_SYMPTOMS_DETECTED');
    });

    it('should detect mental health crisis', () => {
      mockContext.userInput = 'I want to end my life';
      const result = performEnhancedTriage(mockContext);
      
      expect(result.level).toBe('EMERGENCY');
      expect(result.mentalHealthCrisis).toBe(true);
      expect(result.safetyFlags).toContain('MENTAL_HEALTH_CRISIS');
    });

    it('should apply conservative bias for pediatric cases', () => {
      mockContext.userInput = 'my child has a fever';
      mockContext.demographics = { age: 5 };
      const result = performEnhancedTriage(mockContext);
      
      expect(result.level).toBe('URGENT');
      expect(result.safetyFlags).toContain('PEDIATRIC_ESCALATION');
    });

    it('should handle non-urgent symptoms appropriately', () => {
      mockContext.userInput = 'I have a mild headache';
      mockContext.demographics = { age: 30 };
      const result = performEnhancedTriage(mockContext);
      
      expect(result.level).toBe('NON_URGENT');
      expect(result.emergencyProtocol).toBe(false);
    });
  });
});

describe('Emergency Detector', () => {
  describe('detectEmergency', () => {
    it('should detect medical emergencies', () => {
      const result = detectEmergency('I think I am having a heart attack');
      
      expect(result.isEmergency).toBe(true);
      expect(result.emergencyType).toBe('medical');
      expect(result.severity).toBe('critical');
      expect(result.requiresEmergencyServices).toBe(true);
    });

    it('should detect mental health crises', () => {
      const result = detectEmergency('I am going to kill myself tonight');
      
      expect(result.isEmergency).toBe(true);
      expect(result.emergencyType).toBe('mental_health');
      expect(result.severity).toBe('critical');
      expect(result.requiresEmergencyServices).toBe(true);
    });

    it('should provide appropriate emergency contacts', () => {
      const result = detectEmergency('medical emergency', 'US');
      
      expect(result.emergencyContacts.emergency).toBe('911');
      expect(result.emergencyContacts.crisis).toBe('988');
    });

    it('should handle non-emergency input', () => {
      const result = detectEmergency('I have a question about my medication');
      
      expect(result.isEmergency).toBe(false);
      expect(result.emergencyType).toBe(null);
    });
  });
});

describe('ATD Router', () => {
  let mockTriageResult, mockEmergencyDetection;

  beforeEach(() => {
    mockTriageResult = {
      level: 'NON_URGENT',
      reasons: [],
      safetyFlags: [],
      emergencyProtocol: false,
      mentalHealthCrisis: false,
      symptomNames: [],
      severityAssessment: { emergencyCount: 0, severeCount: 0, moderateCount: 0 }
    };
    
    mockEmergencyDetection = {
      isEmergency: false,
      emergencyType: null,
      severity: 'low'
    };
  });

  describe('routeToProvider', () => {
    it('should route emergency cases to emergency provider', () => {
      mockTriageResult.level = 'EMERGENCY';
      mockEmergencyDetection.isEmergency = true;
      mockEmergencyDetection.emergencyType = 'medical';
      
      const result = routeToProvider(mockTriageResult, mockEmergencyDetection, 'chest pain', {});
      
      expect(result.routeToProvider).toBe(true);
      expect(result.providerType).toBe('emergency');
      expect(result.priorityScore).toBe(10);
      expect(result.clinicalFlags).toContain('EMERGENCY_SITUATION');
    });

    it('should route mental health crises appropriately', () => {
      mockTriageResult.level = 'EMERGENCY';
      mockTriageResult.mentalHealthCrisis = true;
      mockEmergencyDetection.isEmergency = true;
      mockEmergencyDetection.emergencyType = 'mental_health';
      
      const result = routeToProvider(mockTriageResult, mockEmergencyDetection, 'suicidal thoughts', {});
      
      expect(result.routeToProvider).toBe(true);
      expect(result.providerType).toBe('mental_health');
      expect(result.clinicalFlags).toContain('MENTAL_HEALTH_CRISIS');
    });

    it('should escalate pediatric cases', () => {
      mockTriageResult.symptomNames = ['fever'];
      
      const result = routeToProvider(mockTriageResult, mockEmergencyDetection, 'fever', { age: 8 });
      
      expect(result.routeToProvider).toBe(true);
      expect(result.clinicalFlags).toContain('PEDIATRIC_PATIENT');
      expect(result.priorityScore).toBeGreaterThan(1);
    });

    it('should not route non-urgent cases without risk factors', () => {
      const result = routeToProvider(mockTriageResult, mockEmergencyDetection, 'mild headache', { age: 30 });
      
      expect(result.routeToProvider).toBe(false);
      expect(result.providerType).toBe('routine');
    });
  });
});

describe('Response Safety Processing', () => {
  describe('processAIResponseForSafety', () => {
    it('should filter overconfident language', () => {
      const response = 'You have pneumonia. Take this medication.';
      const context = { triageLevel: 'URGENT', isEmergency: false, isMentalHealth: false, detectedSymptoms: [] };
      
      const result = processAIResponseForSafety(response, context);
      
      expect(result).toContain('You may be experiencing');
      expect(result).toContain('Discuss with your doctor');
      expect(result).toContain('medical disclaimer');
    });

    it('should add emergency notices for emergency cases', () => {
      const response = 'This looks concerning.';
      const context = { triageLevel: 'EMERGENCY', isEmergency: true, isMentalHealth: false, detectedSymptoms: [] };
      
      const result = processAIResponseForSafety(response, context);
      
      expect(result).toContain('🚨 **EMERGENCY NOTICE**');
      expect(result).toContain('medical emergency');
    });

    it('should add mental health notices for mental health cases', () => {
      const response = 'I understand you are struggling.';
      const context = { triageLevel: 'EMERGENCY', isEmergency: false, isMentalHealth: true, detectedSymptoms: [] };
      
      const result = processAIResponseForSafety(response, context);
      
      expect(result).toContain('💙 **MENTAL HEALTH NOTICE**');
      expect(result).toContain('thoughts of self-harm');
    });
  });
});

describe('Medical Safety Processor Integration', () => {
  describe('processMedicalSafety', () => {
    it('should process emergency cases correctly', async () => {
      const result = await processMedicalSafety('I have severe chest pain and cannot breathe');
      
      expect(result.shouldBlockAI).toBe(true);
      expect(result.emergencyProtocol).toBe(true);
      expect(result.routeToProvider).toBe(true);
      expect(result.priorityScore).toBeGreaterThan(8);
      expect(result.safetyNotices).toHaveLength(2); // Emergency + general disclaimer
      expect(result.triageWarning).not.toBe(null);
      expect(result.fallbackResponse).not.toBe(null);
    });

    it('should process mental health crises correctly', async () => {
      const result = await processMedicalSafety('I want to end my life tonight');
      
      expect(result.shouldBlockAI).toBe(true);
      expect(result.emergencyProtocol).toBe(true);
      expect(result.safetyNotices[0].type).toBe('mental_health');
      expect(result.triageWarning.mentalHealthCrisis).toBe(true);
    });

    it('should handle routine cases appropriately', async () => {
      const result = await processMedicalSafety('I have a mild headache today');
      
      expect(result.shouldBlockAI).toBe(false);
      expect(result.emergencyProtocol).toBe(false);
      expect(result.routeToProvider).toBe(false);
      expect(result.safetyNotices).toHaveLength(1); // Only general disclaimer
      expect(result.triageWarning).toBe(null);
    });

    it('should apply conservative bias for high-risk demographics', async () => {
      const result = await processMedicalSafety('my baby has a fever', {
        demographics: { age: 1 },
        region: 'US'
      });
      
      expect(result.routeToProvider).toBe(true);
      expect(result.safetyContext.atdRouting.clinicalFlags).toContain('PEDIATRIC_PATIENT');
      expect(result.priorityScore).toBeGreaterThan(3);
    });

    it('should handle processing errors gracefully', async () => {
      // Test with malformed input that might cause errors
      const result = await processMedicalSafety(null);
      
      expect(result.shouldBlockAI).toBe(true);
      expect(result.fallbackResponse).not.toBe(null);
      expect(result.safetyNotices[0].type).toBe('general');
    });
  });
});