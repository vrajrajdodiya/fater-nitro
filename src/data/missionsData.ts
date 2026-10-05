/**
 * Apex Nitro 3D - Daily Missions Generator & Tracking
 */

import { DailyMission, DailyMissionsState, BiomeType, RaceResult, LevelConfig } from '../types/game';

interface MissionTemplate {
  title: string;
  description: string;
  type: DailyMission['type'];
  targetCount: number;
  rewardCoins: number;
  rewardNitroRefills?: number;
  biomeRequired?: BiomeType;
  icon: DailyMission['icon'];
}

export const MISSION_POOL: MissionTemplate[] = [
  {
    title: 'Drift King 500m',
    description: 'Drift 500 meters across turns in races',
    type: 'drift_distance',
    targetCount: 500,
    rewardCoins: 750,
    rewardNitroRefills: 1,
    icon: 'flame'
  },
  {
    title: 'Speedway Duelist',
    description: 'Win 2 races in 1st place',
    type: 'win_races',
    targetCount: 2,
    rewardCoins: 800,
    rewardNitroRefills: 1,
    icon: 'trophy'
  },
  {
    title: 'Adrenaline Near Miss',
    description: 'Perform 4 high-speed Near Misses',
    type: 'near_miss',
    targetCount: 4,
    rewardCoins: 700,
    rewardNitroRefills: 1,
    icon: 'zap'
  },
  {
    title: 'Drift Precision 300m',
    description: 'Drift 300 meters through corners',
    type: 'drift_distance',
    targetCount: 300,
    rewardCoins: 550,
    rewardNitroRefills: 1,
    icon: 'flame'
  },
  {
    title: 'Nitro Overdrive',
    description: 'Use Nitro boost 4 times during races',
    type: 'use_nitro',
    targetCount: 4,
    rewardCoins: 650,
    rewardNitroRefills: 2,
    icon: 'zap'
  },
  {
    title: 'Razor-Edge Passing',
    description: 'Perform 6 Near Misses against rival cars',
    type: 'near_miss',
    targetCount: 6,
    rewardCoins: 900,
    rewardNitroRefills: 2,
    icon: 'zap'
  },
  {
    title: 'Desert Dominator',
    description: 'Win 2 races in the Desert biome',
    type: 'win_races_in_biome',
    targetCount: 2,
    rewardCoins: 600,
    rewardNitroRefills: 1,
    biomeRequired: 'desert',
    icon: 'trophy'
  },
  {
    title: 'Gold Rush Collector',
    description: 'Collect 50 coins floating on racing tracks',
    type: 'collect_coins',
    targetCount: 50,
    rewardCoins: 500,
    rewardNitroRefills: 1,
    icon: 'coins'
  },
  {
    title: 'Precision Speedster',
    description: 'Beat the target time with 3 stars in 2 races',
    type: 'beat_target_time',
    targetCount: 2,
    rewardCoins: 750,
    rewardNitroRefills: 1,
    icon: 'clock'
  },
  {
    title: 'Metropolis Core Blitz',
    description: 'Win 2 races in the City biome',
    type: 'win_races_in_biome',
    targetCount: 2,
    rewardCoins: 600,
    rewardNitroRefills: 1,
    biomeRequired: 'city',
    icon: 'flag'
  },
  {
    title: 'Asphalt Champion',
    description: 'Win 3 races in 1st place in any track',
    type: 'win_races',
    targetCount: 3,
    rewardCoins: 950,
    rewardNitroRefills: 2,
    icon: 'trophy'
  },
  {
    title: 'High-Altitude Climber',
    description: 'Win 2 races in Mountain passes',
    type: 'win_races_in_biome',
    targetCount: 2,
    rewardCoins: 650,
    rewardNitroRefills: 1,
    biomeRequired: 'mountain',
    icon: 'flag'
  },
  {
    title: 'Treasure Hunter',
    description: 'Collect 75 coins during your races',
    type: 'collect_coins',
    targetCount: 75,
    rewardCoins: 800,
    rewardNitroRefills: 1,
    icon: 'coins'
  },
  {
    title: 'Neon Night Rider',
    description: 'Win 2 races in the Night Track biome',
    type: 'win_races_in_biome',
    targetCount: 2,
    rewardCoins: 700,
    rewardNitroRefills: 1,
    biomeRequired: 'night',
    icon: 'flame'
  },
  {
    title: 'Endurance Racer',
    description: 'Finish 4 races across any championship levels',
    type: 'finish_races',
    targetCount: 4,
    rewardCoins: 650,
    rewardNitroRefills: 1,
    icon: 'flame'
  }
];

export function getTodayDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getSecondsUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
}

export function formatCountdown(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}

// Generate 3 unique tasks deterministically per date key
export function generateDailyMissions(dateKey: string): DailyMissionsState {
  // Simple seed hash from date string
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash << 5) - hash + dateKey.charCodeAt(i);
    hash |= 0;
  }
  hash = Math.abs(hash);

  const poolCopy = [...MISSION_POOL];
  const selected: DailyMission[] = [];

  // Pick 3 distinct items
  for (let i = 0; i < 3; i++) {
    const idx = (hash + i * 17) % poolCopy.length;
    const template = poolCopy.splice(idx, 1)[0] || MISSION_POOL[i];

    selected.push({
      id: `daily_${dateKey}_${i}_${template.type}`,
      title: template.title,
      description: template.description,
      type: template.type,
      targetCount: template.targetCount,
      currentProgress: 0,
      rewardCoins: template.rewardCoins,
      rewardNitroRefills: template.rewardNitroRefills || 1,
      completed: false,
      claimed: false,
      biomeRequired: template.biomeRequired,
      icon: template.icon
    });
  }

  return {
    lastDateKey: dateKey,
    missions: selected,
    bonusClaimed: false,
    grandBonusCoins: 1200, // Bonus for finishing all 3 daily tasks!
    grandBonusNitroRefills: 3
  };
}

/**
 * Checks and updates missions progress given a finished race.
 * Returns updated missions and any newly completed mission titles.
 */
export function updateMissionsOnRaceFinish(
  currentMissions: DailyMission[],
  raceResult: RaceResult,
  level: LevelConfig
): { updatedMissions: DailyMission[]; newlyCompleted: DailyMission[] } {
  const newlyCompleted: DailyMission[] = [];
  const coinsCollectedInRace = Math.round(raceResult.coinsEarned.collectedCoins / 25);
  const beatTarget = raceResult.time <= level.targetTime;

  const updatedMissions = currentMissions.map(mission => {
    if (mission.completed) return mission;

    let delta = 0;

    switch (mission.type) {
      case 'win_races':
        if (raceResult.won) delta = 1;
        break;

      case 'win_races_in_biome':
        if (raceResult.won && mission.biomeRequired && level.biome === mission.biomeRequired) {
          delta = 1;
        }
        break;

      case 'collect_coins':
        delta = coinsCollectedInRace;
        break;

      case 'beat_target_time':
        if (beatTarget) delta = 1;
        break;

      case 'finish_races':
        if (raceResult.completed) delta = 1;
        break;

      case 'drift_distance':
        delta = Math.round(raceResult.driftMeters || 0);
        break;

      case 'near_miss':
        delta = raceResult.nearMisses || 0;
        break;

      case 'use_nitro':
        delta = 1;
        break;
    }

    if (delta > 0) {
      const nextProgress = Math.min(mission.targetCount, mission.currentProgress + delta);
      const isNowCompleted = nextProgress >= mission.targetCount;

      if (isNowCompleted && !mission.completed) {
        newlyCompleted.push({
          ...mission,
          currentProgress: nextProgress,
          completed: true
        });
      }

      return {
        ...mission,
        currentProgress: nextProgress,
        completed: isNowCompleted
      };
    }

    return mission;
  });

  return { updatedMissions, newlyCompleted };
}
