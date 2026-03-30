export default function Privacy() {
  return (
    <div className="min-h-[calc(100vh-4rem)] py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: March 23, 2026</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground leading-relaxed">
          <Section title="1. Information We Collect">
            <p>When you use 1ur.in, we collect information you provide directly to us, such as when you create an account or use our services. This includes:</p>
            <ul>
              <li>Email address and profile information from your authentication provider (Clerk)</li>
              <li>URLs you submit for shortening</li>
              <li>Custom slugs you create</li>
              <li>Payment information processed securely via Razorpay (we never store card details)</li>
            </ul>
          </Section>

          <Section title="2. How We Use Your Information">
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, maintain, and improve our URL shortening services</li>
              <li>Process transactions and manage your subscription plan</li>
              <li>Send you technical notices and support messages</li>
              <li>Track click analytics for your shortened links</li>
              <li>Monitor and analyze usage patterns to improve user experience</li>
            </ul>
          </Section>

          <Section title="3. Information We Share">
            <p>We do not sell, trade, or rent your personal information to third parties. We may share information only in the following circumstances:</p>
            <ul>
              <li>With service providers who assist in our operations (Clerk for auth, Turso for database, Razorpay for payments)</li>
              <li>When required by law or to protect our rights</li>
              <li>In connection with a merger or acquisition</li>
            </ul>
          </Section>

          <Section title="4. Data Retention">
            <p>We retain your account data and shortened URLs for as long as your account is active. If you delete your account, we will delete your data within 30 days, except where retention is required by law.</p>
          </Section>

          <Section title="5. Click Analytics">
            <p>When someone clicks one of your shortened links, we record the click count. We do not collect personal data about the visitors who click your links — only aggregate click counts are stored.</p>
          </Section>

          <Section title="6. Security">
            <p>We implement appropriate technical and organizational measures to protect your information against unauthorized access, alteration, disclosure, or destruction. All data is transmitted over HTTPS and stored securely in our Turso database.</p>
          </Section>

          <Section title="7. Your Rights">
            <p>You have the right to access, correct, or delete your personal information at any time by contacting us at privacy@1ur.in. You may also delete your account through your account settings.</p>
          </Section>

          <Section title="8. Cookies">
            <p>We use cookies and similar tracking technologies to maintain your session and improve your experience. You can control cookies through your browser settings, though this may affect functionality.</p>
          </Section>

          <Section title="9. Changes to This Policy">
            <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page with an updated date.</p>
          </Section>

          <Section title="10. Contact Us">
            <p>If you have questions about this Privacy Policy, please contact us at <a href="mailto:privacy@1ur.in" className="text-primary hover:underline">privacy@1ur.in</a>.</p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-white/5 pt-8">
      <h2 className="text-xl font-semibold text-foreground mb-4">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
