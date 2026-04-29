// PASS-42-FIXTURES-TAB (editorial + username pills)
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { FORMAT_LABELS } from '@/lib/tournaments';

const ROUND_LABELS: Record<number, string> = {
  1: 'Round of 32',
  2: 'Round of 16',
  3: 'Quarter-finals',
  4: 'Semi-finals',
  5: 'Final',
};

type WinnerSide = 'home' | 'away' | 'draw' | null;

export default async function FixturesTab({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { registered?: string; withdrawn?: string; error?: string };
}) {
  const supabase = createClient();

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, name, slug, status, format, starts_at, max_participants')
    .eq('slug', params.slug)
    .maybeSingle();
  if (!tournament) notFound();

  const { data: matches } = await supabase
    .from('matches')
    .select(`
      id, matchday, round, status, group_id,
      home_score, away_score, home_pens, away_pens, decided_by,
      home:tournament_participants!matches_home_participant_id_fkey(
        id,
        country:countries(name, group_label),
        player:players(id, username, display_name)
      ),
      away:tournament_participants!matches_away_participant_id_fkey(
        id,
        country:countries(name, group_label),
        player:players(id, username, display_name)
      )
    `)
    .eq('tournament_id', tournament.id)
    .order('round', { ascending: true, nullsFirst: true })
    .order('matchday', { ascending: true, nullsFirst: false })
    .order('match_number_in_round', { ascending: true, nullsFirst: false });

  const groupMatches: Record<number, any[]> = {};
  const koMatches: Record<number, any[]> = {};

  for (const m of (matches ?? [])) {
    const md = (m as any).matchday;
    const round = (m as any).round;
    if (md != null) {
      if (!groupMatches[md]) groupMatches[md] = [];
      groupMatches[md].push(m);
    } else if (round != null) {
      if (!koMatches[round]) koMatches[round] = [];
      koMatches[round].push(m);
    }
  }

  const totalMatches = matches?.length ?? 0;

  return (
    <div>
      {searchParams.registered && (
        <Banner tone="ok">You are registered. See you at the draw.</Banner>
      )}
      {searchParams.withdrawn && (
        <Banner tone="muted">Withdrawn from this tournament.</Banner>
      )}
      {searchParams.error && (
        <Banner tone="warn">{searchParams.error}</Banner>
      )}

      {totalMatches === 0 ? (
        <FixturesEmptyState tournament={tournament} />
      ) : (
        <>
          {Object.keys(groupMatches).sort((a, b) => Number(a) - Number(b)).map((md) => (
            <Section
              key={`md-${md}`}
              title={`Matchday ${md} · group stage`}
              count={groupMatches[Number(md)].length}
            >
              {groupMatches[Number(md)].map((m: any) => (
                <MatchRow key={m.id} match={m} />
              ))}
            </Section>
          ))}
          {Object.keys(koMatches).sort((a, b) => Number(a) - Number(b)).map((r) => (
            <Section
              key={`r-${r}`}
              title={ROUND_LABELS[Number(r)] ?? `Round ${r}`}
              count={koMatches[Number(r)].length}
            >
              {koMatches[Number(r)].map((m: any) => (
                <MatchRow key={m.id} match={m} />
              ))}
            </Section>
          ))}
        </>
      )}
    </div>
  );
}

function FixturesEmptyState({ tournament }: { tournament: any }) {
  const startsAt = tournament.starts_at ? new Date(tournament.starts_at) : null;
  const startDate = startsAt
    ? startsAt.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
    : null;
  const formatLabel = FORMAT_LABELS[tournament.format as keyof typeof FORMAT_LABELS] ?? tournament.format;

  let eyebrow = 'No fixtures yet';
  let headline = "Fixtures haven't been generated.";
  let body = 'Matches will publish here once the tournament is set up.';

  if (tournament.status === 'registration_open') {
    eyebrow = 'Awaiting group-stage draw';
    headline = "Fixtures aren't out yet.";
    body = 'Group-stage draw happens after registration closes. Matches publish here on day one of the tournament.';
  } else if (tournament.status === 'registration_closed') {
    eyebrow = 'Draw in progress';
    headline = 'Fixtures coming soon.';
    body = 'Group draws are being finalized. Matches will publish here once the draw concludes.';
  } else if (tournament.status === 'in_progress') {
    eyebrow = 'No fixtures yet';
    headline = "Fixtures haven't been generated.";
    body = 'The tournament has started but fixtures are still being set up. Check back shortly.';
  } else if (tournament.status === 'cancelled') {
    eyebrow = 'Tournament cancelled';
    headline = 'No fixtures.';
    body = 'This tournament was cancelled before fixtures were generated.';
  }

  return (
    <>
      <SectionHead title="Fixtures" count={0} />
      <div className="bg-card border border-hairline-strong px-6 py-7 md:px-7 md:py-8 mb-8">
        <div className="label-strong mb-3">{eyebrow}</div>
        <div className="font-sans font-black text-2xl md:text-[28px] leading-[1.05] tracking-tight text-default mb-3">
          {headline}
        </div>
        <p className="text-muted text-sm md:text-base leading-relaxed max-w-[520px] mb-5">
          {body}
        </p>
        <div className="flex flex-wrap gap-x-7 gap-y-3 pt-4 hairline-t">
          {startDate && (
            <div>
              <div className="label mb-1">Tournament begins</div>
              <div className="font-sans font-bold text-base text-default">{startDate}</div>
            </div>
          )}
          <div>
            <div className="label mb-1">Format</div>
            <div className="font-sans font-bold text-base text-default">{formatLabel}</div>
          </div>
        </div>
      </div>
    </>
  );
}

function SectionHead({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex justify-between items-baseline pb-3 hairline-strong-b mb-4">
      <div className="label-strong">{title}</div>
      <div className="label tabular-nums">/{String(count).padStart(2, '0')}</div>
    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <SectionHead title={title} count={count} />
      <div className="flex flex-col gap-2">
        {children}
      </div>
    </section>
  );
}

function getWinner(match: any): WinnerSide {
  if (match.status !== 'completed') return null;
  const hs = match.home_score ?? 0;
  const as_ = match.away_score ?? 0;
  if (match.decided_by === 'penalties') {
    const hp = match.home_pens ?? 0;
    const ap = match.away_pens ?? 0;
    if (hp > ap) return 'home';
    if (ap > hp) return 'away';
    return 'draw';
  }
  if (hs > as_) return 'home';
  if (as_ > hs) return 'away';
  return 'draw';
}

function MatchRow({ match }: { match: any }) {
  const home = match.home;
  const away = match.away;
  const homeUsername = home?.player?.username ?? null;
  const awayUsername = away?.player?.username ?? null;
  const homeCountry = home?.country?.name ?? 'TBD';
  const awayCountry = away?.country?.name ?? 'TBD';
  const groupLabel = home?.country?.group_label ?? away?.country?.group_label;

  const status = match.status as string;
  const isPending = status === 'awaiting_result' || status === 'scheduled';
  const isAwaiting = status === 'awaiting_confirmation' || status === 'disputed';
  const isComplete = status === 'completed';

  const winner = getWinner(match);

  let statusEl: React.ReactNode = null;
  if (isPending) {
    statusEl = <span className="label-strong">Pending</span>;
  } else if (isAwaiting) {
    statusEl = <span className="pill pill-warn">Awaiting confirm</span>;
  } else if (isComplete) {
    statusEl = (
      <span className="label-strong">
        {match.decided_by === 'penalties' ? 'Final · Pen' : 'Final'}
      </span>
    );
  }

  let scoreEl: React.ReactNode;
  if (isComplete || isAwaiting) {
    const hs = match.home_score ?? 0;
    const as_ = match.away_score ?? 0;
    if (match.decided_by === 'penalties' && isComplete) {
      const hp = match.home_pens ?? 0;
      const ap = match.away_pens ?? 0;
      scoreEl = (
        <div className="text-center px-1">
          <div className="font-sans font-black text-xl md:text-2xl tabular-nums tracking-tight leading-none text-default">
            {hs} — {as_}
          </div>
          <div className="label mt-1 whitespace-nowrap">{hp}-{ap} PEN</div>
        </div>
      );
    } else {
      scoreEl = (
        <span className="font-sans font-black text-xl md:text-2xl tabular-nums tracking-tight leading-none text-default px-1">
          {hs} — {as_}
        </span>
      );
    }
  } else {
    scoreEl = <span className="label tracking-[0.16em]">VS</span>;
  }

  return (
    <article className="bg-card border border-hairline px-4 py-3.5">
      {(groupLabel || statusEl) && (
        <div className="flex justify-between items-center mb-3 gap-2">
          <span className="label">{groupLabel ? `Group ${groupLabel}` : ''}</span>
          {statusEl}
        </div>
      )}
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-3 items-center">
        <PlayerSide
          username={homeUsername}
          country={homeCountry}
          dimmed={isComplete && winner === 'away'}
          align="left"
        />
        {scoreEl}
        <PlayerSide
          username={awayUsername}
          country={awayCountry}
          dimmed={isComplete && winner === 'home'}
          align="right"
        />
      </div>
    </article>
  );
}

function PlayerSide({
  username,
  country,
  dimmed,
  align,
}: {
  username: string | null;
  country: string;
  dimmed: boolean;
  align: 'left' | 'right';
}) {
  const wrapperClass = align === 'right'
    ? 'flex flex-col items-end gap-1.5 min-w-0 w-full'
    : 'flex flex-col items-start gap-1.5 min-w-0 w-full';

  return (
    <div className={wrapperClass}>
      {username ? (
        <span className={dimmed ? 'handle-pill handle-pill-eliminated' : 'handle-pill'}>
          {username}
        </span>
      ) : (
        <span className="label-strong">TBD</span>
      )}
      <span
        className={`text-[13px] truncate max-w-full ${dimmed ? 'text-subtle' : 'text-muted'}`}
      >
        {country}
      </span>
    </div>
  );
}

function Banner({ children, tone }: { children: React.ReactNode; tone: 'ok' | 'warn' | 'muted' }) {
  const cls =
    tone === 'ok' ? 'bg-status-ok-soft text-status-ok'
    : tone === 'warn' ? 'bg-status-warn-soft text-status-warn'
    : 'bg-card-2 text-muted';
  return (
    <div className={`${cls} border border-hairline px-4 py-3 mb-5 text-sm`}>
      {children}
    </div>
  );
}
