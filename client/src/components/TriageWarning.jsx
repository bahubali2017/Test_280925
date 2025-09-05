/**
 * @file Medical triage warning and escalation component
 * Phase 9: Medical Safety Guidelines - Triage-based warning system
 */

import { AlertCircle, Clock, Zap, Dot } from "lucide-react";

/**
 * Triage warning component for medical escalations
 * @param {object} props
 * @param {'EMERGENCY'|'URGENT'|'NON_URGENT'} props.triageLevel - Triage level
 * @param {string[]} props.reasons - Triage reasons
 * @param {string[]} props.safetyFlags - Safety flags from triage
 * @param {boolean} props.emergencyProtocol - Whether emergency protocol is active
 * @param {boolean} props.mentalHealthCrisis - Whether mental health crisis detected
 * @param {string[]} [props.recommendedActions] - Recommended actions
 * @param {object} [props.emergencyContacts] - Emergency contact info
 * @param {() => void} [props.onEmergencyCall] - Emergency call handler
 * @param {boolean} [props.showActions] - Whether to show action buttons
 * @returns {JSX.Element} TriageWarning component
 */
export default function TriageWarning({
  triageLevel,
  reasons = [],
  safetyFlags = [],
  emergencyProtocol = false,
  mentalHealthCrisis = false,
  recommendedActions = [],
  emergencyContacts = null,
  onEmergencyCall = null,
  showActions = true
}) {
  if (triageLevel === "NON_URGENT" && !emergencyProtocol && !mentalHealthCrisis) {
    return null;
  }

  const getTriageConfig = () => {
    if (emergencyProtocol || triageLevel === "EMERGENCY") {
      return {
        icon: AlertCircle,
        bgColor: "bg-red-50 dark:bg-red-950",
        borderColor: "border-red-500 dark:border-red-400",
        textColor: "text-red-900 dark:text-red-100",
        iconColor: "text-red-600 dark:text-red-400",
        title: mentalHealthCrisis ? "🆘 Mental Health Crisis Detected" : "🚨 Medical Emergency Detected",
        urgency: "IMMEDIATE ATTENTION REQUIRED",
        buttonColor: "bg-red-600 hover:bg-red-700"
      };
    } else if (triageLevel === "URGENT") {
      return {
        icon: Zap,
        bgColor: "bg-orange-50 dark:bg-orange-950",
        borderColor: "border-orange-500 dark:border-orange-400",
        textColor: "text-orange-900 dark:text-orange-100",
        iconColor: "text-orange-600 dark:text-orange-400",
        title: "⚡ Urgent Medical Attention Needed",
        urgency: "SEEK CARE WITHIN 2-4 HOURS",
        buttonColor: "bg-orange-600 hover:bg-orange-700"
      };
    } else {
      return {
        icon: Clock,
        bgColor: "bg-yellow-50 dark:bg-yellow-950",
        borderColor: "border-yellow-500 dark:border-yellow-400",
        textColor: "text-yellow-900 dark:text-yellow-100",
        iconColor: "text-yellow-600 dark:text-yellow-400",
        title: "⚠️ Medical Consultation Recommended",
        urgency: "SCHEDULE APPOINTMENT SOON",
        buttonColor: "bg-yellow-600 hover:bg-yellow-700"
      };
    }
  };

  const config = getTriageConfig();
  const IconComponent = config.icon;

  const handleEmergencyCall = () => {
    if (onEmergencyCall) {
      onEmergencyCall();
    } else if (emergencyContacts?.emergency) {
      // Try to initiate call on mobile devices
      window.location.href = `tel:${emergencyContacts.emergency}`;
    }
  };

  const getCriticalFlags = () => {
    const criticalFlags = safetyFlags.filter(flag => 
      flag.includes('EMERGENCY') || 
      flag.includes('CRISIS') || 
      flag.includes('SUICIDE') ||
      flag.includes('CARDIAC') ||
      flag.includes('RESPIRATORY')
    );
    return criticalFlags;
  };

  return (
    <div className={`${config.bgColor} ${config.borderColor} border-2 shadow-lg mb-6 p-4 rounded-md`}>
      <div className="flex items-start space-x-3">
        <IconComponent className={`h-6 w-6 mt-1 flex-shrink-0 ${config.iconColor} animate-pulse`} />
        
        <div className="flex-1 min-w-0">
          <h3 className={`text-base font-bold mb-2 ${config.textColor}`}>
            {config.title}
          </h3>
          
          <div className={`text-sm font-semibold mb-3 ${config.textColor} opacity-90`}>
            {config.urgency}
          </div>

          {/* Critical Safety Flags */}
          {getCriticalFlags().length > 0 && (
            <div className="mb-3">
              <div className={`text-sm font-medium mb-2 ${config.textColor}`}>
                Critical Indicators:
              </div>
              <div className="flex flex-wrap gap-2">
                {getCriticalFlags().map((flag, index) => (
                  <span 
                    key={index}
                    className={`px-2 py-1 text-xs rounded-full ${config.borderColor} border ${config.textColor} bg-opacity-50`}
                  >
                    {flag.replace(/_/g, ' ').toLowerCase()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Triage Reasons */}
          {reasons.length > 0 && (
            <div className={`text-sm ${config.textColor} mb-4`}>
              <div className="font-medium mb-2">Assessment Reasoning:</div>
              <ul className="space-y-1">
                {reasons.map((reason, index) => (
                  <li key={index} className="flex items-start">
                    <Dot className="h-3 w-3 mt-1 mr-2 flex-shrink-0 opacity-60" />
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommended Actions */}
          {recommendedActions.length > 0 && (
            <div className="mb-4">
              <div className={`text-sm font-medium mb-2 ${config.textColor}`}>
                Immediate Actions:
              </div>
              <ol className={`text-sm space-y-2 ${config.textColor}`}>
                {recommendedActions.map((action, index) => (
                  <li key={index} className="flex items-start">
                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-current text-white mr-3 mt-0.5 flex-shrink-0 opacity-80">
                      {index + 1}
                    </span>
                    {action}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Action Buttons */}
          {showActions && (
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              {(emergencyProtocol || triageLevel === "EMERGENCY") && (
                <button
                  onClick={handleEmergencyCall}
                  className={`${config.buttonColor} text-white font-semibold flex-1 sm:flex-none py-2 px-4 rounded-md transition-all duration-200`}
                >
                  {mentalHealthCrisis ? (
                    <>📞 Call Crisis Line {emergencyContacts?.crisis && `(${emergencyContacts.crisis})`}</>
                  ) : (
                    <>🚨 Call Emergency {emergencyContacts?.emergency && `(${emergencyContacts.emergency})`}</>
                  )}
                </button>
              )}
              
              {triageLevel === "URGENT" && (
                <button
                  className={`${config.buttonColor} text-white font-semibold flex-1 sm:flex-none py-2 px-4 rounded-md transition-all duration-200 text-sm`}
                >
                  🏥 Find Urgent Care
                </button>
              )}
              
              <button
                className={`${config.textColor} border border-current flex-1 sm:flex-none py-2 px-4 rounded-md transition-all duration-200 text-sm hover:bg-gray-50`}
              >
                📋 Save Assessment
              </button>
            </div>
          )}

          {/* Emergency Contact Information */}
          {(emergencyProtocol || mentalHealthCrisis) && emergencyContacts && (
            <div className={`mt-4 p-3 rounded-md border ${config.borderColor} bg-opacity-50 bg-white dark:bg-gray-900`}>
              <div className={`text-xs font-medium mb-2 ${config.textColor}`}>
                Emergency Contacts (Available 24/7):
              </div>
              <div className={`text-xs space-y-1 ${config.textColor}`}>
                {mentalHealthCrisis && emergencyContacts.crisis && (
                  <div className="flex justify-between items-center">
                    <span>Crisis Hotline:</span>
                    <a 
                      href={`tel:${emergencyContacts.crisis}`}
                      className="font-mono font-bold underline hover:no-underline"
                    >
                      {emergencyContacts.crisis}
                    </a>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span>Emergency Services:</span>
                  <a 
                    href={`tel:${emergencyContacts.emergency}`}
                    className="font-mono font-bold underline hover:no-underline"
                  >
                    {emergencyContacts.emergency}
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}