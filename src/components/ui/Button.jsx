import React from 'react';
import { cn } from '../../lib/utils';

export const Button = React.forwardRef(({ className, variant = "default", size = "default", ...props }, ref) => {
  const variants = {
    default: "bg-primary-600 text-white hover:bg-primary-700 shadow-sm",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
    ghost: "hover:bg-gray-100 text-gray-700",
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
  };
  
  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-8 px-3 text-xs",
    lg: "h-12 px-8 text-lg",
    icon: "h-10 w-10 flex items-center justify-center",
  };

  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
});

Button.displayName = "Button";
