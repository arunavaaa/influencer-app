import { ChevronDown } from 'lucide-react'
import { SelectHTMLAttributes } from 'react'

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  className?: string
}

export function AppSelect({ className = '', children, ...props }: Props) {
  return (
    <div className="relative">
      <select className={`appearance-none pr-10 ${className}`} {...props}>
        {children}
      </select>
      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6A6C6A] pointer-events-none" />
    </div>
  )
}
