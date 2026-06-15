import { Skeleton } from '@/components/ui/skeleton'

export default function BrandMessagesLoading() {
  return (
    <div className="p-6 md:p-8 max-w-[700px]">
      <div className="mb-6">
        <Skeleton className="h-8 w-36 mb-2" />
      </div>
      <div className="bg-white rounded-[24px] overflow-hidden">
        {[0, 1, 2, 3, 4].map((i, idx) => (
          <div
            key={i}
            className={`flex items-center gap-4 px-5 py-4 ${idx !== 4 ? 'border-b border-[#F0F0F0]' : ''}`}
          >
            <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <Skeleton className="h-4 w-36 mb-2" />
              <Skeleton className="h-3 w-52" />
            </div>
            <Skeleton className="h-3 w-12 flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
