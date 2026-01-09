'use client'

import { forwardRef } from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', className = '', children, disabled, ...props }, ref) => {
    const baseStyles = 'font-medium rounded-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-maroon/50'

    const variants = {
      primary: 'bg-maroon hover:bg-maroon-light active:bg-maroon-dark text-white shadow-sm hover:shadow-accent-glow',
      secondary: 'bg-dark-600 hover:bg-dark-500 active:bg-dark-700 text-white border border-dark-400',
      ghost: 'bg-transparent hover:bg-dark-600 active:bg-dark-700 text-gray-300 hover:text-white',
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
