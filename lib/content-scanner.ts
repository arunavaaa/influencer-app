/**
 * Scans message bodies for personally identifying / off-platform contact info.
 * If any pattern matches, the substring is replaced with "[redacted]" and the
 * message is flagged for moderation. Patterns intentionally lean toward
 * over-blocking — false positives are easier to recover from than missed
 * platform bypass attempts.
 *
 * Patterns:
 *   - email          name@domain.tld
 *   - upi            handle@<bank-vpa-suffix>  (paytm, ybl, oksbi, ...)
 *   - phone          Indian mobile: 10 digits starting 6-9 (with optional +91/91/0 prefix)
 *   - instagram      @handle   (not preceded by a word char so it doesn't match emails)
 *   - whatsapp       wa.me/...  or whatsapp.com/...
 */
export type FlagReason =
  | 'email'
  | 'upi'
  | 'phone'
  | 'instagram_handle'
  | 'whatsapp_link'

type Pattern = {
  reason: FlagReason
  // Stored as source+flags so we always construct fresh RegExp instances and
  // avoid /g lastIndex stickiness pitfalls.
  source: string
  flags: string
}

const UPI_VPA_SUFFIXES = [
  'upi',
  'ybl',
  'axl',
  'paytm',
  'apl',
  'okaxis',
  'okhdfcbank',
  'okicici',
  'oksbi',
  'ibl',
  'ibknet',
  'hdfc',
  'icici',
  'sbi',
  'kotak',
  'axisbank',
  'airtel',
  'fbl',
  'federal',
  'barodapay',
  'allbank',
  'aubl',
  'jio',
  'jiopayments',
  'rbl',
  'pnb',
  'idfcfirst',
  'idbi',
  'jupiteraxis',
  'cnrb',
  'kbl',
  'tatabank',
]

const PATTERNS: Pattern[] = [
  // Order matters: check email first, then UPI (they share the @ symbol),
  // then phone, then handle, then whatsapp.
  {
    reason: 'email',
    source: '[\\w.+-]+@[\\w-]+\\.[\\w-]{2,}',
    flags: 'gi',
  },
  {
    reason: 'upi',
    source: `\\b[\\w.-]+@(?:${UPI_VPA_SUFFIXES.join('|')})\\b`,
    flags: 'gi',
  },
  {
    reason: 'phone',
    // Optional +91 / 91 / 0 prefix, then 10 digits starting 6-9
    source: '(?<!\\w)(?:\\+?91[-\\s]?|0)?[6-9]\\d{9}(?!\\w)',
    flags: 'g',
  },
  {
    reason: 'instagram_handle',
    // @handle: not preceded by a word char or another @ (so emails / UPI don't
    // also match), 2+ chars, alnum / dot / underscore
    source: '(?<![\\w@])@[A-Za-z0-9._]{2,30}\\b',
    flags: 'g',
  },
  {
    reason: 'whatsapp_link',
    source: '\\b(?:wa\\.me|whatsapp\\.com|chat\\.whatsapp\\.com)\\/\\S+',
    flags: 'gi',
  },
]

export type ScanResult = {
  redactedBody: string
  flagged: boolean
  reasons: FlagReason[]
}

export function scanAndRedact(body: string): ScanResult {
  const reasons: FlagReason[] = []
  let working = body

  for (const { reason, source, flags } of PATTERNS) {
    const detector = new RegExp(source, flags)
    if (detector.test(working)) {
      reasons.push(reason)
      const replacer = new RegExp(source, flags)
      working = working.replace(replacer, '[redacted]')
    }
  }

  return {
    redactedBody: working,
    flagged: reasons.length > 0,
    reasons,
  }
}

export function describeReasons(reasons: FlagReason[]): string {
  const labels: Record<FlagReason, string> = {
    email: 'email address',
    upi: 'UPI ID',
    phone: 'phone number',
    instagram_handle: 'social handle',
    whatsapp_link: 'WhatsApp link',
  }
  const unique = Array.from(new Set(reasons.map((r) => labels[r])))
  if (unique.length === 0) return ''
  if (unique.length === 1) return unique[0]
  if (unique.length === 2) return `${unique[0]} and ${unique[1]}`
  return `${unique.slice(0, -1).join(', ')}, and ${unique[unique.length - 1]}`
}
