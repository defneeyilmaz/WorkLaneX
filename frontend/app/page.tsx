import Link from "next/link";

import { ApiHealthStatus } from "@/components/api-health-status";
import { LandingActions } from "@/components/landing-actions";
import { LandingFeatures } from "@/components/landing-features";

export default function Home() {
  return (
    <div className="landing-shell">
      <header className="landing-header">
        <Link href="/" className="landing-logo">
          WorkLaneX
        </Link>
        <LandingActions />
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <p className="landing-eyebrow">Team productivity workspace</p>
          <h1 className="landing-title">
            Plan, ship, and document work in one calm workspace
          </h1>
          <p className="landing-lead">
            WorkLaneX combines kanban boards, project docs, dashboards, and AI
            planning helpers for student teams, startups, and small software
            groups — without enterprise Jira complexity.
          </p>
        </section>

        <LandingFeatures />

        <section className="landing-demo-card" aria-label="Demo account">
          <p className="landing-demo-label">Local demo account</p>
          <p className="landing-demo-copy">
            Start the API in Development to auto-seed sample data, then sign in
            with:
          </p>
          <dl className="landing-demo-credentials">
            <div>
              <dt>Email</dt>
              <dd>defne.demo@worklanex.com</dd>
            </div>
            <div>
              <dt>Password</dt>
              <dd>admin123</dd>
            </div>
          </dl>
        </section>

        <div className="landing-health">
          <ApiHealthStatus />
        </div>
      </main>
    </div>
  );
}
