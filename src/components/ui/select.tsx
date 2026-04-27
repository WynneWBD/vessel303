import * as React from 'react'
import { cn } from '@/lib/utils'

// Minimal native-select wrapper styled to match the admin dark theme.
// Not the full Radix Select — we intentionally keep this simple for V8.0 step 3.
const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          'appearance-none flex h-10 w-full rounded-md border border-[#E5DED4] bg-[#FFFFFF] px-3 pr-9 py-2 text-sm text-[#2C2A28] focus:outline-none focus:ring-2 focus:ring-[#E36F2C]/40 focus:border-[#E36F2C] disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <svg
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#8A8580"
        strokeWidth="2"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  )
})
Select.displayName = 'Select'

export { Select }
