'use client'

import { forwardRef } from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', className = '', children, disabled, ...props }, ref) => {
    const baseStyles = 'font-medium rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-accent/30'

    const variants = {
      primary: 'bg-accent hover:bg-accent-light active:bg-accent-dark text-white',
      secondary: 'bg-stone-800 hover:bg-stone-700 active:bg-stone-900 text-stone-300 border border-stone-700 hover:border-stone-600',
      ghost: 'bg-transparent hover:bg-stone-800 active:bg-stone-900 text-stone-400 hover:text-stone-200',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-2.5 text-base',
    }

    const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabledStyles} ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
