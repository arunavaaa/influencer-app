import { Skeleton } from '@/components/ui/skeleton'

export default function SearchLoading() {
  return (
    <div className="p-6 md:p-8 max-w-[1000px]">
      <div className="mb-6">
        <Skeleton className="h-8 w-44 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      {/* Search bar */}
      <Skeleton className="h-12 w-full rounded-[14px] mb-6" />
      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {[0, 1, 2, 3].map(i => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} className="bg-white rounded-[20px] p-5">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
              <div>
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <div className="flex gap-2 mb-3">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-8 w-full rounded-full mt-2" />
          </div>
        ))}
      </div>
    </div>
  )
}
