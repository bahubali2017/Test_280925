// @ts-nocheck
import React from 'react';
// Use public path for logo to ensure it loads in all environments
const neuralLogo = '/neural-logo.png';

/**
 * Animated Neural Logo component with water ripple effects
 * @param {object} props
 * @param {number} [props.size=80] - Size of the logo in pixels
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {string} [props.alt='Anamnesis Neural Logo with Water Ripples'] - Alt text for accessibility
 * @returns {JSX.Element}
 */
export default function AnimatedNeuralLogo({
  size = 80,
  className = '',
  alt = 'Anamnesis Neural Logo with Water Ripples'
}) {
  const containerStyle = {
    width: `${size}px`,
    height: `${size}px`,
    position: 'relative',
    animation: 'gentleHeartbeat 3s ease-in-out infinite',
    transformOrigin: 'center'
  };

  const rippleBaseStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none'
  };

  const logoStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    filter: 'brightness(1) drop-shadow(0 0 8px rgba(159, 223, 255, 0.6))',
    position: 'relative',
    zIndex: 10
  };

  return (
    <div 
      className={`animated-neural-logo ${className}`} 
      style={containerStyle}
    >
      {/* Primary Ripple Layer */}
      <div 
        style={{
          ...rippleBaseStyle,
          border: '2px solid rgba(159, 223, 255, 0.8)',
          animation: 'continuousRipples 3s ease-out infinite'
        }}
      />
      
      {/* Secondary Ripple Layer */}
      <div 
        style={{
          ...rippleBaseStyle,
          border: '1px solid rgba(159, 223, 255, 0.6)',
          animation: 'continuousRipples 3s ease-out infinite 1s'
        }}
      />
      
      {/* Tertiary Ripple Layer */}
      <div 
        style={{
          ...rippleBaseStyle,
          border: '1px solid rgba(159, 223, 255, 0.4)',
          animation: 'rippleLayer1 3s ease-out infinite 0.5s'
        }}
      />
      
      {/* Additional Subtle Layer */}
      <div 
        style={{
          ...rippleBaseStyle,
          border: '1px solid rgba(159, 223, 255, 0.2)',
          animation: 'rippleLayer2 3s ease-out infinite 2s'
        }}
      />
      
      {/* Original Neural Brain Logo */}
      <img
        src={neuralLogo}
        alt={alt}
        width={size}
        height={size}
        className="neural-brain-logo"
        style={logoStyle}
      />
    </div>
  );
}