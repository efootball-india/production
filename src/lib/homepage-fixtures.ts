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

// Country name → ISO 2-letter code map for emoji flag derivation.
// Covers the 32 World Cup 2026 + 2022 nations and common eFTBL choices.
const NAME_TO_CODE: Record<string, string> = {
  'Argentina': 'AR', 'Australia': 'AU', 'Belgium': 'BE', 'Brazil': 'BR',
  'Cameroon': 'CM', 'Canada': 'CA', 'Chile': 'CL', 'Colombia': 'CO',
  'Costa Rica': 'CR', 'Croatia': 'HR', 'Czech Republic': 'CZ',
  'Denmark': 'DK', 'Ecuador': 'EC', 'Egypt': 'EG', 'England': 'GB',
  'France': 'FR', 'Germany': 'DE', 'Ghana': 'GH', 'Iran': 'IR',
  'Ireland': 'IE', 'Italy': 'IT', 'Japan': 'JP', 'Mexico': 'MX',
  'Morocco': 'MA', 'Netherlands': 'NL', 'Nigeria': 'NG', 'Norway': 'NO',
  'Peru': 'PE', 'Poland': 'PL', 'Portugal': 'PT', 'Qatar': 'QA',
  'Russia': 'RU', 'Saudi Arabia': 'SA', 'Scotland': 'GB', 'Senegal': 'SN',
  'Serbia': 'RS', 'South Africa': 'ZA', 'South Korea': 'KR',
  'Korea Republic': 'KR', 'Spain': 'ES', 'Sweden': 'SE', 'Switzerland': 'CH',
  'Tunisia': 'TN', 'Turkey': 'TR', 'Ukraine': 'UA', 'United States': 'US',
  'USA': 'US', 'Uruguay': 'UY', 'Wales': 'GB',
};

function codeToEmoji(code: string | null | undefined): string {
  if (!code || code.length !== 2) return '🏴';
  const upper = code.toUpperCase();
  const a = upper.charCodeAt(0);
  const b = upper.charCodeAt(1);
  if (a < 65 || a > 90 || b < 65 || b > 90) return '🏴';
  return String.fromCodePoint(0x1F1E6 + a - 65, 0x1F1E6 + b - 65);
}

function getFlagEmoji(country: string | null | undefined, code: string | null | undefined): string {
  if (code) return codeToEmoji(code);
  if (!country) return '🏴';
  const fromMap = NAME_TO_CODE[country];
  return fromMap ? codeToEmoji(fromMap) : '🏴';
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

export async function getFixtureTickerData(limit: number = 10): Promise<FixtureEntry[]> {
  const supabase = createClient();

  const { data: matches } = await supabase
    .from('matches')
    .select(`
      id, status, decided_by,
      home_score, away_score, home_pens, away_pens,
      matchday, round, confirmed_at,
      home_participant_id, away_participant_id, winner_participant_id, tournament_id,
      tournament:tournaments(id, name, slug, status),
      home:tournament_participants!matches_home_participant_id_fkey(
        id,
        country:countries(name, group_label),
        player:players(username)
      ),
      away:tournament_participants!matches_away_participant_id_fkey(
        id,
        country:countries(name, group_label),
        player:players(username)
      )
    `)
    .in('status', ['live', 'in_progress', 'awaiting_result', 'awaiting_confirmation', 'completed', 'walkover'])
    .order('confirmed_at', { ascending: false, nullsFirst: false })
    .limit(60);

  if (!matches || matches.length === 0) return [];

  const live: FixtureEntry[] = [];
  const upcoming: FixtureEntry[] = [];
  const played: FixtureEntry[] = [];

  for (const m of matches) {
    const tournament: any = m.tournament;
    if (!tournament || tournament.status === 'cancelled') continue;

    const home: any = m.home;
    const away: any = m.away;
    if (!home || !away) continue;

    const homeUsername = home.player?.username ?? null;
    const awayUsername = away.player?.username ?? null;
    const homeCountry = home.country?.name ?? null;
    const awayCountry = away.country?.name ?? null;
    if (!homeUsername || !awayUsername || !homeCountry || !awayCountry) continue;

    let status: FixtureStatus;
    let statusLabel: string;

    if (m.status === 'completed' || m.status === 'walkover') {
      status = 'played';
      statusLabel = ageLabel(m.confirmed_at);
    } else if (m.status === 'live' || m.status === 'in_progress') {
      status = 'live';
      statusLabel = 'LIVE';
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

    const entry: FixtureEntry = {
      id: m.id,
      status,
      statusLabel,
      home: {
        country: homeCountry,
        countryFlag: getFlagEmoji(homeCountry, null),
        username: homeUsername,
        score: m.home_score,
        pens: m.home_pens,
      },
      away: {
        country: awayCountry,
        countryFlag: getFlagEmoji(awayCountry, null),
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

    if (status === 'live') live.push(entry);
    else if (status === 'upcoming') upcoming.push(entry);
    else played.push(entry);
  }

  // Take up to 3 live, up to 4 upcoming, fill rest with played
  const result: FixtureEntry[] = [
    ...live.slice(0, 3),
    ...upcoming.slice(0, 4),
    ...played.slice(0, Math.max(0, limit - live.slice(0, 3).length - upcoming.slice(0, 4).length)),
  ];

  return result.slice(0, limit);
}
