// PASS-45-PLAYERS-TAB
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PLATFORM_LABELS } from '@/lib/player';

export default async function PlayersTab({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id')
    .eq('slug', params.slug)
    .maybeSingle();
  if (!tournament) notFound();

  const { data: participants } = await supabase
    .from('tournament_participants')
    .select(`
      id, status,
      player:players(username, display_name, platform, region, discord_handle),
      country:countries(name, group_label)
    `)
    .eq('tournament_id', tournament.id)
    .order('id');

  const active = (participants ?? []).filter((p: any) => p.status === 'registered');

  if (active.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px 20px',
        border: '1px dashed rgba(255,255,255,0.1)',
        borderRadius: 6,
        fontSize: 13,
        color: 'var(--text-3)',
      }}>
        No registrations yet.
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.18em', fontWeight: 700, marginBottom: 10 }}>
        REGISTERED · {active.length}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {active.map((p: any) => (
          <div key={p.id} style={{
            background: 'var(--glass)',
            border: '1px solid var(--glass-border)',
            borderRadius: 4,
            padding: '10px 14px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4, gap: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>
                {p.player?.display_name ?? p.player?.username}
              </span>
              {p.country?.group_label && (
                <span style={{ fontSize: 9, color: 'var(--accent)', background: 'rgba(0,255,136,0.1)', padding: '2px 7px', borderRadius: 2, letterSpacing: '0.14em', fontWeight: 700 }}>
                  GROUP {p.country.group_label}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 11, color: 'var(--text-3)' }}>
              {p.country?.name && <span style={{ color: 'var(--text-2)' }}>{p.country.name}</span>}
              {p.player?.platform && <span>{(PLATFORM_LABELS as any)[p.player.platform] ?? p.player.platform}</span>}
              {p.player?.discord_handle && <span style={{ fontFamily: 'ui-monospace, monospace' }}>{p.player.discord_handle}</span>}
              {p.player?.region && <span>{p.player.region}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
