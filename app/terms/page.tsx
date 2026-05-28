import { BackLink } from '@/components/ui/back-link'

export const metadata = { title: 'Terms of Service — GrabCollab' }

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white px-5 md:px-[70px] py-16" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
      <div className="max-w-[760px] mx-auto">
        <BackLink label="Back" />
        <h1 className="text-[40px] font-black text-[#163300] mb-4">Terms of Service</h1>
        <p className="text-[15px] text-[#6A6C6A] mb-10">Last updated: May 2026</p>

        <div className="space-y-8 text-[15px] leading-relaxed text-[#121511]">

          <p>
            Welcome to GrabCollab. By creating an account or using our platform, you agree to these Terms of Service. If you do not agree, please do not use GrabCollab.
          </p>

          <section>
            <h2 className="text-[22px] font-black text-[#121511] mb-3">1. About GrabCollab</h2>
            <p>
              GrabCollab is an online platform that connects Indian content creators with brands looking for collaborations. We provide the tools for discovery, communication, and campaign management. GrabCollab is currently in an early access (Phase 1) phase and is provided free of charge.
            </p>
          </section>

          <section>
            <h2 className="text-[22px] font-black text-[#121511] mb-3">2. Eligibility</h2>
            <p>
              You must be at least 18 years old to use GrabCollab. By registering, you confirm that the information you provide is accurate and that you have the legal capacity to enter into these terms.
            </p>
          </section>

          <section>
            <h2 className="text-[22px] font-black text-[#121511] mb-3">3. Creator Accounts</h2>
            <p>
              As a creator, you agree to:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-[#4A4C4A]">
              <li>Provide accurate profile information, including honest follower/subscriber counts</li>
              <li>Only list social accounts that you own and control</li>
              <li>Respond to brand enquiries in a timely and professional manner</li>
              <li>Not use the platform to spam, mislead, or harass brands</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[22px] font-black text-[#121511] mb-3">4. Brand Accounts</h2>
            <p>
              As a brand, you agree to:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-[#4A4C4A]">
              <li>Post campaigns that are legal, honest, and clearly described</li>
              <li>Not post campaigns for prohibited products or services (tobacco, adult content, illegal goods, etc.)</li>
              <li>Respect creators' right to decline collaborations</li>
              <li>Not use creator contact details obtained through GrabCollab for any purpose outside of the collaboration discussed on the platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[22px] font-black text-[#121511] mb-3">5. No Payment Processing</h2>
            <p>
              In Phase 1, GrabCollab does not process, hold, or facilitate any payments between creators and brands. All financial arrangements — including fees, payment terms, and invoicing — are agreed upon and settled directly between the creator and the brand. GrabCollab is not a party to any such agreement and bears no responsibility for any payment disputes.
            </p>
          </section>

          <section>
            <h2 className="text-[22px] font-black text-[#121511] mb-3">6. Non-Circumvention</h2>
            <p>
              If you discover or are introduced to another user through GrabCollab, you agree not to knowingly circumvent the platform to avoid future use of it. This means that brand–creator relationships formed through GrabCollab should continue to be managed through the platform for as long as both parties remain active users.
            </p>
          </section>

          <section>
            <h2 className="text-[22px] font-black text-[#121511] mb-3">7. Content & Intellectual Property</h2>
            <p>
              You retain ownership of all content you post on GrabCollab (profile bios, photos, campaign descriptions, etc.). By posting content, you grant GrabCollab a non-exclusive, royalty-free licence to display it on the platform for the purpose of providing the service. We will never sell your content to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-[22px] font-black text-[#121511] mb-3">8. Prohibited Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-[#4A4C4A]">
              <li>Create fake accounts or impersonate another person or brand</li>
              <li>Post false, misleading, or defamatory content</li>
              <li>Attempt to hack, scrape, or reverse-engineer any part of the platform</li>
              <li>Use automated tools to send bulk messages or applications</li>
              <li>Engage in any activity that violates applicable Indian law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[22px] font-black text-[#121511] mb-3">9. Suspension & Termination</h2>
            <p>
              We reserve the right to suspend or terminate any account that violates these terms or that we reasonably believe is being used fraudulently or abusively. You may delete your account at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-[22px] font-black text-[#121511] mb-3">10. Limitation of Liability</h2>
            <p>
              GrabCollab is a discovery and communication platform. We do not guarantee that any collaboration will be successful or result in payment. To the maximum extent permitted by law, GrabCollab is not liable for any indirect, incidental, or consequential damages arising from your use of the platform or from any collaboration arranged through it.
            </p>
          </section>

          <section>
            <h2 className="text-[22px] font-black text-[#121511] mb-3">11. Changes to These Terms</h2>
            <p>
              We may update these terms from time to time. We will notify you of significant changes by email or through an in-app notice. Continued use of the platform after changes take effect constitutes your acceptance of the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-[22px] font-black text-[#121511] mb-3">12. Governing Law</h2>
            <p>
              These terms are governed by the laws of India. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts in Bangalore, India.
            </p>
          </section>

          <section>
            <h2 className="text-[22px] font-black text-[#121511] mb-3">13. Contact Us</h2>
            <p>
              For questions about these Terms, please email us at{' '}
              <a href="mailto:legal@grabcollab.com" className="text-[#163300] font-semibold hover:underline">legal@grabcollab.com</a>.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
