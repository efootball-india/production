import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import DangerActionButton from '../../../../../components/DangerActionButton';
import { createClient } from '@/lib/supabase/server';
import { getCurrentPlayer } from '@/lib/player';
import { FORMAT_LABELS } from '@/lib/tournaments';
import { updateTournament, cancelTournament } from '../../../../actions/tournaments';
import { resetKnockoutBracket } from '../../../../actions/knockout';
import AddPlayersSheet from '../../../../../components/AddPlayersSheet';
import PlayerRowActions from '../../../../../components/PlayerRowActions';
// Players tab data
  let participants: any[] = [];
  let allPlayers: any[] = [];
  if (tab === 'players') {
    const [pResult, allResult] = await Promise.all([
      supabase
        .from('tournament_participants')
        .select(`
          id, status, player_id, country_id,
          player:players(username, display_name, avatar_url, role, platform),
          country:countries(name, group_label)
        `)
        .eq('tournament_id', tournament.id)
        .order('id'),
      supabase
        .from('players')
        .select('id, username, display_name, avatar_url')
        .order('username'),
    ]);
    participants = pResult.data ?? [];
    allPlayers = (allResult.data ?? []).map((p: any) => ({
      id: p.id,
      username: p.username,
      displayName: p.display_name,
      avatarUrl: p.avatar_url,
    }));
  }

export default async function ManageTournamentPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { tab?: string; error?: string; saved?: string; cancelled?: string; added?: string; removed?: string; withdrew?: string; country_changed?: string; role_changed?: string };
}) {
  const player = await getCurrentPlayer();
  if (!player) redirect('/signin');
  if (player.role !== 'admin' && player.role !== 'super_admin') redirect('/');

  const supabase = createClient();
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('*')
    .eq('slug', params.slug)
    .maybeSingle();
  if (!tournament) notFound();

  const { data: koStage } = await supabase
    .from('stages')
    .select('id')
    .eq('tournament_id', tournament.id)
    .eq('stage_type', 'single_elimination')
    .maybeSingle();

  let koPlayed = 0;
  if (koStage) {
    const { count } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('stage_id', koStage.id)
      .not('home_score', 'is', null);
    koPlayed = count ?? 0;
  }

  const { count: registeredCount } = await supabase
    .from('tournament_participants')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', tournament.id)
    .eq('status', 'registered');

  const tab = searchParams.tab === 'players' ? 'players' : searchParams.tab === 'activity' ? 'activity' : 'settings';

  return (
    <>
      <Styles />
      <main className="mg-page">
        <Link href={`/tournaments/${tournament.slug}`} className="mg-back">
          ← {tournament.name}
        </Link>

        <header className="mg-head">
          <div className="mg-eyebrow">ADMIN · TOURNAMENT MANAGEMENT</div>
          <h1 className="mg-title">
            Manage <span className="accent">tournament.</span>
          </h1>
          <div className="mg-sub">
            {tournament.name.toUpperCase()} · SETTINGS, PLAYERS, HISTORY
          </div>
        </header>

        <nav className="mg-tabs">
          <Link
            href={`/admin/tournaments/${tournament.slug}/manage`}
            className={`mg-tab ${tab === 'settings' ? 'active' : ''}`}
          >
            Settings
          </Link>
          <Link
            href={`/admin/tournaments/${tournament.slug}/manage?tab=players`}
            className={`mg-tab ${tab === 'players' ? 'active' : ''}`}
          >
            Players · {registeredCount ?? 0}
          </Link>
          <Link
            href={`/admin/tournaments/${tournament.slug}/manage?tab=activity`}
            className={`mg-tab ${tab === 'activity' ? 'active' : ''}`}
          >
            Activity
          </Link>
        </nav>

        {searchParams.saved && (
          <div className="mg-banner mg-banner-ok">
            <span className="dot" />
            <span>SETTINGS SAVED.</span>
          </div>
        )}
        {searchParams.cancelled && (
          <div className="mg-banner mg-banner-warn">
            <span className="dot" />
            <span>TOURNAMENT CANCELLED.</span>
          </div>
        )}
        {searchParams.added && (
          <div className="mg-banner mg-banner-ok">
            <span className="dot" />
            <span>ADDED {searchParams.added} PLAYER{searchParams.added === '1' ? '' : 'S'}.</span>
          </div>
        )}
        {searchParams.removed && (
          <div className="mg-banner mg-banner-ok">
            <span className="dot" />
            <span>PLAYER REMOVED.</span>
          </div>
        )}
        {searchParams.withdrew && (
          <div className="mg-banner mg-banner-ok">
            <span className="dot" />
            <span>PLAYER WITHDRAWN. PENDING MATCHES SET TO WALKOVER.</span>
          </div>
        )}
        {searchParams.country_changed && (
          <div className="mg-banner mg-banner-ok">
            <span className="dot" />
            <span>COUNTRY UPDATED.</span>
          </div>
        )}
        {searchParams.role_changed && (
          <div className="mg-banner mg-banner-ok">
            <span className="dot" />
            <span>ROLE UPDATED.</span>
          </div>
        )}
        {searchParams.error && (
          <div className="mg-banner mg-banner-warn">
            <span className="dot" />
            <span>{searchParams.error.toUpperCase()}</span>
          </div>
        )}

        {tab === 'settings' && (
          <SettingsTab tournament={tournament} koPlayed={koPlayed} />
        )}
        {tab === 'players' && (
          <PlayersTab
            slug={tournament.slug}
            participants={participants}
            allPlayers={allPlayers}
            currentUserId={player.id}
          />
        )}
        {tab === 'activity' && <ActivityTabStub />}
      </main>
    </>
  );
}

function SettingsTab({ tournament, koPlayed }: { tournament: any; koPlayed: number }) {
  const formatLabel = FORMAT_LABELS[tournament.format as keyof typeof FORMAT_LABELS] ?? tournament.format;

  const fmtDateTimeLocal = (iso: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const isCancelled = tournament.status === 'cancelled';
  const canResetBracket = koPlayed === 0;

  return (
    <>
      <form action={updateTournament}>
        <input type="hidden" name="slug" value={tournament.slug} />

        <section className="mg-section">
          <div className="mg-section-head">BASICS</div>

          <div className="mg-field">
            <label htmlFor="mg-name" className="mg-label">
              Name <span className="required">·</span>
            </label>
            <input
              id="mg-name"
              name="name"
              type="text"
              className="mg-input"
              defaultValue={tournament.name}
              maxLength={80}
              required
            />
          </div>

          <div className="mg-field">
            <label htmlFor="mg-description" className="mg-label">Description</label>
            <textarea
              id="mg-description"
              name="description"
              className="mg-input mg-textarea"
              defaultValue={tournament.description ?? ''}
              maxLength={500}
            />
          </div>

          <div className="mg-field">
            <label htmlFor="mg-banner" className="mg-label">Banner image URL</label>
            <input
              id="mg-banner"
              name="banner_image_url"
              type="url"
              className="mg-input"
              defaultValue={tournament.banner_image_url ?? ''}
              placeholder="https://..."
            />
            <div className="mg-hint">
              Direct link to a 16:9 image. Leave empty to show the default pitch graphic.
            </div>
          </div>

          <div className="mg-field">
            <label className="mg-label">Format</label>
            <input
              type="text"
              className="mg-input mg-input-disabled"
              value={formatLabel}
              disabled
            />
            <div className="mg-hint">Cannot be changed after tournament creation.</div>
          </div>
        </section>

        <section className="mg-section">
          <div className="mg-section-head">CAPACITY & DATES</div>

          <div className="mg-field">
            <label htmlFor="mg-max" className="mg-label">Max participants</label>
            <input
              id="mg-max"
              name="max_participants"
              type="number"
              className="mg-input"
              defaultValue={tournament.max_participants ?? ''}
              min={2}
              max={256}
            />
          </div>

          <div className="mg-grid-2">
            <div className="mg-field">
              <label htmlFor="mg-reg-close" className="mg-label">Registration closes</label>
              <input
                id="mg-reg-close"
                name="registration_closes_at"
                type="datetime-local"
                className="mg-input"
                defaultValue={fmtDateTimeLocal(tournament.registration_closes_at)}
              />
            </div>
            <div className="mg-field">
              <label htmlFor="mg-starts" className="mg-label">Tournament starts</label>
              <input
                id="mg-starts"
                name="starts_at"
                type="datetime-local"
                className="mg-input"
                defaultValue={fmtDateTimeLocal(tournament.starts_at)}
              />
            </div>
          </div>
        </section>

        <section className="mg-section">
          <div className="mg-section-head">RULES (markdown)</div>
          <div className="mg-field">
            <textarea
              name="rules"
              className="mg-input mg-textarea-large"
              defaultValue={tournament.rules ?? ''}
              placeholder="## Match Format&#10;Best-of-1 group stage matches.&#10;&#10;## Disputes&#10;Disputed scores are reviewed by admins."
              maxLength={5000}
            />
            <div className="mg-hint">
              Supports markdown — headers (## ###), lists (-), bold (**text**), links ([text](url)).
              Visible to all players on the tournament's Rules tab.
            </div>
          </div>
        </section>

        <div className="mg-actions">
          <Link
            href={`/tournaments/${tournament.slug}`}
            className="mg-btn mg-btn-secondary"
          >
            Cancel
          </Link>
          <button type="submit" className="mg-btn mg-btn-primary">
            Save changes →
          </button>
        </div>
      </form>

      <div className="mg-danger">
        <div className="mg-danger-head">
          <span className="dot" />
          <span>DANGER ZONE</span>
        </div>

        <div className="mg-danger-row">
          <div className="mg-danger-info">
            <div className="mg-danger-name">Reset bracket</div>
            <div className="mg-danger-desc">
              Delete all knockout matches and start fresh. Only allowed if no KO match has been played.
            </div>
          </div>
          <DangerActionButton
            formAction={resetKnockoutBracket}
            slug={tournament.slug}
            disabled={!canResetBracket}
            disabledLabel={`Locked · ${koPlayed} played`}
            label="Reset bracket"
            confirmMessage="Reset bracket? This deletes all current KO matches and seeds. Cannot be undone."
          />
        </div>

        {!isCancelled && (
          <div className="mg-danger-row">
            <div className="mg-danger-info">
              <div className="mg-danger-name">Cancel tournament</div>
              <div className="mg-danger-desc">
                Mark this tournament as cancelled. Data is preserved but the tournament becomes read-only.
              </div>
            </div>
            <DangerActionButton
              formAction={cancelTournament}
              slug={tournament.slug}
              label="Cancel tournament"
              confirmMessage="Cancel this tournament? Players will see it as cancelled. To undo, you must edit the database directly."
            />
          </div>
        )}

        {isCancelled && (
          <div className="mg-danger-row">
            <div className="mg-danger-info">
              <div className="mg-danger-name">Tournament is cancelled</div>
              <div className="mg-danger-desc">
                This tournament was cancelled. To restore it, change the status manually in the database.
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function PlayersTab({
  slug,
  participants,
  allPlayers,
  currentUserId,
}: {
  slug: string;
  participants: any[];
  allPlayers: any[];
  currentUserId: string;
}) {
  const registered = participants.filter((p) => p.status === 'registered');
  const withdrawn = participants.filter((p) => p.status === 'withdrawn');

  const alreadyRegisteredIds = participants
    .filter((p) => p.player_id)
    .map((p) => p.player_id);

  return (
    <>
      <div className="mg-players-head">
        <div>
          <div className="mg-players-stat">
            <span className="big">{registered.length}</span>
            <span className="lbl">REGISTERED</span>
          </div>
          {withdrawn.length > 0 && (
            <div className="mg-players-stat dim">
              <span className="big">{withdrawn.length}</span>
              <span className="lbl">WITHDRAWN</span>
            </div>
          )}
        </div>
        <AddPlayersSheet
          slug={slug}
          allPlayers={allPlayers}
          alreadyRegisteredIds={alreadyRegisteredIds}
        />
      </div>

      {registered.length === 0 ? (
        <div className="mg-empty">
          <div className="mg-empty-title">No players registered yet.</div>
          <p className="mg-empty-body">Use the "Add players" button to manually add players from your platform.</p>
        </div>
      ) : (
        <div className="mg-player-list">
          {registered.map((p) => (
            <PlayerRow
              key={p.id}
              participant={p}
              slug={slug}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}

      {withdrawn.length > 0 && (
        <>
          <div className="mg-players-section-head">WITHDRAWN · {withdrawn.length}</div>
          <div className="mg-player-list mg-player-list-dim">
            {withdrawn.map((p) => (
              <PlayerRow
                key={p.id}
                participant={p}
                slug={slug}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}

function PlayerRow({
  participant,
  slug,
  currentUserId,
}: {
  participant: any;
  slug: string;
  currentUserId: string;
}) {
  const p = participant;
  const username = p.player?.username ?? '?';
  const displayName = p.player?.display_name ?? username;
  const initial = displayName.charAt(0).toUpperCase();
  const avatarUrl = p.player?.avatar_url;
  const role = p.player?.role ?? 'player';
  const country = p.country?.name;
  const groupLabel = p.country?.group_label;
  const isMe = p.player_id === currentUserId;
  const isWithdrawn = p.status === 'withdrawn';

  return (
    <div className={`mg-player-row ${isWithdrawn ? 'withdrawn' : ''}`}>
      <div
        className="mg-player-avatar"
        style={avatarUrl ? {
          backgroundImage: `url(${avatarUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : undefined}
      >
        {!avatarUrl && <span>{initial}</span>}
      </div>
      <div className="mg-player-info">
        <div className="mg-player-name-row">
          <span className="name">{displayName}</span>
          {role !== 'player' && (
            <span className={`role-pill role-${role}`}>{role.toUpperCase()}</span>
          )}
          {groupLabel && (
            <span className="group-pill">GROUP {groupLabel}</span>
          )}
          {isWithdrawn && (
            <span className="status-pill">WITHDRAWN</span>
          )}
        </div>
        <div className="mg-player-meta">
          @{username}
          {country && <span> · {country}</span>}
        </div>
      </div>
      <PlayerRowActions
        slug={slug}
        participantId={p.id}
        playerId={p.player_id}
        username={username}
        currentRole={role}
        isCurrentUser={isMe}
        status={p.status}
      />
    </div>
  );
}

function ActivityTabStub() {
  return (
    <div className="mg-stub">
      <div className="mg-stub-title">Activity log — Phase 3</div>
      <p className="mg-stub-body">Coming next. Will show a timeline of all admin actions on this tournament.</p>
    </div>
  );
}

function Styles() {
  return (
    <style>{`
      .mg-page {
        max-width: 600px;
        margin: 0 auto;
        padding: 16px 20px 60px;
      }

      .mg-back {
        display: inline-block;
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px; font-weight: 700;
        letter-spacing: 0.14em; text-transform: uppercase;
        color: hsl(var(--ink) / 0.62);
        text-decoration: none;
        margin-bottom: 16px;
      }
      .mg-back:hover { color: hsl(var(--ink)); }

      .mg-head { padding-bottom: 16px; }
      .mg-eyebrow {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px; font-weight: 700;
        letter-spacing: 0.18em; text-transform: uppercase;
        color: hsl(var(--ink) / 0.42);
        margin-bottom: 6px;
      }
      .mg-title {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900; font-size: 28px;
        line-height: 0.92; letter-spacing: -0.03em;
        margin: 0 0 6px;
      }
      .mg-title .accent { color: hsl(var(--accent)); font-style: italic; }
      .mg-sub {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px; font-weight: 500;
        letter-spacing: 0.12em;
        color: hsl(var(--ink) / 0.42);
      }

      .mg-tabs {
        display: flex; gap: 18px;
        border-bottom: 1px solid hsl(var(--ink));
        margin-top: 18px; margin-bottom: 18px;
      }
      .mg-tab {
        position: relative;
        padding: 10px 0;
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 11px; font-weight: 700;
        letter-spacing: 0.14em; text-transform: uppercase;
        color: hsl(var(--ink) / 0.42);
        text-decoration: none;
      }
      .mg-tab:hover { color: hsl(var(--ink)); }
      .mg-tab.active { color: hsl(var(--ink)); }
      .mg-tab.active::after {
        content: '';
        position: absolute;
        bottom: -1px; left: 0; right: 0;
        height: 2px;
        background: hsl(var(--ink));
      }

      .mg-banner {
        display: flex; align-items: center; gap: 10px;
        padding: 10px 14px;
        margin-bottom: 14px;
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 11px; font-weight: 700;
        letter-spacing: 0.14em; text-transform: uppercase;
      }
      .mg-banner .dot {
        width: 6px; height: 6px; border-radius: 50%;
        background: currentColor;
      }
      .mg-banner-ok {
        background: hsl(var(--accent) / 0.08);
        border: 1px solid hsl(var(--accent) / 0.30);
        color: hsl(var(--accent));
      }
      .mg-banner-warn {
        background: hsl(var(--warn) / 0.08);
        border: 1px solid hsl(var(--warn) / 0.30);
        color: hsl(var(--warn));
      }

      .mg-section { margin-bottom: 24px; }
      .mg-section-head {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px; font-weight: 700;
        letter-spacing: 0.18em; text-transform: uppercase;
        color: hsl(var(--ink) / 0.42);
        margin-bottom: 12px;
        padding-bottom: 6px;
        border-bottom: 1px solid hsl(var(--ink) / 0.08);
      }

      .mg-field { margin-bottom: 14px; }
      .mg-label {
        display: block;
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px; font-weight: 700;
        letter-spacing: 0.16em; text-transform: uppercase;
        color: hsl(var(--ink));
        margin-bottom: 6px;
      }
      .mg-label .required { color: hsl(var(--live)); margin-left: 2px; }

      .mg-input {
        width: 100%;
        padding: 10px 12px;
        background: hsl(var(--surface));
        border: 1px solid hsl(var(--ink) / 0.20);
        font-family: var(--font-sans), system-ui, sans-serif;
        font-size: 14px; font-weight: 500;
        color: hsl(var(--ink));
        outline: none;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
      }
      .mg-input:focus {
        border-color: hsl(var(--accent));
        box-shadow: 0 0 0 3px hsl(var(--accent) / 0.15);
      }
      .mg-input-disabled {
        background: hsl(var(--ink) / 0.04);
        color: hsl(var(--ink) / 0.42);
        cursor: not-allowed;
      }
      .mg-textarea {
        min-height: 80px;
        resize: vertical;
        font-family: var(--font-sans), system-ui, sans-serif;
      }
      .mg-textarea-large {
        min-height: 200px;
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 13px;
        line-height: 1.5;
      }
      .mg-hint {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-size: 12px;
        color: hsl(var(--ink) / 0.62);
        margin-top: 4px;
        line-height: 1.4;
      }

      .mg-grid-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .mg-actions {
        display: flex; gap: 8px;
        padding-top: 16px;
        border-top: 1px solid hsl(var(--ink) / 0.08);
        margin-top: 8px;
      }
      .mg-btn {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 11px; font-weight: 700;
        letter-spacing: 0.14em; text-transform: uppercase;
        padding: 12px 18px;
        border: 1px solid;
        cursor: pointer;
        text-decoration: none;
        display: inline-flex; align-items: center; justify-content: center;
        line-height: 1;
      }
      .mg-btn-primary {
        background: hsl(var(--ink));
        color: hsl(var(--bg));
        border-color: hsl(var(--ink));
        flex: 1;
      }
      .mg-btn-primary:hover {
        background: hsl(var(--accent));
        border-color: hsl(var(--accent));
      }
      .mg-btn-secondary {
        background: transparent;
        color: hsl(var(--ink));
        border-color: hsl(var(--ink) / 0.20);
      }
      .mg-btn-secondary:hover {
        border-color: hsl(var(--ink));
      }

      .mg-danger {
        background: hsl(var(--live) / 0.04);
        border: 1px solid hsl(var(--live) / 0.30);
        padding: 16px;
        margin-top: 32px;
      }
      .mg-danger-head {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px; font-weight: 700;
        letter-spacing: 0.18em; text-transform: uppercase;
        color: hsl(var(--live));
        margin-bottom: 12px;
        display: flex; align-items: center; gap: 6px;
      }
      .mg-danger-head .dot {
        width: 6px; height: 6px; border-radius: 50%;
        background: currentColor;
      }
      .mg-danger-row {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 12px;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid hsl(var(--live) / 0.15);
      }
      .mg-danger-row:last-child { border-bottom: none; padding-bottom: 0; }
      .mg-danger-row:first-child { padding-top: 0; }
      .mg-danger-info { min-width: 0; }
      .mg-danger-name {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 800; font-size: 14px;
        color: hsl(var(--ink));
        margin-bottom: 4px;
        letter-spacing: -0.01em;
      }
      .mg-danger-desc {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-size: 12px;
        color: hsl(var(--ink) / 0.62);
        line-height: 1.4;
      }
      .mg-danger-btn {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px; font-weight: 700;
        letter-spacing: 0.14em; text-transform: uppercase;
        padding: 8px 14px;
        border: 1px solid hsl(var(--live));
        color: hsl(var(--live));
        background: transparent;
        cursor: pointer;
        flex-shrink: 0;
      }
      .mg-danger-btn:hover {
        background: hsl(var(--live));
        color: hsl(var(--bg));
      }
      .mg-danger-btn-disabled {
        color: hsl(var(--ink) / 0.42);
        border-color: hsl(var(--ink) / 0.20);
        cursor: not-allowed;
      }
      .mg-danger-btn-disabled:hover {
        background: transparent;
        color: hsl(var(--ink) / 0.42);
      }

      .mg-stub {
        text-align: center;
        padding: 60px 20px;
        border: 1px dashed hsl(var(--ink) / 0.20);
        background: hsl(var(--surface));
      }
      .mg-stub-title {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900; font-size: 18px;
        line-height: 1.05; letter-spacing: -0.02em;
        margin-bottom: 8px;
      }
      .mg-stub-body {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-size: 13px;
        color: hsl(var(--ink) / 0.62);
        line-height: 1.5;
      }
      .mg-players-head {
        display: flex; justify-content: space-between; align-items: center;
        gap: 14px;
        margin-bottom: 18px;
        padding-bottom: 14px;
        border-bottom: 1px solid hsl(var(--ink));
        flex-wrap: wrap;
      }
      .mg-players-head > div:first-child {
        display: flex; gap: 22px; align-items: baseline;
      }
      .mg-players-stat {
        display: flex; flex-direction: column; gap: 2px;
      }
      .mg-players-stat.dim { opacity: 0.6; }
      .mg-players-stat .big {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900; font-size: 28px;
        line-height: 1; letter-spacing: -0.025em;
        color: hsl(var(--ink));
        font-variant-numeric: tabular-nums;
      }
      .mg-players-stat .lbl {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px; font-weight: 700;
        letter-spacing: 0.16em; text-transform: uppercase;
        color: hsl(var(--ink) / 0.42);
      }

      .mg-players-section-head {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px; font-weight: 700;
        letter-spacing: 0.18em; text-transform: uppercase;
        color: hsl(var(--ink) / 0.42);
        margin: 24px 0 10px;
        padding-bottom: 6px;
        border-bottom: 1px solid hsl(var(--ink) / 0.20);
      }

      .mg-player-list {
        display: flex; flex-direction: column;
        gap: 6px;
      }
      .mg-player-list-dim { opacity: 0.65; }
      .mg-player-row {
        display: grid;
        grid-template-columns: 36px 1fr auto;
        gap: 12px; align-items: center;
        background: hsl(var(--surface));
        border: 1px solid hsl(var(--ink) / 0.20);
        padding: 10px 14px;
      }
      .mg-player-row.withdrawn { opacity: 0.7; }
      .mg-player-avatar {
        width: 36px; height: 36px;
        background: hsl(var(--ink));
        color: hsl(var(--bg));
        display: flex; align-items: center; justify-content: center;
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 800; font-size: 14px;
        flex-shrink: 0;
      }
      .mg-player-info { min-width: 0; }
      .mg-player-name-row {
        display: flex; align-items: center;
        gap: 6px; margin-bottom: 3px;
        flex-wrap: wrap;
      }
      .mg-player-name-row .name {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 800; font-size: 14px;
        letter-spacing: -0.005em;
        color: hsl(var(--ink));
        line-height: 1.2;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .role-pill, .group-pill, .status-pill {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 8px; font-weight: 700;
        letter-spacing: 0.14em;
        padding: 2px 6px;
        line-height: 1.4;
      }
      .role-pill.role-admin {
        background: hsl(var(--ink));
        color: hsl(var(--bg));
      }
      .role-pill.role-moderator {
        background: hsl(var(--warn));
        color: #fff;
      }
      .role-pill.role-super_admin {
        background: hsl(var(--accent));
        color: #fff;
      }
      .group-pill {
        background: hsl(var(--accent) / 0.10);
        color: hsl(var(--accent));
      }
      .status-pill {
        background: hsl(var(--ink) / 0.10);
        color: hsl(var(--ink) / 0.62);
      }
      .mg-player-meta {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px; font-weight: 500;
        letter-spacing: 0.10em;
        color: hsl(var(--ink) / 0.62);
        text-transform: uppercase;
      }

      .mg-empty {
        text-align: center;
        padding: 36px 20px;
        border: 1px dashed hsl(var(--ink) / 0.20);
        background: hsl(var(--surface));
      }
      .mg-empty-title {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900; font-size: 18px;
        margin-bottom: 8px;
      }
      .mg-empty-body {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-size: 13px;
        color: hsl(var(--ink) / 0.62);
      }
    `}</style>
  );
}
