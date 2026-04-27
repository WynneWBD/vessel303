import * as React from 'react'
import { cn } from '@/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'flex h-10 w-full rounded-md border border-[#E5DED4] bg-[#FFFFFF] px-3 py-2 text-sm text-[#2C2A28] placeholder:text-[#6B6560] focus:outline-none focus:ring-2 focus:ring-[#E36F2C]/40 focus:border-[#E36F2C] disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

export { Input }
