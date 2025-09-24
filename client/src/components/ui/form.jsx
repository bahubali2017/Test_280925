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
 * @typedef {object} FormFieldContext
 * @property {string} name - Field name
 */

/**
 * @typedef {object} FormItemContext
 * @property {string} id - Item ID
 */

/**
 * @typedef {object} FormFieldProps
 * @property {string} name - Field name
 * @property {(renderProps: any) => React.ReactNode} [render] - Render function
 * @property {any} [control] - Form control
 * @property {any} [rules] - Validation rules
 */

/**
 * @typedef {object} FormProps
 * @property {(event: React.FormEvent<HTMLFormElement>) => void} [onSubmit] - Submit handler
 * @property {React.ReactNode} [children] - Child elements
 * @property {string} [className] - CSS classes
 */

/**
 * @typedef {object} FormMessageProps
 * @property {string} [message] - Message text
 * @property {'error'|'warning'|'info'} [type] - Message type
 * @property {string} [className] - CSS classes
 * @property {React.ReactNode} [children] - Child elements
 */

/**
 * @typedef {object} FormItemProps
 * @property {string} [className] - CSS classes
 * @property {React.ReactNode} [children] - Child elements
 */

/**
 * @typedef {object} FormLabelProps
 * @property {string} [className] - CSS classes
 * @property {React.ReactNode} [children] - Child elements
 * @property {string} [htmlFor] - Associated input ID
 */

/**
 * @typedef {object} FormControlProps
 * @property {React.ReactNode} [children] - Child elements
 */

/**
 * @typedef {object} FormDescriptionProps
 * @property {string} [className] - CSS classes
 * @property {React.ReactNode} [children] - Child elements
 */

/**
 * @typedef {object} FieldState
 * @property {any} [error] - Field error
 * @property {boolean} [invalid] - Whether field is invalid
 * @property {boolean} [isTouched] - Whether field is touched
 * @property {boolean} [isDirty] - Whether field is dirty
 */

/**
 * @typedef {object} FormFieldState
 * @property {string} id - Field ID
 * @property {string} name - Field name
 * @property {string} formItemId - Form item ID
 * @property {string} formDescriptionId - Description ID
 * @property {string} formMessageId - Message ID
 * @property {any} error - Field error
 * @property {boolean} invalid - Whether invalid
 * @property {boolean} isTouched - Whether touched
 * @property {boolean} isDirty - Whether dirty
 */

/**
 * Structured logging function to replace console.log
 * @param {'info'|'warn'|'error'} level - Log level
 * @param {string} message - Log message
 * @param {any} [data] - Additional data
 */
function log(level, message, data) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  switch (level) {
    case 'error':
      console.error(logMessage, data || '');
      break;
    case 'warn':
      console.warn(logMessage, data || '');
      break;
    case 'info':
    default:
      console.info(logMessage, data || '');
      break;
  }
}

/**
 * Form provider component from react-hook-form
 */
const Form = FormProvider

/**
 * Create form field context with default value
 * @type {React.Context<FormFieldContext>}
 */
const FormFieldContext = React.createContext(/** @type {FormFieldContext} */ ({ name: "" }))

/**
 * Create form item context with default value
 * @type {React.Context<FormItemContext>}
 */
const FormItemContext = React.createContext(/** @type {FormItemContext} */ ({ id: "" }))

/**
 * Checks if a value is a valid FormFieldContext
 * @param {any} context - The context to check
 * @returns {context is FormFieldContext} Whether the context is valid
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
 * @returns {context is FormItemContext} Whether the context is valid
 */
function isFormItemContext(context) {
  return Boolean(context) && 
         typeof context === 'object' && 
         'id' in context && 
         typeof context.id === "string"
}

/**
 * Centralized form classes helper
 * @param {string} [baseClass] - Base CSS class
 * @param {string} [additionalClass] - Additional CSS class
 * @param {boolean} [hasError] - Whether there's an error
 * @returns {string} Combined CSS classes
 */
function getFormClasses(baseClass = '', additionalClass = '', hasError = false) {
  return cn(
    baseClass,
    hasError && "text-destructive",
    additionalClass
  );
}

/**
 * Centralized form message renderer
 * @param {any} error - Error object or string
 * @param {React.ReactNode} children - Fallback children
 * @returns {string|React.ReactNode} Rendered message content
 */
function renderFormMessage(error, children) {
  if (error) {
    if (typeof error === "string") {
      return error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      return typeof error.message === "string" ? error.message : "Error";
    } else {
      return "An error occurred";
    }
  }
  return children;
}

/**
 * Safely extracts specific props and returns them with all other props
 * @param {string[]} propNames - Names of props to extract
 * @param {Record<string, any>} [props] - Component props
 * @param {Record<string, any>} [defaults] - Default values for props
 * @returns {Record<string, any>} Object containing extracted props and rest props
 */
function extractProps(propNames, props, defaults = {}) {
  // Provide default if not passed
  const safeDefaults = defaults || {};
  
  // Initialize result with default values
  const result = { ...safeDefaults };
  
  // Initialize rest object for remaining props
  const rest = /** @type {Record<string, any>} */ ({});
  
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
 * FormField component for form fields
 * @param {FormFieldProps} props - Component props
 * @returns {React.ReactElement} FormField component
 */
function FormField(props) {
  // Safely extract name from props with proper typing
  const name = (props && typeof props === 'object' && 'name' in props && typeof props.name === 'string') 
    ? props.name 
    : "";
  
  /**
   * Renders the field content
   * @param {any} renderProps - Props from Controller
   * @returns {React.ReactElement} Rendered content
   */
  const renderWrapper = (renderProps) => {
    // Ensure we always return a JSX element
    if (props && typeof props === 'object' && 'render' in props && typeof props.render === 'function') {
      try {
        const result = props.render(renderProps);
        // Ensure result is a valid JSX element
        return React.isValidElement(result) ? result : <div>{String(result || "")}</div>;
      } catch (err) {
        log('error', "Error in form field render function:", err);
        return <div>Error rendering field</div>;
      }
    }
    
    // Default rendering with proper fallbacks
    const fieldValue = (renderProps && 
                       typeof renderProps === 'object' && 
                       'field' in renderProps && 
                       renderProps.field &&
                       typeof renderProps.field === 'object' &&
                       'value' in renderProps.field) 
                       ? renderProps.field.value 
                       : "";
    return <div>{fieldValue || ""}</div>;
  };

  // Extract props excluding name to avoid duplication
  // eslint-disable-next-line no-unused-vars
  const { name: _, ...controllerProps } = props || {};

  return (
    <FormFieldContext.Provider value={{ name }}>
      <Controller 
        name={name}
        {...controllerProps} 
        render={renderWrapper} 
      />
    </FormFieldContext.Provider>
  );
}

/**
 * Custom hook for form field context
 * @returns {FormFieldState} Form field properties and state
 */
const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  
  // Get form context with fallback
  let form = null;
  try {
    form = useFormContext();
  } catch (err) {
    log('error', "Error getting form context:", err);
  }

  // Validate contexts
  if (!isFormFieldContext(fieldContext)) {
    throw new Error("useFormField must be used inside <FormField>");
  }
  
  if (!isFormItemContext(itemContext)) {
    throw new Error("useFormField must be used inside <FormItem>");
  }

  // Initialize with safe defaults
  const result = /** @type {FormFieldState} */ ({
    id: itemContext.id || "",
    name: fieldContext.name || "",
    formItemId: `${itemContext.id || "field"}-form-item`,
    formDescriptionId: `${itemContext.id || "field"}-form-item-description`,
    formMessageId: `${itemContext.id || "field"}-form-item-message`,
    error: null,
    invalid: false,
    isTouched: false,
    isDirty: false
  });
  
  // Safely get field state if available
  if (form && typeof form.getFieldState === 'function' && form.formState) {
    try {
      const fieldState = form.getFieldState(fieldContext.name, form.formState);
      if (fieldState && typeof fieldState === 'object') {
        // Update state properties safely
        if ('error' in fieldState) result.error = fieldState.error;
        if ('invalid' in fieldState) result.invalid = !!fieldState.invalid;
        if ('isTouched' in fieldState) result.isTouched = !!fieldState.isTouched;
        if ('isDirty' in fieldState) result.isDirty = !!fieldState.isDirty;
      }
    } catch (err) {
      log('error', "Error getting field state:", err);
    }
  }

  return result;
}

/**
 * FormItem component that provides the container for form field elements
 * @param {FormItemProps} props - Component props 
 * @param {React.Ref<HTMLDivElement>} ref - Ref to the div element
 * @returns {React.ReactElement} FormItem component
 */
const FormItem = React.forwardRef(function FormItem(props, ref) {
  // Generate unique ID for form item
  const id = React.useId();
  
  // Extract props safely using the helper function
  const extracted = extractProps(
    ['className', 'children'],
    props, 
    { className: '', children: null }
  );
  
  const className = typeof extracted.className === 'string' ? extracted.className : '';
  const children = extracted.children;
  const rest = extracted.rest || {};
  
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
 * @param {FormLabelProps} props - Component props
 * @param {React.Ref<HTMLLabelElement>} ref - Ref to the label element
 * @returns {React.ReactElement} FormLabel component
 */
const FormLabel = React.forwardRef(function FormLabel(props, ref) {
  // Extract props safely using the helper function
  const extracted = extractProps(
    ['className', 'children'],
    props, 
    { className: '', children: null }
  );
  
  const className = typeof extracted.className === 'string' ? extracted.className : '';
  const children = extracted.children;
  const rest = extracted.rest || {};
  
  // Get form field context
  const formField = useFormField();
  const error = formField.error;
  const formItemId = formField.formItemId;
  
  return (
    <Label
      ref={ref}
      htmlFor={formItemId}
      className={getFormClasses("", className, !!error)}
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
 * @param {FormControlProps} props - Component props
 * @param {React.Ref<HTMLElement>} ref - Ref to the element
 * @returns {React.ReactElement} FormControl component
 */
const FormControl = React.forwardRef(function FormControl(props, ref) {
  // Extract props safely using the helper function
  const extracted = extractProps(
    ['children'],
    props, 
    { children: null }
  );
  
  const children = extracted.children;
  const rest = extracted.rest || {};
  
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
 * @param {FormDescriptionProps} props - Component props
 * @param {React.Ref<HTMLParagraphElement>} ref - Ref to the paragraph element
 * @returns {React.ReactElement} FormDescription component
 */
const FormDescription = React.forwardRef(function FormDescription(props, ref) {
  // Extract props safely using the helper function
  const extracted = extractProps(
    ['className', 'children'],
    props, 
    { className: '', children: null }
  );
  
  const className = typeof extracted.className === 'string' ? extracted.className : '';
  const children = extracted.children;
  const rest = extracted.rest || {};
  
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
 * @param {FormMessageProps} props - Component props
 * @param {React.Ref<HTMLParagraphElement>} ref - Ref to the paragraph element
 * @returns {React.ReactElement|null} FormMessage component or null if no message
 */
const FormMessage = React.forwardRef(function FormMessage(props, ref) {
  // Extract props safely using the helper function
  const extracted = extractProps(
    ['className', 'children'],
    props, 
    { className: '', children: null }
  );
  
  const className = typeof extracted.className === 'string' ? extracted.className : '';
  const children = extracted.children;
  const rest = extracted.rest || {};
  
  // Get form field context
  const formField = useFormField();
  const error = formField.error;
  const formMessageId = formField.formMessageId;
  
  // Determine what to display using centralized helper
  const body = renderFormMessage(error, children);

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
 * Export all form components and hooks for use in applications
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