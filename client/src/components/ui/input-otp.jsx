"use client"

import * as React from "react"
import { OTPInput, OTPInputContext } from "input-otp"
import { Dot } from "lucide-react"
import { cn } from "../../lib/utils"

// Using direct property access with nullish coalescing for safety
// instead of a separate utility object

/**
 * Input OTP component for OTP input fields
 */
const InputOTP = React.forwardRef((props, ref) => {
  // Use functional component to avoid TypeScript issues
  function SafeInputOTP() {
    // The component's children with proper ReactNode typing
    const children = props && 
      typeof props === "object" && 
      "children" in props 
        ? /** @type {React.ReactNode} */ (props.children) 
        : null;
    
    // Container className with safe access
    const containerClassName = props && 
      typeof props === "object" && 
      "containerClassName" in props && 
      typeof props.containerClassName === "string" 
        ? props.containerClassName 
        : "";
    
    // Input className with safe access
    const className = props && 
      typeof props === "object" && 
      "className" in props && 
      typeof props.className === "string" 
        ? props.className 
        : "";
        
    // Get maxLength with safe access
    const maxLength = props && 
      typeof props === "object" && 
      "maxLength" in props 
        ? props.maxLength 
        : undefined;
    
    // Get remaining props safely
    const otherProps = {};
    if (props && typeof props === "object") {
      Object.keys(props).forEach(key => {
        if (!["className", "containerClassName", "maxLength", "children"].includes(key)) {
          otherProps[key] = props[key];
        }
      });
    }
    
    // Create a standard div structure that mimics OTP input behavior
    return (
      <div 
        className={cn(
          "flex items-center gap-2 has-[:disabled]:opacity-50",
          containerClassName
        )}
      >
        <div
          className={cn("disabled:cursor-not-allowed", className)}
          ref={ref}
          data-otp-input="true"
          data-max-length={maxLength}
          {...otherProps}
        >
          {React.isValidElement(children) ? children : null}
        </div>
      </div>
    );
  }
  
  return <SafeInputOTP />;
});
InputOTP.displayName = "InputOTP"

/**
 * Input OTP group component
 */
const InputOTPGroup = React.forwardRef(function InputOTPGroup(props, ref) {
  // Use safe property access
  const className = props && 
    typeof props === "object" && 
    "className" in props && 
    typeof props.className === "string" 
      ? props.className 
      : "";
  
  // Extract remaining props safely
  const otherProps = {};
  if (props && typeof props === "object") {
    Object.keys(props).forEach(key => {
      if (key !== "className") {
        otherProps[key] = props[key];
      }
    });
  }
  
  return (
    <div ref={ref} className={cn("flex items-center", className)} {...otherProps} />
  )
})
InputOTPGroup.displayName = "InputOTPGroup"

/**
 * Input OTP slot component
 */
const InputOTPSlot = React.forwardRef(function InputOTPSlot(props, ref) {
  // Safe property access
  const className = props && 
    typeof props === "object" && 
    "className" in props && 
    typeof props.className === "string" 
      ? props.className 
      : "";
      
  // Safe index access
  const index = props && 
    typeof props === "object" && 
    "index" in props && 
    typeof props.index === "number" 
      ? props.index 
      : 0;
  
  // Extract remaining props safely
  const otherProps = {};
  if (props && typeof props === "object") {
    Object.keys(props).forEach(key => {
      if (!["className", "index"].includes(key)) {
        otherProps[key] = props[key];
      }
    });
  }
  
  // Safe context access
  const inputOTPContext = React.useContext(OTPInputContext);
  
  // Get slot data safely
  let char = "";
  let hasFakeCaret = false;
  let isActive = false;
  
  if (inputOTPContext && 
      typeof inputOTPContext === "object" && 
      "slots" in inputOTPContext && 
      Array.isArray(inputOTPContext.slots) && 
      inputOTPContext.slots[index]) {
    
    const slot = inputOTPContext.slots[index];
    
    if (slot && typeof slot === "object") {
      if ("char" in slot && typeof slot.char === "string") {
        char = slot.char;
      }
      
      if ("hasFakeCaret" in slot && typeof slot.hasFakeCaret === "boolean") {
        hasFakeCaret = slot.hasFakeCaret;
      }
      
      if ("isActive" in slot && typeof slot.isActive === "boolean") {
        isActive = slot.isActive;
      }
    }
  }

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center border-y border-r border-input text-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
        isActive && "z-10 ring-2 ring-ring ring-offset-background",
        className
      )}
      {...otherProps}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
        </div>
      )}
    </div>
  )
})
InputOTPSlot.displayName = "InputOTPSlot"

/**
 * Input OTP separator component
 */
const InputOTPSeparator = React.forwardRef(function InputOTPSeparator(props, ref) {
  // Extract props safely
  const safeProps = {};
  if (props && typeof props === "object") {
    Object.keys(props).forEach(key => {
      safeProps[key] = props[key];
    });
  }
  
  return (
    <div ref={ref} role="separator" {...safeProps}>
      <Dot />
    </div>
  )
})
InputOTPSeparator.displayName = "InputOTPSeparator"

/**
 *
 */
export {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator
}
