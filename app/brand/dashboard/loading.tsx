import { Skeleton } from '@/components/ui/skeleton'

export default function BrandDashboardLoading() {
  return (
    <div className="p-6 md:p-8 max-w-[1000px]">
      <div className="mb-8">
        <Skeleton className="h-8 w-56 mb-2" />
        <Skeleton className="h-4 w-44" />
      </div>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[0, 1, 2].map(i => (
          <div key={i} className="bg-white rounded-[20px] p-5">
            <Skeleton className="h-9 w-12 mb-2" />
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[0, 1].map(i => (
          <div key={i} className="bg-white rounded-[24px] p-6">
            <div className="flex items-center justify-between mb-5">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="space-y-3">
              {[0, 1, 2].map(j => (
                <div key={j} className="border border-[#E8E8E8] rounded-[14px] p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
