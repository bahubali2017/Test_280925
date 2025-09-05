import * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "../../lib/utils.js";

/**
 * Alert component styling variants
 */
const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

/**
 * @typedef {object} AlertProps
 * @property {'default' | 'destructive'} [variant]
 * @property {string} [className]
 * @property {React.ReactNode} [children]
 */

/**
 * @type {React.ForwardRefExoticComponent<AlertProps & React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>}
 */
const Alert = React.forwardRef(function Alert(
  {
    className = "",
    variant = "default",
    children = null,
    ...props
  },
  ref
) {
  return (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {children}
    </div>
  );
});
Alert.displayName = "Alert";

/**
 * @typedef {object} AlertTitleProps
 * @property {string} [className]
 * @property {React.ReactNode} [children]
 */

/**
 * @type {React.ForwardRefExoticComponent<AlertTitleProps & React.HTMLAttributes<HTMLHeadingElement> & React.RefAttributes<HTMLHeadingElement>>}
 */
const AlertTitle = React.forwardRef(function AlertTitle(
  {
    className = "",
    children = null,
    ...props
  },
  ref
) {
  return (
    <h5
      ref={ref}
      className={cn("mb-1 font-medium leading-none tracking-tight", className)}
      {...props}
    >
      {children}
    </h5>
  );
});
AlertTitle.displayName = "AlertTitle";

/**
 * @typedef {object} AlertDescriptionProps
 * @property {string} [className]
 * @property {React.ReactNode} [children]
 */

/**
 * @type {React.ForwardRefExoticComponent<AlertDescriptionProps & React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>}
 */
const AlertDescription = React.forwardRef(function AlertDescription(
  {
    className = "",
    children = null,
    ...props
  },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn("text-sm [&_p]:leading-relaxed", className)}
      {...props}
    >
      {children}
    </div>
  );
});
AlertDescription.displayName = "AlertDescription";

/**
 *
 */
export { Alert, AlertTitle, AlertDescription };
