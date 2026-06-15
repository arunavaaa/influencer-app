import { Skeleton } from '@/components/ui/skeleton'

export default function BrandProfileLoading() {
  return (
    <div className="p-6 md:p-8 max-w-[700px]">
      <div className="mb-6">
        <Skeleton className="h-8 w-40 mb-2" />
      </div>
      <div className="bg-white rounded-[24px] p-6 space-y-6">
        <div className="flex items-center gap-5">
          <Skeleton className="w-20 h-20 rounded-full flex-shrink-0" />
          <div>
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        {[0, 1, 2, 3].map(i => (
          <div key={i}>
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-10 w-full rounded-[12px]" />
          </div>
        ))}
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>
    </div>
  )
}
