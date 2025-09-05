"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "../../lib/utils.js";

/**
 * Avatar root component
 * @param {React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>} props
 * @param {React.Ref<HTMLDivElement>} ref
 * @returns {JSX.Element} The avatar component
 */
const Avatar = React.forwardRef(function Avatar(props, ref) {
  const {
    className = "",
    children = null,
    ...rest
  } = /** @type {any} */ (props ?? {});

  return (
    <AvatarPrimitive.Root
      ref={ref}
      className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
      {...rest}
    >
      {children}
    </AvatarPrimitive.Root>
  );
});
Avatar.displayName = AvatarPrimitive.Root.displayName;

/**
 * Avatar image component
 * @param {React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>} props
 * @param {React.Ref<HTMLImageElement>} ref
 * @returns {JSX.Element} The avatar image component
 */
const AvatarImage = React.forwardRef(function AvatarImage(props, ref) {
  const {
    className = "",
    ...rest
  } = /** @type {any} */ (props ?? {});

  return (
    <AvatarPrimitive.Image
      ref={ref}
      className={cn("aspect-square h-full w-full", className)}
      {...rest}
    />
  );
});
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

/**
 * Avatar fallback component
 * @param {React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>} props
 * @param {React.Ref<HTMLDivElement>} ref
 * @returns {JSX.Element} The avatar fallback component
 */
const AvatarFallback = React.forwardRef(function AvatarFallback(props, ref) {
  const {
    className = "",
    children = null,
    ...rest
  } = /** @type {any} */ (props ?? {});

  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className)}
      {...rest}
    >
      {children}
    </AvatarPrimitive.Fallback>
  );
});
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

/**
 * Export Avatar components
 * @module Avatar
 */
export { Avatar, AvatarImage, AvatarFallback };
