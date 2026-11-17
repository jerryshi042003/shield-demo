import { TabButton } from './TabButton';

interface LeagueTabsProps {
  league: 'NHL';
  onChange: (league: 'NHL') => void;
}

export function LeagueTabs({ league: _league, onChange }: LeagueTabsProps) {
  return (
    <div role="tablist" className="flex items-center gap-6">
      <TabButton isActive={true} onClick={() => onChange('NHL')}>
        NHL
      </TabButton>
      {/* AHL removed */}
    </div>
  );
} 