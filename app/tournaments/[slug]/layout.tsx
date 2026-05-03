// PASS-43-TOURNAMENT-LAYOUT (with Rules tab)
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTournamentBySlug, isCurrentUserRegistered, FORMAT_LABELS, STATUS_LABELS } from '@/lib/tournaments';
import { getCurrentPlayer, isProfileComplete } from '@/lib/player';
import { getDrawState } from '@/lib/draw';
import { fixturesExist } from '@/lib/fixtures';
import { registerForTournament, withdrawFromTournament } from '../../actions/tournaments';
import TournamentTabs from '../../../components/TournamentTabs';

type EyebrowTone = 'live' | 'ok' | 'subtle' | 'warn';

function getEyebrow(status: string): { text: string; tone: EyebrowTone } {
  switch (status) {
    case 'in_progress':         return { text: 'LIVE NOW', tone: 'live' };
    case 'registration_open':   return { text: 'REGISTRATION OPEN', tone: 'ok' };
    case 'registration_closed': return { text: 'REGISTRATION CLOSED', tone: 'subtle' };
    case 'completed':           return { text: 'FINAL · CHAMPION CROWNED', tone: 'ok' };
    case 'cancelled':           return { text: 'CANCELLED', tone: 'warn' };
    default:                    return { text: (status ?? 'DRAFT').toUpperCase().replace(/_/g, ' '), tone: 'subtle' };
  }
}

function getDateMeta(status: string, startsAt?: string | null) {
  if (!startsAt) return null;
  const formatted = new Date(startsAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  if (status === 'in_progress' || status === 'completed') {
    return { label: 'Started', value: formatted };
  }
  return { label: 'Starts', value: formatted };
}

export default async function TournamentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const result = await getTournamentBySlug(params.slug);
  if (!result) notFound();
  const { tournament, participants } = result;

  const player = await getCurrentPlayer();
  const isRegistered = player ? await isCurrentUserRegistered(tournament.id) : false;
  const profileOk = player ? isProfileComplete(player) : false;
  const isAdmin = player?.role === 'admin' || player?.role === 'super_admin';
  const isMod = isAdmin || player?.role === 'moderator';
  const drawState = await getDrawState(tournament.id);
  const hasFixtures = await fixturesExist(tournament.id);

  const registeredCount = participants.filter((p: any) => p.status === 'registered').length;
  const capacityFull = tournament.max_participants ? registeredCount >= tournament.max_participants : false;
  const regOpen = tournament.status === 'registration_open' &&
    (!tournament.registration_closes_at || new Date(tournament.registration_closes_at) > new Date());

  const formatLabel = FORMAT_LABELS[tournament.format as keyof typeof FORMAT_LABELS] ?? tournament.format;
  const eyebrow = getEyebrow(tournament.status);
  const dateMeta = getDateMeta(tournament.status, tournament.starts_at);
  const capacityValue = `${registeredCount}${tournament.max_participants ? ` / ${tournament.max_participants}` : ''}`;
  const capacityForBanner = `${registeredCount}${tournament.max_participants ? `/${tournament.max_participants}` : ''} PLAYERS`;

  // Read defensively in case the type hasn't been updated yet
  const bannerUrl: string | null = (tournament as any).banner_image_url ?? null;
  const rulesText: string | null = (tournament as any).rules ?? null;
  const hasRules = !!(rulesText && rulesText.trim().length > 0);

  const eyebrowToneClass =
    eyebrow.tone === 'live'   ? 'text-status-live'
    : eyebrow.tone === 'ok'   ? 'text-status-ok'
    : eyebrow.tone === 'warn' ? 'text-status-warn'
    : 'text-subtle';

  return (
    <main className="max-w-[920px] mx-auto px-5 md:px-8 pt-6 md:pt-10 pb-24">

      {/* Breadcrumb */}
      <Link
        href="/tournaments"
        className="label hover:text-default transition-colors inline-block mb-5"
      >
        ← All tournaments
      </Link>

      {/* Banner */}
      <div className="border border-ink-strong overflow-hidden mb-7 md:mb-8">
        <div className="relative w-full h-[120px] md:h-[220px] bg-card-2">
          {bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bannerUrl}
              alt={tournament.name}
              className="w-full h-full object-cover block"
            />
          ) : (
            <BannerFallback />
          )}
        </div>
      </div>

      {/* Header — Option 2: eyebrow + title + 3-col stat strip */}
      <header className="mb-7 md:mb-8">
        <div className={`label-strong mb-2 md:mb-3 flex items-center gap-2 ${eyebrowToneClass}`}>
          {eyebrow.tone === 'live' && (
            <span className="stripe-live-dot" aria-hidden="true" />
          )}
          {eyebrow.tone === 'ok' && (
            <span
              aria-hidden="true"
              className="inline-block w-[6px] h-[6px] rounded-full bg-accent"
            />
          )}
          <span>{eyebrow.text}</span>
        </div>

        <h1 className="display-h1 mb-5 md:mb-6">{tournament.name}.</h1>

        <div className="hairline-strong-t pt-4 grid grid-cols-3 gap-3 md:gap-6 mb-5 md:mb-6">
          <div className="min-w-0">
            <div className="label mb-1">Format</div>
            <div className="font-sans font-bold text-xs md:text-base text-default truncate">
              {formatLabel}
            </div>
          </div>
          <div className="min-w-0">
            <div className="label mb-1">Capacity</div>
            <div className="font-sans font-bold text-xs md:text-base text-default tabular-nums truncate">
              {capacityValue}
            </div>
          </div>
          {dateMeta ? (
            <div className="min-w-0">
              <div className="label mb-1">{dateMeta.label}</div>
              <div className="font-sans font-bold text-xs md:text-base text-default truncate">
                {dateMeta.value}
              </div>
            </div>
          ) : (
            <div className="min-w-0">
              <div className="label mb-1">Status</div>
              <div className="font-sans font-bold text-xs md:text-base text-default truncate">
                {STATUS_LABELS[tournament.status as keyof typeof STATUS_LABELS] ?? tournament.status}
              </div>
            </div>
          )}
        </div>

        {tournament.description && (
          <p className="text-muted text-base md:text-lg leading-relaxed max-w-2xl">
            {tournament.description}
          </p>
        )}
      </header>
{/* Action row — register / withdraw / sign in / complete profile / offline notice */}
      <div className="mb-6 md:mb-8">
        {(() => {
          const isOfflineRegistration = tournament.slug === 'eftbl-world-cup';

          // Offline-registration tournaments: show notice instead of register flow
          if (isOfflineRegistration && tournament.status === 'registration_open') {
            if (player && profileOk && isRegistered) {
              return (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="label-strong text-status-ok">✓ You're in</span>
                  <span className="label">Registration managed by admin</span>
                </div>
              );
            }
            return (
              <div className="border border-ink-strong bg-card-2 px-5 py-4 max-w-xl">
                <div className="font-mono text-[10px] font-bold tracking-[0.18em] uppercase text-accent mb-2">
                  ★ INVITE ONLY
                </div>
                <div className="text-sm text-ink/80 leading-relaxed">
                  This tournament's registration is managed offline. Contact admin to register.
                </div>
              </div>
            );
          }

          // Normal flow
          return (
            <>
              {!player && (
                <Link
                  href="/signin"
                  className="inline-block bg-accent text-white border border-accent hover:bg-ink hover:border-ink transition-colors px-5 py-3 font-mono text-[11px] font-bold tracking-[0.18em] uppercase"
                >
                  Sign in to register
                </Link>
              )}

              {player && !profileOk && (
                <Link
                  href="/profile/edit"
                  className="inline-block bg-accent text-white border border-accent hover:bg-ink hover:border-ink transition-colors px-5 py-3 font-mono text-[11px] font-bold tracking-[0.18em] uppercase"
                >
                  Complete profile to register
                </Link>
              )}

              {player && profileOk && !isRegistered && regOpen && !capacityFull && (
                <form action={registerForTournament}>
                  <input type="hidden" name="slug" value={tournament.slug} />
                  <button
                    type="submit"
                    className="bg-accent text-white border border-accent hover:bg-ink hover:border-ink transition-colors px-6 py-3 font-mono text-[11px] font-bold tracking-[0.18em] uppercase cursor-pointer"
                  >
                    Register →
                  </button>
                </form>
              )}

              {player && profileOk && !isRegistered && regOpen && capacityFull && (
                <span className="label">Tournament is full</span>
              )}

              {player && profileOk && isRegistered && tournament.status === 'registration_open' && (
                <form action={withdrawFromTournament}>
                  <input type="hidden" name="slug" value={tournament.slug} />
                  <input type="hidden" name="tournament_id" value={tournament.id} />
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="label-strong text-status-ok">✓ You're in</span>
                    <button
                      type="submit"
                      className="border border-hairline-strong hover:border-ink-strong text-default hover:bg-ink hover:text-bg transition-colors px-3 py-2 font-mono text-[10px] font-bold tracking-[0.14em] uppercase cursor-pointer"
                    >
                      Withdraw
                    </button>
                  </div>
                </form>
              )}

              {player && profileOk && isRegistered && tournament.status !== 'registration_open' && (
                <span className="label-strong text-status-ok">✓ You're in this tournament</span>
              )}
            </>
          );
        })()}
      </div>

      {/* Admin shortcuts */}
      {isAdmin && (
        <div className="mb-3">
          <div className="font-mono text-[9px] font-bold tracking-[0.18em] uppercase text-status-ok mb-2">
            ADMIN
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <Link
              href={`/admin/tournaments/${tournament.slug}/draw`}
              className="font-mono text-[10px] font-bold tracking-[0.14em] uppercase border border-ink-strong text-ink hover:bg-status-ok hover:border-status-ok hover:text-white transition-colors px-3 py-2 leading-none"
            >
              {drawState.status === 'completed'
                ? 'Draw'
                : drawState.status === 'in_progress'
                ? 'Continue draw'
                : 'Set up draw'}
            </Link>
            {drawState.status === 'completed' && (
              <Link
                href={`/admin/tournaments/${tournament.slug}/fixtures`}
                className="font-mono text-[10px] font-bold tracking-[0.14em] uppercase border border-ink-strong text-ink hover:bg-status-ok hover:border-status-ok hover:text-white transition-colors px-3 py-2 leading-none"
              >
                Fixtures
              </Link>
            )}
            {hasFixtures && (
              <Link
                href={`/admin/tournaments/${tournament.slug}/matches`}
                className="font-mono text-[10px] font-bold tracking-[0.14em] uppercase border border-ink-strong text-ink hover:bg-status-ok hover:border-status-ok hover:text-white transition-colors px-3 py-2 leading-none"
              >
                All matches
              </Link>
            )}
            <Link
              href={`/admin/tournaments/${tournament.slug}/manage`}
              className="font-mono text-[10px] font-bold tracking-[0.14em] uppercase border border-ink-strong text-ink hover:bg-status-ok hover:border-status-ok hover:text-white transition-colors px-3 py-2 leading-none"
            >
              Manage
            </Link>
          </div>
        </div>
      )}

      {/* Mod shortcuts */}
      {isMod && hasFixtures && (
        <div className="mb-3">
          <div className="font-mono text-[9px] font-bold tracking-[0.18em] uppercase text-status-warn mb-2">
            MOD
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <Link
              href={`/admin/tournaments/${tournament.slug}/queue`}
              className="font-mono text-[10px] font-bold tracking-[0.14em] uppercase border border-ink-strong text-ink hover:bg-status-warn hover:border-status-warn hover:text-white transition-colors px-3 py-2 leading-none"
            >
              Match queue
            </Link>
          </div>
        </div>
      )}

      {/* Tabs (sticky) */}
      <TournamentTabs slug={tournament.slug} hasRules={hasRules} />

      {/* Tab content */}
      <div className="pt-6">
        {children}
      </div>
    </main>
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
