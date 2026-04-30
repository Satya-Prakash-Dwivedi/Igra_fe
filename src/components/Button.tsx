import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'glass';
  fullWidth?: boolean;
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  fullWidth = false,
  isLoading = false,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-bold tracking-tight transition-all duration-300 active:scale-95 disabled:pointer-events-none disabled:opacity-50 overflow-hidden relative group transform-gpu';
  
  const variants = {
    primary: 'bg-primary text-white shadow-xl shadow-primary/20 hover:bg-primary-hover hover:shadow-primary/40 hover:-translate-y-0.5',
    outline: 'border border-white/10 bg-white/5 text-text-muted hover:text-white hover:bg-white/10 hover:border-white/20',
    ghost: 'bg-transparent text-text-dim hover:text-text-main transition-colors duration-200',
    glass: 'bg-white/[0.03] backdrop-blur-md border border-white/10 text-white hover:bg-white/[0.06] shadow-xl',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], fullWidth && 'w-full', className)}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {/* Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-200 ease-in-out pointer-events-none" />
      
      {isLoading ? (
        <div className="flex items-center gap-3 relative z-10">
          <svg className="animate-spin h-3 w-3 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="tracking-[0.4em]">Processing</span>
        </div>
      ) : (
        <div className="relative z-10 flex items-center justify-center gap-2.5">
          {children}
        </div>
      )}
    </button>
  );
};

export default Button;
