import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive' | 'ai' | 'info';
  size?: 'sm' | 'md';
}

export function Badge({ className, variant = 'default', size = 'md', children, ...props }: BadgeProps) {
  const baseStyles = 'inline-flex items-center font-medium rounded-full shrink-0 select-none';

  const variants = {
    default: 'bg-slate-100 text-slate-700 border border-slate-200',
    secondary: 'bg-slate-100 text-slate-800',
    outline: 'border border-slate-300 text-slate-600 bg-transparent',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200/80',
    destructive: 'bg-rose-50 text-rose-700 border border-rose-200/80',
    ai: 'bg-violet-50 text-violet-700 border border-violet-200/80',
    info: 'bg-blue-50 text-blue-700 border border-blue-200/80',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  return (
    <span className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))} {...props}>
      {children}
    </span>
  );
}
