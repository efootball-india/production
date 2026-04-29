// PASS-35-PAGE-TOURNAMENTS
import Link from 'next/link';
import { listTournaments, FORMAT_LABELS, STATUS_LABELS } from '@/lib/tournaments';
import { getCurrentPlayer } from '@/lib/player';
import { createClient } from '@/lib/supabase/server';

export default async function TournamentsPage() {
  const tournaments = await listTournaments();
  const player = await getCurrentPlayer();
  const isAdmin = player?.role === 'admin' || player?.role === 'super_admin';

  let myTournamentIds = new Set<string>();
  if (player) {
    const supabase = createClient();
    const { data: parts } = await supabase
      .from('tournament_participants')
      .select('tournament_id')
      .eq('player_id', player.id)
      .eq('status', 'registered');
    for (const p of (parts ?? [])) {
      myTournamentIds.add(p.tournament_id);
    }
  }

  const mine: any[] = [];
  const ongoing: any[] = [];
  const past: any[] = [];

  for (const t of tournaments) {
    if (t.status === 'completed' || t.status === 'cancelled') {
      past.push(t);
    } else if (myTournamentIds.has(t.id)) {
      mine.push(t);
    } else {
      ongoing.push(t);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px 60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div className="auth-eyebrow">eFTBL</div>
          <h1 className="auth-h1" style={{ marginBottom: 0 }}>Tournaments</h1>
        </div>
        {isAdmin && (
          <Link href="/admin/tournaments/new" className="auth-button" style={{ padding: '8px 14px', width: 'auto' }}>
            + New tournament
          </Link>
        )}
      </div>

      {tournaments.length === 0 && (
        <div style={{ padding: 24, border: '1px solid var(--glass-border)', color: 'var(--text-2)', fontSize: 14, borderRadius: 6 }}>
          No tournaments yet. {isAdmin && 'Click "New tournament" above to create the first one.'}
        </div>
      )}

      {player && (
        <Section
          label="MY TOURNAMENTS"
          tournaments={mine}
          emptyHint="You haven't joined any tournament yet. Browse the open ones below."
        />
      )}

      <Section
        label="ONGOING & UPCOMING"
        tournaments={ongoing}
        emptyHint="No active tournaments right now."
      />

      {past.length > 0 && (
        <Section label="PAST" tournaments={past} />
      )}
    </main>
  );
}

function Section({
  label,
  tournaments,
  emptyHint,
}: {
  label: string;
  tournaments: any[];
  emptyHint?: string;
}) {
  return (
    <section style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.18em', fontWeight: 700, marginBottom: 10 }}>
        {label}
      </div>
      {tournaments.length === 0 ? (
        emptyHint ? (
          <div style={{
            padding: '14px 16px',
            border: '1px dashed rgba(255,255,255,0.1)',
            borderRadius: 6,
            color: 'var(--text-3)',
            fontSize: 12,
          }}>
            {emptyHint}
          </div>
        ) : null
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tournaments.map((t) => (
            <Link
              key={t.id}
              href={`/tournaments/${t.slug}`}
              style={{
                display: 'block',
                padding: '18px 20px',
                background: 'var(--glass)',
                border: '1px solid var(--glass-border)',
                borderRadius: 6,
                textDecoration: 'none',
                color: 'inherit',
                transition: 'border-color 0.15s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6, gap: 12 }}>
                <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{t.name}</h2>
                <span style={{ fontSize: 12, color: 'var(--text-3)', flexShrink: 0 }}>
                  {STATUS_LABELS[t.status as keyof typeof STATUS_LABELS] ?? t.status}
                </span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <span>{FORMAT_LABELS[t.format as keyof typeof FORMAT_LABELS] ?? t.format}</span>
                <span>{t.participant_count}{t.max_participants ? ` / ${t.max_participants}` : ''} players</span>
                {t.starts_at && (
                  <span>Starts {new Date(t.starts_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
