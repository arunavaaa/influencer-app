import { Skeleton } from '@/components/ui/skeleton'

export default function ProfileEditLoading() {
  return (
    <div className="p-6 md:p-8 max-w-[700px]">
      <div className="mb-6">
        <Skeleton className="h-8 w-40 mb-2" />
      </div>
      <div className="bg-white rounded-[24px] p-6 space-y-6">
        <div className="flex items-center gap-5">
          <Skeleton className="w-20 h-20 rounded-full flex-shrink-0" />
          <Skeleton className="h-9 w-32 rounded-full" />
        </div>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i}>
            <Skeleton className="h-3 w-24 mb-2" />
            <Skeleton className="h-10 w-full rounded-[12px]" />
          </div>
        ))}
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>
    </div>
  )
}
