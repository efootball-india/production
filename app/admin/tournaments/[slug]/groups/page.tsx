// PASS-2-PAGE-GROUPS
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getGroupStandings } from '@/lib/fixtures';

export default async function GroupsPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, name, slug')
    .eq('slug', params.slug)
    .maybeSingle();
  if (!tournament) notFound();

  const { data: stage } = await supabase
    .from('stages')
    .select('id')
    .eq('tournament_id', tournament.id)
    .eq('stage_type', 'groups')
    .maybeSingle();

  if (!stage) {
    return (
      <main style={{ minHeight: '100vh', maxWidth: 760, margin: '0 auto', padding: '24px 20px 60px' }}>
        <Link href={`/tournaments/${tournament.slug}`} style={{ color: 'var(--text-2)', fontSize: 13 }}>← {tournament.name}</Link>
        <h1 className="auth-h1" style={{ marginTop: 12 }}>Groups</h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Groups haven&apos;t been generated yet.</p>
      </main>
    );
  }

  const { data: groups } = await supabase
    .from('groups')
    .select('id, name, position')
    .eq('stage_id', stage.id)
    .order('position');

  // Fetch standings for each group in parallel
  const groupsWithStandings = await Promise.all(
    (groups ?? []).map(async (g) => ({
      group: g,
      standings: await getGroupStandings(g.id),
    }))
  );

  return (
    <main style={{ minHeight: '100vh', maxWidth: 1100, margin: '0 auto', padding: '24px 20px 60px' }}>
      <Link href={`/tournaments/${tournament.slug}`} style={{ color: 'var(--text-2)', fontSize: 13 }}>← {tournament.name}</Link>
      <h1 style={{ fontSize: 26, fontWeight: 600, marginTop: 12, marginBottom: 24 }}>Standings</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {groupsWithStandings.map(({ group, standings }) => (
          <div key={group.id} style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 600 }}>
              {group.name}
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '20px 1fr 22px 22px 22px 28px 28px 32px',
              gap: 4,
              padding: '6px 10px',
              fontSize: 10,
              color: 'var(--text-3)',
              borderBottom: '1px solid var(--border)',
            }}>
              <span></span>
              <span>Team</span>
              <span style={{ textAlign: 'right' }}>P</span>
              <span style={{ textAlign: 'right' }}>W</span>
              <span style={{ textAlign: 'right' }}>L</span>
              <span style={{ textAlign: 'right' }}>GF</span>
              <span style={{ textAlign: 'right' }}>GA</span>
              <span style={{ textAlign: 'right' }}>Pts</span>
            </div>
            {standings.length === 0 ? (
              <div style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-3)' }}>No data yet.</div>
            ) : (
              standings.map((s, idx) => {
                // Top 2 advance, position 3 is in best-thirds bucket, position 4 eliminated
                const advance = s.position <= 2;
                const thirds = s.position === 3;
                return (
                  <div key={s.participant_id} style={{
                    display: 'grid',
                    gridTemplateColumns: '20px 1fr 22px 22px 22px 28px 28px 32px',
                    gap: 4,
                    padding: '6px 10px',
                    fontSize: 12,
                    borderBottom: idx < standings.length - 1 ? '1px solid var(--border)' : 'none',
                    background: advance ? 'rgba(0,255,136,0.04)' : 'transparent',
                  }}>
                    <span style={{ color: advance ? 'var(--accent)' : thirds ? '#ff9500' : 'var(--text-3)' }}>{s.position}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.country?.name}
                      {s.needs_tiebreaker && <span style={{ marginLeft: 4, fontSize: 9, color: '#ff9500' }}>TIE</span>}
                    </span>
                    <span style={{ textAlign: 'right' }}>{s.played}</span>
                    <span style={{ textAlign: 'right' }}>{s.wins}</span>
                    <span style={{ textAlign: 'right' }}>{s.losses}</span>
                    <span style={{ textAlign: 'right' }}>{s.goals_for}</span>
                    <span style={{ textAlign: 'right' }}>{s.goals_against}</span>
                    <span style={{ textAlign: 'right', fontWeight: 600 }}>{s.points}</span>
                  </div>
                );
              })
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20, fontSize: 11, color: 'var(--text-3)' }}>
        <span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--accent)', verticalAlign: 'middle', marginRight: 6 }}></span>Top 2: advance to KO ·{' '}
        <span style={{ color: '#ff9500' }}>3rd</span>: best-thirds qualifier ·{' '}
        <span style={{ color: '#ff9500' }}>TIE</span> = unresolved tiebreaker
      </div>
    </main>
  );
}
