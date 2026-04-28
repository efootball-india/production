// PASS-3-PAGE-BRACKET
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentPlayer } from '@/lib/player';
import { getBracketView, bracketExists } from '@/lib/knockout';

const ROUND_LABELS: Record<number, string> = {
  1: 'Round of 32',
  2: 'Round of 16',
  3: 'Quarter-finals',
  4: 'Semi-finals',
  5: 'Final',
};

export default async function BracketPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, name, slug, champion_participant_id')
    .eq('slug', params.slug)
    .maybeSingle();
  if (!tournament) notFound();

  const player = await getCurrentPlayer();
  const isMod = player && ['moderator', 'admin', 'super_admin'].includes(player.role);

  const exists = await bracketExists(tournament.id);
  if (!exists) {
    return (
      <main style={{ minHeight: '100vh', maxWidth: 760, margin: '0 auto', padding: '24px 20px 60px' }}>
        <Link href={`/tournaments/${tournament.slug}`} style={{ color: 'var(--text-2)', fontSize: 13 }}>← {tournament.name}</Link>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginTop: 12, marginBottom: 8 }}>Knockout bracket</h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)' }}>The bracket hasn&apos;t been generated yet. Wait for group stage to complete.</p>
      </main>
    );
  }

  const bracket = await getBracketView(tournament.id);
  if (!bracket) {
    return (
      <main style={{ minHeight: '100vh', maxWidth: 760, margin: '0 auto', padding: '24px 20px 60px' }}>
        <Link href={`/tournaments/${tournament.slug}`} style={{ color: 'var(--text-2)', fontSize: 13 }}>← {tournament.name}</Link>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginTop: 12 }}>Bracket unavailable</h1>
      </main>
    );
  }

  // Find champion if Final is complete
  let champion: any = null;
  if (tournament.champion_participant_id) {
    const { data: champ } = await supabase
      .from('tournament_participants')
      .select(`
        id,
        player:players(username, display_name),
        country:countries(name)
      `)
      .eq('id', tournament.champion_participant_id)
      .maybeSingle();
    champion = champ;
  }

  return (
    <main style={{ minHeight: '100vh', maxWidth: 1400, margin: '0 auto', padding: '24px 20px 60px' }}>
      <Link href={`/tournaments/${tournament.slug}`} style={{ color: 'var(--text-2)', fontSize: 13 }}>← {tournament.name}</Link>
      <h1 style={{ fontSize: 26, fontWeight: 600, marginTop: 12, marginBottom: 16 }}>Knockout bracket</h1>

      {champion && (
        <div style={{
          padding: '20px 24px',
          background: 'rgba(0,255,136,0.08)',
          border: '1px solid rgba(0,255,136,0.3)',
          marginBottom: 32,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 11, color: 'var(--accent)', marginBottom: 6, letterSpacing: '0.1em' }}>CHAMPION</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>
            {(champion.country as any)?.name ?? '—'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>
            {(champion.player as any)?.display_name ?? (champion.player as any)?.username}
          </div>
        </div>
      )}

      {/* Horizontal scrollable bracket */}
      <div style={{ overflowX: 'auto', paddingBottom: 12 }}>
        <div style={{
          display: 'flex',
          gap: 16,
          minWidth: 'min-content',
          alignItems: 'stretch',
        }}>
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
    </main>
  );
}

function RoundColumn({ round, matches, isMod, slug }: { round: number; matches: any[]; isMod: boolean; slug: string }) {
  return (
    <div style={{
      flex: '0 0 auto',
      minWidth: 240,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <div style={{
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--text-2)',
        letterSpacing: '0.05em',
        marginBottom: 4,
        textAlign: 'center',
      }}>
        {ROUND_LABELS[round]}
      </div>
      {matches.length === 0 ? (
        <div style={{ padding: 16, fontSize: 12, color: 'var(--text-3)', textAlign: 'center' }}>—</div>
      ) : (
        matches.map((m, idx) => (
          <BracketMatch key={m.id} match={m} isMod={isMod} slug={slug} round={round} />
        ))
      )}
    </div>
  );
}

function BracketMatch({ match, isMod, slug, round }: any) {
  const home = match.home;
  const away = match.away;

  const homeName = home?.country?.name ?? 'TBD';
  const awayName = away?.country?.name ?? 'TBD';
  const homeUser = home?.player?.username;
  const awayUser = away?.player?.username;

  const completed = match.status === 'completed';
  const homeScore = match.home_score;
  const awayScore = match.away_score;
  const homePens = match.home_pens;
  const awayPens = match.away_pens;
  const decidedBy = match.decided_by;

  const winnerId = match.winner_participant_id;
  const homeWon = winnerId && home && winnerId === home.id;
  const awayWon = winnerId && away && winnerId === away.id;

  const sideStyle = (won: boolean) => ({
    padding: '8px 10px',
    fontSize: 12,
    background: won ? 'rgba(0,255,136,0.06)' : 'transparent',
    color: won ? 'var(--accent)' : 'var(--text)',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  });

  return (
    <div style={{
      background: 'var(--glass)',
      border: '1px solid var(--glass-border)',
    }}>
      <div style={{ ...sideStyle(homeWon), borderBottom: '1px solid var(--border)' }}>
        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{homeName}</div>
          <div style={{ fontSize: 10, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{homeUser ?? '—'}</div>
        </div>
        <div style={{ flexShrink: 0, fontWeight: 700, fontSize: 14 }}>
          {homeScore != null ? homeScore : ''}
          {decidedBy === 'penalties' && homePens != null && (
            <span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 4 }}>({homePens})</span>
          )}
        </div>
      </div>

      <div style={{ ...sideStyle(awayWon), borderBottom: 'none' }}>
        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{awayName}</div>
          <div style={{ fontSize: 10, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{awayUser ?? '—'}</div>
        </div>
        <div style={{ flexShrink: 0, fontWeight: 700, fontSize: 14 }}>
          {awayScore != null ? awayScore : ''}
          {decidedBy === 'penalties' && awayPens != null && (
            <span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 4 }}>({awayPens})</span>
          )}
        </div>
      </div>

      <div style={{ padding: '6px 10px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.05em' }}>
          {completed && decidedBy === 'penalties' && 'PENS'}
          {completed && decidedBy === 'extra_time' && 'AET'}
          {!completed && match.status === 'pending' && 'TBD'}
          {!completed && match.status === 'awaiting_result' && 'NEXT'}
        </span>
        {isMod && home && away && (
          <Link
            href={`/admin/tournaments/${slug}/ko-match/${match.id}`}
            style={{ fontSize: 10, color: 'var(--accent)' }}
          >
            {completed ? 'Edit' : 'Set'} →
          </Link>
        )}
      </div>
    </div>
  );
}
