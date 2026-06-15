import { Skeleton } from '@/components/ui/skeleton'

export default function CampaignsLoading() {
  return (
    <div className="p-6 md:p-8 max-w-[900px]">
      <div className="mb-6">
        <Skeleton className="h-8 w-52 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>
      {/* Filter bar */}
      <div className="flex gap-2 mb-6">
        <Skeleton className="h-9 w-28 rounded-full" />
        <Skeleton className="h-9 w-28 rounded-full" />
        <Skeleton className="h-9 w-28 rounded-full" />
      </div>
      <div className="space-y-4">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-[20px] p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-6 w-16 rounded-full flex-shrink-0" />
            </div>
            <div className="flex gap-2 mb-3">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-24 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
