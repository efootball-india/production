// PASS-41-FIXTURES-TAB
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const ROUND_LABELS: Record<number, string> = {
  1: 'Round of 32',
  2: 'Round of 16',
  3: 'Quarter-finals',
  4: 'Semi-finals',
  5: 'Final',
};

export default async function FixturesTab({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { registered?: string; withdrawn?: string; error?: string };
}) {
  const supabase = createClient();

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, name, slug')
    .eq('slug', params.slug)
    .maybeSingle();
  if (!tournament) notFound();

  const { data: matches } = await supabase
    .from('matches')
    .select(`
      id, matchday, round, status, group_id,
      home_score, away_score, home_pens, away_pens, decided_by,
      home:tournament_participants!matches_home_participant_id_fkey(id, country:countries(name, group_label)),
      away:tournament_participants!matches_away_participant_id_fkey(id, country:countries(name, group_label))
    `)
    .eq('tournament_id', tournament.id)
    .order('round', { ascending: true, nullsFirst: true })
    .order('matchday', { ascending: true, nullsFirst: false })
    .order('match_number_in_round', { ascending: true, nullsFirst: false });

  const groupMatches: Record<number, any[]> = {};
  const koMatches: Record<number, any[]> = {};

  for (const m of (matches ?? [])) {
    const md = (m as any).matchday;
    const round = (m as any).round;
    if (md != null) {
      if (!groupMatches[md]) groupMatches[md] = [];
      groupMatches[md].push(m);
    } else if (round != null) {
      if (!koMatches[round]) koMatches[round] = [];
      koMatches[round].push(m);
    }
  }

  return (
    <div>
      {searchParams.registered && (
        <Banner color="accent">You are registered. See you at the draw.</Banner>
      )}
      {searchParams.withdrawn && (
        <Banner color="muted">Withdrawn from this tournament.</Banner>
      )}
      {searchParams.error && (
        <Banner color="error">{searchParams.error}</Banner>
      )}

      {(!matches || matches.length === 0) ? (
        <EmptyState>Fixtures haven't been generated yet.</EmptyState>
      ) : (
        <>
          {Object.keys(groupMatches).sort((a, b) => Number(a) - Number(b)).map((md) => (
            <Section
              key={`md-${md}`}
              title={`MATCHDAY ${md} · GROUP STAGE`}
              matches={groupMatches[Number(md)]}
            />
          ))}
          {Object.keys(koMatches).sort((a, b) => Number(a) - Number(b)).map((r) => (
            <Section
              key={`r-${r}`}
              title={ROUND_LABELS[Number(r)]?.toUpperCase() ?? `ROUND ${r}`}
              matches={koMatches[Number(r)]}
            />
          ))}
        </>
      )}
    </div>
  );
}

function Section({ title, matches }: { title: string; matches: any[] }) {
  return (
    <section style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.18em', fontWeight: 700, marginBottom: 10 }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {matches.map((m: any) => (
          <MatchRow key={m.id} match={m} />
        ))}
      </div>
    </section>
  );
}

function MatchRow({ match }: { match: any }) {
  const home = match.home;
  const away = match.away;
  const homeName = home?.country?.name ?? 'TBD';
  const awayName = away?.country?.name ?? 'TBD';
  const groupLabel = home?.country?.group_label ?? away?.country?.group_label;
  const completed = match.status === 'completed';

  const statusLabel =
    match.status === 'completed' ? null :
    match.status === 'awaiting_result' ? 'PENDING' :
    match.status === 'awaiting_confirmation' ? 'AWAITING CONFIRM' :
    match.status === 'disputed' ? 'DISPUTED' :
    'TBD';

  const statusColor =
    match.status === 'awaiting_confirmation' ? '#ff9500' :
    match.status === 'disputed' ? '#ff5050' :
    'var(--text-3)';

  return (
    <div style={{
      background: 'var(--glass)',
      border: '1px solid var(--glass-border)',
      borderRadius: 4,
      padding: '8px 12px',
    }}>
      {groupLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.14em', fontWeight: 600 }}>GROUP {groupLabel}</span>
          {statusLabel && (
            <span style={{ fontSize: 8, color: statusColor, letterSpacing: '0.14em', fontWeight: 700 }}>{statusLabel}</span>
          )}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--text)' }}>{homeName}</span>
        <span style={{ fontSize: 13, color: completed ? 'var(--text)' : 'var(--text-3)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
          {completed
            ? `${match.home_score} — ${match.away_score}${match.decided_by === 'penalties' ? ` (${match.home_pens}-${match.away_pens})` : ''}`
            : 'vs'}
        </span>
        <span style={{ fontSize: 13, color: 'var(--text)', textAlign: 'right' }}>{awayName}</span>
      </div>
    </div>
  );
}

function Banner({ children, color }: { children: React.ReactNode; color: 'accent' | 'error' | 'muted' }) {
  const styles = {
    accent: { bg: 'rgba(0,255,136,0.08)', fg: 'var(--accent)', border: 'rgba(0,255,136,0.3)' },
    error: { bg: 'rgba(255,80,80,0.08)', fg: '#ff5050', border: 'rgba(255,80,80,0.3)' },
    muted: { bg: 'rgba(255,255,255,0.05)', fg: 'var(--text-2)', border: 'var(--border)' },
  };
  const s = styles[color];
  return (
    <div style={{ padding: '10px 14px', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 4, color: s.fg, fontSize: 13, marginBottom: 16 }}>
      {children}
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '40px 20px',
      border: '1px dashed rgba(255,255,255,0.1)',
      borderRadius: 6,
      fontSize: 13,
      color: 'var(--text-3)',
    }}>
      {children}
    </div>
  );
}
