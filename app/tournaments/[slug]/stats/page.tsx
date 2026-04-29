// PASS-44-STATS-TAB
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function StatsTab({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id')
    .eq('slug', params.slug)
    .maybeSingle();
  if (!tournament) notFound();

  const { data: completedMatches } = await supabase
    .from('matches')
    .select(`
      home_score, away_score, decided_by,
      home:tournament_participants!matches_home_participant_id_fkey(id, country:countries(name), player:players(username)),
      away:tournament_participants!matches_away_participant_id_fkey(id, country:countries(name), player:players(username)),
      winner_participant_id
    `)
    .eq('tournament_id', tournament.id)
    .eq('status', 'completed');

  const totalMatches = completedMatches?.length ?? 0;

  if (totalMatches === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px 20px',
        border: '1px dashed rgba(255,255,255,0.1)',
        borderRadius: 6,
      }}>
        <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600, marginBottom: 6 }}>No records yet</div>
        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Tournament records appear after the first match.</div>
      </div>
    );
  }

  let totalGoals = 0;
  let highestScoring: any = null;
  let biggestMargin: any = null;
  let biggestMarginValue = -1;

  const winsByParticipant = new Map<string, { count: number; name: string; player: string }>();

  for (const m of completedMatches ?? []) {
    const total = (m.home_score ?? 0) + (m.away_score ?? 0);
    const margin = Math.abs((m.home_score ?? 0) - (m.away_score ?? 0));
    totalGoals += total;

    if (!highestScoring || total > ((highestScoring.home_score ?? 0) + (highestScoring.away_score ?? 0))) {
      highestScoring = m;
    }
    if (margin > biggestMarginValue) {
      biggestMargin = m;
      biggestMarginValue = margin;
    }

    if (m.winner_participant_id) {
      const winnerSide = (m.home as any)?.id === m.winner_participant_id ? m.home : m.away;
      const w = winnerSide as any;
      if (w) {
        const key = w.id;
        const existing = winsByParticipant.get(key);
        winsByParticipant.set(key, {
          count: (existing?.count ?? 0) + 1,
          name: w.country?.name ?? '—',
          player: w.player?.username ?? '—',
        });
      }
    }
  }

  const topWinners = Array.from(winsByParticipant.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const avgGoals = (totalGoals / totalMatches).toFixed(2);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
        <StatCard label="MATCHES PLAYED" value={String(totalMatches)} />
        <StatCard label="TOTAL GOALS" value={String(totalGoals)} />
        <StatCard label="GOALS / MATCH" value={avgGoals} />
      </div>

      {highestScoring && (
        <RecordCard
          label="HIGHEST-SCORING MATCH"
          home={(highestScoring.home as any)?.country?.name ?? 'TBD'}
          away={(highestScoring.away as any)?.country?.name ?? 'TBD'}
          homeScore={highestScoring.home_score}
          awayScore={highestScoring.away_score}
        />
      )}

      {biggestMargin && (
        <RecordCard
          label="BIGGEST MARGIN"
          home={(biggestMargin.home as any)?.country?.name ?? 'TBD'}
          away={(biggestMargin.away as any)?.country?.name ?? 'TBD'}
          homeScore={biggestMargin.home_score}
          awayScore={biggestMargin.away_score}
          subtitle={`Margin: ${biggestMarginValue} goal${biggestMarginValue === 1 ? '' : 's'}`}
        />
      )}

      {topWinners.length > 0 && (
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.18em', fontWeight: 700, marginBottom: 8 }}>
            MOST WINS
          </div>
          <div style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 4, overflow: 'hidden' }}>
            {topWinners.map((w, i) => (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '24px 1fr auto',
                gap: 12,
                padding: '10px 14px',
                fontSize: 13,
                borderBottom: i === topWinners.length - 1 ? 'none' : '1px solid var(--border)',
              }}>
                <span style={{ color: 'var(--text-3)', fontWeight: 600 }}>{i + 1}</span>
                <div>
                  <div style={{ color: 'var(--text)' }}>{w.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{w.player}</div>
                </div>
                <span style={{ color: 'var(--accent)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                  {w.count} W
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      padding: '14px 16px',
      background: 'var(--glass)',
      border: '1px solid var(--glass-border)',
      borderRadius: 4,
    }}>
      <div style={{ fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.18em', fontWeight: 700, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, color: 'var(--text)', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

function RecordCard({ label, home, away, homeScore, awayScore, subtitle }: {
  label: string;
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  subtitle?: string;
}) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.18em', fontWeight: 700, marginBottom: 8 }}>{label}</div>
      <div style={{
        background: 'var(--glass)',
        border: '1px solid var(--glass-border)',
        borderRadius: 4,
        padding: '14px 16px',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>{home}</span>
          <span style={{ fontSize: 18, color: 'var(--text)', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
            {homeScore} — {awayScore}
          </span>
          <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600, textAlign: 'right' }}>{away}</span>
        </div>
        {subtitle && (
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6, textAlign: 'center' }}>{subtitle}</div>
        )}
      </div>
    </div>
  );
}
