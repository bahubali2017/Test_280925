/**
 * @file Medical feedback and disclaimer notice component
 * Phase 9: Medical Safety Guidelines - User feedback and safety notice display
 */

import { AlertTriangle, Heart, Phone, Users } from "lucide-react";

/**
 * Medical feedback notice component with safety disclaimers
 * @param {object} props
 * @param {'general'|'emergency'|'mental_health'|'medication'} props.type - Notice type
 * @param {string} props.message - Main message content
 * @param {boolean} props.isVisible - Whether notice is visible
 * @param {string[]} [props.recommendedActions] - List of recommended actions
 * @param {object} [props.emergencyContacts] - Emergency contact information
 * @param {() => void} [props.onDismiss] - Dismiss callback
 * @returns {JSX.Element} FeedbackNotice component
 */
export default function FeedbackNotice({
  type = "general",
  message,
  isVisible = true,
  recommendedActions = [],
  emergencyContacts = null,
  onDismiss
}) {
  if (!isVisible) return null;

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

  return (
    <div className={`${config.bgColor} ${config.borderColor} mb-4 border-l-4 p-4 rounded-md`}>
      <div className="flex items-start space-x-3">
        <IconComponent className={`h-5 w-5 mt-0.5 flex-shrink-0 ${config.iconColor}`} />
        
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-semibold mb-2 ${config.textColor}`}>
            {config.title}
          </h3>
          
          <div className={`text-sm ${config.textColor} mb-3`}>
            {message}
          </div>

          {/* Recommended Actions */}
          {recommendedActions.length > 0 && (
            <div className="mb-3">
              <h4 className={`text-sm font-medium mb-2 ${config.textColor}`}>
                Recommended Actions:
              </h4>
              <ul className={`text-sm space-y-1 ${config.textColor}`}>
                {recommendedActions.map((action, index) => (
                  <li key={index} className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-current rounded-full mt-2 mr-2 flex-shrink-0 opacity-60" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Emergency Contacts */}
          {emergencyContacts && type === "emergency" && (
            <div className={`p-3 rounded-md bg-red-100 dark:bg-red-900 ${config.borderColor} border`}>
              <h4 className={`text-sm font-medium mb-2 ${config.textColor}`}>
                Emergency Contacts:
              </h4>
              <div className={`text-sm space-y-1 ${config.textColor}`}>
                <div className="flex justify-between">
                  <span>Emergency Services:</span>
                  <span className="font-mono font-bold">{emergencyContacts.emergency}</span>
                </div>
                {emergencyContacts.crisis && (
                  <div className="flex justify-between">
                    <span>Crisis Line:</span>
                    <span className="font-mono font-bold">{emergencyContacts.crisis}</span>
                  </div>
                )}
                {emergencyContacts.poison && (
                  <div className="flex justify-between">
                    <span>Poison Control:</span>
                    <span className="font-mono font-bold">{emergencyContacts.poison}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mental Health Crisis Contacts */}
          {emergencyContacts && type === "mental_health" && (
            <div className={`p-3 rounded-md bg-blue-100 dark:bg-blue-900 ${config.borderColor} border`}>
              <h4 className={`text-sm font-medium mb-2 ${config.textColor}`}>
                Crisis Support:
              </h4>
              <div className={`text-sm space-y-1 ${config.textColor}`}>
                {emergencyContacts.crisis && (
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
          )}

          {/* Dismiss Button */}
          {onDismiss && type === "general" && (
            <button
              onClick={onDismiss}
              className={`text-xs ${config.textColor} opacity-70 hover:opacity-100 underline mt-2`}
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}