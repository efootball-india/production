import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { createClient } from '@/lib/supabase/server';

export default async function TournamentRulesPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, name, slug, rules')
    .eq('slug', params.slug)
    .maybeSingle();

  if (!tournament) notFound();

  if (!tournament.rules || tournament.rules.trim().length === 0) {
    return (
      <>
        <Styles />
        <div className="rules-empty">
          <div className="rules-empty-title">No rules published.</div>
          <p className="rules-empty-body">
            The organizers haven't published rules for this tournament yet.
          </p>
          <Link href={`/tournaments/${tournament.slug}`} className="rules-empty-link">
            ← Back to tournament
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Styles />
      <div className="rules-page">
        <div className="rules-eyebrow">RULES · {tournament.name.toUpperCase()}</div>
        <article className="rules-prose">
          <ReactMarkdown>{tournament.rules}</ReactMarkdown>
        </article>
      </div>
    </>
  );
}

function Styles() {
  return (
    <style>{`
      .rules-page {
        padding: 8px 0 40px;
      }

      .rules-eyebrow {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: hsl(var(--ink) / 0.42);
        margin-bottom: 24px;
        padding-bottom: 10px;
        border-bottom: 1px solid hsl(var(--ink));
      }

      .rules-prose {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-size: 15px;
        line-height: 1.6;
        color: hsl(var(--ink));
      }

      .rules-prose h1 {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900;
        font-size: 28px;
        line-height: 1;
        letter-spacing: -0.025em;
        color: hsl(var(--ink));
        margin: 32px 0 14px;
        padding-bottom: 8px;
        border-bottom: 1px solid hsl(var(--ink));
      }
      .rules-prose h1:first-child { margin-top: 0; }

      .rules-prose h2 {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900;
        font-size: 20px;
        line-height: 1.05;
        letter-spacing: -0.02em;
        color: hsl(var(--ink));
        margin: 28px 0 12px;
      }
      .rules-prose h2:first-child { margin-top: 0; }

      .rules-prose h3 {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 800;
        font-size: 16px;
        line-height: 1.1;
        letter-spacing: -0.015em;
        color: hsl(var(--ink));
        margin: 22px 0 8px;
      }
      .rules-prose h3:first-child { margin-top: 0; }

      .rules-prose h4, .rules-prose h5, .rules-prose h6 {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: hsl(var(--ink) / 0.62);
        margin: 18px 0 6px;
      }

      .rules-prose p {
        margin: 0 0 14px;
      }
      .rules-prose p:last-child {
        margin-bottom: 0;
      }

      .rules-prose ul,
      .rules-prose ol {
        padding-left: 22px;
        margin: 0 0 14px;
      }
      .rules-prose ul {
        list-style: none;
      }
      .rules-prose ul > li {
        position: relative;
        margin-bottom: 6px;
        padding-left: 4px;
      }
      .rules-prose ul > li::before {
        content: '—';
        position: absolute;
        left: -22px;
        color: hsl(var(--accent));
        font-weight: 700;
      }
      .rules-prose ol > li {
        margin-bottom: 6px;
        padding-left: 4px;
      }
      .rules-prose ol > li::marker {
        color: hsl(var(--accent));
        font-weight: 700;
        font-family: var(--font-mono), ui-monospace, monospace;
      }
      .rules-prose li > ul,
      .rules-prose li > ol {
        margin: 6px 0 0;
      }

      .rules-prose strong {
        font-weight: 800;
        color: hsl(var(--ink));
      }
      .rules-prose em {
        font-style: italic;
        color: hsl(var(--ink) / 0.85);
      }

      .rules-prose a {
        color: hsl(var(--accent));
        text-decoration: underline;
        text-underline-offset: 2px;
        text-decoration-thickness: 1px;
      }
      .rules-prose a:hover {
        color: hsl(var(--ink));
        text-decoration-thickness: 2px;
      }

      .rules-prose blockquote {
        border-left: 3px solid hsl(var(--accent));
        padding: 4px 0 4px 16px;
        margin: 16px 0;
        color: hsl(var(--ink) / 0.72);
        font-style: italic;
      }
      .rules-prose blockquote p:last-child { margin-bottom: 0; }

      .rules-prose code {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 13px;
        background: hsl(var(--ink) / 0.06);
        padding: 2px 6px;
        border-radius: 2px;
        color: hsl(var(--ink));
      }
      .rules-prose pre {
        background: hsl(var(--ink) / 0.04);
        border: 1px solid hsl(var(--ink) / 0.10);
        padding: 12px 14px;
        margin: 14px 0;
        overflow-x: auto;
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 13px;
        line-height: 1.5;
      }
      .rules-prose pre code {
        background: transparent;
        padding: 0;
        border-radius: 0;
      }

      .rules-prose hr {
        border: 0;
        border-top: 1px solid hsl(var(--ink) / 0.20);
        margin: 24px 0;
      }

      .rules-prose table {
        width: 100%;
        border-collapse: collapse;
        margin: 14px 0;
        font-size: 13px;
      }
      .rules-prose th {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: hsl(var(--ink));
        background: hsl(var(--ink) / 0.04);
        padding: 8px 10px;
        text-align: left;
        border-bottom: 1px solid hsl(var(--ink));
      }
      .rules-prose td {
        padding: 8px 10px;
        border-bottom: 1px solid hsl(var(--ink) / 0.10);
      }

      .rules-empty {
        text-align: center;
        padding: 60px 20px;
        border: 1px dashed hsl(var(--ink) / 0.20);
        background: hsl(var(--surface));
      }
      .rules-empty-title {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900;
        font-size: 20px;
        line-height: 1.05;
        letter-spacing: -0.02em;
        margin-bottom: 8px;
      }
      .rules-empty-body {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-size: 13px;
        color: hsl(var(--ink) / 0.62);
        margin-bottom: 18px;
        line-height: 1.5;
      }
      .rules-empty-link {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: hsl(var(--ink) / 0.62);
        text-decoration: none;
      }
      .rules-empty-link:hover { color: hsl(var(--ink)); }
    `}</style>
  );
}
