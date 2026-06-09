'use client'

export default function BrandError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <p className="text-[28px] mb-3">⚠️</p>
        <h2 className="text-[18px] font-black text-[#121511] mb-2">Something went wrong</h2>
        <p className="text-[13px] text-[#6A6C6A] mb-4 font-mono bg-[#F5F5F5] p-3 rounded-xl text-left break-all">{error.message}</p>
        <button onClick={reset} className="bg-[#163300] text-[#9FE870] font-bold text-[14px] px-6 py-2.5 rounded-full hover:bg-[#1f4a00] transition-colors">
          Try again
        </button>
      </div>
    </div>
  )
}
