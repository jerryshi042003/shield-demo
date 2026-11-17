export const LEAGUE_TOGGLE_SECTIONS = [] as const;

export type LeagueToggleSection = typeof LEAGUE_TOGGLE_SECTIONS[number];

export function isLeagueToggleVisible(section: string): boolean {
  return LEAGUE_TOGGLE_SECTIONS.includes(section as LeagueToggleSection);
}
