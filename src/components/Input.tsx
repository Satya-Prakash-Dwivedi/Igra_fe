import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from './Button';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  showPasswordToggle?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  type,
  className,
  showPasswordToggle = false,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="text-sm font-medium text-text-muted">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={inputType}
          className={cn(
            'flex h-11 w-full rounded-xl border border-border bg-bg-card px-3 py-2 text-sm text-text-main ring-offset-bg-dark file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
            error && 'border-error ring-error',
            className
          )}
          {...props}
        />
        {isPassword && showPasswordToggle && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main transition-colors"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
};

export default Input;
