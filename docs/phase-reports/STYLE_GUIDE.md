# Anamnesis Medical AI Assistant Style Guide

This document outlines the styling guidelines, brand elements, and design principles for the Anamnesis Medical AI Assistant.

## Brand Colors

### Primary Colors
- **Primary Blue**: `#1E3A8A` (Tailwind: `blue-900`) - Main brand color, used for primary buttons, headers, and key UI elements
- **Secondary Blue**: `#2563EB` (Tailwind: `blue-600`) - Used for interactive elements, links, and secondary actions
- **Tertiary Blue**: `#BFDBFE` (Tailwind: `blue-200`) - Used for backgrounds, highlights, and subtle accents

### Neutral Colors
- **Dark Gray**: `#1F2937` (Tailwind: `gray-800`) - Used for text and dark UI elements
- **Medium Gray**: `#6B7280` (Tailwind: `gray-500`) - Used for secondary text and borders
- **Light Gray**: `#F3F4F6` (Tailwind: `gray-100`) - Used for backgrounds and subtle UI elements

### Semantic Colors
- **Success**: `#10B981` (Tailwind: `emerald-500`) - Indicates successful actions or positive status
- **Warning**: `#F59E0B` (Tailwind: `amber-500`) - Indicates warnings or alerts
- **Error**: `#EF4444` (Tailwind: `red-500`) - Indicates errors or critical issues
- **Info**: `#3B82F6` (Tailwind: `blue-500`) - Indicates informational messages

## Typography

### Font Family
- **Primary Font**: Inter (Sans-serif) - Used for all UI text
- **Fallback Fonts**: system-ui, -apple-system, sans-serif

### Font Sizes
- **Heading 1**: 2rem (32px) - `text-4xl`
- **Heading 2**: 1.5rem (24px) - `text-2xl`
- **Heading 3**: 1.25rem (20px) - `text-xl`
- **Body Text**: 1rem (16px) - `text-base`
- **Small Text**: 0.875rem (14px) - `text-sm`
- **Extra Small**: 0.75rem (12px) - `text-xs`

### Font Weights
- **Regular**: 400 - `font-normal`
- **Medium**: 500 - `font-medium`
- **Semibold**: 600 - `font-semibold`
- **Bold**: 700 - `font-bold`

## Spacing

- **Base Unit**: 0.25rem (4px)
- **Standard Spacing**: Multiples of the base unit (0.5rem/8px, 1rem/16px, 1.5rem/24px, etc.)
- **Component Spacing**: 1rem (16px) between related elements
- **Section Spacing**: 2rem (32px) between sections

## Responsive Breakpoints

| Breakpoint | Size (px) | Tailwind Class | Description |
|------------|-----------|----------------|-------------|
| Small      | < 640px   | `sm:`          | Mobile devices |
| Medium     | ≥ 640px   | `md:`          | Tablets and small laptops |
| Large      | ≥ 1024px  | `lg:`          | Desktops and large tablets |
| Extra Large| ≥ 1280px  | `xl:`          | Large desktop displays |

### Responsive Design Principles
1. **Mobile-First Approach**: Design for mobile screens first, then expand for larger screens
2. **Fluid Typography**: Font sizes scale appropriately across breakpoints
3. **Stacking Elements**: UI components stack vertically on smaller screens
4. **Simplified Navigation**: Navigation condenses to a menu on mobile devices
5. **Touch-Friendly Elements**: Interactive elements are sized appropriately for touch on mobile

## Dark Mode

The application supports dark mode using Tailwind's `dark:` variant with class-based implementation.

### Dark Mode Colors
- **Background**: `#111827` (Tailwind: `dark:bg-gray-900`)
- **Surface**: `#1F2937` (Tailwind: `dark:bg-gray-800`)
- **Primary Text**: `#F9FAFB` (Tailwind: `dark:text-gray-50`)
- **Secondary Text**: `#D1D5DB` (Tailwind: `dark:text-gray-300`)
- **Borders**: `#374151` (Tailwind: `dark:border-gray-700`)
- **Primary Blue (Dark)**: `#3B82F6` (Tailwind: `dark:blue-500`) - Adjusted for better visibility in dark mode

### Dark Mode Implementation
- The application uses the `dark` class on the `html` element to trigger dark mode
- A theme toggle in the navigation allows users to switch between light and dark modes
- System preferences are respected by default (using `prefers-color-scheme` media query)

## Component Standards

### Buttons
- **Primary Button**: Blue background, white text, rounded corners
- **Secondary Button**: Outlined style with blue border, transparent background
- **Tertiary Button**: Text only, no background or border
- **Button States**: Include hover, focus, active, and disabled states with appropriate visual feedback

### Inputs
- **Text Inputs**: Consistent height, padding, and border styles
- **Focus States**: Clear visual indication when inputs are focused
- **Error States**: Red border and error message when validation fails
- **Disabled States**: Grayed out appearance when inputs are disabled

### Message Bubbles
- **User Messages**: Right-aligned, primary blue background
- **AI Messages**: Left-aligned, light gray or white background with subtle shadow
- **Loading States**: Animated indicators when messages are being processed
- **Error States**: Clear visual indication when message delivery fails

### Cards
- **Standard Card**: White background, subtle shadow, rounded corners
- **Interactive Cards**: Include hover states for interactive elements
- **Card Layouts**: Consistent padding and spacing within cards

## Accessibility Guidelines

- **Color Contrast**: Maintain WCAG AA standard (minimum 4.5:1 for normal text, 3:1 for large text)
- **Keyboard Navigation**: All interactive elements must be accessible via keyboard
- **Focus Indicators**: Clear visual focus indicators for keyboard navigation
- **Screen Readers**: Appropriate ARIA labels and roles for screen reader compatibility
- **Text Sizing**: Text must be resizable without breaking layout
- **Input Labels**: All form inputs must have visible labels

## Animation & Transitions

- **Duration**: Fast (150ms) for small elements, medium (300ms) for larger components
- **Easing**: Use `ease-in-out` for most transitions
- **Purpose**: Animations should serve a purpose (feedback, guidance, attention)
- **Reduced Motion**: Respect user preferences for reduced motion

## Icons

- **Style**: Consistent icon style throughout the application (using Lucide React icons)
- **Sizing**: Appropriate sizing relative to accompanying text (typically 1.25em for inline icons)
- **Meaning**: Icons should have clear meaning and be accompanied by text where possible
- **Accessibility**: Icons that convey meaning must have appropriate aria-labels