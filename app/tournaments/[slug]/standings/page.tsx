// PASS-42-STANDINGS-TAB
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getGroupStandings } from '@/lib/fixtures';

export default async function StandingsTab({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id')
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
    return <EmptyState>Group stage hasn't started yet.</EmptyState>;
  }

  const { data: groups } = await supabase
    .from('groups')
    .select('id, name, position')
    .eq('stage_id', stage.id)
    .order('position', { ascending: true });

  if (!groups || groups.length === 0) {
    return <EmptyState>No groups yet. Wait for the draw to complete.</EmptyState>;
  }

  const groupsWithStandings = await Promise.all(
    groups.map(async (g) => ({
      group: g,
      standings: await getGroupStandings(g.id),
    }))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {groupsWithStandings.map(({ group, standings }) => (
        <GroupTable key={group.id} groupName={group.name} standings={standings} />
      ))}
    </div>
  );
}

function GroupTable({ groupName, standings }: { groupName: string; standings: any[] }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.18em', fontWeight: 700, marginBottom: 8 }}>
        {groupName.toUpperCase()}
      </div>
      <div style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '24px 1fr 24px 24px 24px 28px 28px 32px',
          gap: 6, padding: '6px 12px', fontSize: 9,
          color: 'var(--text-3)', letterSpacing: '0.1em', fontWeight: 700,
          borderBottom: '1px solid var(--border)',
        }}>
          <span></span>
          <span>TEAM</span>
          <span style={{ textAlign: 'right' }}>P</span>
          <span style={{ textAlign: 'right' }}>W</span>
          <span style={{ textAlign: 'right' }}>L</span>
          <span style={{ textAlign: 'right' }}>GF</span>
          <span style={{ textAlign: 'right' }}>GA</span>
          <span style={{ textAlign: 'right' }}>PTS</span>
        </div>
        {standings.map((s) => (
          <div key={s.participant_id} style={{
            display: 'grid',
            gridTemplateColumns: '24px 1fr 24px 24px 24px 28px 28px 32px',
            gap: 6, padding: '8px 12px', fontSize: 12,
            borderBottom: '1px solid var(--border)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            <span style={{ color: 'var(--text-3)', fontWeight: 600 }}>{s.position}</span>
            <span style={{ color: 'var(--text)' }}>
              {s.country?.name}
              {s.needs_tiebreaker && <span style={{ marginLeft: 4, fontSize: 8, color: '#ff9500', letterSpacing: '0.1em' }}>TIE</span>}
            </span>
            <span style={{ textAlign: 'right', color: 'var(--text-2)' }}>{s.played}</span>
            <span style={{ textAlign: 'right', color: 'var(--text-2)' }}>{s.wins}</span>
            <span style={{ textAlign: 'right', color: 'var(--text-2)' }}>{s.losses}</span>
            <span style={{ textAlign: 'right', color: 'var(--text-2)' }}>{s.goals_for}</span>
            <span style={{ textAlign: 'right', color: 'var(--text-2)' }}>{s.goals_against}</span>
            <span style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text)' }}>{s.points}</span>
          </div>
        ))}
      </div>
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
