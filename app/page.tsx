// PASS-13-PAGE
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getCurrentPlayer } from '@/lib/player';
import { listTournaments, FORMAT_LABELS, STATUS_LABELS } from '@/lib/tournaments';
import { getPlayerStats } from '@/lib/stats';
import ProfileHero from '../components/ProfileHero';

export default async function HomePage() {
  const player = await getCurrentPlayer();
  const isAdmin = player?.role === 'admin' || player?.role === 'super_admin';
  const isMod = isAdmin || player?.role === 'moderator';

  const tournaments = await listTournaments();
  const stats = player ? await getPlayerStats(player.id) : null;

  const supabase = createClient();
  let myParticipations: Map<string, { participantId: string; status: string; countryId: string | null }> = new Map();
  if (player) {
    const { data: parts } = await supabase
      .from('tournament_participants')
      .select('id, tournament_id, status, country_id')
      .eq('player_id', player.id);
    for (const p of (parts ?? [])) {
      myParticipations.set(p.tournament_id, {
        participantId: p.id,
        status: p.status,
        countryId: p.country_id,
      });
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {player && stats ? (
        <ProfileHero
          displayName={player.display_name ?? player.username}
          username={player.username}
          avatarUrl={player.avatar_url ?? null}
          wins={stats.wins}
          draws={stats.draws}
          losses={stats.losses}
        />
      ) : (
        <section style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '60px 20px 40px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.15em', marginBottom: 12 }}>
            THE COMMUNITY 1V1 PLATFORM
          </div>
          <h1 style={{
            fontSize: 'clamp(36px, 7vw, 64px)',
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            marginBottom: 16,
          }}>
            eFootball tournaments,<br />
            <span style={{ color: 'var(--accent)' }}>played the right way</span>
          </h1>
          <p style={{
            fontSize: 16,
            color: 'var(--text-2)',
            maxWidth: 540,
            margin: '0 auto',
            lineHeight: 1.55,
          }}>
            48-player FIFA WC format. Group draws. Knockouts. Real standings.
            Run by your community, for your community.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 28 }}>
            <Link href="/signup" className="auth-button" style={{ padding: '12px 24px', width: 'auto', fontSize: 14 }}>
              Create account
            </Link>
            <Link href="/signin" style={{
              padding: '12px 24px',
              fontSize: 14,
              color: 'var(--text-2)',
              border: '1px solid var(--border)',
              textDecoration: 'none',
            }}>
              Sign in
            </Link>
          </div>
        </section>
      )}

      <section style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '20px 20px 60px',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 16,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>Tournaments</h2>
          {isAdmin && (
            <Link href="/admin/tournaments/new" style={{
              fontSize: 13,
              color: 'var(--accent)',
              textDecoration: 'none',
            }}>
              + New tournament
            </Link>
          )}
        </div>

        {tournaments.length === 0 ? (
          <div style={{
            padding: '32px 24px',
            border: '1px solid var(--border)',
            color: 'var(--text-2)',
            fontSize: 14,
            textAlign: 'center',
          }}>
            No tournaments yet.
            {isAdmin && <> <Link href="/admin/tournaments/new" style={{ color: 'var(--accent)' }}>Create the first one →</Link></>}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
            {tournaments.map((t: any) => (
              <TournamentCard
                key={t.id}
                tournament={t}
                player={player}
                isAdmin={isAdmin}
                isMod={isMod}
                myParticipation={myParticipations.get(t.id)}
              />
            ))}
          </div>
        )}
      </section>

      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '24px 20px',
        marginTop: 40,
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          fontSize: 12,
          color: 'var(--text-3)',
        }}>
          <div>eFTBL · Community 1v1 platform</div>
          <div style={{ display: 'flex', gap: 16 }}>
            {player && <Link href="/profile/edit" style={{ color: 'var(--text-3)' }}>Profile</Link>}
            <Link href="/tournaments" style={{ color: 'var(--text-3)' }}>All tournaments</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function TournamentCard({ tournament, player, isAdmin, isMod, myParticipation }: any) {
  const t = tournament;
  const status = t.status as string;
  const isRegistered = !!myParticipation && myParticipation.status === 'registered';
  const hasCountry = !!myParticipation?.countryId;

  let primary: { label: string; href: string } | null = null;
  let secondary: { label: string; href: string }[] = [];

  if (status === 'registration_open') {
    if (!player) {
      primary = { label: 'Sign in to register', href: '/signin' };
    } else if (isRegistered) {
      primary = { label: "You're in · View", href: `/tournaments/${t.slug}` };
    } else {
      primary = { label: 'Register', href: `/tournaments/${t.slug}` };
    }
  } else if (status === 'registration_closed') {
    primary = { label: 'View tournament', href: `/tournaments/${t.slug}` };
  } else if (status === 'in_progress') {
    if (isRegistered && hasCountry) {
      primary = { label: 'Your matches', href: `/play/${t.slug}` };
      secondary.push({ label: 'Standings', href: `/tournaments/${t.slug}/groups` });
      secondary.push({ label: 'Bracket', href: `/tournaments/${t.slug}/bracket` });
    } else {
      primary = { label: 'View standings', href: `/tournaments/${t.slug}/groups` };
      secondary.push({ label: 'Bracket', href: `/tournaments/${t.slug}/bracket` });
    }
  } else if (status === 'completed') {
    primary = { label: 'View bracket', href: `/tournaments/${t.slug}/bracket` };
    secondary.push({ label: 'Standings', href: `/tournaments/${t.slug}/groups` });
  } else {
    primary = { label: 'View tournament', href: `/tournaments/${t.slug}` };
  }

  const adminLinks: { label: string; href: string }[] = [];
  if (isAdmin) {
    if (status === 'registration_closed' || status === 'registration_open') {
      adminLinks.push({ label: 'Draw', href: `/admin/tournaments/${t.slug}/draw` });
    }
    if (status === 'in_progress' || status === 'registration_closed') {
      adminLinks.push({ label: 'Fixtures', href: `/admin/tournaments/${t.slug}/fixtures` });
      adminLinks.push({ label: 'All matches', href: `/admin/tournaments/${t.slug}/matches` });
    }
  }
  if (isMod && (status === 'in_progress')) {
    adminLinks.push({ label: 'Queue', href: `/admin/tournaments/${t.slug}/queue` });
  }

  return (
    <div style={{
      background: 'var(--glass)',
      border: '1px solid var(--glass-border)',
      padding: '16px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
        <span style={{
          padding: '3px 8px',
          background: statusBg(status),
          color: statusFg(status),
          letterSpacing: '0.05em',
        }}>
          {STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status}
        </span>
        <span style={{ color: 'var(--text-3)' }}>{FORMAT_LABELS[t.format as keyof typeof FORMAT_LABELS] ?? t.format}</span>
      </div>

      <div>
        <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 4 }}>{t.name}</h3>
        {t.description && (
          <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>{t.description}</p>
        )}
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <span>{(t.participant_count ?? 0)}{t.max_participants ? ` / ${t.max_participants}` : ''} players</span>
        {t.starts_at && (
          <span>Starts {new Date(t.starts_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
        )}
      </div>

      {primary && (
        <Link href={primary.href} className="auth-button" style={{
          padding: '8px 14px',
          fontSize: 13,
          width: 'auto',
          textAlign: 'center',
        }}>
          {primary.label}
        </Link>
      )}

      {secondary.length > 0 && (
        <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
          {secondary.map(s => (
            <Link key={s.href} href={s.href} style={{ color: 'var(--text-2)' }}>
              {s.label}
            </Link>
          ))}
        </div>
      )}

      {adminLinks.length > 0 && (
        <div style={{
          paddingTop: 10,
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          fontSize: 11,
        }}>
          <span style={{ color: 'var(--accent)', letterSpacing: '0.05em' }}>ADMIN</span>
          {adminLinks.map(a => (
            <Link key={a.href} href={a.href} style={{ color: 'var(--accent)' }}>
              {a.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function statusBg(status: string): string {
  switch (status) {
    case 'registration_open': return 'rgba(0,255,136,0.1)';
    case 'in_progress': return 'rgba(255,149,0,0.1)';
    case 'completed': return 'rgba(255,255,255,0.06)';
    default: return 'rgba(255,255,255,0.04)';
  }
}
function statusFg(status: string): string {
  switch (status) {
    case 'registration_open': return 'var(--accent)';
    case 'in_progress': return '#ff9500';
    case 'completed': return 'var(--text-2)';
    default: return 'var(--text-3)';
  }
}
