import Link from 'next/link'

export const metadata = { title: 'Terms of Service — Crayon' }

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white px-5 md:px-[70px] py-16" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
      <div className="max-w-[760px] mx-auto">
        <Link href="/" className="text-[14px] text-[#6A6C6A] hover:text-[#163300] transition-colors mb-8 inline-block">
          ← Back to Crayon
        </Link>
        <h1 className="text-[40px] font-black text-[#163300] mb-4">Terms of Service</h1>
        <p className="text-[15px] text-[#6A6C6A] mb-10">Last updated: May 2026</p>
        <div className="prose prose-neutral max-w-none text-[#121511] space-y-6 text-[15px] leading-relaxed">
          <p>
            By using Crayon, you agree to these Terms of Service. Please read them carefully.
          </p>
          <h2 className="text-[22px] font-black text-[#121511] mt-8">Using Our Services</h2>
          <p>
            You must follow any policies made available to you within the services. You may only use our services as permitted by law. We may suspend or stop providing services to you if you do not comply with our terms.
          </p>
          <h2 className="text-[22px] font-black text-[#121511] mt-8">Non-Circumvention</h2>
          <p>
            All collaborations facilitated through Crayon must be conducted exclusively through the platform for a period of 12 months from the date of first contact. Circumventing the platform to avoid fees is a violation of these terms.
          </p>
          <h2 className="text-[22px] font-black text-[#121511] mt-8">Payments & Escrow</h2>
          <p>
            All payments are processed through Razorpay and held in escrow until content is approved. Crayon charges a 10% platform fee on all transactions.
          </p>
          <h2 className="text-[22px] font-black text-[#121511] mt-8">Contact Us</h2>
          <p>
            If you have questions about these Terms, please contact us at <a href="mailto:legal@crayon.in" className="text-[#163300] font-semibold hover:underline">legal@crayon.in</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
