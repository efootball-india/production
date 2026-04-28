// PASS-2-PAGE-MOD-QUEUE
import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentPlayer } from '@/lib/player';
import { overrideMatchScore } from '../../../../actions/fixtures';

export default async function ModQueuePage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { error?: string; overridden?: string };
}) {
  const player = await getCurrentPlayer();
  if (!player) redirect('/signin');
  if (!['moderator', 'admin', 'super_admin'].includes(player.role)) redirect('/');

  const supabase = createClient();
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, name, slug')
    .eq('slug', params.slug)
    .maybeSingle();
  if (!tournament) notFound();

  // Disputed matches
  const { data: disputed } = await supabase
    .from('matches')
    .select(`
      id, matchday, status,
      home:tournament_participants!matches_home_participant_id_fkey(
        id,
        player:players(username, display_name),
        country:countries(name, group_label)
      ),
      away:tournament_participants!matches_away_participant_id_fkey(
        id,
        player:players(username, display_name),
        country:countries(name, group_label)
      )
    `)
    .eq('tournament_id', tournament.id)
    .eq('status', 'disputed')
    .order('matchday')
    .order('match_number_in_round');

  // Awaiting confirmation: only one player has submitted
  const { data: awaiting } = await supabase
    .from('matches')
    .select(`
      id, matchday, status, reported_at,
      home:tournament_participants!matches_home_participant_id_fkey(
        id,
        player:players(username, display_name),
        country:countries(name, group_label)
      ),
      away:tournament_participants!matches_away_participant_id_fkey(
        id,
        player:players(username, display_name),
        country:countries(name, group_label)
      )
    `)
    .eq('tournament_id', tournament.id)
    .eq('status', 'awaiting_confirmation')
    .order('matchday')
    .order('match_number_in_round');

  // For disputed matches, fetch the actual submissions to show what was claimed
  const disputedMatchIds = (disputed ?? []).map(m => m.id);
  const { data: subs } = disputedMatchIds.length > 0
    ? await supabase
        .from('score_submissions')
        .select('match_id, submitted_by, home_score, away_score, notes, created_at')
        .in('match_id', disputedMatchIds)
    : { data: [] };

  const subsByMatch = new Map<string, any[]>();
  for (const s of (subs ?? [])) {
    const arr = subsByMatch.get(s.match_id) ?? [];
    arr.push(s);
    subsByMatch.set(s.match_id, arr);
  }

  return (
    <main style={{ minHeight: '100vh', maxWidth: 760, margin: '0 auto', padding: '24px 20px 60px' }}>
      <Link href={`/tournaments/${tournament.slug}`} style={{ color: 'var(--text-2)', fontSize: 13 }}>← {tournament.name}</Link>
      <h1 style={{ fontSize: 26, fontWeight: 600, marginTop: 12, marginBottom: 24 }}>Match queue</h1>

      {searchParams.overridden && (
        <div style={{ padding: '10px 14px', background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.3)', color: 'var(--accent)', fontSize: 13, marginBottom: 16 }}>
          Match score overridden.
        </div>
      )}
      {searchParams.error && (
        <div style={{ padding: '10px 14px', background: 'rgba(255,92,92,0.08)', border: '1px solid rgba(255,92,92,0.3)', color: '#ff5c5c', fontSize: 13, marginBottom: 16 }}>
          {searchParams.error}
        </div>
      )}

      {/* Disputed */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#ff5c5c', marginBottom: 10 }}>
          Disputed ({disputed?.length ?? 0})
        </h2>
        {(disputed?.length ?? 0) === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>No disputed matches.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(disputed ?? []).map((m: any) => (
              <DisputedMatchCard
                key={m.id}
                match={m}
                submissions={subsByMatch.get(m.id) ?? []}
                slug={tournament.slug}
              />
            ))}
          </div>
        )}
      </section>

      {/* Awaiting confirmation */}
      <section>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#ff9500', marginBottom: 10 }}>
          Awaiting opponent confirmation ({awaiting?.length ?? 0})
        </h2>
        {(awaiting?.length ?? 0) === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>No matches waiting.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(awaiting ?? []).map((m: any) => (
              <AwaitingMatchCard key={m.id} match={m} slug={tournament.slug} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function DisputedMatchCard({ match, submissions, slug }: any) {
  const homeName = match.home?.country?.name ?? '?';
  const awayName = match.away?.country?.name ?? '?';
  const homePlayer = match.home?.player?.username ?? '?';
  const awayPlayer = match.away?.player?.username ?? '?';

  const homeSub = submissions.find((s: any) => s.submitted_by === match.home?.player?.id);
  const awaySub = submissions.find((s: any) => s.submitted_by === match.away?.player?.id);

  return (
    <div style={{ background: 'rgba(255,92,92,0.04)', border: '1px solid rgba(255,92,92,0.3)', padding: '14px 16px' }}>
      <div style={{ fontSize: 11, color: '#ff5c5c', marginBottom: 8 }}>MATCH DAY {match.matchday}</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{homeName}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{homePlayer}</div>
        </div>
        <span style={{ fontSize: 14, color: 'var(--text-2)' }}>vs</span>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{awayName}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{awayPlayer}</div>
        </div>
      </div>

      {/* What each player submitted */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12, padding: '10px', background: 'rgba(0,0,0,0.2)' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{homePlayer} says</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>
            {homeSub ? `${homeSub.home_score} – ${homeSub.away_score}` : 'Did not submit'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{awayPlayer} says</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>
            {awaySub ? `${awaySub.home_score} – ${awaySub.away_score}` : 'Did not submit'}
          </div>
        </div>
      </div>

      <details>
        <summary style={{ cursor: 'pointer', fontSize: 13, color: 'var(--accent)' }}>Override final score</summary>
        <form action={overrideMatchScore} style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <input type="hidden" name="match_id" value={match.id} />
          <input type="hidden" name="slug" value={slug} />
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block' }}>{homeName}</label>
            <input type="number" name="home_score" min={0} max={50} required className="auth-input" style={{ width: 60 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block' }}>{awayName}</label>
            <input type="number" name="away_score" min={0} max={50} required className="auth-input" style={{ width: 60 }} />
          </div>
          <button type="submit" className="auth-button" style={{ padding: '8px 16px', width: 'auto' }}>Override</button>
        </form>
      </details>
    </div>
  );
}

function AwaitingMatchCard({ match, slug }: any) {
  const homeName = match.home?.country?.name ?? '?';
  const awayName = match.away?.country?.name ?? '?';
  const homePlayer = match.home?.player?.username ?? '?';
  const awayPlayer = match.away?.player?.username ?? '?';

  return (
    <div style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', padding: '12px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>MD{match.matchday}</span>
        <span style={{ fontSize: 11, color: '#ff9500' }}>Reported {match.reported_at ? new Date(match.reported_at).toLocaleString() : ''}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{homeName}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{homePlayer}</div>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-2)' }}>vs</span>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{awayName}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{awayPlayer}</div>
        </div>
      </div>
      <details>
        <summary style={{ cursor: 'pointer', fontSize: 12, color: 'var(--accent)' }}>Force-set score</summary>
        <form action={overrideMatchScore} style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <input type="hidden" name="match_id" value={match.id} />
          <input type="hidden" name="slug" value={slug} />
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block' }}>{homeName}</label>
            <input type="number" name="home_score" min={0} max={50} required className="auth-input" style={{ width: 60 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block' }}>{awayName}</label>
            <input type="number" name="away_score" min={0} max={50} required className="auth-input" style={{ width: 60 }} />
          </div>
          <button type="submit" className="auth-button" style={{ padding: '6px 12px', width: 'auto', fontSize: 12 }}>Override</button>
        </form>
      </details>
    </div>
  );
}
