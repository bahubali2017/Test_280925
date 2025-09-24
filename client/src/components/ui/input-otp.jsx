"use client"

import * as React from "react"
import { OTPInputContext } from "input-otp"
import { Dot } from "lucide-react"
import { cn } from "../../lib/utils"

/**
 * Props for InputOTP component
 * @typedef {{
 *   children?: React.ReactNode;
 *   className?: string;
 *   containerClassName?: string;
 *   maxLength?: number;
 *   [key: string]: unknown;
 * }} InputOTPProps
 */

/**
 * Props for InputOTPGroup component
 * @typedef {{
 *   className?: string;
 *   children?: React.ReactNode;
 *   [key: string]: unknown;
 * }} InputOTPGroupProps
 */

/**
 * Props for InputOTPSlot component
 * @typedef {{
 *   className?: string;
 *   index: number;
 *   [key: string]: unknown;
 * }} InputOTPSlotProps
 */

/**
 * Props for InputOTPSeparator component
 * @typedef {{
 *   className?: string;
 *   [key: string]: unknown;
 * }} InputOTPSeparatorProps
 */

/**
 * OTP slot data structure from input-otp context
 * @typedef {{
 *   char?: string;
 *   hasFakeCaret?: boolean;
 *   isActive?: boolean;
 * }} OTPSlotData
 */

/**
 * OTP input context structure
 * @typedef {{
 *   slots?: OTPSlotData[];
 *   [key: string]: unknown;
 * }} OTPInputContextData
 */

/**
 * Safely extract props from an object, excluding specified keys
 * @param {unknown} props - The props object
 * @param {string[]} excludeKeys - Keys to exclude from extraction
 * @returns {Record<string, unknown>} Filtered props object
 */
function extractSafeProps(props, excludeKeys = []) {
  /** @type {Record<string, unknown>} */
  const safeProps = {};
  
  if (props && typeof props === 'object' && props !== null) {
    Object.keys(props).forEach(key => {
      if (!excludeKeys.includes(key)) {
        safeProps[key] = /** @type {Record<string, unknown>} */ (props)[key];
      }
    });
  }
  
  return safeProps;
}

/**
 * Type guard to check if a value is a valid React ref
 * @param {unknown} ref - The ref to validate
 * @returns {boolean} True if ref is valid
 */
function isValidRef(ref) {
  return ref !== null && ref !== undefined;
}

/**
 * Input OTP component for OTP input fields
 * @param {InputOTPProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forward ref
 * @returns {React.ReactElement} Rendered InputOTP component
 */
const InputOTP = React.forwardRef(function InputOTP(props, ref) {
  if (!props || typeof props !== 'object') {
    console.warn('[InputOTP] Invalid props provided');
    return <div data-testid="input-otp-fallback" />;
  }

  // Extract props with safe access
  const children = 'children' in props ? props.children : null;
  const containerClassName = 'containerClassName' in props && typeof props.containerClassName === 'string' 
    ? props.containerClassName 
    : '';
  const className = 'className' in props && typeof props.className === 'string' 
    ? props.className 
    : '';
  const maxLength = 'maxLength' in props ? props.maxLength : undefined;
  
  // Get remaining props safely
  const otherProps = extractSafeProps(props, ['className', 'containerClassName', 'maxLength', 'children']);
  
  return (
    <div 
      className={cn(
        "flex items-center gap-2 has-[:disabled]:opacity-50",
        containerClassName
      )}
      data-testid="input-otp-container"
    >
      <div
        className={cn("disabled:cursor-not-allowed", className)}
        ref={isValidRef(ref) ? ref : null}
        data-otp-input="true"
        data-max-length={maxLength}
        {...otherProps}
      >
        {React.isValidElement(children) ? children : null}
      </div>
    </div>
  );
});
InputOTP.displayName = "InputOTP";

/**
 * Input OTP group component for grouping OTP slots
 * @param {InputOTPGroupProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forward ref
 * @returns {React.ReactElement} Rendered InputOTPGroup component
 */
const InputOTPGroup = React.forwardRef(function InputOTPGroup(props, ref) {
  if (!props || typeof props !== 'object') {
    console.warn('[InputOTPGroup] Invalid props provided');
    return <div data-testid="input-otp-group-fallback" />;
  }

  // Safe property access
  const className = 'className' in props && typeof props.className === 'string' 
    ? props.className 
    : '';
  
  // Extract remaining props safely
  const otherProps = extractSafeProps(props, ['className']);
  
  return (
    <div 
      ref={isValidRef(ref) ? ref : null} 
      className={cn("flex items-center", className)} 
      data-testid="input-otp-group"
      {...otherProps} 
    />
  );
});
InputOTPGroup.displayName = "InputOTPGroup";

/**
 * Input OTP slot component for individual OTP digit inputs
 * @param {InputOTPSlotProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forward ref
 * @returns {React.ReactElement} Rendered InputOTPSlot component
 */
const InputOTPSlot = React.forwardRef(function InputOTPSlot(props, ref) {
  if (!props || typeof props !== 'object') {
    console.warn('[InputOTPSlot] Invalid props provided');
    return <div data-testid="input-otp-slot-fallback" />;
  }

  // Safe property access
  const className = 'className' in props && typeof props.className === 'string' 
    ? props.className 
    : '';
  const index = 'index' in props && typeof props.index === 'number' 
    ? props.index 
    : 0;
  
  // Extract remaining props safely
  const otherProps = extractSafeProps(props, ['className', 'index']);
  
  // Safe context access
  const inputOTPContext = /** @type {OTPInputContextData | null} */ (/** @type {unknown} */ (React.useContext(OTPInputContext)));
  
  // Get slot data safely with defaults
  let char = '';
  let hasFakeCaret = false;
  let isActive = false;
  
  if (inputOTPContext && 
      typeof inputOTPContext === 'object' && 
      'slots' in inputOTPContext && 
      Array.isArray(inputOTPContext.slots) && 
      index >= 0 &&
      index < inputOTPContext.slots.length) {
    
    const slot = inputOTPContext.slots[index];
    
    if (slot && typeof slot === 'object') {
      if ('char' in slot && typeof slot.char === 'string') {
        char = slot.char;
      }
      
      if ('hasFakeCaret' in slot && typeof slot.hasFakeCaret === 'boolean') {
        hasFakeCaret = slot.hasFakeCaret;
      }
      
      if ('isActive' in slot && typeof slot.isActive === 'boolean') {
        isActive = slot.isActive;
      }
    }
  }

  return (
    <div
      ref={isValidRef(ref) ? ref : null}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center border-y border-r border-input text-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
        isActive && "z-10 ring-2 ring-ring ring-offset-background",
        className
      )}
      data-testid={`input-otp-slot-${index}`}
      aria-label={`OTP digit ${index + 1}`}
      role="textbox"
      aria-readonly="true"
      aria-invalid={char === '' ? 'false' : 'true'}
      {...otherProps}
    >
      {char}
      {hasFakeCaret && (
        <div 
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          data-testid={`input-otp-caret-${index}`}
          aria-hidden="true"
        >
          <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
        </div>
      )}
    </div>
  );
});
InputOTPSlot.displayName = "InputOTPSlot";

/**
 * Input OTP separator component for visual separation between OTP groups
 * @param {InputOTPSeparatorProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forward ref
 * @returns {React.ReactElement} Rendered InputOTPSeparator component
 */
const InputOTPSeparator = React.forwardRef(function InputOTPSeparator(props, ref) {
  // Extract props safely - allow empty props for this simple component
  const safeProps = props ? extractSafeProps(props, []) : {};
  
  return (
    <div 
      ref={isValidRef(ref) ? ref : null} 
      role="separator" 
      aria-hidden="true"
      data-testid="input-otp-separator"
      {...safeProps}
    >
      <Dot />
    </div>
  );
});
InputOTPSeparator.displayName = "InputOTPSeparator";

console.info('[InputOTP] OTP input components initialized with accessibility support');

/**
 * Export OTP input components for use in forms and authentication flows
 */
export {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator
};