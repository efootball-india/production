// PASS-2-PAGE-ADMIN-MATCHES
import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentPlayer } from '@/lib/player';
import { overrideMatchScore } from '../../../../actions/fixtures';

export default async function AdminMatchesPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { error?: string; overridden?: string; md?: string };
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

  const filterMd = searchParams.md ? parseInt(searchParams.md, 10) : null;

  let query = supabase
    .from('matches')
    .select(`
      id, matchday, match_number_in_round, status, home_score, away_score, group_id,
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
    .not('matchday', 'is', null)
    .order('matchday')
    .order('match_number_in_round');

  if (filterMd) query = query.eq('matchday', filterMd);

  const { data: matches } = await query;

  // Group matches by group_id for display
  const { data: groups } = await supabase
    .from('groups')
    .select(`
      id, name, position,
      stage:stages!inner(tournament_id)
    `)
    .eq('stage.tournament_id', tournament.id)
    .order('position');

  const groupNameById = new Map<string, string>();
  for (const g of (groups ?? [])) groupNameById.set(g.id, g.name);

  const matchesByGroup = new Map<string, any[]>();
  for (const m of (matches ?? [])) {
    const gid = m.group_id ?? 'ungrouped';
    const arr = matchesByGroup.get(gid) ?? [];
    arr.push(m);
    matchesByGroup.set(gid, arr);
  }

  // Counts for quick stats
  const total = matches?.length ?? 0;
  const completed = (matches ?? []).filter(m => m.status === 'completed').length;
  const disputed = (matches ?? []).filter(m => m.status === 'disputed').length;
  const awaiting = (matches ?? []).filter(m => m.status === 'awaiting_confirmation').length;

  return (
    <main style={{ minHeight: '100vh', maxWidth: 960, margin: '0 auto', padding: '24px 20px 60px' }}>
      <Link href={`/tournaments/${tournament.slug}`} style={{ color: 'var(--text-2)', fontSize: 13 }}>← {tournament.name}</Link>
      <h1 style={{ fontSize: 26, fontWeight: 600, marginTop: 12, marginBottom: 8 }}>All matches</h1>
      <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>
        {completed} of {total} completed · {disputed} disputed · {awaiting} awaiting
      </p>

      {searchParams.overridden && (
        <div style={{ padding: '10px 14px', background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.3)', color: 'var(--accent)', fontSize: 13, marginBottom: 16 }}>
          Match score updated.
        </div>
      )}
      {searchParams.error && (
        <div style={{ padding: '10px 14px', background: 'rgba(255,92,92,0.08)', border: '1px solid rgba(255,92,92,0.3)', color: '#ff5c5c', fontSize: 13, marginBottom: 16 }}>
          {searchParams.error}
        </div>
      )}

      {/* Matchday filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <FilterChip slug={tournament.slug} label="All" active={!filterMd} md={null} />
        <FilterChip slug={tournament.slug} label="MD1" active={filterMd === 1} md={1} />
        <FilterChip slug={tournament.slug} label="MD2" active={filterMd === 2} md={2} />
        <FilterChip slug={tournament.slug} label="MD3" active={filterMd === 3} md={3} />
      </div>

      {/* Matches grouped */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {Array.from(matchesByGroup.entries()).map(([gid, ms]) => (
          <section key={gid}>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>
              {groupNameById.get(gid) ?? 'Unknown group'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ms.map(m => <MatchRow key={m.id} match={m} slug={tournament.slug} />)}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

function FilterChip({ slug, label, active, md }: { slug: string; label: string; active: boolean; md: number | null }) {
  const href = md ? `/admin/tournaments/${slug}/matches?md=${md}` : `/admin/tournaments/${slug}/matches`;
  return (
    <Link href={href} style={{
      padding: '6px 12px',
      fontSize: 12,
      border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
      color: active ? 'var(--accent)' : 'var(--text-2)',
      background: active ? 'rgba(0,255,136,0.06)' : 'transparent',
    }}>
      {label}
    </Link>
  );
}

function MatchRow({ match, slug }: any) {
  const home = match.home;
  const away = match.away;
  const homeName = home?.country?.name ?? '?';
  const awayName = away?.country?.name ?? '?';
  const completed = match.status === 'completed';

  const statusColors: Record<string, string> = {
    completed: 'var(--accent)',
    disputed: '#ff5c5c',
    awaiting_confirmation: '#ff9500',
    awaiting_result: 'var(--text-3)',
    pending: 'var(--text-3)',
  };

  return (
    <div style={{
      background: 'var(--glass)',
      border: '1px solid var(--glass-border)',
      padding: '10px 14px',
      display: 'grid',
      gridTemplateColumns: '40px 1fr auto 1fr 1fr',
      gap: 12,
      alignItems: 'center',
      fontSize: 13,
    }}>
      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>MD{match.matchday}</span>

      <div>
        <div style={{ fontWeight: 500 }}>{homeName}</div>
        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{home?.player?.username ?? '?'}</div>
      </div>

      <div style={{ minWidth: 60, textAlign: 'center' }}>
        {completed && match.home_score != null && match.away_score != null ? (
          <strong style={{ fontSize: 15 }}>{match.home_score} – {match.away_score}</strong>
        ) : (
          <span style={{ color: statusColors[match.status] ?? 'var(--text-3)', fontSize: 11 }}>
            {match.status === 'awaiting_result' ? 'Pending' : match.status.replace(/_/g, ' ')}
          </span>
        )}
      </div>

      <div style={{ textAlign: 'right' }}>
        <div style={{ fontWeight: 500 }}>{awayName}</div>
        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{away?.player?.username ?? '?'}</div>
      </div>

      <details style={{ justifySelf: 'end' }}>
        <summary style={{ cursor: 'pointer', fontSize: 11, color: 'var(--accent)' }}>
          {completed ? 'Edit' : 'Set score'}
        </summary>
        <form action={overrideMatchScore} style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'flex-end' }}>
          <input type="hidden" name="match_id" value={match.id} />
          <input type="hidden" name="slug" value={slug} />
          <input
            type="number" name="home_score" min={0} max={50} required
            defaultValue={match.home_score ?? ''}
            placeholder={homeName.slice(0, 3)}
            className="auth-input" style={{ width: 50, fontSize: 12 }}
          />
          <input
            type="number" name="away_score" min={0} max={50} required
            defaultValue={match.away_score ?? ''}
            placeholder={awayName.slice(0, 3)}
            className="auth-input" style={{ width: 50, fontSize: 12 }}
          />
          <button type="submit" className="auth-button" style={{ padding: '4px 10px', fontSize: 11, width: 'auto' }}>
            Save
          </button>
        </form>
      </details>
    </div>
  );
}
