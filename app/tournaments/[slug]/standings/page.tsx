// PASS-44-STANDINGS-TAB (editorial · group cards)
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getGroupStandings } from '@/lib/fixtures';

export default async function StandingsTab({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id')
    .eq('slug', params.slug)
    .maybeSingle();
  if (!tournament) notFound();

  const { data: stage } = await supabase
    .from('stages')
    .select('id')
    .eq('tournament_id', tournament.id)
    .eq('stage_type', 'groups')
    .maybeSingle();

  if (!stage) {
    return (
      <EmptyState
        title="Group stage hasn't started"
        body="Standings will appear here once the group draw is complete and fixtures are generated."
      />
    );
  }

  const { data: groups } = await supabase
    .from('groups')
    .select('id, name, position')
    .eq('stage_id', stage.id)
    .order('position', { ascending: true });

  if (!groups || groups.length === 0) {
    return (
      <EmptyState
        title="No groups yet"
        body="Waiting for the draw to complete. Group standings appear once players are placed."
      />
    );
  }

  const groupsWithStandings = await Promise.all(
    groups.map(async (g) => ({
      group: g,
      standings: await getGroupStandings(g.id),
    }))
  );

  const totalPlayers = groupsWithStandings.reduce(
    (n, { standings }) => n + standings.length,
    0
  );
  const completedGroups = groupsWithStandings.filter(({ standings }) => {
    const size = standings.length;
    if (size === 0) return false;
    const expected = (size * (size - 1)) / 2;
    const played = Math.floor(
      standings.reduce((s: number, x: any) => s + (x.played ?? 0), 0) / 2
    );
    return played === expected;
  }).length;

  return (
    <>
      <Styles />
      <div className="ef-st-page">
        <header className="ef-st-head">
          <h2 className="ef-st-title">
            Standings
            <span className="ef-st-ct">
              /{String(groupsWithStandings.length).padStart(2, '0')}
            </span>
          </h2>
          <div className="ef-st-sub">
            {groupsWithStandings.length} GROUPS · {totalPlayers} PLAYERS · {completedGroups}/
            {groupsWithStandings.length} COMPLETE
          </div>
        </header>

        <div className="ef-st-cards">
          {groupsWithStandings.map(({ group, standings }) => (
            <GroupCard
              key={group.id}
              group={group}
              standings={standings as any[]}
            />
          ))}
        </div>
      </div>
    </>
  );
}

function GroupCard({
  group,
  standings,
}: {
  group: { id: string; name: string };
  standings: any[];
}) {
  const letter = extractLetter(group.name);
  const groupSize = standings.length;
  const expected = (groupSize * (groupSize - 1)) / 2;
  const played = Math.floor(
    standings.reduce((s, x) => s + (x.played ?? 0), 0) / 2
  );
  const status: 'pending' | 'live' | 'final' =
    expected === 0 || played === 0
      ? 'pending'
      : played === expected
      ? 'final'
      : 'live';

  const subline =
    status === 'final'
      ? `Complete · ${played}/${expected} played`
      : status === 'live'
      ? `In progress · ${played}/${expected} played`
      : `Awaiting first match · 0/${expected} played`;

  return (
    <div className="ef-card">
      <div className="ef-card-head">
        <span className="ef-letter">{letter}</span>
        <div className="ef-info">
          <span className="ef-info-lbl">GROUP {letter}</span>
          <span className="ef-info-name">{subline}</span>
        </div>
        <StatusPill status={status} played={played} expected={expected} />
      </div>

      <div className="ef-table-head">
        <span className="left">#</span>
        <span className="left">TEAM</span>
        <span>W-D-L</span>
        <span>PTS</span>
      </div>

      {standings.length === 0 ? (
        <div className="ef-empty-row">No participants drawn yet</div>
      ) : (
        standings.map((s) => {
          const rowClass = getRowClass(s.position, groupSize);
          const draws = Math.max(
            0,
            (s.played ?? 0) - (s.wins ?? 0) - (s.losses ?? 0)
          );
          return (
            <div key={s.participant_id} className={`ef-row ${rowClass}`}>
              <span className="ef-pos">{s.position}</span>
              <div className="ef-team">
                <div className="ef-team-line">
                  <span className="ef-cntry">
                    {s.country?.name ?? 'TBD'}
                  </span>
                  {s.needs_tiebreaker && <span className="ef-tie">TIE</span>}
                </div>
              </div>
              <span className="ef-rec">
                {s.wins ?? 0}-{draws}-{s.losses ?? 0}
              </span>
              <span className="ef-pts">{s.points ?? 0}</span>
            </div>
          );
        })
      )}
    </div>
  );
}

function StatusPill({
  status,
  played,
  expected,
}: {
  status: 'pending' | 'live' | 'final';
  played: number;
  expected: number;
}) {
  if (status === 'final') {
    return <span className="ef-pill ef-pill-done">FINAL</span>;
  }
  if (status === 'live') {
    return (
      <span className="ef-pill ef-pill-live">
        LIVE · {played}/{expected}
      </span>
    );
  }
  return <span className="ef-pill ef-pill-pending">PENDING</span>;
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="ef-st-empty">
      <div className="ef-st-empty-title">{title}.</div>
      <p className="ef-st-empty-body">{body}</p>
    </div>
  );
}

function extractLetter(name: string): string {
  const stripped = name.replace(/^group\s+/i, '').trim();
  if (!stripped) return '?';
  return stripped.length === 1 ? stripped.toUpperCase() : stripped.charAt(0).toUpperCase();
}

function getRowClass(position: number, groupSize: number): string {
  if (position <= 2) return 'qualify';
  if (groupSize === 4 && position === 3) return 'bestthird';
  if (position === groupSize) return 'eliminated';
  return '';
}

function Styles() {
  return (
    <style>{`
      .ef-st-page { display: flex; flex-direction: column; gap: 20px; }

      .ef-st-head { padding-bottom: 4px; }
      .ef-st-title {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900;
        font-size: 32px;
        line-height: 0.92;
        letter-spacing: -0.03em;
        color: hsl(var(--ink));
        margin: 0 0 8px;
      }
      @media (min-width: 768px) {
        .ef-st-title { font-size: 40px; }
      }
      .ef-st-ct {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 14px;
        font-weight: 500;
        color: hsl(var(--ink) / 0.42);
        letter-spacing: 0.06em;
        margin-left: 10px;
        vertical-align: middle;
      }
      .ef-st-sub {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px;
        font-weight: 500;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: hsl(var(--ink) / 0.42);
        line-height: 1.5;
      }

      .ef-st-cards {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .ef-card {
        background: hsl(var(--surface));
        border: 1px solid hsl(var(--ink) / 0.20);
      }

      .ef-card-head {
        display: grid;
        grid-template-columns: 44px minmax(0, 1fr) auto;
        gap: 14px;
        align-items: center;
        padding: 14px 16px;
        border-bottom: 1px solid hsl(var(--ink) / 0.08);
      }
      .ef-letter {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900;
        font-size: 40px;
        line-height: 1;
        letter-spacing: -0.04em;
        text-align: center;
        color: hsl(var(--ink));
      }
      .ef-info {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .ef-info-lbl {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: hsl(var(--ink) / 0.42);
        line-height: 1;
      }
      .ef-info-name {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 800;
        font-size: 14px;
        line-height: 1;
        letter-spacing: -0.01em;
        color: hsl(var(--ink));
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .ef-pill {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        padding: 5px 8px;
        white-space: nowrap;
        border: 1px solid hsl(var(--ink) / 0.20);
        color: hsl(var(--ink) / 0.62);
        line-height: 1;
      }
      .ef-pill-done {
        background: hsl(var(--ink));
        border-color: hsl(var(--ink));
        color: hsl(var(--bg));
      }
      .ef-pill-live {
        background: hsl(var(--live));
        border-color: hsl(var(--live));
        color: #fff;
        display: inline-flex;
        align-items: center;
        gap: 5px;
      }
      .ef-pill-live::before {
        content: '';
        width: 5px;
        height: 5px;
        background: #fff;
        border-radius: 50%;
        animation: ef-pulse 1.4s ease-in-out infinite;
      }
      @keyframes ef-pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(0.85); }
      }
      .ef-pill-pending {
        color: hsl(var(--ink) / 0.42);
      }

      .ef-table-head {
        display: grid;
        grid-template-columns: 22px minmax(0, 1fr) 56px 32px;
        gap: 6px;
        align-items: center;
        padding: 6px 16px;
        background: hsl(var(--surface-2));
        border-bottom: 1px solid hsl(var(--ink) / 0.08);
      }
      .ef-table-head span {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: hsl(var(--ink) / 0.42);
        text-align: center;
      }
      .ef-table-head span.left { text-align: left; }

      .ef-row {
        display: grid;
        grid-template-columns: 22px minmax(0, 1fr) 56px 32px;
        gap: 6px;
        align-items: center;
        padding: 9px 16px;
        border-bottom: 1px solid hsl(var(--ink) / 0.08);
      }
      .ef-row:last-child { border-bottom: none; }
      .ef-row.qualify {
        background: hsl(var(--accent) / 0.08);
        border-left: 3px solid hsl(var(--accent));
        padding-left: 13px;
      }
      .ef-row.bestthird {
        border-left: 3px solid hsl(var(--warn));
        padding-left: 13px;
      }
      .ef-row.eliminated { opacity: 0.42; }

      .ef-pos {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900;
        font-size: 18px;
        line-height: 1;
        letter-spacing: -0.02em;
        color: hsl(var(--ink));
      }
      .ef-row.qualify .ef-pos { color: hsl(var(--accent)); }
      .ef-row.bestthird .ef-pos { color: hsl(var(--warn)); }

      .ef-team {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .ef-team-line {
        display: flex;
        align-items: center;
        gap: 6px;
        line-height: 1;
        min-width: 0;
      }
      .ef-cntry {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 800;
        font-size: 14px;
        letter-spacing: -0.01em;
        line-height: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: hsl(var(--ink));
      }
      .ef-tie {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 8px;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        padding: 1px 4px;
        background: hsl(var(--warn));
        color: #fff;
        line-height: 1;
        flex-shrink: 0;
      }

      .ef-rec {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 11px;
        font-weight: 600;
        color: hsl(var(--ink) / 0.62);
        text-align: center;
        letter-spacing: 0.04em;
        font-variant-numeric: tabular-nums;
      }
      .ef-row.qualify .ef-rec {
        color: hsl(var(--ink));
        font-weight: 700;
      }

      .ef-pts {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900;
        font-size: 22px;
        text-align: right;
        line-height: 1;
        letter-spacing: -0.025em;
        color: hsl(var(--ink));
        font-variant-numeric: tabular-nums;
      }
      .ef-row.qualify .ef-pts { color: hsl(var(--accent)); }

      .ef-empty-row {
        padding: 16px;
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px;
        font-weight: 500;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: hsl(var(--ink) / 0.42);
        text-align: center;
      }

      .ef-st-empty {
        text-align: center;
        padding: 48px 24px;
        border: 1px dashed hsl(var(--ink) / 0.20);
        background: hsl(var(--surface));
      }
      .ef-st-empty-title {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900;
        font-size: 24px;
        line-height: 1;
        letter-spacing: -0.025em;
        color: hsl(var(--ink));
        margin-bottom: 10px;
      }
      .ef-st-empty-body {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        color: hsl(var(--ink) / 0.62);
        max-width: 440px;
        margin: 0 auto;
      }
    `}</style>
  );
}
