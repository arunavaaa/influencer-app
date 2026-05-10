'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Star } from 'lucide-react'

type Props = {
  contractId: string
  influencerId: string
  onDone?: () => void
}

function StarPicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center gap-4">
      <span className="text-[14px] text-[#6A6C6A] w-36">{label}</span>
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i + 1)}
            onMouseEnter={() => setHover(i + 1)}
            onMouseLeave={() => setHover(0)}
          >
            <Star
              className={`w-6 h-6 transition-colors ${
                (hover || value) > i
                  ? 'fill-[#9FE870] stroke-[#9FE870]'
                  : 'stroke-[#E8E8E8] fill-[#E8E8E8]'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

export function ReviewForm({ contractId, influencerId, onDone }: Props) {
  const supabase = createClient()
  const [overall, setOverall] = useState(0)
  const [communication, setCommunication] = useState(0)
  const [timeliness, setTimeliness] = useState(0)
  const [satisfaction, setSatisfaction] = useState(0)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    if (!overall) {
      toast.error('Please add an overall rating')
      return
    }
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('You must be signed in to leave a review')
      setSubmitting(false)
      return
    }

    const { error } = await supabase.from('reviews').insert({
      contract_id: contractId,
      reviewer_id: user.id,
      influencer_id: influencerId,
      rating_overall: overall,
      rating_communication: communication || null,
      rating_timeliness: timeliness || null,
      rating_satisfaction: satisfaction || null,
      text: text.trim() || null,
    })

    if (error) {
      toast.error('Failed to submit review')
    } else {
      toast.success('Review submitted!')
      onDone?.()
    }
    setSubmitting(false)
  }

  return (
    <div className="bg-white rounded-[24px] p-6 border-2 border-[#9FE870]">
      <h3 className="text-[20px] font-black text-[#121511] mb-1">Leave a Review</h3>
      <p className="text-[14px] text-[#6A6C6A] mb-6">
        Rate your experience with this creator
      </p>

      <div className="flex flex-col gap-4 mb-6">
        <StarPicker label="Overall *" value={overall} onChange={setOverall} />
        <StarPicker label="Communication" value={communication} onChange={setCommunication} />
        <StarPicker label="Timeliness" value={timeliness} onChange={setTimeliness} />
        <StarPicker label="Satisfaction" value={satisfaction} onChange={setSatisfaction} />
      </div>

      <textarea
        placeholder="Share your experience... (optional)"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        className="w-full text-[15px] px-4 py-3 rounded-[12px] border border-[#E8E8E8] focus:outline-none focus:border-[#163300] resize-none mb-4"
      />

      <button
        onClick={submit}
        disabled={submitting || !overall}
        className="w-full bg-[#9FE870] text-[#163300] font-bold text-[16px] py-3 rounded-full hover:bg-[#8fdc60] transition-colors disabled:opacity-50"
      >
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </div>
  )
}
