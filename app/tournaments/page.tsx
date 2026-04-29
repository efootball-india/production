// PASS-36-PAGE-TOURNAMENTS (editorial)
import Link from 'next/link';
import { listTournaments, FORMAT_LABELS, STATUS_LABELS, type TournamentStatus } from '@/lib/tournaments';
import { getCurrentPlayer } from '@/lib/player';
import { createClient } from '@/lib/supabase/server';

export default async function TournamentsPage() {
  const tournaments = await listTournaments();
  const player = await getCurrentPlayer();
  const isAdmin = player?.role === 'admin' || player?.role === 'super_admin';

  // Find which tournaments the current player is registered in
  const myTournamentIds = new Set<string>();
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

  // Bucket tournaments
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

  const totalCount = tournaments.length;
  const showEmptyState = totalCount === 0;

  return (
    <main className="max-w-[920px] mx-auto px-5 md:px-8 pt-10 md:pt-16 pb-24">

      {/* Page header */}
      <header className="mb-12 md:mb-16">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="auth-eyebrow mb-3">eFTBL</div>
            <h1 className="display-h1">Tournaments.</h1>
          </div>
          {isAdmin && (
            <Link
              href="/admin/tournaments/new"
              className="bg-accent text-white border border-accent hover:bg-ink hover:border-ink transition-colors px-5 py-3 font-mono text-[11px] font-bold tracking-[0.18em] uppercase whitespace-nowrap"
            >
              + New tournament
            </Link>
          )}
        </div>
      </header>

      {/* Empty state — no tournaments at all */}
      {showEmptyState && (
        <div className="card-brutalist-sm p-10 text-center">
          <div className="label mb-3">No tournaments yet</div>
          <div className="font-sans font-black text-2xl mb-3">Quiet on the pitch.</div>
          <p className="text-muted text-sm">
            {isAdmin ? (
              <>
                Be the first to{' '}
                <Link href="/admin/tournaments/new" className="text-accent underline hover:text-ink transition-colors">
                  create a tournament →
                </Link>
              </>
            ) : (
              'Check back soon — new cups drop weekly.'
            )}
          </p>
        </div>
      )}

      {/* Your tournaments — only shown when logged in */}
      {player && (
        <Section
          title="Your tournaments."
          count={mine.length}
          tournaments={mine}
          variant="active"
          emptyHint="You haven't joined any tournament yet. Browse the open ones below."
        />
      )}

      {/* Open & live (everything not completed, not cancelled, that you're not in) */}
      <Section
        title="Open & live."
        count={ongoing.length}
        tournaments={ongoing}
        variant="active"
        emptyHint={!showEmptyState ? 'No open tournaments right now. Check back soon.' : undefined}
      />

      {/* Past — muted treatment */}
      {past.length > 0 && (
        <Section
          title="Past."
          count={past.length}
          tournaments={past}
          variant="past"
        />
      )}
    </main>
  );
}

function Section({
  title,
  count,
  tournaments,
  variant,
  emptyHint,
}: {
  title: string;
  count: number;
  tournaments: any[];
  variant: 'active' | 'past';
  emptyHint?: string;
}) {
  // Hide section entirely if empty and no hint
  if (tournaments.length === 0 && !emptyHint) return null;

  return (
    <section className="mb-16 last:mb-0">
      <h2 className="section-head">
        <span>{title}</span>
        <span className="font-mono text-subtle text-xs tracking-[0.14em]">
          /{String(count).padStart(2, '0')}
        </span>
      </h2>

      {tournaments.length === 0 ? (
        <div className="border border-dashed border-hairline-2 px-5 py-6 text-subtle text-sm">
          {emptyHint}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {tournaments.map((t) => (
            <TournamentRow key={t.id} tournament={t} variant={variant} />
          ))}
        </div>
      )}
    </section>
  );
}

function TournamentRow({
  tournament: t,
  variant,
}: {
  tournament: any;
  variant: 'active' | 'past';
}) {
  const status = t.status as TournamentStatus;
  const formatLabel = FORMAT_LABELS[t.format as keyof typeof FORMAT_LABELS] ?? t.format;
  const statusLabel = STATUS_LABELS[status] ?? status;

  // Status pill — only on active rows
  let pillClass = 'pill';
  let pillLabel = statusLabel.toUpperCase();
  if (status === 'in_progress') {
    pillClass = 'pill pill-live';
    pillLabel = '● LIVE';
  } else if (status === 'registration_open') {
    pillClass = 'pill pill-open';
    pillLabel = '● OPEN';
  } else if (status === 'registration_closed') {
    pillClass = 'pill';
    pillLabel = 'CLOSED';
  } else if (status === 'completed') {
    pillClass = 'pill pill-muted';
    pillLabel = 'COMPLETED';
  } else if (status === 'cancelled') {
    pillClass = 'pill pill-muted';
    pillLabel = 'CANCELLED';
  }

  const startsLabel = t.starts_at
    ? new Date(t.starts_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : null;

  if (variant === 'past') {
    return (
      <Link
        href={`/tournaments/${t.slug}`}
        className="block bg-card border border-hairline px-5 py-4 hover:border-hairline-strong transition-colors group"
      >
        <div className="flex items-baseline justify-between gap-3 mb-1">
          <h3 className="font-sans font-black text-lg text-muted leading-tight">
            {t.name}
          </h3>
          <span className="label whitespace-nowrap">{pillLabel}</span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 label">
          <span>{formatLabel}</span>
          <span>
            {t.participant_count}
            {t.max_participants ? ` / ${t.max_participants}` : ''} players
          </span>
          {startsLabel && <span>{startsLabel}</span>}
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/tournaments/${t.slug}`}
      className="block bg-card border border-hairline px-5 py-5 hover:border-ink-strong transition-colors group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-sans font-black text-2xl tracking-tight leading-[1.1] mb-1">
            {t.name}
          </h3>
          {t.description && (
            <p className="text-muted text-sm leading-relaxed line-clamp-2">
              {t.description}
            </p>
          )}
        </div>
        <span className={`${pillClass} flex-shrink-0`}>{pillLabel}</span>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1 label pt-3 hairline-t">
        <span>{formatLabel}</span>
        <span className="tabular-nums">
          {t.participant_count}
          {t.max_participants ? ` / ${t.max_participants}` : ''} players
        </span>
        {startsLabel && <span>Starts {startsLabel}</span>}
      </div>
    </Link>
  );
}
