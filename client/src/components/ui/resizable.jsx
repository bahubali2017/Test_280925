"use client"

import { GripVertical } from "lucide-react"
import * as ResizablePrimitive from "react-resizable-panels"

import { cn } from "../../lib/utils"

// Use a simpler approach that doesn't try to be too clever with TypeScript
/**
 * Resizable panel group component
 * @param {object} props - Component props
 * @returns {JSX.Element} Panel group component
 */
const ResizablePanelGroup = function ResizablePanelGroup(props) {
  return (
    <ResizablePrimitive.PanelGroup
      direction="horizontal" // Default required value
      className={cn(
        "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
        props?.className
      )}
      {...props}
    />
  );
}

/**
 * Resizable panel component
 * @type {typeof ResizablePrimitive.Panel}
 */
const ResizablePanel = ResizablePrimitive.Panel

/**
 * Resizable handle component
 * @param {object} props - Component props
 * @param {boolean} [props.withHandle] - Whether to show a handle
 * @param {string} [props.className] - Additional class names
 * @returns {JSX.Element} Resize handle component
 */
const ResizableHandle = function ResizableHandle(props) {
  // Safe extraction with defaults
  const { 
    withHandle = false, 
    className,
    ...otherProps 
  } = props || {};
  
  return (
    <ResizablePrimitive.PanelResizeHandle
      className={cn(
        "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90",
        className
      )}
      {...otherProps}
    >
      {withHandle && (
        <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
          <GripVertical className="h-2.5 w-2.5" />
        </div>
      )}
    </ResizablePrimitive.PanelResizeHandle>
  );
}

/**
 *
 */
export { ResizablePanelGroup, ResizablePanel, ResizableHandle }