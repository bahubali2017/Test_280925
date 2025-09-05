"use client"

import * as React from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"

import { cn } from "../../lib/utils"
import { toggleVariants } from "./toggle"

/**
 * Toggle Group context interface
 * @typedef {object} ToggleGroupContextType
 * @property {string} size - Size variant (default, sm, lg)
 * @property {string} variant - Visual variant (default, outline)
 */

/**
 * Default context values
 * @type {ToggleGroupContextType}
 */
const defaultContextValue = {
  size: "default",
  variant: "default"
};

/**
 * Context for sharing toggle variants between components
 * @type {React.Context<ToggleGroupContextType>}
 */
const ToggleGroupContext = React.createContext(defaultContextValue);

/**
 * Toggle group component
 * @typedef {object} ToggleGroupPropsBase
 * @property {string} [className] - Additional class names
 * @property {string} [variant] - Visual variant (default, outline)
 * @property {string} [size] - Size variant (default, sm, lg)
 * @property {React.ReactNode} children - Child elements
 */
 
/**
 * Toggle group multiple mode props
 * @typedef {ToggleGroupPropsBase & {
 *   type: "multiple",
 *   value?: string[],
 *   defaultValue?: string[],
 *   onValueChange?: (value: string[]) => void
 * }} ToggleGroupMultipleProps
 */

/**
 * Toggle group single mode props
 * @typedef {ToggleGroupPropsBase & {
 *   type: "single",
 *   value?: string,
 *   defaultValue?: string,
 *   onValueChange?: (value: string) => void
 * }} ToggleGroupSingleProps
 */

/**
 * Toggle group combined props type
 * @typedef {ToggleGroupMultipleProps | ToggleGroupSingleProps} ToggleGroupProps
 * 
 * @param {ToggleGroupProps} props - The component props
 * @param {React.ForwardedRef<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} The toggle group component
 */
/**
 * The toggle group component with proper typing
 * @type {React.ForwardRefExoticComponent<React.PropsWithoutRef<ToggleGroupProps> & React.RefAttributes<HTMLDivElement>>}
 */
/**
 * Multiple toggle group component that enforces proper typing
 * @type {React.ForwardRefExoticComponent<React.PropsWithoutRef<ToggleGroupMultipleProps> & React.RefAttributes<HTMLDivElement>>}
 */
const MultipleToggleGroup = React.forwardRef(function MultipleToggleGroup(
  /** @type {ToggleGroupMultipleProps} */ props,
  /** @type {React.ForwardedRef<HTMLDivElement>} */ ref
) {
  const { 
    className, 
    variant, 
    size, 
    children, 
    value,
    defaultValue,
    onValueChange,
    // Removing unused 'type' variable - already hardcoded in Root
    ...rest 
  } = props;
  
  // Create a contextValue for all children
  const contextValue = React.useMemo(() => ({
    variant: variant || defaultContextValue.variant, 
    size: size || defaultContextValue.size 
  }), [variant, size]);
  
  // Create a modified rest object without the type property to avoid duplication
  const safeRest = { ...rest };
  if ('type' in safeRest) {
    delete safeRest.type;
  }
  
  return (
    <ToggleGroupPrimitive.Root
      ref={ref}
      type="multiple"
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      className={cn("flex items-center justify-center gap-1", className)}
      {...safeRest}
    >
      <ToggleGroupContext.Provider value={contextValue}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  );
});

MultipleToggleGroup.displayName = "MultipleToggleGroup";

/**
 * Single toggle group component that enforces proper typing
 * @type {React.ForwardRefExoticComponent<React.PropsWithoutRef<ToggleGroupSingleProps> & React.RefAttributes<HTMLDivElement>>}
 */
const SingleToggleGroup = React.forwardRef(function SingleToggleGroup(
  /** @type {ToggleGroupSingleProps} */ props,
  /** @type {React.ForwardedRef<HTMLDivElement>} */ ref
) {
  const { 
    className, 
    variant, 
    size, 
    children, 
    value,
    defaultValue,
    onValueChange,
    // Removing unused 'type' variable - prevents it from being passed to Root
    ...rest 
  } = props;
  
  // Create a contextValue for all children
  const contextValue = React.useMemo(() => ({
    variant: variant || defaultContextValue.variant, 
    size: size || defaultContextValue.size 
  }), [variant, size]);
  
  // Create a modified rest object without the type property to avoid duplication
  const safeRest = { ...rest };
  if ('type' in safeRest) {
    delete safeRest.type;
  }
  
  return (
    <ToggleGroupPrimitive.Root
      ref={ref}
      type="single"
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      className={cn("flex items-center justify-center gap-1", className)}
      {...safeRest}
    >
      <ToggleGroupContext.Provider value={contextValue}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  );
});

SingleToggleGroup.displayName = "SingleToggleGroup";

/**
 * Combined toggle group component that handles both single and multiple modes
 * @type {React.ForwardRefExoticComponent<React.PropsWithoutRef<ToggleGroupProps> & React.RefAttributes<HTMLDivElement>>}
 */
const ToggleGroup = React.forwardRef(function ToggleGroup(
  /** @type {ToggleGroupProps} */ props,
  /** @type {React.ForwardedRef<HTMLDivElement>} */ ref
) {
  // Use type assertion to determine which component to render
  if (props.type === "single") {
    return <SingleToggleGroup {...props} ref={ref} />;
  } else {
    return <MultipleToggleGroup {...props} ref={ref} />;
  }
});

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName;

/**
 * Toggle group item component
 * @typedef {object} ToggleGroupItemProps
 * @property {string} value - The unique value of the item
 * @property {React.ReactNode} children - Child elements
 * @property {string} [className] - Additional class names
 * @property {string} [variant] - Visual variant (default, outline)
 * @property {string} [size] - Size variant (default, sm, lg)
 * @property {boolean} [disabled] - Whether the item is disabled
 * 
 * @param {ToggleGroupItemProps} props - The component props
 * @param {React.ForwardedRef<HTMLButtonElement>} ref - Forwarded ref
 * @returns {JSX.Element} The toggle group item component
 */
/**
 * The toggle group item component with proper typing
 * @type {React.ForwardRefExoticComponent<React.PropsWithoutRef<ToggleGroupItemProps> & React.RefAttributes<HTMLButtonElement>>}
 */
const ToggleGroupItem = React.forwardRef(function ToggleGroupItem(
  /** @type {ToggleGroupItemProps} */ props,
  /** @type {React.ForwardedRef<HTMLButtonElement>} */ ref
) {
  const { 
    className, 
    children, 
    variant, 
    size, 
    value = "", // Provide default value to avoid undefined
    ...otherProps 
  } = props;
  
  const context = React.useContext(ToggleGroupContext);

  if (value === undefined) {
    console.warn("ToggleGroupItem should have a value prop");
  }

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      value={value}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        className
      )}
      {...otherProps}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );
});

ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName;

/**
 * Export the toggle group components
 * @returns {object} ToggleGroup components
 */
export { ToggleGroup, ToggleGroupItem }