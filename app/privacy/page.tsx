import Link from 'next/link'

export const metadata = { title: 'Privacy Policy — Crayon' }

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white px-5 md:px-[70px] py-16" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
      <div className="max-w-[760px] mx-auto">
        <Link href="/" className="text-[14px] text-[#6A6C6A] hover:text-[#163300] transition-colors mb-8 inline-block">
          ← Back to Crayon
        </Link>
        <h1 className="text-[40px] font-black text-[#163300] mb-4">Privacy Policy</h1>
        <p className="text-[15px] text-[#6A6C6A] mb-10">Last updated: May 2026</p>
        <div className="prose prose-neutral max-w-none text-[#121511] space-y-6 text-[15px] leading-relaxed">
          <p>
            Crayon (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) operates the Crayon influencer marketplace platform. This Privacy Policy describes how we collect, use, and share information about you when you use our services.
          </p>
          <h2 className="text-[22px] font-black text-[#121511] mt-8">Information We Collect</h2>
          <p>
            We collect information you provide directly to us, such as when you create an account, complete your profile, post a campaign, or contact us for support.
          </p>
          <h2 className="text-[22px] font-black text-[#121511] mt-8">How We Use Your Information</h2>
          <p>
            We use your information to operate and improve our services, process transactions, send notifications, and comply with legal obligations.
          </p>
          <h2 className="text-[22px] font-black text-[#121511] mt-8">Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us at <a href="mailto:privacy@crayon.in" className="text-[#163300] font-semibold hover:underline">privacy@crayon.in</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
