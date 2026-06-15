import { Skeleton } from '@/components/ui/skeleton'

export default function SettingsLoading() {
  return (
    <div className="p-6 md:p-8 max-w-[700px]">
      <div className="mb-6">
        <Skeleton className="h-8 w-28 mb-2" />
      </div>
      <div className="space-y-4">
        {[0, 1, 2].map(i => (
          <div key={i} className="bg-white rounded-[20px] p-5">
            <Skeleton className="h-5 w-36 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  )
}
