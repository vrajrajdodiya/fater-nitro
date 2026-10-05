/**
 * Apex Nitro 3D - Types & Interfaces
 */

export type BiomeType = 
  | 'city'
  | 'highway'
  | 'forest'
  | 'mountain'
  | 'desert'
  | 'night'
  | 'rainy_highway'
  | 'snow_mountain'
  | 'coastal_road'
  | 'extreme_storm'
  | 'championship';

export interface CarStats {
  topSpeed: number;     // km/h (140 - 320)
  acceleration: number; // m/s^2 factor (1 - 10)
  handling: number;     // turn rate & grip factor (1 - 10)
  braking: number;      // deceleration power (1 - 10)
  nitro: number;        // nitro capacity & boost multiplier (1 - 10)
  durability: number;   // collision resilience factor (1 - 10)
}

export interface CarUpgradeLevels {
  topSpeed: number;     // 1 - 10
  acceleration: number; // 1 - 10
  handling: number;     // 1 - 10
  braking: number;      // 1 - 10
  nitro: number;        // 1 - 10
  durability: number;   // 1 - 10
}

export type StatType = keyof CarUpgradeLevels;

export interface CarDefinition {
  id: string;
  name: string;
  tagline: string;
  type: 'Tuner' | 'Supercar' | 'Muscle' | 'Formula' | 'Hypercar' | 'Prototype';
  unlockedAtLevel: number;
  price: number;
  baseStats: CarStats;
  colors: string[];
  defaultColor: string;
  soundType: 'sport' | 'v8' | 'v10' | 'f1';
}

export interface LevelMilestoneReward {
  level: number;
  title: string;
  coins: number;
  carUnlockId?: string;
  paintUnlock?: string;
  nitroBonus?: number;
  description: string;
}

export interface LevelConfig {
  id: number;
  name: string;
  biome: BiomeType;
  trackLength: number; // in meters (approx 800 - 3500)
  turnsDifficulty: number; // 1 (straight) to 5 (extreme hairpins)
  opponentCount: number; // 1 to 3 AI opponents
  targetTime: number; // in seconds for 3-star rating
  twoStarTime: number; // in seconds for 2-star rating
  coinReward: number; // base reward for completing
  milestoneReward?: LevelMilestoneReward;
}

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  type: 'win_races' | 'win_races_in_biome' | 'collect_coins' | 'beat_target_time' | 'finish_races' | 'drift_distance' | 'near_miss' | 'use_nitro';
  targetCount: number;
  currentProgress: number;
  rewardCoins: number;
  rewardNitroRefills?: number;
  completed: boolean;
  claimed: boolean;
  biomeRequired?: BiomeType;
  icon: 'trophy' | 'coins' | 'clock' | 'flag' | 'flame' | 'zap';
}

export interface DailyMissionsState {
  lastDateKey: string; // e.g. "2026-10-04"
  missions: DailyMission[];
  bonusClaimed: boolean;
  grandBonusCoins: number;
  grandBonusNitroRefills?: number;
}

export interface LeaderboardEntry {
  rank: number;
  racerName: string;
  country: string;
  carId: string;
  carName: string;
  carColor: string;
  timeSeconds: number;
  formattedTime: string;
  deltaSeconds: number;
  date: string;
  isPlayer?: boolean;
}

export interface LocalLapRecord {
  levelId: number;
  timeSeconds: number;
  formattedTime: string;
  carId: string;
  carColor: string;
  date: string;
  stars: number;
  rank?: number;
}

export interface PlayerProgress {
  coins: number;
  currentCarId: string;
  carColors: Record<string, string>; // carId -> hex color
  carUpgrades: Record<string, CarUpgradeLevels>; // carId -> upgrades
  unlockedCars: string[]; // list of car IDs
  highestUnlockedLevel: number; // 1 - 100
  levelStars: Record<number, number>; // levelId -> 1, 2, or 3
  levelBestTimes: Record<number, number>; // levelId -> best time in seconds
  localLapRecords?: Record<number, LocalLapRecord>; // levelId -> detailed record
  playerName?: string;
  playerCountry?: string;
  claimedMilestones: number[]; // levels whose milestone rewards were claimed
  dailyMissions?: DailyMissionsState;
  nitroRefills?: number; // stored bonus nitro boost charges
  totalNearMisses?: number;
  totalDriftMeters?: number;
}

export interface GameSettings {
  soundEnabled: boolean;
  sfxVolume: number; // 0 - 1
  musicVolume: number; // 0 - 1
  vibration: boolean;
  graphicsQuality: 'high' | 'low';
  controlScheme: 'buttons' | 'wheel';
  cameraView: 'chase' | 'close' | 'hood';
  steeringSensitivity: number; // 0.6 - 1.8 (default 1.0)
}

export interface RaceResult {
  completed: boolean;
  won: boolean;
  time: number;
  targetTime: number;
  stars: number;
  position: number; // 1st, 2nd, etc.
  totalRacers: number;
  nearMisses: number;
  driftMeters: number;
  isBossRace?: boolean;
  coinsEarned: {
    base: number;
    positionBonus: number;
    timeBonus: number;
    nearMissBonus: number;
    collectedCoins: number;
    total: number;
  };
  milestoneUnlocked?: LevelMilestoneReward;
}

export type GameScreen = 
  | 'menu'
  | 'garage'
  | 'upgrades'
  | 'levels'
  | 'leaderboard'
  | 'settings'
  | 'race';
