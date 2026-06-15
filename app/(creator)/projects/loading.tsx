import { Skeleton } from '@/components/ui/skeleton'

export default function ProjectsLoading() {
  return (
    <div className="p-6 md:p-8 max-w-[900px]">
      <div className="mb-6">
        <Skeleton className="h-8 w-44 mb-2" />
        <Skeleton className="h-4 w-60" />
      </div>
      <div className="space-y-4">
        {[0, 1, 2].map(i => (
          <div key={i} className="bg-white rounded-[20px] p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-6 w-24 rounded-full flex-shrink-0" />
            </div>
            <div className="flex gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
