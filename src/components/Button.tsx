import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  fullWidth = false,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg-dark disabled:pointer-events-none disabled:opacity-50';
  
  const variants = {
    primary: 'bg-primary text-text-main hover:bg-primary-hover',
    outline: 'border border-border bg-transparent text-text-main hover:bg-bg-card',
    ghost: 'bg-transparent text-text-muted hover:text-text-main hover:bg-bg-card',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], fullWidth && 'w-full', className)}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
