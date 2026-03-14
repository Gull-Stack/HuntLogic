import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | HuntLogic",
  description: "HuntLogic Privacy Policy — how we collect, use, and protect your information.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-4xl font-bold text-brand-forest dark:text-brand-cream">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-brand-sage">Effective Date: March 14, 2026 · Last Updated: March 14, 2026</p>

      <section className="mt-10 space-y-8 text-brand-bark/90 dark:text-brand-cream/80">

        {/* Intro */}
        <div className="space-y-3">
          <p>
            HuntLogic ("we," "us," "our") operates huntlogic.ai and related applications. This Privacy Policy explains
            how we collect, use, store, share, and protect your personal information when you use our Platform.
          </p>
          <p>
            We take your privacy seriously — particularly because hunting-related data (location, harvest history,
            application strategy) is sensitive and personal. We collect only what we need to operate the service and
            be useful to you.
          </p>
        </div>

        {/* 1 */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-brand-forest dark:text-brand-gold">1. Information We Collect</h2>

          <h3 className="text-lg font-semibold text-brand-forest dark:text-brand-cream">1.1 Information You Provide Directly</h3>
          <p className="font-medium">Account Information</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>Name and email address</li>
            <li>Authentication provider (Google, Apple, or email)</li>
            <li>Profile photo (if provided via OAuth)</li>
          </ul>
          <p className="font-medium">Hunter Profile</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>Species preferences and target animals</li>
            <li>State and region interests</li>
            <li>Experience level and hunting orientation (DIY, guided, meat hunting, trophy)</li>
            <li>Budget range and timeline preferences</li>
            <li>Season and weapon preferences</li>
          </ul>
          <p className="font-medium">Point and Application Data</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>State agencies, species, point types, and current balances</li>
            <li>Application history (states, species, years, outcomes)</li>
            <li>Harvest history (what you killed, where, when)</li>
          </ul>
          <p className="font-medium">Planning and Social Data</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>Playbook goals, saved and dismissed recommendations</li>
            <li>Hunt group membership, shared plans</li>
            <li>Outfitter reviews and ratings</li>
            <li>Messages sent to Teddy (AI concierge)</li>
            <li>Support requests and feedback</li>
          </ul>
          <p className="font-medium">State Agency Credentials (Optional — Vault Feature)</p>
          <p>
            Encrypted login credentials for state wildlife agency portals, stored only with your explicit consent.
            See Section 7 for full details.
          </p>

          <h3 className="text-lg font-semibold text-brand-forest dark:text-brand-cream">1.2 Information We Collect Automatically</h3>
          <ul className="list-disc space-y-1 pl-6">
            <li>Pages visited, features used, button clicks, filters applied</li>
            <li>IP address, browser type, operating system, device identifiers</li>
            <li>Referral URL, session duration, performance metrics</li>
            <li>Error logs and API response times</li>
          </ul>

          <h3 className="text-lg font-semibold text-brand-forest dark:text-brand-cream">1.3 Information from Third Parties</h3>
          <p>
            When you sign in with Google or Apple, we receive your name, email, and profile picture as authorized by
            you during OAuth consent. State agency draw odds, season dates, and regulations are public data we ingest
            to populate our database — not your personal data.
          </p>
        </div>

        {/* 2 */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-brand-forest dark:text-brand-gold">2. How We Use Your Information</h2>

          <h3 className="text-lg font-semibold text-brand-forest dark:text-brand-cream">2.1 Core Service Delivery</h3>
          <ul className="list-disc space-y-1 pl-6">
            <li>Generate personalized hunt playbooks and recommendations</li>
            <li>Score hunt opportunities using your preferences, points, and budget</li>
            <li>Track your deadlines, applications, and point balances</li>
            <li>Power Teddy (AI concierge) with your hunter profile context</li>
            <li>Retrieve your application status from state portals (if you use credential vaulting)</li>
          </ul>

          <h3 className="text-lg font-semibold text-brand-forest dark:text-brand-cream">2.2 AI and Machine Learning</h3>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <span className="font-medium">Recommendation Engine:</span> Your preferences, point holdings, and behavioral
              signals (saves, dismissals, likes, dislikes) train our recommendation scoring models
            </li>
            <li>
              <span className="font-medium">Behavioral Learning:</span> Saved recommendations carry stronger preference
              weight than dismissed ones, refining future recommendations without overriding your stated preferences
            </li>
            <li>
              <span className="font-medium">RAG Search:</span> Your queries to Teddy are embedded via Gemini and matched
              against our document store to provide responses grounded in real agency data
            </li>
            <li>
              <span className="font-medium">Forecasting:</span> Monte Carlo simulations and ML models process your point
              data and historical draw odds to generate personalized draw probability forecasts
            </li>
            <li>
              <span className="font-medium">Post-Season Feedback:</span> Harvest outcomes improve recommendation quality
              for you and, in aggregated anonymous form, for all users
            </li>
          </ul>
          <p>
            We do not use your personal data to train third-party AI foundation models (Claude, Gemini) beyond what is
            necessary to generate your immediate response.
          </p>

          <h3 className="text-lg font-semibold text-brand-forest dark:text-brand-cream">2.3 Platform Operations</h3>
          <ul className="list-disc space-y-1 pl-6">
            <li>Authenticate your identity and maintain account security</li>
            <li>Send transactional emails (deadline alerts, reminders, verification codes) via Resend</li>
            <li>Deliver in-app and push notifications based on your preferences</li>
            <li>Prevent fraud, abuse, and unauthorized access</li>
            <li>Debug errors and improve platform performance</li>
          </ul>

          <h3 className="text-lg font-semibold text-brand-forest dark:text-brand-cream">2.4 Aggregated Analytics</h3>
          <p>
            We use de-identified, aggregated data to understand platform usage patterns, improve algorithm performance,
            and generate industry-level hunting trend insights. This data cannot be used to identify you individually.
          </p>
        </div>

        {/* 3 */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-brand-forest dark:text-brand-gold">3. Information Sharing and Disclosure</h2>
          <p className="font-medium">We do not sell your personal information.</p>
          <p>We share information only in the following limited circumstances:</p>

          <h3 className="text-lg font-semibold text-brand-forest dark:text-brand-cream">3.1 Service Providers</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-brand-sage/20">
                  <th className="py-2 pr-4 text-left font-semibold">Provider</th>
                  <th className="py-2 pr-4 text-left font-semibold">Purpose</th>
                  <th className="py-2 text-left font-semibold">Data Shared</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-sage/10">
                <tr><td className="py-2 pr-4">Railway</td><td className="py-2 pr-4">Database & queue infrastructure</td><td className="py-2">All platform data</td></tr>
                <tr><td className="py-2 pr-4">Vercel</td><td className="py-2 pr-4">Application hosting & CDN</td><td className="py-2">Request logs, session data</td></tr>
                <tr><td className="py-2 pr-4">Google (Gemini)</td><td className="py-2 pr-4">Text embedding for RAG search</td><td className="py-2">Query text from chat/search</td></tr>
                <tr><td className="py-2 pr-4">Anthropic (Claude)</td><td className="py-2 pr-4">AI concierge responses</td><td className="py-2">Chat messages, hunter profile context</td></tr>
                <tr><td className="py-2 pr-4">Resend</td><td className="py-2 pr-4">Transactional email</td><td className="py-2">Email address, notification content</td></tr>
                <tr><td className="py-2 pr-4">Google / Apple</td><td className="py-2 pr-4">Authentication</td><td className="py-2">Name, email (OAuth flow only)</td></tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-lg font-semibold text-brand-forest dark:text-brand-cream">3.2 Group Features</h3>
          <p>
            When you participate in hunt groups, other group members can see information you choose to share. You
            control sharing settings.
          </p>

          <h3 className="text-lg font-semibold text-brand-forest dark:text-brand-cream">3.3 Legal Requirements</h3>
          <p>
            We may disclose your information if required by law, court order, or valid government request. We will
            notify you of such requests when legally permitted to do so.
          </p>

          <h3 className="text-lg font-semibold text-brand-forest dark:text-brand-cream">3.4 Business Transfers</h3>
          <p>
            If HuntLogic is acquired or its assets sold, your data may be transferred to the acquiring entity. We
            will notify you before your data is transferred and subject to a different privacy policy.
          </p>
        </div>

        {/* 4 */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-brand-forest dark:text-brand-gold">4. Data Retention</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-brand-sage/20">
                  <th className="py-2 pr-4 text-left font-semibold">Data Type</th>
                  <th className="py-2 text-left font-semibold">Retention Period</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-sage/10">
                <tr><td className="py-2 pr-4">Account information</td><td className="py-2">Until account deletion + 30 days</td></tr>
                <tr><td className="py-2 pr-4">Hunter profile and preferences</td><td className="py-2">Until account deletion</td></tr>
                <tr><td className="py-2 pr-4">Point holdings and application history</td><td className="py-2">Until account deletion</td></tr>
                <tr><td className="py-2 pr-4">Behavioral signals (saves/dismissals)</td><td className="py-2">Until account deletion or preference reset</td></tr>
                <tr><td className="py-2 pr-4">Chat conversation history</td><td className="py-2">90 days rolling window</td></tr>
                <tr><td className="py-2 pr-4">Credential vault entries</td><td className="py-2">Until explicitly deleted by you</td></tr>
                <tr><td className="py-2 pr-4">Usage logs and analytics</td><td className="py-2">12 months</td></tr>
                <tr><td className="py-2 pr-4">Error and performance logs</td><td className="py-2">90 days</td></tr>
                <tr><td className="py-2 pr-4">Aggregated/anonymous data</td><td className="py-2">Indefinitely (cannot identify you)</td></tr>
              </tbody>
            </table>
          </div>
          <p>
            When you delete your account, we will delete or anonymize your personal data within 30 days, except where
            retention is required by law or for legitimate fraud prevention purposes.
          </p>
        </div>

        {/* 5 */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-brand-forest dark:text-brand-gold">5. AI Concierge — Teddy</h2>
          <h3 className="text-lg font-semibold text-brand-forest dark:text-brand-cream">5.1 What Teddy Knows About You</h3>
          <p>
            Before responding to your messages, Teddy loads your hunter preferences, current point holdings, and your
            top active recommendations. This context is injected at query time and is not stored with Anthropic.
          </p>
          <h3 className="text-lg font-semibold text-brand-forest dark:text-brand-cream">5.2 Conversation Handling</h3>
          <p>
            Conversations are sent to Anthropic's Claude API via our OpenClaw gateway. We retain the last 20 messages
            for multi-turn context. Older messages expire after 90 days. Do not share sensitive financial, medical, or
            government identification information in chat.
          </p>
          <h3 className="text-lg font-semibold text-brand-forest dark:text-brand-cream">5.3 Telegram Integration</h3>
          <p>
            If you interact with Teddy via Telegram (@TeddyLogicBot), your Telegram user ID is associated with your
            HuntLogic account. Telegram interactions are also subject to Telegram's Privacy Policy. Teddy operates
            in DM-only mode on Telegram — group messages are not processed.
          </p>
        </div>

        {/* 6 */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-brand-forest dark:text-brand-gold">6. Credential Vaulting</h2>
          <p>
            State wildlife agency credentials you voluntarily submit are encrypted with AES-256-GCM before storage.
            Credentials are decrypted in memory only when needed to access your application status. No HuntLogic
            employee accesses your plaintext credentials in normal operations.
          </p>
          <p>
            You may view, update, or permanently delete vaulted credentials at any time in your account settings.
            Deletion is immediate and irreversible.
          </p>
        </div>

        {/* 7 */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-brand-forest dark:text-brand-gold">7. Cookies and Tracking</h2>
          <p>We use session cookies (for authentication), preference cookies (UI settings), and aggregated analytics.</p>
          <p className="font-medium">
            We do not use third-party advertising cookies, cross-site tracking pixels, or participate in ad networks
            or behavioral advertising.
          </p>
        </div>

        {/* 8 */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-brand-forest dark:text-brand-gold">8. Data Security</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>TLS 1.2+ encryption for all data transmission</li>
            <li>Database encryption at rest on Railway infrastructure</li>
            <li>AES-256-GCM encryption for credential vault</li>
            <li>JWT tokens with 30-day expiry, secure HttpOnly cookies</li>
            <li>Role-based access controls, least-privilege principles</li>
          </ul>
          <p>
            No security system is impenetrable. In the event of a data breach affecting your personal information,
            we will notify you as required by applicable law.
          </p>
        </div>

        {/* 9 */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-brand-forest dark:text-brand-gold">9. Your Privacy Rights</h2>

          <h3 className="text-lg font-semibold text-brand-forest dark:text-brand-cream">9.1 All Users</h3>
          <ul className="list-disc space-y-1 pl-6">
            <li><span className="font-medium">Access:</span> Request a copy of the personal data we hold about you</li>
            <li><span className="font-medium">Correction:</span> Update inaccurate information through account settings</li>
            <li><span className="font-medium">Deletion:</span> Request deletion of your account and associated personal data</li>
            <li><span className="font-medium">Data Portability:</span> Request an export of your profile, point holdings, and application history</li>
            <li><span className="font-medium">Withdraw Consent:</span> Withdraw consent for optional features (credential vaulting, behavioral learning) at any time</li>
          </ul>

          <h3 className="text-lg font-semibold text-brand-forest dark:text-brand-cream">9.2 California Residents (CCPA/CPRA)</h3>
          <p>
            California residents have the right to know what personal information is collected and why, to delete
            personal information (subject to legal exceptions), to correct inaccurate information, to opt out of sale
            (we do not sell personal information), and to non-discrimination for exercising privacy rights.
          </p>

          <h3 className="text-lg font-semibold text-brand-forest dark:text-brand-cream">9.3 European/UK Users (GDPR/UK GDPR)</h3>
          <p>
            If you access the Platform from the European Economic Area or United Kingdom, you have rights under GDPR/UK GDPR
            including access, rectification, erasure, restriction of processing, data portability, and the right to object
            to processing. You may also lodge a complaint with your supervisory authority.
          </p>
          <p>
            Our legal basis for processing is: <span className="font-medium">contract performance</span> (core service),{" "}
            <span className="font-medium">legitimate interests</span> (security, fraud prevention, aggregated analytics),
            and <span className="font-medium">consent</span> (credential vaulting, marketing).
          </p>

          <h3 className="text-lg font-semibold text-brand-forest dark:text-brand-cream">9.4 How to Exercise Your Rights</h3>
          <p>
            Submit privacy requests to{" "}
            <a href="mailto:privacy@huntlogic.ai" className="text-brand-sky underline underline-offset-2 hover:text-brand-sky/80">
              privacy@huntlogic.ai
            </a>. We will respond within 30 days (45 days for complex requests, with notice).
          </p>
        </div>

        {/* 10 */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-brand-forest dark:text-brand-gold">10. Children's Privacy</h2>
          <p>
            HuntLogic is not directed to children under 13. We do not knowingly collect personal information from
            children under 13. Users between 13 and 17 may only use the Platform with verifiable parental or guardian
            consent. If you believe your child has provided us data without consent, contact{" "}
            <a href="mailto:privacy@huntlogic.ai" className="text-brand-sky underline underline-offset-2 hover:text-brand-sky/80">
              privacy@huntlogic.ai
            </a>.
          </p>
        </div>

        {/* 11 */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-brand-forest dark:text-brand-gold">11. Third-Party Links</h2>
          <p>
            The Platform may contain links to state wildlife agency websites and other third-party resources. These
            sites are governed by their own privacy policies. Any data you submit directly to state agencies is
            governed by their policies, not ours.
          </p>
        </div>

        {/* 12 */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-brand-forest dark:text-brand-gold">12. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy periodically. We will notify you of material changes via email to your
            registered address or through in-app notification. Continued use of the Platform after changes take effect
            constitutes your acceptance of the updated Policy.
          </p>
        </div>

        {/* Contact */}
        <div className="space-y-3 border-t border-brand-sage/20 pt-8">
          <h2 className="text-2xl font-semibold text-brand-forest dark:text-brand-gold">Contact Us</h2>
          <p>
            Privacy requests:{" "}
            <a href="mailto:privacy@huntlogic.ai" className="text-brand-sky underline underline-offset-2 hover:text-brand-sky/80">
              privacy@huntlogic.ai
            </a>
          </p>
          <p>
            Legal matters:{" "}
            <a href="mailto:legal@huntlogic.ai" className="text-brand-sky underline underline-offset-2 hover:text-brand-sky/80">
              legal@huntlogic.ai
            </a>
          </p>
          <p>
            General support:{" "}
            <a href="mailto:support@huntlogic.ai" className="text-brand-sky underline underline-offset-2 hover:text-brand-sky/80">
              support@huntlogic.ai
            </a>
          </p>
        </div>

      </section>
    </main>
  );
}
