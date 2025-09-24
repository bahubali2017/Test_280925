/**
 * @file Medical feedback and disclaimer notice component
 * Phase 9: Medical Safety Guidelines - User feedback and safety notice display
 */

import { AlertTriangle, Heart, Phone, Users } from "lucide-react";

/**
 * Notice type enumeration
 * @typedef {'general'|'emergency'|'mental_health'|'medication'} NoticeType
 */

/**
 * Emergency contacts structure for safety notices
 * @typedef {{
 *   emergency: string;
 *   crisis?: string;
 *   poison?: string;
 * }} EmergencyContacts
 */

/**
 * Notice configuration with styling and icon information
 * @typedef {{
 *   icon: import('lucide-react').LucideIcon;
 *   bgColor: string;
 *   borderColor: string;
 *   textColor: string;
 *   iconColor: string;
 *   title: string;
 * }} NoticeConfig
 */

/**
 * Props for the FeedbackNotice component
 * @typedef {{
 *   type?: NoticeType;
 *   message: string;
 *   isVisible?: boolean;
 *   recommendedActions?: string[];
 *   emergencyContacts?: EmergencyContacts | null;
 *   onDismiss?: () => void;
 * }} FeedbackNoticeProps
 */

/**
 * Type guard to check if emergency contacts object has required properties
 * @param {EmergencyContacts | null} contacts - The contacts object to check
 * @returns {contacts is EmergencyContacts}
 */
function hasEmergencyContacts(contacts) {
  return contacts !== null && 
         typeof contacts === 'object' && 
         'emergency' in contacts && 
         typeof contacts.emergency === 'string';
}

/**
 * Type guard to check if emergency contacts has crisis property
 * @param {EmergencyContacts} contacts - The contacts object to check
 * @returns {contacts is EmergencyContacts & { crisis: string }}
 */
function hasCrisisContact(contacts) {
  return 'crisis' in contacts && typeof contacts.crisis === 'string';
}

/**
 * Type guard to check if emergency contacts has poison control property
 * @param {EmergencyContacts} contacts - The contacts object to check
 * @returns {contacts is EmergencyContacts & { poison: string }}
 */
function hasPoisonContact(contacts) {
  return 'poison' in contacts && typeof contacts.poison === 'string';
}

/**
 * Renders emergency contact information section
 * @param {EmergencyContacts} emergencyContacts - Emergency contact data
 * @param {NoticeConfig} config - Notice styling configuration
 * @returns {JSX.Element} Emergency contacts section
 */
function renderEmergencyContacts(emergencyContacts, config) {
  return (
    <div className={`p-3 rounded-md bg-red-100 dark:bg-red-900 ${config.borderColor} border`}>
      <h4 className={`text-sm font-medium mb-2 ${config.textColor}`}>
        Emergency Contacts:
      </h4>
      <div className={`text-sm space-y-1 ${config.textColor}`}>
        <div className="flex justify-between">
          <span>Emergency Services:</span>
          <span className="font-mono font-bold">{emergencyContacts.emergency}</span>
        </div>
        {hasCrisisContact(emergencyContacts) && (
          <div className="flex justify-between">
            <span>Crisis Line:</span>
            <span className="font-mono font-bold">{emergencyContacts.crisis}</span>
          </div>
        )}
        {hasPoisonContact(emergencyContacts) && (
          <div className="flex justify-between">
            <span>Poison Control:</span>
            <span className="font-mono font-bold">{emergencyContacts.poison}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Renders mental health crisis support section
 * @param {EmergencyContacts} emergencyContacts - Emergency contact data
 * @param {NoticeConfig} config - Notice styling configuration
 * @returns {JSX.Element} Mental health crisis support section
 */
function renderMentalHealthSupport(emergencyContacts, config) {
  return (
    <div className={`p-3 rounded-md bg-blue-100 dark:bg-blue-900 ${config.borderColor} border`}>
      <h4 className={`text-sm font-medium mb-2 ${config.textColor}`}>
        Crisis Support:
      </h4>
      <div className={`text-sm space-y-1 ${config.textColor}`}>
        {hasCrisisContact(emergencyContacts) && (
          <div className="flex justify-between">
            <span>Crisis Hotline:</span>
            <span className="font-mono font-bold">{emergencyContacts.crisis}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Emergency Services:</span>
          <span className="font-mono font-bold">{emergencyContacts.emergency}</span>
        </div>
        <div className={`text-xs mt-2 ${config.textColor} opacity-80`}>
          Available 24/7 - You are not alone
        </div>
      </div>
    </div>
  );
}

/**
 * Renders recommended actions list
 * @param {string[]} recommendedActions - Array of recommended action strings
 * @param {NoticeConfig} config - Notice styling configuration
 * @returns {JSX.Element} Recommended actions section
 */
function renderRecommendedActions(recommendedActions, config) {
  return (
    <div className="mb-3">
      <h4 className={`text-sm font-medium mb-2 ${config.textColor}`}>
        Recommended Actions:
      </h4>
      <ul className={`text-sm space-y-1 ${config.textColor}`} role="list">
        {recommendedActions.map((action, index) => (
          <li key={index} className="flex items-start">
            <span 
              className="inline-block w-2 h-2 bg-current rounded-full mt-2 mr-2 flex-shrink-0 opacity-60" 
              aria-hidden="true"
            />
            {action}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Medical feedback notice component with safety disclaimers
 * Displays contextual medical notices with emergency contacts and recommended actions
 * @param {FeedbackNoticeProps} props - Component properties
 * @returns {JSX.Element | null} FeedbackNotice component or null if not visible
 */
export default function FeedbackNotice({
  type = "general",
  message,
  isVisible = true,
  recommendedActions = [],
  emergencyContacts = null,
  onDismiss
}) {
  // Early return for non-visible notices
  if (!isVisible) return null;

  /**
   * Gets configuration object for notice styling based on type
   * @returns {NoticeConfig} Configuration object with styling and icons
   */
  const getNoticeConfig = () => {
    switch (type) {
      case "emergency":
        return {
          icon: AlertTriangle,
          bgColor: "bg-red-50 dark:bg-red-950",
          borderColor: "border-red-200 dark:border-red-800",
          textColor: "text-red-900 dark:text-red-100",
          iconColor: "text-red-600 dark:text-red-400",
          title: "Medical Emergency Notice"
        };
      case "mental_health":
        return {
          icon: Heart,
          bgColor: "bg-blue-50 dark:bg-blue-950",
          borderColor: "border-blue-200 dark:border-blue-800",
          textColor: "text-blue-900 dark:text-blue-100",
          iconColor: "text-blue-600 dark:text-blue-400",
          title: "Mental Health Support"
        };
      case "medication":
        return {
          icon: Phone,
          bgColor: "bg-amber-50 dark:bg-amber-950",
          borderColor: "border-amber-200 dark:border-amber-800",
          textColor: "text-amber-900 dark:text-amber-100",
          iconColor: "text-amber-600 dark:text-amber-400",
          title: "Medication Safety Notice"
        };
      default:
        return {
          icon: Users,
          bgColor: "bg-gray-50 dark:bg-gray-950",
          borderColor: "border-gray-200 dark:border-gray-800",
          textColor: "text-gray-900 dark:text-gray-100",
          iconColor: "text-gray-600 dark:text-gray-400",
          title: "Medical Information Notice"
        };
    }
  };

  const config = getNoticeConfig();
  const IconComponent = config.icon;

  /**
   * Handle dismiss button click with proper logging
   * @returns {void}
   */
  const handleDismiss = () => {
    console.info('[FeedbackNotice] Notice dismissed', { type, message: message.substring(0, 50) + '...' });
    if (onDismiss && typeof onDismiss === 'function') {
      onDismiss();
    }
  };

  return (
    <div 
      className={`${config.bgColor} ${config.borderColor} mb-4 border-l-4 p-4 rounded-md`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start space-x-3">
        <IconComponent 
          className={`h-5 w-5 mt-0.5 flex-shrink-0 ${config.iconColor}`} 
          aria-hidden="true"
        />
        
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-semibold mb-2 ${config.textColor}`}>
            {config.title}
          </h3>
          
          <div className={`text-sm ${config.textColor} mb-3`}>
            {message}
          </div>

          {/* Recommended Actions */}
          {Array.isArray(recommendedActions) && recommendedActions.length > 0 && 
            renderRecommendedActions(recommendedActions, config)
          }

          {/* Emergency Contacts */}
          {hasEmergencyContacts(emergencyContacts) && type === "emergency" &&
            renderEmergencyContacts(emergencyContacts, config)
          }

          {/* Mental Health Crisis Contacts */}
          {hasEmergencyContacts(emergencyContacts) && type === "mental_health" &&
            renderMentalHealthSupport(emergencyContacts, config)
          }

          {/* Dismiss Button */}
          {typeof onDismiss === 'function' && type === "general" && (
            <button
              onClick={handleDismiss}
              className={`text-xs ${config.textColor} opacity-70 hover:opacity-100 underline mt-2`}
              aria-label="Dismiss this notice"
              type="button"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}