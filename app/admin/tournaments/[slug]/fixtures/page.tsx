// PASS-2-PAGE-ADMIN-FIXTURES
import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentPlayer } from '@/lib/player';
import { fixturesExist } from '@/lib/fixtures';
import { generateFixtures, setMatchdayDeadlines } from '../../../../actions/fixtures';

export default async function AdminFixturesPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { error?: string; generated?: string; saved?: string };
}) {
  const player = await getCurrentPlayer();
  if (!player) redirect('/signin');
  if (player.role !== 'admin' && player.role !== 'super_admin') redirect('/');

  const supabase = createClient();
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, name, slug, matchday_deadlines')
    .eq('slug', params.slug)
    .maybeSingle();
  if (!tournament) notFound();

  const generated = await fixturesExist(tournament.id);
  const deadlines = tournament.matchday_deadlines as Record<string, string> ?? {};

  // Get count of existing matches for context
  const { count: matchCount } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', tournament.id)
    .not('matchday', 'is', null);

  // Helper to convert ISO to datetime-local format
  const toLocalInput = (iso: string | undefined) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <main style={{ minHeight: '100vh', maxWidth: 720, margin: '0 auto', padding: '24px 20px 60px' }}>
      <Link href={`/tournaments/${tournament.slug}`} style={{ color: 'var(--text-2)', fontSize: 13 }}>← {tournament.name}</Link>

      <h1 style={{ fontSize: 26, fontWeight: 600, marginTop: 12, marginBottom: 24 }}>Fixtures &amp; Deadlines</h1>

      {searchParams.generated && (
        <div style={{ padding: '10px 14px', background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.3)', color: 'var(--accent)', fontSize: 13, marginBottom: 16 }}>
          Fixtures generated.
        </div>
      )}
      {searchParams.saved && (
        <div style={{ padding: '10px 14px', background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.3)', color: 'var(--accent)', fontSize: 13, marginBottom: 16 }}>
          Deadlines saved.
        </div>
      )}
      {searchParams.error && (
        <div style={{ padding: '10px 14px', background: 'rgba(255,92,92,0.08)', border: '1px solid rgba(255,92,92,0.3)', color: '#ff5c5c', fontSize: 13, marginBottom: 16 }}>
          {searchParams.error}
        </div>
      )}

      {/* Generate fixtures section */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Group stage fixtures</h2>
        {generated ? (
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12 }}>
            ✓ {matchCount ?? 0} matches generated. Each group plays 6 matches across MD1, MD2, MD3.
          </p>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12 }}>
            No fixtures yet. Generate them after the draw is complete. Each group of 4 plays 6 matches.
          </p>
        )}
        <form action={generateFixtures}>
          <input type="hidden" name="slug" value={tournament.slug} />
          <button type="submit" className="auth-button" style={{ width: 'auto', padding: '10px 20px' }}>
            {generated ? 'Re-generate (idempotent — skips existing)' : 'Generate fixtures'}
          </button>
        </form>
      </section>

      {/* Matchday deadlines */}
      <section style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Matchday deadlines</h2>
        <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>
          Set when each matchday closes. All players in your tournament have until then to complete their MD match.
        </p>

        <form action={setMatchdayDeadlines}>
          <input type="hidden" name="slug" value={tournament.slug} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Match Day 1 deadline</label>
              <input type="datetime-local" name="md1" defaultValue={toLocalInput(deadlines['1'])} className="auth-input" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Match Day 2 deadline</label>
              <input type="datetime-local" name="md2" defaultValue={toLocalInput(deadlines['2'])} className="auth-input" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Match Day 3 deadline</label>
              <input type="datetime-local" name="md3" defaultValue={toLocalInput(deadlines['3'])} className="auth-input" />
            </div>
          </div>

          <button type="submit" className="auth-button" style={{ marginTop: 16, width: 'auto', padding: '10px 20px' }}>
            Save deadlines
          </button>
        </form>
      </section>
    </main>
  );
}
