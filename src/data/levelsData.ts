/**
 * Apex Nitro 3D - 100 Levels Generator & Milestone Rewards
 */

import { LevelConfig, LevelMilestoneReward, BiomeType } from '../types/game';

const BIOMES: BiomeType[] = [
  'city',
  'highway',
  'forest',
  'mountain',
  'desert',
  'night',
  'rainy_highway',
  'snow_mountain',
  'coastal_road',
  'extreme_storm',
  'championship'
];

export const BIOME_CONFIGS: Record<BiomeType, {
  name: string;
  skyColor: string;
  groundColor: string;
  roadColor: string;
  curbColorA: string;
  curbColorB: string;
  fogColor: string;
  fogDensity: number;
  lightColor: string;
  ambientColor: string;
  accentColor: string;
  propType: 'city_buildings' | 'highway_palms' | 'forest_woods' | 'mountain_pines' | 'desert_rocks' | 'night_lights' | 'rainy_highway' | 'snow_ice' | 'coastal_cliffs' | 'storm_mountains' | 'championship_arena';
}> = {
  city: {
    name: 'Modern City',
    skyColor: '#38bdf8',
    groundColor: '#334155',
    roadColor: '#1e293b',
    curbColorA: '#ef4444',
    curbColorB: '#f8fafc',
    fogColor: '#93c5fd',
    fogDensity: 0.0028,
    lightColor: '#ffffff',
    ambientColor: '#cbd5e1',
    accentColor: '#38bdf8',
    propType: 'city_buildings'
  },
  highway: {
    name: 'Express Highway',
    skyColor: '#fb923c',
    groundColor: '#ca8a04',
    roadColor: '#0f172a',
    curbColorA: '#facc15',
    curbColorB: '#1e293b',
    fogColor: '#fed7aa',
    fogDensity: 0.0022,
    lightColor: '#ffedd5',
    ambientColor: '#fdba74',
    accentColor: '#f97316',
    propType: 'highway_palms'
  },
  forest: {
    name: 'Emerald Forest',
    skyColor: '#4ade80',
    groundColor: '#14532d',
    roadColor: '#1c1917',
    curbColorA: '#22c55e',
    curbColorB: '#f8fafc',
    fogColor: '#bbf7d0',
    fogDensity: 0.0035,
    lightColor: '#f0fdf4',
    ambientColor: '#86efac',
    accentColor: '#10b981',
    propType: 'forest_woods'
  },
  mountain: {
    name: 'Alpine Mountain',
    skyColor: '#60a5fa',
    groundColor: '#3f3f46',
    roadColor: '#18181b',
    curbColorA: '#dc2626',
    curbColorB: '#ffffff',
    fogColor: '#bfdbfe',
    fogDensity: 0.003,
    lightColor: '#ffffff',
    ambientColor: '#94a3b8',
    accentColor: '#3b82f6',
    propType: 'mountain_pines'
  },
  desert: {
    name: 'Red Sand Desert',
    skyColor: '#fdba74',
    groundColor: '#b45309',
    roadColor: '#292524',
    curbColorA: '#f59e0b',
    curbColorB: '#78350f',
    fogColor: '#fde68a',
    fogDensity: 0.0032,
    lightColor: '#fffbeb',
    ambientColor: '#d97706',
    accentColor: '#eab308',
    propType: 'desert_rocks'
  },
  night: {
    name: 'Neon Night City',
    skyColor: '#090d16',
    groundColor: '#030712',
    roadColor: '#090d16',
    curbColorA: '#06b6d4',
    curbColorB: '#a855f7',
    fogColor: '#1e1b4b',
    fogDensity: 0.0032,
    lightColor: '#c084fc',
    ambientColor: '#312e81',
    accentColor: '#ec4899',
    propType: 'night_lights'
  },
  rainy_highway: {
    name: 'Rainy Highway',
    skyColor: '#334155',
    groundColor: '#1e293b',
    roadColor: '#090d16',
    curbColorA: '#38bdf8',
    curbColorB: '#64748b',
    fogColor: '#475569',
    fogDensity: 0.0042,
    lightColor: '#cbd5e1',
    ambientColor: '#64748b',
    accentColor: '#0284c7',
    propType: 'rainy_highway'
  },
  snow_mountain: {
    name: 'Snow Mountains',
    skyColor: '#e0f2fe',
    groundColor: '#f1f5f9',
    roadColor: '#334155',
    curbColorA: '#0284c7',
    curbColorB: '#ffffff',
    fogColor: '#e2e8f0',
    fogDensity: 0.0045,
    lightColor: '#f8fafc',
    ambientColor: '#bae6fd',
    accentColor: '#06b6d4',
    propType: 'snow_ice'
  },
  coastal_road: {
    name: 'Coastal Road',
    skyColor: '#fdba74',
    groundColor: '#ca8a04',
    roadColor: '#1e293b',
    curbColorA: '#f59e0b',
    curbColorB: '#06b6d4',
    fogColor: '#fed7aa',
    fogDensity: 0.0024,
    lightColor: '#ffedd5',
    ambientColor: '#fdba74',
    accentColor: '#0ea5e9',
    propType: 'coastal_cliffs'
  },
  extreme_storm: {
    name: 'Extreme Mountain Storm',
    skyColor: '#1e1b4b',
    groundColor: '#0f172a',
    roadColor: '#020617',
    curbColorA: '#ef4444',
    curbColorB: '#eab308',
    fogColor: '#312e81',
    fogDensity: 0.0048,
    lightColor: '#e2e8f0',
    ambientColor: '#4338ca',
    accentColor: '#f43f5e',
    propType: 'storm_mountains'
  },
  championship: {
    name: 'Ultimate Championship Track',
    skyColor: '#0f172a',
    groundColor: '#020617',
    roadColor: '#090d16',
    curbColorA: '#eab308',
    curbColorB: '#06b6d4',
    fogColor: '#1e293b',
    fogDensity: 0.0025,
    lightColor: '#ffffff',
    ambientColor: '#38bdf8',
    accentColor: '#facc15',
    propType: 'championship_arena'
  }
};

// Milestone reward details every 5 levels
export const MILESTONE_REWARDS: Record<number, LevelMilestoneReward> = {
  5: {
    level: 5,
    title: 'BOSS RACE COMPLETE: Shadow King Defeated!',
    coins: 1500,
    nitroBonus: 2,
    description: 'Crushed the Level 5 Boss! Claimed 1,500 Coins + Nitro Overdrive upgrade!'
  },
  10: {
    level: 10,
    title: 'Supercar Unlock: Hyper Sport V10',
    coins: 2000,
    carUnlockId: 'hyper_sport',
    description: 'Unlocked the legendary Hyper Sport V10 + 2,000 Coins!'
  },
  15: {
    level: 15,
    title: 'Rare Paint Unlock: Radiant Gold Chrome',
    coins: 2500,
    paintUnlock: '#eab308',
    description: 'Unlocked Radiant Gold Custom Paint + 2,500 Coins!'
  },
  20: {
    level: 20,
    title: 'Muscle Beast Unlock: V8 Thunder',
    coins: 3500,
    carUnlockId: 'muscle_beast',
    description: 'Unlocked V8 Thunder Beast raw torque muscle car + 3,500 Coins!'
  },
  25: {
    level: 25,
    title: 'Big Milestone Crate: Silver Apex',
    coins: 5000,
    nitroBonus: 3,
    description: 'Awarded 5,000 Coins & Supercharged Nitro Injector Module!'
  },
  30: {
    level: 30,
    title: 'Open-Wheel Monoposto: Apex Formula 1',
    coins: 7500,
    carUnlockId: 'formula_apex',
    description: 'Unlocked Apex Formula 1 aerodynamic open-wheel racer!'
  },
  35: {
    level: 35,
    title: 'Rare Paint: Electric Violet Pearl',
    coins: 9000,
    paintUnlock: '#8b5cf6',
    description: 'Unlocked Deep Violet Pearl Paint + 9,000 Coins!'
  },
  40: {
    level: 40,
    title: 'Hypercar Unlock: Cyber Phantom GT-R',
    coins: 12000,
    carUnlockId: 'cyber_gtr',
    description: 'Unlocked Cyber Phantom GT-R with active neon aerodynamics!'
  },
  45: {
    level: 45,
    title: 'Master Class Nitro Crate',
    coins: 14000,
    paintUnlock: '#06b6d4',
    description: 'Unlocked Cyber Cyan Neon Paint + 14,000 Coins!'
  },
  50: {
    level: 50,
    title: 'PROTOTYPE UNLOCK: Titan Nebula Spec-X',
    coins: 20000,
    carUnlockId: 'titan_hyper',
    description: 'UNLOCKED THE ULTIMATE MACH-1 TITAN NEBULA HYPERCAR!'
  },
  55: {
    level: 55,
    title: 'Grand Prix Stage I Champion',
    coins: 16000,
    description: 'Earned 16,000 Championship bonus Coins!'
  },
  60: {
    level: 60,
    title: 'High-Altitude Sovereign',
    coins: 18000,
    paintUnlock: '#ec4899',
    description: 'Unlocked Synthwave Pink Pearl + 18,000 Coins!'
  },
  65: {
    level: 65,
    title: 'Rain Storm Master Crate',
    coins: 22000,
    description: 'Awarded 22,000 Coins for wet-tarmac mastery!'
  },
  70: {
    level: 70,
    title: 'Continental Champion',
    coins: 26000,
    description: 'Awarded 26,000 Coins for cross-country domination!'
  },
  75: {
    level: 75,
    title: 'Diamond Nitrous Crate',
    coins: 30000,
    description: 'Earned 30,000 Coins to max out your prototype fleet!'
  },
  80: {
    level: 80,
    title: 'Coastal Speed Sovereign',
    coins: 35000,
    paintUnlock: '#10b981',
    description: 'Unlocked Emerald Racing Green Pearl + 35,000 Coins!'
  },
  85: {
    level: 85,
    title: 'Apex Legend Trophy',
    coins: 40000,
    description: 'Awarded 40,000 Coins for supreme precision racing!'
  },
  90: {
    level: 90,
    title: 'Pinnacle Master Badge',
    coins: 45000,
    description: 'Awarded 45,000 Coins as you enter the Top 10 Finals!'
  },
  95: {
    level: 95,
    title: 'Immortal Racer Trove',
    coins: 50000,
    description: 'Earned 50,000 Coins! Final 5 supreme trials await!'
  },
  100: {
    level: 100,
    title: 'GRAND WORLD CHAMPION TROPHY',
    coins: 100000,
    paintUnlock: '#ffffff',
    description: 'BEAT LEVEL 100! 100,000 Coins + Crown of Faster Nitro World Champion!'
  }
};

/**
 * Generate all 100 levels deterministically matching the requested biomes & AI scaling.
 */
export function generate100Levels(): LevelConfig[] {
  const levels: LevelConfig[] = [];

  for (let i = 1; i <= 100; i++) {
    // 10 biome zones matching user specifications:
    // Levels 1-10: Modern City
    // Levels 11-20: Highway
    // Levels 21-30: Forest
    // Levels 31-40: Mountain
    // Levels 41-50: Desert
    // Levels 51-60: Night City
    // Levels 61-70: Rainy Highway
    // Levels 71-80: Snow Mountains
    // Levels 81-90: Coastal Road
    // Levels 91-99: Extreme Mountain/Storm
    // Level 100: Ultimate Championship Track
    let biome: BiomeType;
    if (i <= 10) biome = 'city';
    else if (i <= 20) biome = 'highway';
    else if (i <= 30) biome = 'forest';
    else if (i <= 40) biome = 'mountain';
    else if (i <= 50) biome = 'desert';
    else if (i <= 60) biome = 'night';
    else if (i <= 70) biome = 'rainy_highway';
    else if (i <= 80) biome = 'snow_mountain';
    else if (i <= 90) biome = 'coastal_road';
    else if (i <= 99) biome = 'extreme_storm';
    else biome = 'championship';

    const biomeInfo = BIOME_CONFIGS[biome];

    // Difficulty curve (1 to 5)
    const progress = (i - 1) / 99;
    const turnsDifficulty = Math.min(5, Math.max(1, 1 + Math.floor(progress * 4.2)));

    // Track length increases gradually from ~800m to ~2900m
    const trackLength = Math.round(800 + progress * 2000 + ((i * 37) % 220));

    // Number of AI opponents: 3 to 5 AI opponents (4 to 6 racers total)
    let opponentCount: number;
    if (i <= 20) {
      opponentCount = 3; // 4 racers total
    } else if (i <= 50) {
      opponentCount = 4; // 5 racers total
    } else {
      opponentCount = 5; // 6 racers total
    }

    // Special Boss Race on Level 5!
    const isBossRace = i === 5;
    if (isBossRace) {
      opponentCount = 3; // Boss + 2 rival wings
    }

    // Target times scaled realistically to track length and car speeds (approx 35s - 90s)
    const baseSpeedMps = 33 + progress * 24; // ~120 km/h to ~205 km/h
    const idealSeconds = Math.round(trackLength / baseSpeedMps);
    const targetTime = idealSeconds + 6; // 3-star requirement
    const twoStarTime = targetTime + 8; // 2-star requirement

    // Base coin reward scales with level
    const coinReward = Math.round(180 + i * 32 + (i % 5 === 0 ? 300 : 0));

    const milestoneReward = MILESTONE_REWARDS[i];

    const names = [
      'Sprint', 'Circuit', 'Dash', 'Rush', 'Championship', 'Grand Prix',
      'Overdrive', 'Ascent', 'Showdown', 'Clash', 'Speedway', 'Apex Run'
    ];
    const suffix = isBossRace ? 'BOSS SHOWDOWN' : names[(i * 3) % names.length];

    levels.push({
      id: i,
      name: `Level ${i}: ${biomeInfo.name} ${suffix}`,
      biome,
      trackLength,
      turnsDifficulty: isBossRace ? 3 : turnsDifficulty,
      opponentCount,
      targetTime,
      twoStarTime,
      coinReward,
      milestoneReward
    });
  }

  return levels;
}

export const ALL_LEVELS = generate100Levels();

export function getLevelConfig(levelId: number): LevelConfig {
  const found = ALL_LEVELS.find(l => l.id === levelId);
  return found || ALL_LEVELS[0];
}
