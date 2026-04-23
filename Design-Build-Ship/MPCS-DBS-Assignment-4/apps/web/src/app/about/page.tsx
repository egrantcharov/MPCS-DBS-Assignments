import Link from 'next/link';

export const metadata = {
  title: 'About · Clutch Index',
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">About Clutch Index</h1>
      <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
        Clutch Index is a multi-sport live dashboard built for MPCS 51040
        &quot;Design, Build, Ship&quot; (Week 4 / Assignment 4). It tracks every MLB and NHL
        game in progress, computes win probability and leverage per play, and surfaces
        the biggest swing moments in real time.
      </p>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Where the data comes from</h2>
        <dl className="mt-4 space-y-5 text-sm text-slate-700 dark:text-slate-300">
          <div>
            <dt className="font-semibold">MLB — <a className="text-indigo-600 hover:underline" href="https://statsapi.mlb.com" target="_blank" rel="noreferrer">statsapi.mlb.com</a></dt>
            <dd className="mt-1 text-slate-600 dark:text-slate-400">
              Official MLB Stats API, free and unauthenticated. Endpoints used:
              <code className="ml-1">/api/v1/schedule</code>,
              <code className="ml-1">/api/v1/teams</code>, and
              <code className="ml-1">/api/v1.1/game/&#123;pk&#125;/feed/live</code>.
              MLB&apos;s <em>captivatingIndex</em> is surfaced unchanged as the per-play Clutch Index (CI).
            </dd>
          </div>
          <div>
            <dt className="font-semibold">NHL — <a className="text-indigo-600 hover:underline" href="https://api-web.nhle.com/v1/score/now" target="_blank" rel="noreferrer">api-web.nhle.com</a></dt>
            <dd className="mt-1 text-slate-600 dark:text-slate-400">
              NHL&apos;s public Web API, free and unauthenticated. The worker hits
              <code className="mx-1">/v1/score/now</code> every 15 seconds to pull score,
              period, clock, and intermission state for every game. Team logos come from
              <code className="ml-1">assets.nhle.com</code>.
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">How the model works</h2>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          The per-play MLB win probability is a transparent approximation — not FanGraphs WPA —
          that combines a logistic over score differential, an inning-weight term, and an
          additive nudge from the classic 24-state run-expectancy table. <em>Leverage</em> is
          derived from win-prob variance scaled by that same inning weight. A swing play is
          any at-bat that moved the home-team WP by 10 percentage points or more.
        </p>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          NHL games don&apos;t have per-shot analytics yet — the frontend shows score, period,
          and live clock, and the card updates in place as the worker polls.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Architecture</h2>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-900 p-4 text-[11px] leading-relaxed text-slate-100">{`MLB Stats API + NHL Web API
         │  (poll 15s / 5m)
         ▼
   Railway worker (Node + TS)
         │  service-role upsert
         ▼
 Supabase Postgres (+ Realtime)
         │  subscribe
         ▼
   Vercel frontend (Next.js 16)
         │
         └─ Clerk auth — per-user favorites`}</pre>
      </section>

      <footer className="mt-12 text-xs text-slate-500 dark:text-slate-500">
        <p>
          Source: <a className="text-indigo-600 hover:underline" href="https://github.com/egrantcharov/MPCS-DBS-Assignments" target="_blank" rel="noreferrer">github.com/egrantcharov/MPCS-DBS-Assignments</a> · {' '}
          <Link href="/status" className="text-indigo-600 hover:underline">System status</Link>
        </p>
      </footer>
    </div>
  );
}
