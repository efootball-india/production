'use client';

import { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import MatchEditSheet from './MatchEditSheet';

type Props = {
  match: any;
  slug: string;
  isMod: boolean;
  isOnPath: boolean;
  seedMap: Record<string, string>;
  roundLabel: string;
};

export default function BracketMatchCard({
  match,
  slug,
  isMod,
  isOnPath,
  seedMap,
  roundLabel,
}: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Close the sheet whenever the URL changes (e.g. after server redirect on save)
  useEffect(() => {
    setSheetOpen(false);
  }, [pathname, searchParams]);

  const m = match;
  const winnerId = m.winner_participant_id ?? null;
  const homeIsWinner = !!winnerId && m.home?.id === winnerId;
  const awayIsWinner = !!winnerId && m.away?.id === winnerId;
  const isAwait = m.status === 'awaiting_result';
  const isConfirm = m.status === 'awaiting_confirmation';
  const isDisputed = m.status === 'disputed';
  const isCompleted = m.status === 'completed' || m.status === 'walkover';
  const hasBothPlayers = !!m.home && !!m.away;

  const canEdit = isMod && hasBothPlayers && m.status !== 'pending';

  let cardClass = 'efb-match';
  if (isAwait && hasBothPlayers) cardClass += ' live';
  else if (isConfirm) cardClass += ' confirm';
  else if (isDisputed) cardClass += ' disputed';
  if (isOnPath) cardClass += ' path-win';
  if (canEdit) cardClass += ' editable';

  let footText = '';
  let footClass = '';
  if (m.status === 'walkover') {
    footText = 'WALKOVER';
    footClass = 'aet';
  } else if (isCompleted) {
    if (m.decided_by === 'penalties') {
      footText = 'FINAL · PEN';
      footClass = 'aet';
    } else if (m.decided_by === 'extra_time') {
      footText = 'FINAL · A.E.T.';
      footClass = 'aet';
    } else {
      footText = 'FINAL';
    }
  } else if (isAwait) {
    footText = hasBothPlayers ? 'AWAITING RESULT' : 'PENDING';
    footClass = hasBothPlayers ? 'live' : '';
  } else if (isConfirm) {
    footText = '⚠ AWAITING CONFIRMATION';
    footClass = 'confirm';
  } else if (isDisputed) {
    footText = 'DISPUTED · ADMIN';
    footClass = 'confirm';
  } else if (m.status === 'pending') {
    footText = 'TBD';
  } else if (m.status === 'scheduled') {
    footText = 'SCHEDULED';
  } else {
    footText =
      String(m.status ?? '').toUpperCase().replace(/_/g, ' ') || 'TBD';
  }

  const contextLabel = m.match_number_in_round
    ? `${roundLabel} · MATCH ${m.match_number_in_round}`
    : roundLabel;

  const cardContent = (
    <>
      <Side
        side={m.home}
        score={m.home_score}
        pens={m.decided_by === 'penalties' ? m.home_pens : null}
        isWin={homeIsWinner}
        isLoss={!!winnerId && !homeIsWinner}
        seedMap={seedMap}
      />
      <Side
        side={m.away}
        score={m.away_score}
        pens={m.decided_by === 'penalties' ? m.away_pens : null}
        isWin={awayIsWinner}
        isLoss={!!winnerId && !awayIsWinner}
        seedMap={seedMap}
      />
      <div className={`efb-foot ${footClass}`.trim()}>
        <span className="foot-text">{footText}</span>
        {canEdit && <span className="foot-mod">EDIT →</span>}
      </div>
    </>
  );

  return (
    <>
      {canEdit ? (
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className={cardClass}
          style={{ font: 'inherit', color: 'inherit', textAlign: 'left', padding: 0 }}
        >
          {cardContent}
        </button>
      ) : (
        <div className={cardClass}>{cardContent}</div>
      )}

      {canEdit && sheetOpen && (
        <MatchEditSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          matchId={m.id}
          slug={slug}
          isKnockout={true}
          contextLabel={contextLabel}
          home={{
            id: m.home.id,
            country: m.home.country?.name ?? 'TBD',
            handle: m.home.player?.username ?? '?',
            seedLabel: seedMap[m.home.id] ?? undefined,
          }}
          away={{
            id: m.away.id,
            country: m.away.country?.name ?? 'TBD',
            handle: m.away.player?.username ?? '?',
            seedLabel: seedMap[m.away.id] ?? undefined,
          }}
          initialHomeScore={m.home_score}
          initialAwayScore={m.away_score}
          initialHomePens={m.home_pens}
          initialAwayPens={m.away_pens}
          initialDecidedBy={m.decided_by}
          returnTo={`/tournaments/${slug}/bracket`}
        />
      )}
    </>
  );
}

function Side({
  side,
  score,
  pens,
  isWin,
  isLoss,
  seedMap,
}: {
  side: any;
  score: number | null;
  pens: number | null;
  isWin: boolean;
  isLoss: boolean;
  seedMap: Record<string, string>;
}) {
  if (!side) {
    return (
      <div className="efb-side tbd">
        <div className="efb-team">
          <span className="efb-name">TBD</span>
        </div>
        <span className="efb-score">—</span>
      </div>
    );
  }
  const country = side.country?.name ?? 'TBD';
  const handle = side.player?.username ?? side.player?.display_name ?? '';
  const seed = seedMap[side.id] ?? '';
  const handleStr = [seed, handle].filter(Boolean).join(' · ');

  let className = 'efb-side';
  if (isWin) className += ' win';
  else if (isLoss) className += ' loss';

  return (
    <div className={className}>
      <div className="efb-team">
        <span className="efb-name">{country}</span>
        {handleStr && <span className="efb-handle">{handleStr}</span>}
      </div>
      {score == null ? (
        <span className="efb-score efb-score-empty">—</span>
      ) : (
        <span className="efb-score">
          {score}
          {pens != null && <span className="pen">{pens}</span>}
        </span>
      )}
    </div>
  );
}
