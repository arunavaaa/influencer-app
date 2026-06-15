export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-[#E2E4E0] rounded-[8px] ${className}`} />
  )
}
