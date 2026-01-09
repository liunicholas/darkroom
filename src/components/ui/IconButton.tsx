'use client'

import { forwardRef } from 'react'

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode
  tooltip?: string
  active?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, tooltip, active = false, size = 'md', className = '', disabled, ...props }, ref) => {
    const sizes = {
      sm: 'p-1.5',
      md: 'p-2',
      lg: 'p-2.5',
    }

    const baseStyles = `
      rounded-md transition-all duration-150
      focus:outline-none focus:ring-2 focus:ring-maroon/50
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    `

    const activeStyles = active
      ? 'bg-maroon/20 text-maroon hover:bg-maroon/30'
      : 'text-gray-400 hover:text-white hover:bg-dark-600 active:bg-dark-700'

    return (
      <button
        ref={ref}
        disabled={disabled}
        title={tooltip}
        className={`${baseStyles} ${activeStyles} ${sizes[size]} ${className}`}
        {...props}
      >
        {icon}
      </button>
    )
  }
)

IconButton.displayName = 'IconButton'
