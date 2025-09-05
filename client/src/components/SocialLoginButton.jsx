import React from 'react';
import { cn } from '../lib/utils';

/**
 * Props for the SocialLoginButton component
 * @typedef {object} SocialLoginButtonProps
 * @property {React.ReactNode} icon - The icon to display on the button
 * @property {string} provider - The provider name (Google, Microsoft, Apple)
 * @property {React.MouseEventHandler<HTMLButtonElement>} [onClick] - Optional click handler
 * @property {string} [className] - Optional additional classes
 * @property {boolean} [disabled] - Whether the button is disabled
 */

/**
 * Button component for social login options
 * @param {object} props - The social login button props
 * @param {React.ReactNode} props.icon - The icon to display on the button
 * @param {string} props.provider - The provider name (Google, Microsoft, Apple)
 * @param {React.MouseEventHandler<HTMLButtonElement>} [props.onClick] - Optional click handler
 * @param {string} [props.className] - Optional additional classes
 * @param {boolean} [props.disabled] - Whether the button is disabled
 * @returns {JSX.Element} The SocialLoginButton component
 */
export function SocialLoginButton({ icon, provider, onClick, className, disabled }) {
  return (
    <button
      type="button"
      className={cn(
        "flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-md",
        "shadow-sm text-sm font-medium text-gray-700",
        "bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
        disabled && "opacity-50 cursor-not-allowed hover:bg-white",
        className
      )}
      onClick={onClick}
      disabled={disabled}
      aria-label={`Sign in with ${provider}`}
    >
      <span className="mr-2">{icon}</span>
      <span>Sign in with {provider}</span>
    </button>
  );
}