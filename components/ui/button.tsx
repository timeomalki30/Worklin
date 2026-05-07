import * as React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'terra' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  loading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const variants = {
      primary: 'bg-navy-800 text-white hover:bg-navy-700 active:bg-navy-900',
      terra: 'bg-terra-500 text-white hover:bg-terra-600 active:bg-terra-700',
      secondary: 'bg-cream-300 text-navy-800 hover:bg-cream-400 border border-cream-400',
      ghost: 'bg-transparent text-navy-700 hover:bg-cream-300 border border-cream-300',
      danger: 'bg-red-600 text-white hover:bg-red-700',
    }
    const sizes = {
      sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
      md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
      lg: 'px-6 py-3.5 text-base rounded-2xl gap-2.5',
      icon: 'p-2.5 aspect-square rounded-xl',
    }
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-semibold transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant], sizes[size], className
        )}
        {...props}
      >
        {loading && <span className="spinner" />}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
