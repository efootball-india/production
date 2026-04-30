// PASS-46-PLAYERS-TAB (editorial · linked profiles)
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PLATFORM_LABELS } from '@/lib/player';
import { getConsistencyRanking } from '@/lib/consistency';
import type { Tier } from '@/lib/consistency';

export default async function PlayersTab({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id')
    .eq('slug', params.slug)
    .maybeSingle();
  if (!tournament) notFound();

  const { data: participants } = await supabase
    .from('tournament_participants')
    .select(`
      id, status, player_id,
      player:players(username, display_name, platform, region, discord_handle, avatar_url),
      country:countries(name, group_label)
    `)
    .eq('tournament_id', tournament.id)
    .order('id');

  const active = (participants ?? []).filter((p: any) => p.status === 'registered');

  // Get consistency for ranked players (single batched call)
  const ranking = await getConsistencyRanking();
  const consistencyByPlayerId = new Map<string, { tier: Tier; rank: number; points: number }>();
  for (const e of ranking) {
    consistencyByPlayerId.set(e.playerId, {
      tier: e.tier,
      rank: e.rank,
      points: e.points,
    });
  }

  if (active.length === 0) {
    return (
      <>
        <Styles />
        <div className="ptab-empty">
          No registrations yet.
        </div>
      </>
    );
  }

  return (
    <>
      <Styles />
      <div className="ptab-wrap">
        <div className="ptab-head">REGISTERED · {active.length}</div>
        <div className="ptab-list">
          {active.map((p: any) => {
            const username = p.player?.username;
            const displayName = p.player?.display_name ?? username ?? '?';
            const initial = (displayName.charAt(0) || '?').toUpperCase();
            const avatarUrl = p.player?.avatar_url ?? null;
            const cons = p.player_id ? consistencyByPlayerId.get(p.player_id) : null;
            const isUnranked = !cons || cons.tier === 'unranked' || cons.points < 100;

            const rowContent = (
              <>
                <div
                  className="ptab-avatar"
                  style={
                    avatarUrl
                      ? {
                          backgroundImage: `url(${avatarUrl})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }
                      : undefined
                  }
                >
                  {!avatarUrl && <span>{initial}</span>}
                </div>

                <div className="ptab-body">
                  <div className="ptab-name-row">
                    <span className="ptab-name">{displayName}</span>
                    {p.country?.group_label && (
                      <span className="ptab-group">GROUP {p.country.group_label}</span>
                    )}
                  </div>
                  <div className="ptab-meta">
                    {p.country?.name && <span>{p.country.name}</span>}
                    {p.player?.platform && (
                      <span>· {(PLATFORM_LABELS as any)[p.player.platform] ?? p.player.platform}</span>
                    )}
                    {p.player?.region && <span>· {p.player.region}</span>}
                  </div>
                </div>

                <div className="ptab-rank">
                  {!isUnranked && cons ? (
                    <>
                      <span className={`ptab-tier-pill tier-${cons.tier}`}>
                        {cons.tier.toUpperCase()}
                      </span>
                      <span className="ptab-pts">{cons.points}</span>
                    </>
                  ) : (
                    <span className="ptab-tier-pill tier-unranked">UNRANKED</span>
                  )}
                </div>
              </>
            );

           return username ? (
              <Link
                key={p.id}
                href={`/players/${username}?from=/tournaments/${params.slug}/players`}
                className="ptab-row clickable"
              >
                {rowContent}
              </Link>
            ) : (
              <div key={p.id} className="ptab-row">
                {rowContent}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function Styles() {
  return (
    <style>{`
      .ptab-wrap { display: block; }

      .ptab-head {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px; font-weight: 700;
        letter-spacing: 0.18em; text-transform: uppercase;
        color: hsl(var(--ink) / 0.42);
        margin-bottom: 10px;
        padding-bottom: 8px;
        border-bottom: 1px solid hsl(var(--ink));
      }

      .ptab-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .ptab-row {
        display: grid;
        grid-template-columns: 36px 1fr auto;
        gap: 12px;
        align-items: center;
        background: hsl(var(--surface));
        border: 1px solid hsl(var(--ink) / 0.20);
        padding: 10px 14px;
        text-decoration: none;
        color: inherit;
      }
      .ptab-row.clickable {
        transition: border-color 0.15s ease, background 0.15s ease;
      }
      .ptab-row.clickable:hover {
        border-color: hsl(var(--ink));
        background: hsl(var(--ink) / 0.04);
      }

      .ptab-avatar {
        width: 36px; height: 36px;
        background: hsl(var(--ink));
        color: hsl(var(--bg));
        display: flex; align-items: center; justify-content: center;
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 800; font-size: 14px;
        flex-shrink: 0;
      }

      .ptab-body { min-width: 0; }
      .ptab-name-row {
        display: flex; align-items: baseline;
        gap: 8px; margin-bottom: 3px;
      }
      .ptab-name {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 800; font-size: 13px;
        letter-spacing: -0.005em;
        color: hsl(var(--ink));
        line-height: 1.2;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        min-width: 0;
      }
      .ptab-group {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 8px; font-weight: 700;
        letter-spacing: 0.14em;
        color: hsl(var(--accent));
        background: hsl(var(--accent) / 0.10);
        padding: 2px 6px;
        flex-shrink: 0;
      }
      .ptab-meta {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px; font-weight: 500;
        letter-spacing: 0.10em;
        color: hsl(var(--ink) / 0.62);
        text-transform: uppercase;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .ptab-meta span { margin-right: 4px; }

      .ptab-rank {
        display: flex; flex-direction: column;
        align-items: flex-end; gap: 4px;
        flex-shrink: 0;
      }
      .ptab-tier-pill {
        display: inline-block;
        padding: 2px 7px;
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 8px; font-weight: 700;
        letter-spacing: 0.14em;
        line-height: 1.4;
      }
      .ptab-tier-pill.tier-diamond { background: #C7A4DD; color: #3C2A4D; }
      .ptab-tier-pill.tier-platinum { background: #B5D4F4; color: #042C53; }
      .ptab-tier-pill.tier-gold { background: #FAC775; color: #633806; }
      .ptab-tier-pill.tier-silver { background: #D3D1C7; color: #2C2C2A; }
      .ptab-tier-pill.tier-bronze { background: #F5C4B3; color: #4A1B0C; }
      .ptab-tier-pill.tier-unranked {
        background: transparent;
        color: hsl(var(--ink) / 0.42);
        border: 1px solid hsl(var(--ink) / 0.20);
      }
      .ptab-pts {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900; font-size: 13px;
        color: hsl(var(--accent));
        font-variant-numeric: tabular-nums;
        line-height: 1;
      }

      .ptab-empty {
        text-align: center;
        padding: 40px 20px;
        border: 1px dashed hsl(var(--ink) / 0.20);
        background: hsl(var(--surface));
        font-family: var(--font-sans), system-ui, sans-serif;
        font-size: 13px;
        color: hsl(var(--ink) / 0.62);
      }
    `}</style>
  );
}
