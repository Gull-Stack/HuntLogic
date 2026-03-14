import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | HuntLogic",
  description: "HuntLogic Terms of Service — read our full terms before using the platform.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-4xl font-bold text-brand-forest dark:text-brand-cream">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-brand-sage">Effective Date: March 14, 2026 · Last Updated: March 14, 2026</p>

      <section className="mt-10 space-y-8 text-brand-bark/90 dark:text-brand-cream/80">

        {/* 1 */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-brand-forest dark:text-brand-gold">1. Agreement to Terms</h2>
          <p>
            By accessing or using HuntLogic ("the Platform," "we," "us," or "our") at huntlogic.ai or any associated
            mobile or web application, you ("User," "you," or "your") agree to be bound by these Terms of Service
            ("Terms"). If you do not agree to these Terms, do not access or use the Platform.
          </p>
          <p>
            These Terms constitute a legally binding agreement between you and HuntLogic. We reserve the right to
            update these Terms at any time. Continued use of the Platform after any changes constitutes your acceptance
            of the revised Terms. We will notify you of material changes via email or in-app notification.
          </p>
        </div>

        {/* 2 */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-brand-forest dark:text-brand-gold">2. Description of Service</h2>
          <p>HuntLogic is an AI-powered hunt planning and application management platform that helps hunters:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>Track preference points across multiple states and agencies</li>
            <li>Analyze draw odds and forecast application outcomes</li>
            <li>Generate personalized hunt playbooks and recommendations</li>
            <li>Monitor application deadlines and regulatory requirements</li>
            <li>Plan hunting trips including travel, weather, and logistics</li>
            <li>Connect with other hunters and outfitters</li>
            <li>Receive AI-assisted guidance through Teddy, our AI hunting concierge</li>
          </ul>
          <p className="font-medium">
            HuntLogic is an informational and planning tool only. Nothing on the Platform constitutes legal advice,
            regulatory guidance, or a guarantee of any draw outcome.
          </p>
        </div>

        {/* 3 */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-brand-forest dark:text-brand-gold">3. Eligibility</h2>
          <p>
            You must be at least 18 years of age to create an account and use the Platform. By using HuntLogic, you
            represent and warrant that you are at least 18 years old, have the legal capacity to enter into these Terms,
            will use the Platform only for lawful purposes, and that all information you provide is accurate and current.
          </p>
          <p>
            If you are between 13 and 17 years of age, you may only use the Platform with verifiable parental or
            guardian consent. We do not knowingly collect information from children under 13.
          </p>
        </div>

        {/* 4 */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-brand-forest dark:text-brand-gold">4. User Accounts</h2>
          <h3 className="text-lg font-semibold text-brand-forest dark:text-brand-cream">4.1 Account Creation</h3>
          <p>
            You may create an account using Google OAuth, Apple Sign-In, or email magic link. You are responsible for
            maintaining the confidentiality of your account credentials and for all activity that occurs under your account.
          </p>
          <h3 className="text-lg font-semibold text-brand-forest dark:text-brand-cream">4.2 Account Accuracy</h3>
          <p>
            You agree to provide accurate, current, and complete information during registration and to keep your account
            information updated. Inaccurate profile data will degrade recommendation quality and is your responsibility to correct.
          </p>
          <h3 className="text-lg font-semibold text-brand-forest dark:text-brand-cream">4.3 Account Security</h3>
          <p>
            You agree to notify us immediately of any unauthorized use of your account at{" "}
            <a href="mailto:support@huntlogic.ai" className="text-brand-sky underline underline-offset-2 hover:text-brand-sky/80">
              support@huntlogic.ai
            </a>. We are not liable for losses arising from unauthorized account access caused by your failure to secure your credentials.
          </p>
          <h3 className="text-lg font-semibold text-brand-forest dark:text-brand-cream">4.4 Account Termination</h3>
          <p>
            We reserve the right to suspend or terminate accounts that violate these Terms, engage in fraudulent activity,
            or have been inactive for more than 24 consecutive months.
          </p>
        </div>

        {/* 5 */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-brand-forest dark:text-brand-gold">5. Subscriptions and Billing</h2>
          <h3 className="text-lg font-semibold text-brand-forest dark:text-brand-cream">5.1 Subscription Tiers</h3>
          <p>HuntLogic offers the following tiers (pricing subject to change with 30 days' notice):</p>
          <ul className="list-disc space-y-1 pl-6">
            <li><span className="font-medium">Scout (Free):</span> Core features with limited recommendations and data access</li>
            <li><span className="font-medium">Hunter ($9/month):</span> Full playbook generation, advanced forecasting, and priority data updates</li>
            <li><span className="font-medium">Pro ($29/month):</span> All Hunter features plus white-label options, group management, and outfitter tools</li>
          </ul>
          <h3 className="text-lg font-semibold text-brand-forest dark:text-brand-cream">5.2 Billing</h3>
          <p>
            Paid subscriptions are billed monthly or annually. By subscribing, you authorize us to charge your payment
            method on a recurring basis. All fees are in USD.
          </p>
          <h3 className="text-lg font-semibold text-brand-forest dark:text-brand-cream">5.3 Refunds</h3>
          <p>
            We offer a 7-day refund for new paid subscriptions. After 7 days, subscriptions are non-refundable. We do not
            prorate cancellations mid-cycle.
          </p>
          <h3 className="text-lg font-semibold text-brand-forest dark:text-brand-cream">5.4 Free Trial</h3>
          <p>
            When a free trial is offered, your subscription will automatically convert to a paid plan at the end of the
            trial period unless you cancel before the trial expires.
          </p>
          <h3 className="text-lg font-semibold text-brand-forest dark:text-brand-cream">5.5 Pricing Changes</h3>
          <p>
            We will provide at least 30 days' notice before changing subscription pricing. Existing subscribers retain
            current pricing until the start of their next billing cycle following the notice period.
          </p>
        </div>

        {/* 6 */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-brand-forest dark:text-brand-gold">6. AI Concierge (Teddy) — Important Limitations</h2>
          <h3 className="text-lg font-semibold text-brand-forest dark:text-brand-cream">6.1 Nature of AI Guidance</h3>
          <p>
            Teddy, our AI hunting concierge powered by Claude (Anthropic), is an informational assistant. Teddy's
            responses are generated by an AI language model and may contain errors, outdated information, or inaccuracies,
            and may fail to account for recent regulatory changes.
          </p>
          <h3 className="text-lg font-semibold text-brand-forest dark:text-brand-cream">6.2 Not Legal or Regulatory Advice</h3>
          <p className="font-medium">
            Nothing Teddy says constitutes legal advice, regulatory compliance guidance, or an official interpretation of
            any state hunting regulation. Always verify information directly with the relevant state wildlife agency before
            submitting applications, purchasing licenses, or taking any regulatory action.
          </p>
          <h3 className="text-lg font-semibold text-brand-forest dark:text-brand-cream">6.3 Draw Odds Are Estimates</h3>
          <p>
            Draw odds, success rates, and application recommendations provided by HuntLogic — including those generated by
            our ML models and Monte Carlo simulation engine — are statistical estimates based on historical data. They are{" "}
            <span className="font-medium">not guarantees</span> of any specific draw outcome.
          </p>
          <h3 className="text-lg font-semibold text-brand-forest dark:text-brand-cream">6.4 AI Conversation Data</h3>
          <p>
            Conversations with Teddy are used to provide the service and may be used to improve platform performance,
            subject to our Privacy Policy. Do not share sensitive personal information (social security numbers, financial
            account details) in chat sessions.
          </p>
        </div>

        {/* 7 */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-brand-forest dark:text-brand-gold">7. Credential Vaulting</h2>
          <h3 className="text-lg font-semibold text-brand-forest dark:text-brand-cream">7.1 Optional Feature</h3>
          <p>
            HuntLogic offers an optional credential vaulting feature that allows you to securely store state wildlife
            agency login credentials for application tracking purposes.
          </p>
          <h3 className="text-lg font-semibold text-brand-forest dark:text-brand-cream">7.2 Encryption</h3>
          <p>Stored credentials are encrypted using AES-256-GCM encryption.</p>
          <h3 className="text-lg font-semibold text-brand-forest dark:text-brand-cream">7.3 Your Consent and Responsibility</h3>
          <p>By using the credential vaulting feature, you consent to HuntLogic storing your state agency credentials in
            encrypted form, confirm you are authorized to use those credentials, and acknowledge that HuntLogic may use stored
            credentials to retrieve your application status and point balances on your behalf.</p>
          <h3 className="text-lg font-semibold text-brand-forest dark:text-brand-cream">7.4 Removal</h3>
          <p>You may delete vaulted credentials at any time through your account settings. Deletion is permanent and immediate.</p>
        </div>

        {/* 8 */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-brand-forest dark:text-brand-gold">8. User-Generated Content</h2>
          <p>
            You retain ownership of content you submit (reviews, harvest data, group plans). By submitting content, you
            grant HuntLogic a non-exclusive, worldwide, royalty-free license to use, store, display, and distribute your
            content to operate and improve the Platform.
          </p>
          <p>
            You agree not to submit content that is false, defamatory, unlawful, or infringes on third-party rights.
            Outfitter reviews must be based on genuine personal experiences.
          </p>
        </div>

        {/* 9 */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-brand-forest dark:text-brand-gold">9. Group Features</h2>
          <p>
            When you join a hunt group, limited profile information may be visible to other group members. You control
            sharing settings. HuntLogic is not responsible for disputes between group members.
          </p>
        </div>

        {/* 10 */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-brand-forest dark:text-brand-gold">10. Outfitter Directory</h2>
          <p>
            Outfitter listings are informational only. We do not endorse, vet, or guarantee the quality, safety, or
            legitimacy of any listed outfitter. You are solely responsible for independently verifying outfitter
            credentials before booking any service. HuntLogic is not a party to any transaction between you and an outfitter.
          </p>
        </div>

        {/* 11 */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-brand-forest dark:text-brand-gold">11. Prohibited Uses</h2>
          <p>You agree not to:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>Use the Platform for any unlawful purpose or in violation of hunting regulations</li>
            <li>Attempt to gain unauthorized access to any part of the Platform or another user's account</li>
            <li>Scrape, crawl, or systematically extract data from the Platform without written permission</li>
            <li>Reverse engineer, decompile, or disassemble any part of the Platform</li>
            <li>Use automated tools, bots, or scripts to interact with the Platform</li>
            <li>Submit false or misleading information including fraudulent harvest data or point balances</li>
            <li>Impersonate any person or entity</li>
            <li>Use the Platform to market competing services without written consent</li>
          </ul>
        </div>

        {/* 12 */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-brand-forest dark:text-brand-gold">12. Intellectual Property</h2>
          <p>
            HuntLogic and its licensors own all intellectual property rights in the Platform, including the codebase,
            AI models, recommendation algorithms, scoring engines, and brand assets. These Terms do not grant you any
            ownership interest in the Platform.
          </p>
          <p>
            We own aggregated, de-identified data derived from Platform usage, including statistical models built from
            anonymized hunter preference patterns and draw outcome trends.
          </p>
        </div>

        {/* 13 */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-brand-forest dark:text-brand-gold">13. Third-Party Services and Data</h2>
          <p>
            HuntLogic integrates with third-party services including state wildlife agencies (for draw odds, season dates,
            and regulations), Google (OAuth and Gemini embeddings), Apple (Sign-In), Anthropic (Claude AI), Resend (email),
            and mapping providers.
          </p>
          <p className="font-medium">
            State agency data is sourced from public sources. We make reasonable efforts to keep data current but do not
            guarantee accuracy or timeliness. Always verify critical dates and requirements directly with the relevant state agency.
          </p>
        </div>

        {/* 14 */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-brand-forest dark:text-brand-gold">14. Disclaimers</h2>
          <p className="uppercase text-sm font-medium tracking-wide">
            The platform is provided "as is" and "as available" without warranties of any kind, express or implied,
            including warranties of merchantability, fitness for a particular purpose, or non-infringement.
          </p>
          <p className="uppercase text-sm font-medium tracking-wide">
            We do not guarantee that use of the platform will result in successful draw applications, filled tags, or
            any specific hunting outcome.
          </p>
          <p>
            You are solely responsible for complying with all applicable federal, state, and local hunting regulations,
            licensing requirements, and reporting obligations.
          </p>
        </div>

        {/* 15 */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-brand-forest dark:text-brand-gold">15. Limitation of Liability</h2>
          <p className="uppercase text-sm font-medium tracking-wide">
            To the maximum extent permitted by applicable law, HuntLogic and its officers, directors, employees, and
            agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages,
            including loss of draw applications or hunting opportunities, missed deadlines due to platform errors or
            data inaccuracies, or losses arising from AI concierge recommendations.
          </p>
          <p className="uppercase text-sm font-medium tracking-wide">
            Our total liability to you for any claims arising from these terms or the platform shall not exceed the
            greater of (a) the amount you paid us in the 12 months preceding the claim or (b) $100 USD.
          </p>
        </div>

        {/* 16 */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-brand-forest dark:text-brand-gold">16. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless HuntLogic and its officers, directors, employees, and
            agents from any claims, liabilities, damages, and expenses (including reasonable attorneys' fees) arising
            from your violation of these Terms, your User Content, or your use of the Platform in violation of any
            applicable law.
          </p>
        </div>

        {/* 17 */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-brand-forest dark:text-brand-gold">17. Governing Law and Dispute Resolution</h2>
          <p>
            These Terms are governed by applicable law. Before initiating formal proceedings, you agree to contact us
            at{" "}
            <a href="mailto:legal@huntlogic.ai" className="text-brand-sky underline underline-offset-2 hover:text-brand-sky/80">
              legal@huntlogic.ai
            </a>{" "}
            and attempt to resolve disputes informally for at least 30 days.
          </p>
          <p>
            Any dispute not resolved informally shall be submitted to binding individual arbitration. You waive any
            right to participate in class action lawsuits or class-wide arbitration.
          </p>
        </div>

        {/* 18 */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-brand-forest dark:text-brand-gold">18. Changes to the Service</h2>
          <p>
            We may modify, suspend, or discontinue any part of the Platform at any time. We will provide reasonable
            notice for material changes that affect paid features. We are not liable to you for any modification or
            discontinuation of the Service.
          </p>
        </div>

        {/* 19 */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-brand-forest dark:text-brand-gold">19. Miscellaneous</h2>
          <p>
            These Terms, along with our Privacy Policy, constitute the entire agreement between you and HuntLogic.
            If any provision is found unenforceable, the remaining provisions remain in full force. Our failure to
            enforce any provision does not constitute a waiver of that right.
          </p>
        </div>

        {/* Contact */}
        <div className="space-y-3 border-t border-brand-sage/20 pt-8">
          <h2 className="text-2xl font-semibold text-brand-forest dark:text-brand-gold">Contact</h2>
          <p>
            For questions about these Terms:{" "}
            <a href="mailto:legal@huntlogic.ai" className="text-brand-sky underline underline-offset-2 hover:text-brand-sky/80">
              legal@huntlogic.ai
            </a>
          </p>
          <p>
            For general support:{" "}
            <a href="mailto:support@huntlogic.ai" className="text-brand-sky underline underline-offset-2 hover:text-brand-sky/80">
              support@huntlogic.ai
            </a>
          </p>
        </div>

      </section>
    </main>
  );
}
