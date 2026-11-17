import type { Franchise } from '@/lib/franchise';

/**
 * Team Logo Utility
 *
 * Provides consistent access to team logos via ESPN CDN.
 * Supports LAK (NHL) and LAG (MLS) opponent names.
 */

type LeagueCode = 'nhl' | 'mls';

// ESPN CDN team code mapping (lowercase required) - NHL
const NHL_TEAM_CODES: Record<string, string> = {
  // Pacific Division
  'Anaheim Ducks': 'ana',
  'Calgary Flames': 'cgy',
  'Edmonton Oilers': 'edm',
  'Los Angeles Kings': 'la',
  'San Jose Sharks': 'sj',
  'Seattle Kraken': 'sea',
  'Vancouver Canucks': 'van',
  'Vegas Golden Knights': 'vgk',

  // Central Division
  'Arizona Coyotes': 'ari',
  'Chicago Blackhawks': 'chi',
  'Colorado Avalanche': 'col',
  'Dallas Stars': 'dal',
  'Minnesota Wild': 'min',
  'Nashville Predators': 'nsh',
  'St. Louis Blues': 'stl',
  'St Louis Blues': 'stl',
  'Utah Hockey Club': 'uta',
  'Winnipeg Jets': 'wpg',

  // Metropolitan Division
  'Carolina Hurricanes': 'car',
  'Columbus Blue Jackets': 'cbj',
  'New Jersey Devils': 'njd',
  'New York Islanders': 'nyi',
  'New York Rangers': 'nyr',
  'Philadelphia Flyers': 'phi',
  'Pittsburgh Penguins': 'pit',
  'Washington Capitals': 'wsh',

  // Atlantic Division
  'Boston Bruins': 'bos',
  'Buffalo Sabres': 'buf',
  'Detroit Red Wings': 'det',
  'Florida Panthers': 'fla',
  'Montreal Canadiens': 'mtl',
  'Ottawa Senators': 'ott',
  'Tampa Bay Lightning': 'tb',
  'Toronto Maple Leafs': 'tor',
};

// ESPN CDN team code mapping (lowercase required) - MLS
const MLS_TEAM_CODES: Record<string, string> = {
  'Atlanta United FC': 'atl',
  'Austin FC': 'aus',
  'CF Montreal': 'mtl',
  'Charlotte FC': 'clt',
  'Chicago Fire FC': 'chi',
  'Colorado Rapids': 'col',
  'Columbus Crew': 'clb',
  'D.C. United': 'dc',
  'FC Cincinnati': 'cin',
  'FC Dallas': 'dal',
  'Houston Dynamo FC': 'hou',
  'Inter Miami CF': 'mia',
  'LA Galaxy': 'lag',
  'Los Angeles FC': 'lafc',
  'Minnesota United FC': 'min',
  'Nashville SC': 'nsh',
  'New England Revolution': 'ne',
  'New York City FC': 'nyc',
  'New York Red Bulls': 'nyrb',
  'Orlando City SC': 'orl',
  'Philadelphia Union': 'phi',
  'Portland Timbers': 'por',
  'Real Salt Lake': 'rsl',
  'San Diego FC': 'sd',
  'San Jose Earthquakes': 'sj',
  'Seattle Sounders FC': 'sea',
  'Sporting Kansas City': 'skc',
  'St. Louis City SC': 'stl',
  'St Louis City SC': 'stl',
  'Toronto FC': 'tor',
  'Vancouver Whitecaps FC': 'van',
};

// Explicit brand logo overrides for franchise identities
const BRAND_LOGO_OVERRIDES: Partial<Record<string, string>> = {
  'LA Galaxy': '/lag-logo.png',
  'Los Angeles Galaxy': '/lag-logo.png',
  'Ontario Reign': '/ont-logo.png',
};

// Local fallback mapping for critical teams
const LOCAL_FALLBACKS: Partial<Record<string, string>> = {
  'Los Angeles Kings': '/Los-Angeles-Kings-Logo.png',
  'Anaheim Ducks': '/anaheim-ducks.png',
  'Winnipeg Jets': '/Winnipeg-Jets-PNG-File.png',
};

const FRANCHISE_TO_PRIMARY_LEAGUE: Partial<Record<Franchise, LeagueCode>> = {
  LAK: 'nhl',
  LAG: 'mls',
};

const TEAM_CODES_BY_LEAGUE: Record<LeagueCode, Record<string, string>> = {
  nhl: NHL_TEAM_CODES,
  mls: MLS_TEAM_CODES,
};

function buildEspnLogoUrl(league: LeagueCode, code: string): string {
  return `https://a.espncdn.com/i/teamlogos/${league}/500/${code}.png`;
}

function findTeamLogoEntry(
  teamName: string,
  preferredLeague?: LeagueCode
): { league: LeagueCode; code: string } | null {
  const normalizedName = teamName.trim().replace(/\s+/g, ' ');
  if (!normalizedName) return null;

  if (preferredLeague) {
    const preferredCode = TEAM_CODES_BY_LEAGUE[preferredLeague][normalizedName];
    if (preferredCode) return { league: preferredLeague, code: preferredCode };
  }

  for (const league of ['nhl', 'mls'] as const) {
    if (league === preferredLeague) continue;
    const code = TEAM_CODES_BY_LEAGUE[league][normalizedName];
    if (code) return { league, code };
  }

  return null;
}

/**
 * Get team logo URL from ESPN CDN
 *
 * @param teamName - Full team name (e.g., "Los Angeles Kings")
 * @param size - Logo size in pixels (default: 500)
 * @param franchise - Franchise context to prioritize league lookup
 * @returns CDN URL for team logo
 */
export function getTeamLogo(teamName: string, _size: number = 500, franchise?: Franchise): string {
  const normalizedName = teamName.trim().replace(/\s+/g, ' ');
  const brandOverride = BRAND_LOGO_OVERRIDES[normalizedName];
  if (brandOverride) {
    return brandOverride;
  }

  const preferredLeague = franchise ? FRANCHISE_TO_PRIMARY_LEAGUE[franchise] : undefined;
  const logoEntry = findTeamLogoEntry(teamName, preferredLeague);

  if (!logoEntry) {
    return LOCAL_FALLBACKS[normalizedName] ?? '';
  }

  return buildEspnLogoUrl(logoEntry.league, logoEntry.code);
}

/**
 * Get local fallback logo path (if exists)
 *
 * @param teamName - Full team name
 * @returns Local path or empty string
 */
export function getLocalFallback(teamName: string): string {
  const normalizedName = teamName.trim().replace(/\s+/g, ' ');
  return BRAND_LOGO_OVERRIDES[normalizedName] ?? LOCAL_FALLBACKS[normalizedName] ?? '';
}

/**
 * Get team code for ESPN CDN
 *
 * @param teamName - Full team name
 * @returns Three-letter team code (lowercase)
 */
export function getTeamCode(teamName: string): string {
  const normalizedName = teamName.trim().replace(/\s+/g, ' ');
  const logoEntry = findTeamLogoEntry(normalizedName);
  return logoEntry?.code ?? '';
}

/**
 * Get all supported team names
 *
 * @returns Array of team names
 */
export function getAllTeamNames(): string[] {
  return Array.from(
    new Set([
      ...Object.keys(NHL_TEAM_CODES),
      ...Object.keys(MLS_TEAM_CODES),
    ])
  );
}
