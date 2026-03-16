import React from 'react';

type Variant = 'default' | 'success' | 'error' | 'warning' | 'running';

interface BadgeProps {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<Variant, string> = {
  default:  'bg-gray-100 text-gray-700',
  success:  'bg-green-100 text-green-700',
  error:    'bg-red-100 text-red-700',
  warning:  'bg-amber-100 text-amber-700',
  running:  'bg-blue-100 text-blue-700',
};

export default function Badge({
  variant = 'default',
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {variant === 'running' && (
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
      )}
      {children}
    </span>
  );
}
