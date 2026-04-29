// PASS-46-BRACKET-TAB
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentPlayer } from '@/lib/player';
import { getBracketView, bracketExists, R32_PAIRINGS, seedToLabel } from '@/lib/knockout';

const ROUND_LABELS: Record<number, string> = {
  1: 'Round of 32',
  2: 'Round of 16',
  3: 'Quarter-finals',
  4: 'Semi-finals',
  5: 'Final',
};

function fifaLabel(seed: number): string {
  const raw = seedToLabel(seed);
  if (raw.startsWith('BT')) return raw;
  const letter = raw.charAt(0);
  const num = raw.slice(1);
  return `${num}${letter}`;
}

export default async function BracketTab({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, name, slug, champion_participant_id, status')
    .eq('slug', params.slug)
    .maybeSingle();
  if (!tournament) notFound();

  const player = await getCurrentPlayer();
  const isMod = player && ['moderator', 'admin', 'super_admin'].includes(player.role);

  const exists = await bracketExists(tournament.id);

  if (!exists) {
    const status = tournament.status as string;
    const isPreGroups =
      status === 'draft' ||
      status === 'registration_open' ||
      status === 'registration_closed';

    if (isPreGroups) {
      return (
        <div style={{
          textAlign: 'center',
          padding: '32px 20px',
          border: '1px dashed rgba(255,149,0,0.3)',
          borderRadius: 6,
          background: 'rgba(255,149,0,0.04)',
        }}>
          <div style={{ fontSize: 13, color: '#ff9500', fontWeight: 600, marginBottom: 6 }}>Bracket projects after group stage starts</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', maxWidth: 360, margin: '0 auto', lineHeight: 1.55 }}>
            Once the draw is complete and matchday 1 begins, projected R32 pairings appear here.
          </div>
        </div>
      );
    }

    return (
      <div>
        <div style={{
          padding: '12px 14px',
          background: 'rgba(255,149,0,0.06)',
          border: '1px solid rgba(255,149,0,0.2)',
          borderRadius: 4,
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff9500', flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: '#ff9500', fontWeight: 600 }}>
            Bracket reveals when groups finish · projected pairings below
          </span>
        </div>

        <ProjectedRound title="ROUND OF 32 · PROJECTED" pairings={R32_PAIRINGS} />

        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.18em', fontWeight: 700, marginBottom: 8 }}>
            ROUND OF 16 · PROJECTED
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px dashed rgba(255,255,255,0.08)',
            borderRadius: 4,
            padding: '10px 12px',
            fontSize: 11,
            color: 'var(--text-3)',
            textAlign: 'center',
          }}>
            Winners of R32 · pairings reveal as R32 results come in
          </div>
        </div>
      </div>
    );
  }

  const bracket = await getBracketView(tournament.id);
  if (!bracket) {
    return <div style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: 40 }}>Bracket unavailable</div>;
  }

  let champion: any = null;
  if (tournament.champion_participant_id) {
    const { data: champ } = await supabase
      .from('tournament_participants')
      .select(`id, player:players(username, display_name), country:countries(name)`)
      .eq('id', tournament.champion_participant_id)
      .maybeSingle();
    champion = champ;
  }

  return (
    <div>
      {champion && (
        <div style={{
          padding: '20px 24px',
          background: 'rgba(0,255,136,0.08)',
          border: '1px solid rgba(0,255,136,0.3)',
          marginBottom: 24,
          textAlign: 'center',
          borderRadius: 6,
        }}>
          <div style={{ fontSize: 11, color: 'var(--accent)', marginBottom: 6, letterSpacing: '0.18em', fontWeight: 700 }}>CHAMPION</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>
            {(champion.country as any)?.name ?? '—'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>
            {(champion.player as any)?.display_name ?? (champion.player as any)?.username}
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto', paddingBottom: 12 }}>
        <div style={{ display: 'flex', gap: 16, minWidth: 'min-content', alignItems: 'stretch' }}>
          {[1, 2, 3, 4, 5].map(round => (
            <RoundColumn
              key={round}
              round={round}
              matches={bracket[round] ?? []}
              isMod={!!isMod}
              slug={tournament.slug}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProjectedRound({ title, pairings }: { title: string; pairings: Array<[number, number]> }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.18em', fontWeight: 700, marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {pairings.map((pair, i) => {
          const [seedA, seedB] = pair;
          return (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                gap: 10,
                alignItems: 'center',
                background: 'rgba(255,255,255,0.02)',
                border: '1px dashed rgba(255,255,255,0.12)',
                borderRadius: 4,
                padding: '8px 12px',
              }}
            >
              <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {fifaLabel(seedA)}
              </span>
              <span style={{ fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.14em', fontWeight: 600 }}>VS</span>
              <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
                {fifaLabel(seedB)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RoundColumn({ round, matches, isMod, slug }: { round: number; matches: any[]; isMod: boolean; slug: string }) {
  return (
    <div style={{ flex: '0 0 auto', minWidth: 220, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.14em', marginBottom: 4, textAlign: 'center' }}>
        {ROUND_LABELS[round]?.toUpperCase()}
      </div>
      {matches.length === 0 ? (
        <div style={{ padding: 16, fontSize: 12, color: 'var(--text-3)', textAlign: 'center' }}>—</div>
      ) : (
        matches.map((m) => (
          <BracketMatch key={m.id} match={m} isMod={isMod} slug={slug} />
        ))
      )}
    </div>
  );
}

function BracketMatch({ match, isMod, slug }: any) {
  const home = match.home;
  const away = match.away;
  const homeName = home?.country?.name ?? 'TBD';
  const awayName = away?.country?.name ?? 'TBD';
  const completed = match.status === 'completed';
  const winnerId = match.winner_participant_id;
  const homeWon = winnerId && home && winnerId === home.id;
  const awayWon = winnerId && away && winnerId === away.id;

  const sideStyle = (won: boolean): React.CSSProperties => ({
    padding: '8px 10px',
    fontSize: 12,
    background: won ? 'rgba(0,255,136,0.06)' : 'transparent',
    color: won ? 'var(--accent)' : 'var(--text)',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  });

  return (
    <div style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 4 }}>
      <div style={sideStyle(homeWon)}>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{homeName}</span>
        <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
          {match.home_score != null ? match.home_score : ''}
          {match.decided_by === 'penalties' && match.home_pens != null && (
            <span style={{ fontSize: 9, color: 'var(--text-3)', marginLeft: 3 }}>({match.home_pens})</span>
          )}
        </span>
      </div>
      <div style={{ ...sideStyle(awayWon), borderBottom: 'none' }}>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{awayName}</span>
        <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
          {match.away_score != null ? match.away_score : ''}
          {match.decided_by === 'penalties' && match.away_pens != null && (
            <span style={{ fontSize: 9, color: 'var(--text-3)', marginLeft: 3 }}>({match.away_pens})</span>
          )}
        </span>
      </div>
      <div style={{ padding: '5px 10px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 9 }}>
        <span style={{ color: 'var(--text-3)', letterSpacing: '0.1em' }}>
          {completed && match.decided_by === 'penalties' && 'PENS'}
          {completed && match.decided_by === 'extra_time' && 'AET'}
          {!completed && match.status === 'pending' && 'TBD'}
          {!completed && match.status === 'awaiting_result' && 'NEXT'}
        </span>
        {isMod && home && away && (
          <Link href={`/admin/tournaments/${slug}/ko-match/${match.id}`} style={{ color: 'var(--accent)' }}>
            {completed ? 'Edit' : 'Set'} →
          </Link>
        )}
      </div>
    </div>
  );
}
