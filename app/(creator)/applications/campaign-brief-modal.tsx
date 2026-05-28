'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

export function CampaignBriefModal({ brief }: { brief: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <p className="text-[13px] text-[#4A4C4A] leading-relaxed line-clamp-2">{brief}</p>
      <button
        onClick={() => setOpen(true)}
        className="text-[12px] font-bold text-[#163300] hover:underline mt-0.5"
      >
        Show more
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          <div
            className="relative bg-white rounded-t-[28px] sm:rounded-[24px] w-full sm:max-w-[520px] max-h-[80vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E8E8]">
              <p className="text-[16px] font-black text-[#121511]">Campaign Brief</p>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-[#EDEFEB] flex items-center justify-center text-[#6A6C6A] hover:bg-[#E0E2DE] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto p-5">
              <p className="text-[15px] text-[#121511] leading-relaxed whitespace-pre-wrap">{brief}</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
