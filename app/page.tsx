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
  const myParticipations: Map<string, { participantId: string; status: string; countryId: string | null }> = new Map();
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

  const nonCompleted = tournaments.filter((t: any) => t.status !== 'completed');
  const featured =
    nonCompleted.find((t: any) => t.status === 'registration_open') ??
    nonCompleted[0] ??
    null;
  const active = nonCompleted.filter((t: any) => t.id !== featured?.id);

  return (
    <main className="bg-bg text-ink min-h-screen">
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
        <section className="max-w-[920px] mx-auto px-6 md:px-10 pt-16 md:pt-24 pb-16">
          <h1 className="display-h1 max-w-5xl">
            eFootball tournaments,{' '}
            <span className="display-italic-accent">played for real.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-lg text-ink/70 leading-relaxed">
            Compete in structured cups and ladders with verified results, live brackets,
            and a community that takes the game seriously.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="bg-accent text-bg font-sans font-bold uppercase tracking-wider text-sm px-6 py-3 border border-accent hover:bg-ink hover:border-ink transition-colors"
            >
              Create account
            </Link>
            <Link
              href="/signin"
              className="bg-transparent text-ink font-sans font-bold uppercase tracking-wider text-sm px-6 py-3 border border-ink hover:bg-ink hover:text-bg transition-colors"
            >
              Sign in
            </Link>
          </div>
        </section>
      )}

      {/* Featured cup */}
      {featured && (
        <section className="max-w-[920px] mx-auto px-6 md:px-10 pb-16 md:pb-24">
          <h2 className="section-head">Featured cup.</h2>
          <FeaturedCupCard
            tournament={featured}
            player={player}
            myParticipation={myParticipations.get(featured.id)}
          />
        </section>
      )}

      {/* Active /NN */}
      {active.length > 0 && (
        <section className="max-w-[920px] mx-auto px-6 md:px-10 pb-24">
          <h2 className="section-head">
            Active
            <span className="font-mono text-ink/40 ml-2 text-base align-middle">
              /{String(active.length).padStart(2, '0')}
            </span>
          </h2>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {active.map((t: any) => (
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
        </section>
      )}

      {!featured && active.length === 0 && (
        <section className="max-w-[920px] mx-auto px-6 md:px-10 pb-24">
          <div className="card-brutalist-sm p-10 text-center">
            <div className="label mb-3">No tournaments yet</div>
            <div className="font-sans font-black text-2xl mb-2">Quiet on the pitch.</div>
            <p className="text-ink/70">
              {isAdmin ? (
                <>
                  Be the first to{' '}
                  <Link href="/admin/tournaments/new" className="text-accent underline">
                    create a tournament →
                  </Link>
                </>
              ) : (
                'Check back soon — new cups drop weekly.'
              )}
            </p>
          </div>
        </section>
      )}

      <footer className="hairline-strong-t py-6 px-6 md:px-10 mt-10">
        <div className="max-w-[920px] mx-auto flex justify-between flex-wrap gap-4 label">
          <div>eFTBL · Community 1v1 platform</div>
          <div className="flex gap-4">
            {player && (
              <Link href="/profile/edit" className="text-ink/60 hover:text-ink">
                Profile
              </Link>
            )}
            <Link href="/tournaments" className="text-ink/60 hover:text-ink">
              All tournaments
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function FeaturedCupCard({ tournament, player, myParticipation }: any) {
  const t = tournament;
  const status = t.status as string;
  const isRegistered = !!myParticipation && myParticipation.status === 'registered';
  const bannerUrl: string | null = t.banner_image_url ?? null;

  let primary: { label: string; href: string };
  if (status === 'registration_open') {
    if (!player) primary = { label: 'Sign in to register →', href: '/signin' };
    else if (isRegistered) primary = { label: "You're in · View →", href: `/tournaments/${t.slug}` };
    else primary = { label: 'Register now →', href: `/tournaments/${t.slug}` };
  } else if (status === 'in_progress') {
    primary = { label: 'View tournament →', href: `/tournaments/${t.slug}` };
  } else if (status === 'completed') {
    primary = { label: 'View bracket →', href: `/tournaments/${t.slug}/bracket` };
  } else {
    primary = { label: 'View tournament →', href: `/tournaments/${t.slug}` };
  }

  const startsLabel = t.starts_at
    ? new Date(t.starts_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : '—';

  const pillClass =
    status === 'registration_open'
      ? 'pill pill-open'
      : status === 'in_progress'
      ? 'pill pill-live'
      : 'pill';

  const pillLabel =
    status === 'registration_open'
      ? '● OPEN'
      : status === 'in_progress'
      ? '● LIVE'
      : (STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status).toUpperCase();

  const formatLabel = FORMAT_LABELS[t.format as keyof typeof FORMAT_LABELS] ?? t.format;

  return (
    <div className="card-brutalist mt-10 overflow-hidden">
      {/* Banner */}
      <div className="relative w-full h-[180px] md:h-[280px] bg-card-2 border-b border-ink">
        {bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bannerUrl}
            alt={t.name}
            className="w-full h-full object-cover block"
          />
        ) : (
          <BannerFallback />
        )}
      </div>

      <div className="p-8 md:p-12">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className={pillClass}>{pillLabel}</span>
          <span className="label">Featured · {formatLabel}</span>
        </div>

        <h3 className="font-sans font-black text-[40px] md:text-[56px] leading-[0.95] tracking-tight">
          {t.name}
        </h3>

        {t.description && (
          <p className="mt-6 max-w-2xl text-lg text-ink/70 leading-relaxed">{t.description}</p>
        )}

        <div className="mt-10 grid grid-cols-2 hairline-strong-t hairline-strong-b">
          <div className="py-5 pr-5 border-r border-b border-ink/15">
            <div className="label">Players</div>
            <div className="mt-1 font-sans font-black text-2xl md:text-3xl tabular-nums">
              {t.participant_count ?? 0}
              {t.max_participants && <span className="text-ink/40">/{t.max_participants}</span>}
            </div>
          </div>
          <div className="py-5 pl-5 border-b border-ink/15">
            <div className="label">Status</div>
            <div className="mt-1 font-sans font-black text-2xl md:text-3xl">
              {(STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status).toString().slice(0, 12)}
            </div>
          </div>
          <div className="py-5 pr-5 border-r border-ink/15">
            <div className="label">Starts</div>
            <div className="mt-1 font-sans font-black text-2xl md:text-3xl">{startsLabel}</div>
          </div>
          <div className="py-5 pl-5">
            <div className="label">Format</div>
            <div className="mt-1 font-sans font-black text-2xl md:text-3xl">{formatLabel}</div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={primary.href}
            className="bg-accent text-bg font-sans font-bold uppercase tracking-wider text-sm px-6 py-3 border border-accent hover:bg-ink hover:border-ink transition-colors"
          >
            {primary.label}
          </Link>
          <Link
            href={`/tournaments/${t.slug}`}
            className="bg-transparent text-ink font-sans font-bold uppercase tracking-wider text-sm px-6 py-3 border border-ink hover:bg-ink hover:text-bg transition-colors"
          >
            Format details
          </Link>
        </div>
      </div>
    </div>
  );
}

function TournamentCard({ tournament, player, isAdmin, isMod, myParticipation }: any) {
  const t = tournament;
  const status = t.status as string;
  const isRegistered = !!myParticipation && myParticipation.status === 'registered';
  const hasCountry = !!myParticipation?.countryId;
  const bannerUrl: string | null = t.banner_image_url ?? null;

  let primary: { label: string; href: string };
  const secondary: { label: string; href: string }[] = [];

  if (status === 'registration_open') {
    if (!player) primary = { label: 'Sign in to register →', href: '/signin' };
    else if (isRegistered) primary = { label: "You're in · View →", href: `/tournaments/${t.slug}` };
    else primary = { label: 'Register →', href: `/tournaments/${t.slug}` };
  } else if (status === 'registration_closed') {
    primary = { label: 'View tournament →', href: `/tournaments/${t.slug}` };
  } else if (status === 'in_progress') {
    if (isRegistered && hasCountry) {
      primary = { label: 'Your matches →', href: `/play/${t.slug}` };
      secondary.push({ label: 'Standings', href: `/tournaments/${t.slug}/groups` });
      secondary.push({ label: 'Bracket', href: `/tournaments/${t.slug}/bracket` });
    } else {
      primary = { label: 'View standings →', href: `/tournaments/${t.slug}/groups` };
      secondary.push({ label: 'Bracket', href: `/tournaments/${t.slug}/bracket` });
    }
  } else if (status === 'completed') {
    primary = { label: 'View bracket →', href: `/tournaments/${t.slug}/bracket` };
    secondary.push({ label: 'Standings', href: `/tournaments/${t.slug}/groups` });
  } else {
    primary = { label: 'View tournament →', href: `/tournaments/${t.slug}` };
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
  if (isMod && status === 'in_progress') {
    adminLinks.push({ label: 'Queue', href: `/admin/tournaments/${t.slug}/queue` });
  }

  const gradientClass =
    status === 'in_progress'
      ? 'from-live via-live/70 to-ink'
      : status === 'registration_open'
      ? 'from-accent via-accent/70 to-ink'
      : status === 'registration_closed'
      ? 'from-warn via-warn/60 to-surface-2'
      : 'from-surface-2 via-surface-2 to-ink/20';

  const pillClass =
    status === 'registration_open'
      ? 'pill pill-open'
      : status === 'in_progress'
      ? 'pill pill-live'
      : 'pill';

  const pillLabel =
    status === 'in_progress'
      ? '● LIVE'
      : status === 'registration_open'
      ? '● OPEN'
      : (STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status).toUpperCase();

  const formatLabel = FORMAT_LABELS[t.format as keyof typeof FORMAT_LABELS] ?? t.format;
  const isLightOverlay = status === 'in_progress' || status === 'registration_open';

  return (
    <article className="card-brutalist-sm overflow-hidden flex flex-col">
      <div className={`aspect-[16/9] relative ${bannerUrl ? '' : `bg-gradient-to-br ${gradientClass}`}`}>
        {bannerUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bannerUrl}
            alt={t.name}
            className="absolute inset-0 w-full h-full object-cover block"
          />
        )}
        <div className="absolute top-4 left-4 z-10">
          <span className={pillClass}>{pillLabel}</span>
        </div>
        <div
          className={`absolute bottom-4 left-4 label-strong z-10 ${
            bannerUrl ? 'text-bg drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]' : isLightOverlay ? 'text-bg/90' : 'text-ink/80'
          }`}
        >
          {formatLabel}
        </div>
      </div>
      <div className="p-6 flex flex-col flex-1">
        <h3 className="font-sans font-black text-2xl leading-tight tracking-tight">{t.name}</h3>
        {t.description && (
          <p className="mt-2 text-sm text-ink/70 leading-relaxed line-clamp-3">{t.description}</p>
        )}

        <div className="mt-5 pt-4 hairline-strong-t flex items-center justify-between label">
          <span className="tabular-nums">
            {t.participant_count ?? 0}
            {t.max_participants ? `/${t.max_participants}` : ''} players
          </span>
          {t.starts_at && (
            <span>
              {new Date(t.starts_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}
        </div>

        <Link
          href={primary.href}
          className="mt-5 w-full bg-ink text-bg font-sans font-bold uppercase tracking-wider text-sm px-4 py-3 border border-ink hover:bg-accent hover:border-accent hover:text-bg transition-colors text-center"
        >
          {primary.label}
        </Link>

        {secondary.length > 0 && (
          <div className="mt-3 flex gap-4 label">
            {secondary.map((s) => (
              <Link key={s.href} href={s.href} className="text-ink/60 hover:text-ink">
                {s.label}
              </Link>
            ))}
          </div>
        )}

        {adminLinks.length > 0 && (
          <div className="mt-4 pt-3 hairline-t flex gap-3 flex-wrap label">
            <span className="text-accent">ADMIN</span>
            {adminLinks.map((a) => (
              <Link key={a.href} href={a.href} className="text-accent hover:text-ink">
                {a.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function BannerFallback() {
  return (
    <svg
      viewBox="0 0 1400 440"
      preserveAspectRatio="xMidYMid slice"
      className="w-full h-full block"
      style={{ color: 'hsl(var(--accent))' }}
      aria-hidden="true"
    >
      <rect width="1400" height="440" fill="currentColor" />
      <g stroke="rgba(255,255,255,0.18)" strokeWidth="2" fill="none">
        <line x1="700" y1="0" x2="700" y2="440" />
        <circle cx="700" cy="220" r="92" />
        <rect x="0" y="116" width="136" height="208" />
        <rect x="0" y="170" width="52" height="100" />
        <rect x="1264" y="116" width="136" height="208" />
        <rect x="1348" y="170" width="52" height="100" />
      </g>
      <circle cx="700" cy="220" r="4" fill="rgba(255,255,255,0.3)" />
    </svg>
  );
}
