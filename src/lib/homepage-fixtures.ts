import { createClient } from '@/lib/supabase/server';

export type FixtureStatus = 'live' | 'upcoming' | 'played';

export type FixtureSide = {
  country: string;
  countryFlag: string;
  username: string;
  score: number | null;
  pens: number | null;
};

export type FixtureEntry = {
  id: string;
  status: FixtureStatus;
  statusLabel: string;
  home: FixtureSide;
  away: FixtureSide;
  tournamentName: string;
  tournamentSlug: string;
  stageLabel: string;
  groupLabel: string | null;
  isWinnerHome: boolean | null;
};

const ROUND_LABELS: Record<number, string> = {
  1: 'R32',
  2: 'R16',
  3: 'QF',
  4: 'SF',
  5: 'F',
  6: 'F',
};

const NAME_TO_CODE: Record<string, string> = {
  'Algeria': 'DZ', 'Argentina': 'AR', 'Australia': 'AU', 'Austria': 'AT',
  'Belgium': 'BE', 'Bosnia-Herzegovina': 'BA', 'Brazil': 'BR',
  'Cabo Verde': 'CV', 'Cameroon': 'CM', 'Canada': 'CA', 'Chile': 'CL',
  'Colombia': 'CO', 'Congo DR': 'CD', 'Costa Rica': 'CR',
  "Côte d'Ivoire": 'CI', 'Croatia': 'HR', 'Curaçao': 'CW',
  'Czech Republic': 'CZ',
  'Denmark': 'DK', 'Ecuador': 'EC', 'Egypt': 'EG', 'England': 'GB',
  'France': 'FR', 'Germany': 'DE', 'Ghana': 'GH', 'Haiti': 'HT',
  'Iran': 'IR', 'IR Iran': 'IR', 'Iraq': 'IQ', 'Ireland': 'IE',
  'Italy': 'IT', 'Japan': 'JP', 'Jordan': 'JO',
  'Korea Republic': 'KR', 'Mexico': 'MX', 'Morocco': 'MA',
  'Netherlands': 'NL', 'New Zealand': 'NZ', 'Nigeria': 'NG', 'Norway': 'NO',
  'Panama': 'PA', 'Paraguay': 'PY', 'Peru': 'PE', 'Poland': 'PL',
  'Portugal': 'PT', 'Qatar': 'QA', 'Russia': 'RU',
  'Saudi Arabia': 'SA', 'Scotland': 'GB', 'Senegal': 'SN',
  'Serbia': 'RS', 'South Africa': 'ZA', 'South Korea': 'KR',
  'Spain': 'ES', 'Sweden': 'SE', 'Switzerland': 'CH',
  'Tunisia': 'TN', 'Turkey': 'TR', 'Türkiye': 'TR',
  'Ukraine': 'UA', 'United States': 'US', 'USA': 'US',
  'Uruguay': 'UY', 'Uzbekistan': 'UZ', 'Wales': 'GB',
};

function codeToEmoji(code: string | null | undefined): string {
  if (!code || code.length !== 2) return '';
  const upper = code.toUpperCase();
  const a = upper.charCodeAt(0);
  const b = upper.charCodeAt(1);
  if (a < 65 || a > 90 || b < 65 || b > 90) return '';
  return String.fromCodePoint(0x1F1E6 + a - 65, 0x1F1E6 + b - 65);
}

function getFlagEmoji(country: string | null | undefined): string {
  if (!country) return '';
  const fromMap = NAME_TO_CODE[country];
  return fromMap ? codeToEmoji(fromMap) : '';
}

function ageLabel(confirmedAt: string | null): string {
  if (!confirmedAt) return 'FT';
  const ageMs = Date.now() - new Date(confirmedAt).getTime();
  const ageMin = Math.floor(ageMs / 60000);
  if (ageMin < 1) return 'FT · JUST NOW';
  if (ageMin < 60) return `FT · ${ageMin}M AGO`;
  const ageHr = Math.floor(ageMin / 60);
  if (ageHr < 24) return `FT · ${ageHr}H AGO`;
  const ageDay = Math.floor(ageHr / 24);
  return `FT · ${ageDay}D AGO`;
}

const LIVE_STATUSES = new Set(['live', 'in_progress', 'in-progress', 'ongoing']);
const UPCOMING_STATUSES = new Set(['scheduled', 'pending', 'upcoming', 'awaiting_result', 'awaiting_confirmation', 'submitted', 'not_started', 'open']);
const PLAYED_STATUSES = new Set(['completed', 'walkover', 'finished', 'final', 'confirmed']);

export async function getFixtureTickerData(
  limit: number = 10,
  currentPlayerId?: string | null
): Promise<FixtureEntry[]> {
  const supabase = createClient();

  const { data: matches, error: matchError } = await supabase
    .from('matches')
    .select('id, status, decided_by, home_score, away_score, home_pens, away_pens, matchday, round, confirmed_at, home_participant_id, away_participant_id, winner_participant_id, tournament_id, created_at')
    .order('confirmed_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(120);

  if (matchError) {
    console.error('[ticker] matches query error:', matchError);
    return [];
  }
  if (!matches || matches.length === 0) {
    return [];
  }

  const tournamentIds = Array.from(new Set(matches.map((m: any) => m.tournament_id).filter(Boolean)));
  const participantIds = Array.from(new Set(
    matches.flatMap((m: any) => [m.home_participant_id, m.away_participant_id]).filter(Boolean)
  ));

  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('id, name, slug, status')
    .in('id', tournamentIds);
  const tournamentById = new Map<string, any>();
  for (const t of (tournaments ?? [])) tournamentById.set(t.id, t);

  const { data: participants } = await supabase
    .from('tournament_participants')
    .select('id, player_id, country:countries(name, code, group_label), player:players(username)')
    .in('id', participantIds);
  const participantById = new Map<string, any>();
  for (const p of (participants ?? [])) participantById.set(p.id, p);

  const all: { entry: FixtureEntry; isMine: boolean }[] = [];

  for (const m of matches as any[]) {
    const tournament = tournamentById.get(m.tournament_id);
    if (!tournament || tournament.status === 'cancelled') continue;

    const home = participantById.get(m.home_participant_id);
    const away = participantById.get(m.away_participant_id);
    if (!home || !away) continue;

    const homeUsername = home.player?.username ?? null;
    const awayUsername = away.player?.username ?? null;
    const homeCountry = home.country?.name ?? null;
    const awayCountry = away.country?.name ?? null;
    if (!homeUsername || !awayUsername || !homeCountry || !awayCountry) continue;

    const rawStatus = String(m.status ?? '').toLowerCase();
    let status: FixtureStatus;
    let statusLabel: string;

    if (PLAYED_STATUSES.has(rawStatus) || m.home_score != null) {
      status = 'played';
      statusLabel = ageLabel(m.confirmed_at ?? m.created_at);
    } else if (LIVE_STATUSES.has(rawStatus)) {
      status = 'live';
      statusLabel = 'LIVE';
    } else if (UPCOMING_STATUSES.has(rawStatus)) {
      status = 'upcoming';
      statusLabel = 'UPCOMING';
    } else {
      status = 'upcoming';
      statusLabel = 'UPCOMING';
    }

    const stageLabel = m.matchday != null
      ? `MD${m.matchday}`
      : m.round != null
      ? ROUND_LABELS[m.round] ?? `R${m.round}`
      : '';

    const groupLabel = home.country?.group_label
      ? `GROUP ${home.country.group_label}`
      : null;

    const winnerId = m.winner_participant_id;
    const isWinnerHome = winnerId
      ? winnerId === home.id
        ? true
        : winnerId === away.id
        ? false
        : null
      : null;

    const isMine = !!(currentPlayerId && (home.player_id === currentPlayerId || away.player_id === currentPlayerId));

    const entry: FixtureEntry = {
      id: m.id,
      status,
      statusLabel,
      home: {
        country: homeCountry,
        countryFlag: getFlagEmoji(homeCountry),
        username: homeUsername,
        score: m.home_score,
        pens: m.home_pens,
      },
      away: {
        country: awayCountry,
        countryFlag: getFlagEmoji(awayCountry),
        username: awayUsername,
        score: m.away_score,
        pens: m.away_pens,
      },
      tournamentName: tournament.name,
      tournamentSlug: tournament.slug,
      stageLabel,
      groupLabel,
      isWinnerHome,
    };

    all.push({ entry, isMine });
  }

  // Bucket
  const myLive = all.filter((x) => x.isMine && x.entry.status === 'live').map((x) => x.entry);
  const myUpcoming = all.filter((x) => x.isMine && x.entry.status === 'upcoming').map((x) => x.entry);
  const myPlayed = all.filter((x) => x.isMine && x.entry.status === 'played').map((x) => x.entry);

  const otherLive = all.filter((x) => !x.isMine && x.entry.status === 'live').map((x) => x.entry);
  const otherUpcoming = all.filter((x) => !x.isMine && x.entry.status === 'upcoming').map((x) => x.entry);
  const otherPlayed = all.filter((x) => !x.isMine && x.entry.status === 'played').map((x) => x.entry);

  // Personal slice — capped at 2 cards (live > upcoming > played)
  const mineSlice: FixtureEntry[] = [];
  for (const f of myLive) { if (mineSlice.length < 2) mineSlice.push(f); }
  for (const f of myUpcoming) { if (mineSlice.length < 2) mineSlice.push(f); }
  for (const f of myPlayed) { if (mineSlice.length < 2) mineSlice.push(f); }

  // Other slice — fill the rest
  const remaining = Math.max(0, limit - mineSlice.length);
  const otherSlice: FixtureEntry[] = [
    ...otherLive.slice(0, 3),
    ...otherUpcoming.slice(0, 4),
    ...otherPlayed.slice(0, Math.max(0, remaining - otherLive.slice(0, 3).length - otherUpcoming.slice(0, 4).length)),
  ].slice(0, remaining);

  return [...mineSlice, ...otherSlice].slice(0, limit);
}
