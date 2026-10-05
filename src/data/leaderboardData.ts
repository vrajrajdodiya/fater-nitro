/**
 * Faster Nitro 3D - Global & Local Leaderboards Data Engine
 * Computes, manages, and simulates realistic world rankings across all 100 levels,
 * combining local personal bests with global competitors.
 */

import { LeaderboardEntry, LocalLapRecord } from '../types/game';
import { getLevelConfig } from './levelsData';
import { CAR_CATALOG } from './carModels';

export const COUNTRY_OPTIONS = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪' }
];

interface GhostCompetitor {
  name: string;
  country: string;
  carId: string;
  timeOffset: number; // offset in seconds relative to level's ideal pace
}

// Elite global rival database
const GLOBAL_ROSTER: GhostCompetitor[] = [
  { name: 'ApexVeloce', country: '🇮🇹', carId: 'bmw_m4', timeOffset: -4.2 },
  { name: 'Klaus_Nurburg', country: '🇩🇪', carId: 'bmw_m4', timeOffset: -3.8 },
  { name: 'TokyoDriftKing', country: '🇯🇵', carId: 'cyber_gtr', timeOffset: -3.4 },
  { name: 'RedlineRacer', country: '🇺🇸', carId: 'muscle_beast', timeOffset: -2.9 },
  { name: 'SilverstonePro', country: '🇬🇧', carId: 'formula_apex', timeOffset: -2.6 },
  { name: 'Ghost_Monza', country: '🇮🇹', carId: 'hyper_sport', timeOffset: -2.2 },
  { name: 'NordicSpeed', country: '🇸🇪', carId: 'titan_hyper', timeOffset: -1.8 },
  { name: 'LeMansPhantom', country: '🇫🇷', carId: 'bmw_m4', timeOffset: -1.5 },
  { name: 'VortexPilot', country: '🇧🇷', carId: 'hyper_sport', timeOffset: -1.1 },
  { name: 'MapleRocket', country: '🇨🇦', carId: 'muscle_beast', timeOffset: -0.8 },
  { name: 'OutbackDrifter', country: '🇦🇺', carId: 'cyber_gtr', timeOffset: -0.5 },
  { name: 'KyotoPhantom', country: '🇯🇵', carId: 'formula_apex', timeOffset: -0.2 },
  { name: 'BavarianBeast', country: '🇩🇪', carId: 'bmw_m4', timeOffset: 0.1 },
  { name: 'IberianNitro', country: '🇪🇸', carId: 'hyper_sport', timeOffset: 0.4 },
  { name: 'DubaiSupercar', country: '🇦🇪', carId: 'titan_hyper', timeOffset: 0.8 },
  { name: 'SeoulChallenger', country: '🇰🇷', carId: 'cyber_gtr', timeOffset: 1.2 },
  { name: 'AmsterdamSpeed', country: '🇳🇱', carId: 'bmw_m4', timeOffset: 1.6 },
  { name: 'AlpineBlizzard', country: '🇨🇭', carId: 'formula_apex', timeOffset: 2.1 }
];

export function formatLapTime(seconds: number): string {
  if (!seconds || seconds <= 0) return '--:--.--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const hundredths = Math.floor((seconds % 1) * 100);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
}

/**
 * Deterministically generates the global leaderboard for a specific level,
 * cleanly integrating the player's personal best time into the rankings.
 */
export function getGlobalLeaderboard(
  levelId: number,
  playerRecord?: LocalLapRecord,
  playerName: string = 'You (ApexPilot)',
  playerCountry: string = '🇺🇸'
): LeaderboardEntry[] {
  const level = getLevelConfig(levelId);
  const targetTime = level.targetTime;

  // Build AI Global Competitors for this level
  const entries: Array<{
    racerName: string;
    country: string;
    carId: string;
    carName: string;
    carColor: string;
    timeSeconds: number;
    date: string;
    isPlayer?: boolean;
  }> = [];

  GLOBAL_ROSTER.forEach((competitor, idx) => {
    // Unique deterministic variance per level & competitor
    const seed = (levelId * 37 + idx * 19) % 100;
    const variance = (seed / 100) * 0.9 - 0.45;
    const timeSeconds = Math.max(12, Number((targetTime + competitor.timeOffset + variance).toFixed(2)));

    const carDef = CAR_CATALOG.find(c => c.id === competitor.carId) || CAR_CATALOG[0];
    const carColor = carDef.colors[idx % carDef.colors.length];

    // Seeded realistic date within last 30 days
    const dayAgo = (idx * 3 + levelId) % 28 + 1;
    const dateStr = `Oct ${dayAgo}, 2026`;

    entries.push({
      racerName: competitor.name,
      country: competitor.country,
      carId: competitor.carId,
      carName: carDef.name,
      carColor,
      timeSeconds,
      date: dateStr,
      isPlayer: false
    });
  });

  // Inject Player if they completed this level
  if (playerRecord && playerRecord.timeSeconds > 0) {
    const playerCar = CAR_CATALOG.find(c => c.id === playerRecord.carId) || CAR_CATALOG[0];
    entries.push({
      racerName: playerName,
      country: playerCountry,
      carId: playerRecord.carId,
      carName: playerCar.name,
      carColor: playerRecord.carColor || playerCar.defaultColor,
      timeSeconds: Number(playerRecord.timeSeconds.toFixed(2)),
      date: playerRecord.date || 'Today',
      isPlayer: true
    });
  }

  // Sort ascending by fastest lap time
  entries.sort((a, b) => a.timeSeconds - b.timeSeconds);

  // Compute final ranks and deltas to #1
  const fastestTime = entries[0].timeSeconds;

  return entries.map((entry, index) => ({
    rank: index + 1,
    racerName: entry.racerName,
    country: entry.country,
    carId: entry.carId,
    carName: entry.carName,
    carColor: entry.carColor,
    timeSeconds: entry.timeSeconds,
    formattedTime: formatLapTime(entry.timeSeconds),
    deltaSeconds: Number((entry.timeSeconds - fastestTime).toFixed(2)),
    date: entry.date,
    isPlayer: !!entry.isPlayer
  }));
}
