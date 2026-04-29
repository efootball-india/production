// PASS-41-TOURNAMENT-LAYOUT (editorial)
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTournamentBySlug, isCurrentUserRegistered, FORMAT_LABELS, STATUS_LABELS } from '@/lib/tournaments';
import { getCurrentPlayer, isProfileComplete } from '@/lib/player';
import { getDrawState } from '@/lib/draw';
import { fixturesExist } from '@/lib/fixtures';
import { registerForTournament, withdrawFromTournament } from '../../actions/tournaments';
import TournamentTabs from '../../../components/TournamentTabs';

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

  const statusLabel = STATUS_LABELS[tournament.status as keyof typeof STATUS_LABELS] ?? tournament.status;
  const formatLabel = FORMAT_LABELS[tournament.format as keyof typeof FORMAT_LABELS] ?? tournament.format;
  const capacityLabel = `${registeredCount}${tournament.max_participants ? ` / ${tournament.max_participants}` : ''} players`;

  return (
    <main className="max-w-[920px] mx-auto px-5 md:px-8 pt-6 md:pt-10 pb-24">

      {/* Breadcrumb */}
      <Link
        href="/tournaments"
        className="label hover:text-default transition-colors inline-block mb-8"
      >
        ← All tournaments
      </Link>

      {/* Header — meta line, then huge name, then description */}
      <header className="mb-10">
        <div className="label mb-4 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-default font-bold">{statusLabel.toUpperCase()}</span>
          <span className="text-disabled">·</span>
          <span>{formatLabel}</span>
          <span className="text-disabled">·</span>
          <span className="tabular-nums">{capacityLabel}</span>
        </div>

        <h1 className="display-h1 mb-6">{tournament.name}.</h1>

        {tournament.description && (
          <p className="text-muted text-base md:text-lg leading-relaxed max-w-2xl">
            {tournament.description}
          </p>
        )}
      </header>

      {/* Action row — register / withdraw / sign in / complete profile */}
      <div className="mb-8">
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
                className="border border-hairline-strong hover:border-ink-strong text-muted hover:text-default transition-colors px-3 py-2 font-mono text-[10px] font-bold tracking-[0.14em] uppercase cursor-pointer"
              >
                Withdraw
              </button>
            </div>
          </form>
        )}

        {player && profileOk && isRegistered && tournament.status !== 'registration_open' && (
          <span className="label-strong text-status-ok">✓ You're in this tournament</span>
        )}
      </div>

      {/* Admin shortcuts */}
      {isAdmin && (
        <div className="border border-hairline bg-status-ok-soft px-4 py-3 mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 label">
          <span className="text-status-ok font-bold">ADMIN</span>
          <Link
            href={`/admin/tournaments/${tournament.slug}/draw`}
            className="text-status-ok hover:text-default transition-colors"
          >
            {drawState.status === 'completed' ? 'Draw' : drawState.status === 'in_progress' ? 'Continue draw' : 'Set up draw'}
          </Link>
          {drawState.status === 'completed' && (
            <Link
              href={`/admin/tournaments/${tournament.slug}/fixtures`}
              className="text-status-ok hover:text-default transition-colors"
            >
              Fixtures
            </Link>
          )}
          {hasFixtures && (
            <Link
              href={`/admin/tournaments/${tournament.slug}/matches`}
              className="text-status-ok hover:text-default transition-colors"
            >
              All matches
            </Link>
          )}
        </div>
      )}

      {/* Mod shortcuts */}
      {isMod && hasFixtures && (
        <div className="border border-hairline bg-status-warn-soft px-4 py-3 mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 label">
          <span className="text-status-warn font-bold">MOD</span>
          <Link
            href={`/admin/tournaments/${tournament.slug}/queue`}
            className="text-status-warn hover:text-default transition-colors"
          >
            Match queue
          </Link>
        </div>
      )}

      {/* Tabs (sticky) */}
      <TournamentTabs slug={tournament.slug} />

      {/* Tab content */}
      <div className="pt-6">
        {children}
      </div>
    </main>
  );
}
