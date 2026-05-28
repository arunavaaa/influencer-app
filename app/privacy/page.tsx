import { BackLink } from '@/components/ui/back-link'

export const metadata = { title: 'Privacy Policy — GrabCollab' }

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white px-5 md:px-[70px] py-16" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
      <div className="max-w-[760px] mx-auto">
        <BackLink label="Back" />
        <h1 className="text-[40px] font-black text-[#163300] mb-4">Privacy Policy</h1>
        <p className="text-[15px] text-[#6A6C6A] mb-10">Last updated: May 2026</p>

        <div className="space-y-8 text-[15px] leading-relaxed text-[#121511]">

          <p>
            GrabCollab (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) operates grabcollab.com — a platform that connects content creators with brands for collaborations. This Privacy Policy explains what data we collect, how we use it, and your rights over it.
          </p>

          <section>
            <h2 className="text-[22px] font-black text-[#121511] mb-3">1. Information We Collect</h2>
            <p className="mb-3"><strong>Information you give us directly:</strong></p>
            <ul className="list-disc pl-6 space-y-1 text-[#4A4C4A] mb-4">
              <li>Account details: name, email address, password</li>
              <li>Creator profile: username, display name, profile photo, city, bio, languages, content niches</li>
              <li>Social media links and self-reported follower/subscriber counts</li>
              <li>Content package details (platform, content type, pricing)</li>
              <li>Brand profile: brand name, logo, description, website, industry</li>
              <li>Campaign information: title, goals, budget, deadlines</li>
              <li>Messages exchanged with other users on the platform</li>
            </ul>
            <p className="mb-3"><strong>Information collected automatically:</strong></p>
            <ul className="list-disc pl-6 space-y-1 text-[#4A4C4A]">
              <li>Log data: pages visited, actions taken, timestamps</li>
              <li>Device information: browser type, operating system</li>
              <li>Analytics events (via PostHog) to understand how the platform is used</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[22px] font-black text-[#121511] mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1 text-[#4A4C4A]">
              <li>To create and manage your account</li>
              <li>To display your creator profile to brands searching for collaborators</li>
              <li>To match creators with relevant campaigns based on niche and audience size</li>
              <li>To enable messaging between creators and brands</li>
              <li>To send transactional emails (e.g. new message notifications, application updates)</li>
              <li>To improve the platform based on usage patterns</li>
              <li>To enforce our Terms of Service and prevent fraud or abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[22px] font-black text-[#121511] mb-3">3. Who Can See Your Information</h2>
            <p className="mb-3"><strong>Creator profiles</strong> (username, display name, photo, bio, niches, social links, follower counts, content packages) are visible to any registered brand on GrabCollab. If you set your profile as live, it is also accessible to anyone with your profile URL.</p>
            <p className="mb-3"><strong>Brand profiles</strong> (brand name, logo, description, campaigns) are visible to registered creators.</p>
            <p><strong>Messages</strong> are private and only visible to the two parties in a conversation.</p>
          </section>

          <section>
            <h2 className="text-[22px] font-black text-[#121511] mb-3">4. Third-Party Services</h2>
            <p className="mb-3">We use the following third-party services to operate GrabCollab:</p>
            <ul className="list-disc pl-6 space-y-1 text-[#4A4C4A]">
              <li><strong>Supabase</strong> — database, authentication, and file storage (servers located in AWS)</li>
              <li><strong>Google OAuth</strong> — optional sign-in via your Google account</li>
              <li><strong>Resend</strong> — transactional email delivery</li>
              <li><strong>PostHog</strong> — product analytics (anonymised usage data)</li>
              <li><strong>Vercel</strong> — hosting and content delivery</li>
            </ul>
            <p className="mt-3">We do not sell your personal data to any third party, and we do not use it for advertising purposes.</p>
          </section>

          <section>
            <h2 className="text-[22px] font-black text-[#121511] mb-3">5. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active. If you request account deletion, we will remove your personal information within 30 days, except where we are required to retain it by law. Anonymised and aggregated analytics data may be retained indefinitely.
            </p>
          </section>

          <section>
            <h2 className="text-[22px] font-black text-[#121511] mb-3">6. Your Rights</h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1 text-[#4A4C4A]">
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate data through your profile settings</li>
              <li>Request deletion of your account and associated data</li>
              <li>Withdraw consent for non-essential communications at any time</li>
            </ul>
            <p className="mt-3">To exercise these rights, email us at <a href="mailto:privacy@grabcollab.com" className="text-[#163300] font-semibold hover:underline">privacy@grabcollab.com</a>.</p>
          </section>

          <section>
            <h2 className="text-[22px] font-black text-[#121511] mb-3">7. Cookies</h2>
            <p>
              GrabCollab uses cookies and local storage to keep you signed in and to remember your preferences. We do not use advertising or tracking cookies. By using the platform, you consent to the use of these essential cookies.
            </p>
          </section>

          <section>
            <h2 className="text-[22px] font-black text-[#121511] mb-3">8. Children&apos;s Privacy</h2>
            <p>
              GrabCollab is not intended for anyone under the age of 18. We do not knowingly collect personal data from minors. If we become aware that a minor has created an account, we will delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-[22px] font-black text-[#121511] mb-3">9. Applicable Law</h2>
            <p>
              This Privacy Policy is governed by the Information Technology Act, 2000 and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, applicable in India. We are committed to complying with the Digital Personal Data Protection Act, 2023 (DPDPA) as its provisions come into effect.
            </p>
          </section>

          <section>
            <h2 className="text-[22px] font-black text-[#121511] mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy as the platform evolves. We will notify you of material changes by email or via an in-app notice. The &ldquo;Last updated&rdquo; date at the top reflects when the policy was last revised.
            </p>
          </section>

          <section>
            <h2 className="text-[22px] font-black text-[#121511] mb-3">11. Contact Us</h2>
            <p>
              For any privacy-related questions or requests, please contact us at{' '}
              <a href="mailto:privacy@grabcollab.com" className="text-[#163300] font-semibold hover:underline">privacy@grabcollab.com</a>.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
