export default function Terms() {
  return (
    <div className="min-h-[calc(100vh-4rem)] py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: March 23, 2026</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground leading-relaxed">
          <Section title="1. Acceptance of Terms">
            <p>By accessing or using 1ur.in ("Service"), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the Service.</p>
          </Section>

          <Section title="2. Description of Service">
            <p>1ur.in provides URL shortening services. We allow users to create shorter versions of long URLs for easier sharing. Features include:</p>
            <ul>
              <li>URL shortening with auto-generated or custom slugs</li>
              <li>Click tracking and analytics</li>
              <li>Subscription plans for higher URL limits</li>
            </ul>
          </Section>

          <Section title="3. User Accounts">
            <p>To use our Service, you must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must immediately notify us of any unauthorized use of your account.</p>
          </Section>

          <Section title="4. Acceptable Use">
            <p>You agree not to use the Service to shorten URLs that:</p>
            <ul>
              <li>Contain malware, viruses, or malicious code</li>
              <li>Promote illegal activities or content</li>
              <li>Contain spam or unsolicited advertising</li>
              <li>Infringe on intellectual property rights of others</li>
              <li>Harass, abuse, or harm other people</li>
              <li>Violate any applicable local, national, or international law</li>
            </ul>
          </Section>

          <Section title="5. URL Limits and Plans">
            <p>Free accounts are limited to 5 shortened URLs. Paid plans offer higher limits as described on our Pricing page. We reserve the right to modify plan limits with reasonable notice.</p>
          </Section>

          <Section title="6. Payments and Refunds">
            <p>Paid plans are processed via Razorpay. Payments are non-refundable unless required by applicable law. Plan upgrades take effect immediately upon successful payment verification.</p>
          </Section>

          <Section title="7. Link Removal">
            <p>We reserve the right to remove any shortened URL that violates these Terms of Service or our Acceptable Use Policy, without prior notice. Links found to be malicious or harmful will be immediately deactivated.</p>
          </Section>

          <Section title="8. Disclaimer of Warranties">
            <p>The Service is provided "as is" without any warranties of any kind, either express or implied. We do not guarantee that the Service will be available at all times or error-free.</p>
          </Section>

          <Section title="9. Limitation of Liability">
            <p>1ur.in shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the Service. Our total liability shall not exceed the amount you paid to us in the last 12 months.</p>
          </Section>

          <Section title="10. Changes to Terms">
            <p>We reserve the right to modify these Terms at any time. We will provide notice of significant changes. Your continued use of the Service after changes constitutes acceptance of the new Terms.</p>
          </Section>

          <Section title="11. Contact">
            <p>For questions about these Terms, contact us at <a href="mailto:legal@1ur.in" className="text-primary hover:underline">legal@1ur.in</a>.</p>
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
