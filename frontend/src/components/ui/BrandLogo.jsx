import React from 'react';

/**
 * BrandLogo Component
 * Renders the GoSmart Supermarket System logo with responsive options and contrast safeguards.
 * 
 * @param {'full' | 'icon'} variant - 'full' shows complete logo with text, 'icon' shows emblem only
 * @param {'sm' | 'md' | 'lg' | 'xl' | 'custom'} size - Size presets
 * @param {string} className - Additional CSS classes
 * @param {boolean} withCard - If true, wraps logo in a sleek white rounded pill/card for optimal contrast
 */
export default function BrandLogo({
  variant = 'full',
  size = 'md',
  className = '',
  withCard = false,
  cardClassName = '',
  alt = 'GoSmart Supermarket System'
}) {
  const sizeClasses = {
    xs: variant === 'icon' ? 'h-6 w-6' : 'h-6',
    sm: variant === 'icon' ? 'h-8 w-8' : 'h-8',
    md: variant === 'icon' ? 'h-10 w-10' : 'h-10',
    lg: variant === 'icon' ? 'h-14 w-14' : 'h-14',
    xl: variant === 'icon' ? 'h-20 w-20' : 'h-20',
    custom: ''
  };

  const imageSrc = variant === 'icon' ? '/gosmart-icon.png' : '/gosmart-logo.png';
  const imgElement = (
    <img
      src={imageSrc}
      alt={alt}
      className={`object-contain transition-transform duration-200 ${sizeClasses[size] || ''} ${className}`}
      loading="eager"
    />
  );

  if (withCard) {
    return (
      <div className={`bg-white dark:bg-white/95 rounded-xl p-1.5 shadow-xs border border-gray-100 dark:border-white/20 inline-flex items-center justify-center ${cardClassName}`}>
        {imgElement}
      </div>
    );
  }

  return imgElement;
}
