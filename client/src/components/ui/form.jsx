"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  FormProvider,
  useFormContext
} from "react-hook-form"

import { cn } from "../../lib/utils"
import { Label } from "./label"

/**
 * Form provider component from react-hook-form
 */
const Form = FormProvider

/**
 * Create form field context with default value
 */
const FormFieldContext = React.createContext({ name: "" })

/**
 * Create form item context with default value
 */
const FormItemContext = React.createContext({ id: "" })

/**
 * Checks if a value is a valid FormFieldContext
 * @param {any} context - The context to check
 * @returns {boolean} Whether the context is valid
 */
function isFormFieldContext(context) {
  return Boolean(context) && 
         typeof context === 'object' && 
         'name' in context && 
         typeof context.name === "string"
}

/**
 * Checks if a value is a valid FormItemContext
 * @param {any} context - The context to check
 * @returns {boolean} Whether the context is valid
 */
function isFormItemContext(context) {
  return Boolean(context) && 
         typeof context === 'object' && 
         'id' in context && 
         typeof context.id === "string"
}

/**
 * FormField component for form fields
 * @param {object} props - Component props
 * @returns {JSX.Element} FormField component
 */
function FormField(props) {
  // Safely extract name from props
  const name = props?.name || "";
  
  /**
   * Renders the field content
   * @param {object} renderProps - Props from Controller
   * @returns {JSX.Element} Rendered content
   */
  const renderWrapper = (renderProps) => {
    // Ensure we always return a JSX element
    if (typeof props?.render === 'function') {
      try {
        const result = props.render(renderProps);
        // Ensure result is a valid JSX element
        return React.isValidElement(result) ? result : <div>{String(result || "")}</div>;
      } catch (err) {
        console.error("Error in form field render function:", err);
        return <div>Error rendering field</div>;
      }
    }
    
    // Default rendering with proper fallbacks
    return <div>{renderProps?.field?.value || ""}</div>;
  };

  return (
    <FormFieldContext.Provider value={{ name }}>
      <Controller {...props} render={renderWrapper} />
    </FormFieldContext.Provider>
  );
}

/**
 * Custom hook for form field context
 * @returns {object} Form field properties and state
 */
const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  
  // Get form context with fallback
  let form = null;
  try {
    form = useFormContext();
  } catch (err) {
    console.error("Error getting form context:", err);
  }

  // Validate contexts
  if (!isFormFieldContext(fieldContext)) {
    throw new Error("useFormField must be used inside <FormField>");
  }
  
  if (!isFormItemContext(itemContext)) {
    throw new Error("useFormField must be used inside <FormItem>");
  }

  // Initialize with safe defaults
  const result = {
    id: itemContext.id || "",
    name: fieldContext.name || "",
    formItemId: `${itemContext.id || "field"}-form-item`,
    formDescriptionId: `${itemContext.id || "field"}-form-item-description`,
    formMessageId: `${itemContext.id || "field"}-form-item-message`,
    error: null,
    invalid: false,
    isTouched: false,
    isDirty: false
  };
  
  // Safely get field state if available
  if (form && typeof form.getFieldState === 'function' && form.formState) {
    try {
      const fieldState = form.getFieldState(fieldContext.name, form.formState);
      if (fieldState) {
        // Update state properties safely
        if (fieldState.error !== undefined) result.error = fieldState.error;
        if (fieldState.invalid !== undefined) result.invalid = !!fieldState.invalid;
        if (fieldState.isTouched !== undefined) result.isTouched = !!fieldState.isTouched;
        if (fieldState.isDirty !== undefined) result.isDirty = !!fieldState.isDirty;
      }
    } catch (err) {
      console.error("Error getting field state:", err);
    }
  }

  return result;
}

// Removed unused utility function that was originally intended for property access
// Now using direct object access with nullish coalescing instead

/**
 * Safely extracts specific props and returns them with all other props
 * @param {object | null | undefined} props - Component props
 * @param {string[]} propNames - Names of props to extract
 * @param {object} defaults - Default values for props
 * @returns {object} - Object containing extracted props and rest props
 */
function extractProps(props, propNames, defaults = {}) {
  // Initialize result with default values
  const result = { ...defaults };
  
  // Initialize rest object for remaining props
  const rest = {};
  
  // Return early if props is not an object
  if (!props || typeof props !== 'object') {
    return { ...result, rest };
  }
  
  // Extract specified props
  propNames.forEach(name => {
    if (Object.prototype.hasOwnProperty.call(props, name)) {
      result[name] = props[name];
    }
  });
  
  // Extract remaining props
  Object.keys(props).forEach(key => {
    if (!propNames.includes(key)) {
      rest[key] = props[key];
    }
  });
  
  // Add rest to result
  result.rest = rest;
  
  return result;
}

/**
 * FormItem component that provides the container for form field elements
 * @param {object} props - Component props 
 * @param {React.Ref<HTMLDivElement>} ref - Ref to the div element
 * @returns {JSX.Element} FormItem component
 */
const FormItem = React.forwardRef(function FormItem(props, ref) {
  // Generate unique ID for form item
  const id = React.useId();
  
  // Extract props safely using the helper function
  const { className = '', children = null, rest } = extractProps(
    props, 
    ['className', 'children'], 
    { className: '', children: null }
  );
  
  return (
    <FormItemContext.Provider value={{ id }}>
      <div 
        ref={ref} 
        className={cn("space-y-2", className)} 
        {...rest}
      >
        {children}
      </div>
    </FormItemContext.Provider>
  );
});

// Set display name for debugging
FormItem.displayName = "FormItem";

/**
 * FormLabel component that renders a label for form fields
 * @param {object} props - Component props
 * @param {React.Ref<HTMLLabelElement>} ref - Ref to the label element
 * @returns {JSX.Element} FormLabel component
 */
const FormLabel = React.forwardRef(function FormLabel(props, ref) {
  // Extract props safely using the helper function
  const { className = '', children = null, rest } = extractProps(
    props, 
    ['className', 'children'], 
    { className: '', children: null }
  );
  
  // Get form field context
  const formField = useFormField();
  const error = formField.error;
  const formItemId = formField.formItemId;
  
  return (
    <Label
      ref={ref}
      htmlFor={formItemId}
      className={cn(error && "text-destructive", className)}
      {...rest}
    >
      {children}
    </Label>
  );
});

// Set display name for debugging
FormLabel.displayName = "FormLabel";

/**
 * FormControl component that wraps form input elements
 * @param {object} props - Component props
 * @param {React.Ref<HTMLElement>} ref - Ref to the element
 * @returns {JSX.Element} FormControl component
 */
const FormControl = React.forwardRef(function FormControl(props, ref) {
  // Extract props safely using the helper function
  const { children = null, rest } = extractProps(
    props, 
    ['children'], 
    { children: null }
  );
  
  // Get form field context with all needed properties
  const formField = useFormField();
  const error = formField.error;
  const formItemId = formField.formItemId;
  const formDescriptionId = formField.formDescriptionId;
  const formMessageId = formField.formMessageId;
  
  // Create aria-describedby with proper checks
  const describedBy = error 
    ? `${formDescriptionId} ${formMessageId}` 
    : formDescriptionId;
  
  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={describedBy}
      aria-invalid={!!error}
      {...rest}
    >
      {children}
    </Slot>
  );
});

// Set display name for debugging
FormControl.displayName = "FormControl";

/**
 * FormDescription component that displays help text for form fields
 * @param {object} props - Component props
 * @param {React.Ref<HTMLParagraphElement>} ref - Ref to the paragraph element
 * @returns {JSX.Element} FormDescription component
 */
const FormDescription = React.forwardRef(function FormDescription(props, ref) {
  // Extract props safely using the helper function
  const { className = '', children = null, rest } = extractProps(
    props, 
    ['className', 'children'], 
    { className: '', children: null }
  );
  
  // Get form field context
  const formField = useFormField();
  const formDescriptionId = formField.formDescriptionId;
  
  return (
    <p 
      ref={ref} 
      id={formDescriptionId} 
      className={cn("text-sm text-muted-foreground", className)} 
      {...rest}
    >
      {children}
    </p>
  );
});

// Set display name for debugging
FormDescription.displayName = "FormDescription";

/**
 * FormMessage component that displays validation errors for form fields
 * @param {object} props - Component props
 * @param {React.Ref<HTMLParagraphElement>} ref - Ref to the paragraph element
 * @returns {JSX.Element|null} FormMessage component or null if no message
 */
const FormMessage = React.forwardRef(function FormMessage(props, ref) {
  // Extract props safely using the helper function
  const { className = '', children = null, rest } = extractProps(
    props, 
    ['className', 'children'], 
    { className: '', children: null }
  );
  
  // Get form field context
  const formField = useFormField();
  const error = formField.error;
  const formMessageId = formField.formMessageId;
  
  // Determine what to display based on error or children
  let body = null;
  
  // Process errors safely
  if (error) {
    if (typeof error === "string") {
      body = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      body = typeof error.message === "string" ? error.message : "Error";
    } else {
      body = "An error occurred";
    }
  } else {
    body = children;
  }

  // Don't render if no content
  if (!body) {
    return null;
  }

  return (
    <p 
      ref={ref} 
      id={formMessageId} 
      className={cn("text-sm font-medium text-destructive", className)} 
      {...rest}
    >
      {body}
    </p>
  );
});

// Set display name for debugging
FormMessage.displayName = "FormMessage";

/**
 *
 */
export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField
}
