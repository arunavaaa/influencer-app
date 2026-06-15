import { Skeleton } from '@/components/ui/skeleton'

export default function ApplicationsLoading() {
  return (
    <div className="p-6 md:p-8 max-w-[900px]">
      <div className="mb-6">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="space-y-4">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-[20px] p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-6 w-20 rounded-full flex-shrink-0" />
            </div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-4" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
