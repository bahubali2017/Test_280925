import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { Search } from "lucide-react"

import { cn } from "../../lib/utils"
import { Dialog, DialogContent } from "./dialog"

/**
 * Safely check if a property exists on an object with type guards
 * @param {any} obj - The object to check
 * @param {string} prop - The property name to check for
 * @returns {boolean} Whether the property exists on the object
 */
function hasProp(obj, prop) {
  return obj !== null && 
         typeof obj === 'object' && 
         Object.prototype.hasOwnProperty.call(obj, prop);
}

/**
 * Type guard for string values
 * @param {any} value - The value to check
 * @returns {boolean} Whether the value is a string
 */
function isString(value) {
  return typeof value === 'string';
}

/**
 * Extract and safely provide component props with type checking
 * @param {object | null | undefined} props - Raw component props
 * @param {string[]} excludeList - List of prop names to exclude from otherProps
 * @returns {{className: string, otherProps: object}} An object containing processed props
 */
function extractSafeProps(props, excludeList = []) {
  // Initialize with default empty values
  const result = {
    className: "",
    otherProps: {}
  };
  
  // Early return if props is not a valid object
  if (props === null || typeof props !== 'object') {
    return result;
  }
  
  // Type-safe extraction of className
  if (hasProp(props, 'className') && isString(props.className)) {
    result.className = props.className;
  }
  
  // Add all non-excluded properties to otherProps
  Object.keys(props).forEach(key => {
    if (!excludeList.includes(key) && key !== 'className') {
      result.otherProps[key] = props[key];
    }
  });
  
  return result;
}

/**
 * @typedef {object} CommandProps
 * @property {string} [className] - Additional class names to apply to the component
 * @property {React.ReactNode} [children] - Child elements to render inside the component
 */

/**
 * Command component for command menu
 * @param {CommandProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} Command component
 */
const Command = React.forwardRef((props, ref) => {
  // Use our utility function to safely extract props
  const { className, otherProps } = extractSafeProps(props);
  
  return (
    <CommandPrimitive
      ref={ref}
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
        className
      )}
      {...otherProps}
    />
  );
});

Command.displayName = CommandPrimitive.displayName;

/**
 * @typedef {object} CommandDialogProps
 * @property {React.ReactNode} [children] - Child elements to render inside the component
 */

/**
 * Command dialog component for displaying command menu in a dialog
 * @param {any} props - Component props (using any to prevent type errors)
 * @returns {JSX.Element} Command dialog component
 */
const CommandDialog = (props) => {
  // Initialize with defaults
  let children = null;
  const dialogProps = {};
  
  // Only process props if they exist and are an object
  if (props && typeof props === 'object') {
    // Extract children safely
    if ('children' in props) {
      children = props.children;
    }
    
    // Extract all other props for the Dialog component
    Object.keys(props).forEach(key => {
      if (key !== 'children') {
        dialogProps[key] = props[key];
      }
    });
  }
  
  // Apply styles directly to avoid TypeScript errors
  const commandClass = "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5";
  
  // Command styling applied directly to the component
  // The CommandDialog component is the main entry point that sets up our dialog structure
  // Render the dialog with the extracted props
  return (
    <Dialog {...dialogProps}>
      {/* Manually create the DialogContent structure */}
      <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 overflow-hidden p-0 shadow-lg">
        {/* Apply cmdk-specific styling */}
        <div className={commandClass}>
          <div className="flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground">
            {/* Use the cmdk-root attribute for Command to work */}
            <div data-cmdk-root>
              {children}
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

CommandDialog.displayName = "CommandDialog";

/**
 * @typedef {object} CommandInputProps
 * @property {string} [className] - Additional class names to apply to the component
 */

/**
 * Command input component for searching in command menu
 * @param {CommandInputProps} props - Component props
 * @param {React.Ref<HTMLInputElement>} ref - Forwarded ref
 * @returns {JSX.Element} Command input component
 */
const CommandInput = React.forwardRef((props, ref) => {
  // Use our utility function to safely extract props
  const { className, otherProps } = extractSafeProps(props);
  
  // Create a custom input element to avoid TypeScript errors
  const InputElement = () => {
    return (
      <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <CommandPrimitive.Input
          ref={ref}
          className={cn(
            "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...otherProps}
        />
      </div>
    );
  };
  
  return <InputElement />;
});

CommandInput.displayName = CommandPrimitive.Input.displayName;

/**
 * @typedef {object} CommandListProps
 * @property {string} [className] - Additional class names to apply to the component
 * @property {React.ReactNode} [children] - Child elements to render inside the component
 */

/**
 * Command list component for displaying command items
 * @param {CommandListProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} Command list component
 */
const CommandList = React.forwardRef((props, ref) => {
  // Use our utility function to safely extract props
  const { className, otherProps } = extractSafeProps(props);
  
  return (
    <CommandPrimitive.List
      ref={ref}
      className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
      {...otherProps}
    />
  );
});

CommandList.displayName = CommandPrimitive.List.displayName;

/**
 * @typedef {object} CommandEmptyProps
 * @property {string} [className] - Additional class names to apply to the component
 * @property {React.ReactNode} [children] - Child elements to render inside the component
 */

/**
 * Command empty component for displaying when no results are found
 * @param {CommandEmptyProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} Command empty component
 */
const CommandEmpty = React.forwardRef((props, ref) => {
  // Use our utility function to safely extract props
  const { className, otherProps } = extractSafeProps(props);
  
  return (
    <CommandPrimitive.Empty
      ref={ref}
      className={cn("py-6 text-center text-sm", className)}
      {...otherProps}
    />
  );
});

CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

/**
 * @typedef {object} CommandGroupProps
 * @property {string} [className] - Additional class names to apply to the component
 * @property {React.ReactNode} [children] - Child elements to render inside the component
 */

/**
 * Command group component for grouping command items
 * @param {CommandGroupProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} Command group component
 */
const CommandGroup = React.forwardRef((props, ref) => {
  // Use our utility function to safely extract props
  const { className, otherProps } = extractSafeProps(props);
  
  return (
    <CommandPrimitive.Group
      ref={ref}
      className={cn(
        "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
        className
      )}
      {...otherProps}
    />
  );
});

CommandGroup.displayName = CommandPrimitive.Group.displayName;

/**
 * @typedef {object} CommandSeparatorProps
 * @property {string} [className] - Additional class names to apply to the component
 */

/**
 * Command separator component for visual separation between command items
 * @param {CommandSeparatorProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} Command separator component
 */
const CommandSeparator = React.forwardRef((props, ref) => {
  // Use our utility function to safely extract props
  const { className, otherProps } = extractSafeProps(props);
  
  return (
    <CommandPrimitive.Separator
      ref={ref}
      className={cn("-mx-1 h-px bg-border", className)}
      {...otherProps}
    />
  );
});

CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

/**
 * @typedef {object} CommandItemProps
 * @property {string} [className] - Additional class names to apply to the component
 * @property {React.ReactNode} [children] - Child elements to render inside the component
 */

/**
 * Command item component for individual command options
 * @param {CommandItemProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} Command item component
 */
const CommandItem = React.forwardRef((props, ref) => {
  // Use our utility function to safely extract props
  const { className, otherProps } = extractSafeProps(props);
  
  return (
    <CommandPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected='true']:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        className
      )}
      {...otherProps}
    />
  );
});

CommandItem.displayName = CommandPrimitive.Item.displayName;

/**
 * @typedef {object} CommandShortcutProps
 * @property {string} [className] - Additional class names to apply to the component
 * @property {React.ReactNode} [children] - Child elements to render inside the component
 */

/**
 * Command shortcut component for displaying keyboard shortcuts
 * @param {CommandShortcutProps} props - Component props
 * @returns {JSX.Element} Command shortcut component
 */
const CommandShortcut = (props) => {
  // Use our utility function to safely extract props
  const { className, otherProps } = extractSafeProps(props);
  
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )}
      {...otherProps}
    />
  );
};

CommandShortcut.displayName = "CommandShortcut";

/**
 * Export Command components
 * @module Command
 */
export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}