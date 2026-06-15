import { Skeleton } from '@/components/ui/skeleton'

export default function BrandChatLoading() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E8E8E8] bg-white">
        <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
        <div>
          <Skeleton className="h-4 w-28 mb-1" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="flex gap-3 max-w-[70%]">
          <Skeleton className="w-8 h-8 rounded-full flex-shrink-0 mt-1" />
          <Skeleton className="h-10 w-52 rounded-[18px]" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-10 w-48 rounded-[18px]" />
        </div>
        <div className="flex gap-3 max-w-[70%]">
          <Skeleton className="w-8 h-8 rounded-full flex-shrink-0 mt-1" />
          <Skeleton className="h-16 w-60 rounded-[18px]" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-10 w-36 rounded-[18px]" />
        </div>
      </div>

      {/* Input bar */}
      <div className="border-t border-[#E8E8E8] bg-white px-4 py-3">
        <Skeleton className="h-11 w-full rounded-full" />
      </div>
    </div>
  )
}
