'use client';

import { useState } from 'react';
import MatchEditSheet from './MatchEditSheet';

type WinnerSide = 'home' | 'away' | 'draw' | null;

type Props = {
  match: any;
  slug: string;
  isMod: boolean;
  isKnockout: boolean;
};

const ROUND_LABELS: Record<number, string> = {
  1: 'R32',
  2: 'R16',
  3: 'QF',
  4: 'SF',
  5: 'F',
};

function getWinner(match: any): WinnerSide {
  if (match.status !== 'completed' && match.status !== 'walkover') return null;
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

export default function MatchRowWithEdit({ match, slug, isMod, isKnockout }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);

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
  const isComplete = status === 'completed' || status === 'walkover';
  const winner = getWinner(match);

  // Has both players assigned? Required for editing.
  const hasBothPlayers = !!home && !!away;
  const canEdit = isMod && hasBothPlayers && status !== 'pending';

  let statusEl: React.ReactNode = null;
  if (status === 'walkover') {
    statusEl = <span className="label-strong" style={{ color: 'hsl(var(--warn))' }}>Walkover</span>;
  } else if (isPending) {
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

  let centerEl: React.ReactNode;
  if (isComplete || isAwaiting) {
    const hs = match.home_score ?? 0;
    const as_ = match.away_score ?? 0;
    if (match.decided_by === 'penalties' && isComplete) {
      const hp = match.home_pens ?? 0;
      const ap = match.away_pens ?? 0;
      centerEl = (
        <div className="text-center flex-shrink-0">
          <div className="font-sans font-black text-[22px] tabular-nums tracking-tight leading-none whitespace-nowrap text-default">
            {hs} — {as_}
          </div>
          <div className="label mt-1 whitespace-nowrap">{hp}-{ap} PEN</div>
        </div>
      );
    } else {
      centerEl = (
        <span className="font-sans font-black text-[22px] tabular-nums tracking-tight leading-none whitespace-nowrap text-default flex-shrink-0">
          {hs} — {as_}
        </span>
      );
    }
  } else {
    centerEl = <span className="label tracking-[0.16em] flex-shrink-0">VS</span>;
  }

  const stageLabel = isKnockout
    ? ROUND_LABELS[match.round] ?? `R${match.round}`
    : `MD${match.matchday}`;
  const matchNum = match.match_number_in_round ?? '';
  const contextLabel = matchNum
    ? `${stageLabel} · MATCH ${matchNum}`
    : stageLabel;

  const cardContent = (
    <>
      {(groupLabel || statusEl || canEdit) && (
        <div className="flex justify-between items-center mb-3.5 gap-2">
          <div className="flex items-center gap-2">
            <span className="label">{groupLabel ? `Group ${groupLabel}` : ''}</span>
            {canEdit && (
              <span
                className="font-mono text-[9px] font-bold tracking-[0.14em] uppercase text-accent"
                style={{ color: 'hsl(var(--accent))' }}
              >
                EDIT →
              </span>
            )}
          </div>
          {statusEl}
        </div>
      )}
      <div className="max-w-[480px] mx-auto flex items-center gap-4 justify-between">
        <PlayerSide
          username={homeUsername}
          country={homeCountry}
          dimmed={(isComplete) && winner === 'away'}
          align="left"
        />
        {centerEl}
        <PlayerSide
          username={awayUsername}
          country={awayCountry}
          dimmed={(isComplete) && winner === 'home'}
          align="right"
        />
      </div>
    </>
  );

  return (
    <>
      {canEdit ? (
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="bg-card border border-hairline px-4 md:px-5 py-3.5 md:py-4 text-left w-full hover:border-ink-strong transition-colors"
          style={{ font: 'inherit', color: 'inherit', cursor: 'pointer' }}
        >
          {cardContent}
        </button>
      ) : (
        <article className="bg-card border border-hairline px-4 md:px-5 py-3.5 md:py-4">
          {cardContent}
        </article>
      )}

    {canEdit && sheetOpen && (
        <MatchEditSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          matchId={match.id}
          slug={slug}
          isKnockout={isKnockout}
          contextLabel={contextLabel}
          home={{
            id: home.id,
            country: homeCountry,
            handle: homeUsername ?? '?',
          }}
          away={{
            id: away.id,
            country: awayCountry,
            handle: awayUsername ?? '?',
          }}
          initialHomeScore={match.home_score}
          initialAwayScore={match.away_score}
          initialHomePens={match.home_pens}
          initialAwayPens={match.away_pens}
          initialDecidedBy={match.decided_by}
          returnTo={`/tournaments/${slug}${isKnockout ? '/bracket' : ''}`}
        />
      )}
    </>
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
    ? 'flex flex-col items-end gap-[7px] flex-1 min-w-0'
    : 'flex flex-col items-start gap-[7px] flex-1 min-w-0';

  const pillClass = `handle-pill handle-pill-sm ${dimmed ? 'handle-pill-eliminated' : ''} max-w-full`;
  const countryClass = `text-[15px] font-medium truncate max-w-full ${dimmed ? 'text-subtle' : 'text-default'}`;

  return (
    <div className={wrapperClass}>
      {username ? (
        <span className={pillClass}>
          <span className="truncate min-w-0">{username}</span>
        </span>
      ) : (
        <span className="label-strong">TBD</span>
      )}
      <span className={countryClass}>
        {country}
      </span>
    </div>
  );
}
