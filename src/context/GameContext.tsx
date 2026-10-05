/**
 * Apex Nitro 3D - Game State Management & LocalStorage Persistence
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  PlayerProgress,
  GameSettings,
  GameScreen,
  CarStats,
  StatType,
  RaceResult,
  CarUpgradeLevels,
  DailyMission
} from '../types/game';
import { CAR_CATALOG, UPGRADE_CONFIG, getUpgradeCost } from '../data/carModels';
import { ALL_LEVELS, getLevelConfig } from '../data/levelsData';
import { soundManager } from '../audio/soundManager';
import {
  getTodayDateKey,
  generateDailyMissions,
  updateMissionsOnRaceFinish
} from '../data/missionsData';
import { formatLapTime } from '../data/leaderboardData';

interface GameContextType {
  progress: PlayerProgress;
  settings: GameSettings;
  currentScreen: GameScreen;
  activeRaceLevel: number;
  setScreen: (screen: GameScreen) => void;
  startRace: (levelId: number) => void;
  selectCar: (carId: string) => void;
  unlockCar: (carId: string) => boolean;
  setCarColor: (carId: string, colorHex: string) => void;
  buyUpgrade: (carId: string, stat: StatType) => boolean;
  recordRaceResult: (result: RaceResult, levelId: number) => void;
  updateSettings: (newSettings: Partial<GameSettings>) => void;
  updatePlayerProfile: (name: string, country: string) => void;
  claimMilestone: (levelNumber: number) => void;
  claimMissionReward: (missionId: string) => void;
  claimDailyGrandBonus: () => void;
  getCarEffectiveStats: (carId: string) => CarStats;
  resetProgress: () => void;
}

const STORAGE_KEY_PROGRESS = 'apex_nitro_progress_v1';
const STORAGE_KEY_SETTINGS = 'apex_nitro_settings_v1';

const DEFAULT_UPGRADES: CarUpgradeLevels = {
  topSpeed: 1,
  acceleration: 1,
  handling: 1,
  braking: 1,
  nitro: 1,
  durability: 1
};

const todayKey = getTodayDateKey();

const INITIAL_PROGRESS: PlayerProgress = {
  coins: 500, // starting coins for immediate fun
  currentCarId: 'bmw_m4',
  carColors: {
    bmw_m4: '#1d4ed8',
    hyper_sport: '#f97316',
    muscle_beast: '#1e293b'
  },
  carUpgrades: {
    bmw_m4: { ...DEFAULT_UPGRADES },
    hyper_sport: { ...DEFAULT_UPGRADES },
    muscle_beast: { ...DEFAULT_UPGRADES }
  },
  unlockedCars: ['bmw_m4', 'hyper_sport', 'muscle_beast'], // Game starts with 3 racer cars!
  highestUnlockedLevel: 1,
  levelStars: {},
  levelBestTimes: {},
  localLapRecords: {},
  playerName: 'ApexPilot',
  playerCountry: '🇺🇸',
  claimedMilestones: [],
  dailyMissions: generateDailyMissions(todayKey)
};

const INITIAL_SETTINGS: GameSettings = {
  soundEnabled: true,
  sfxVolume: 0.8,
  musicVolume: 0.5,
  vibration: true,
  graphicsQuality: 'high',
  controlScheme: 'buttons',
  cameraView: 'chase',
  steeringSensitivity: 1.0
};

const GameContext = createContext<GameContextType | null>(null);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [progress, setProgress] = useState<PlayerProgress>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROGRESS);
      if (saved) {
        const parsed = JSON.parse(saved);
        let curr = parsed.currentCarId === 'apex_cruiser' ? 'bmw_m4' : (parsed.currentCarId || 'bmw_m4');
        const unlocked = Array.from(new Set([...(parsed.unlockedCars || []).map((c: string) => c === 'apex_cruiser' ? 'bmw_m4' : c), 'bmw_m4', 'hyper_sport', 'muscle_beast']));
        return {
          ...INITIAL_PROGRESS,
          ...parsed,
          currentCarId: curr,
          unlockedCars: unlocked
        };
      }
    } catch {
      // fallback
    }
    return INITIAL_PROGRESS;
  });

  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return { ...INITIAL_SETTINGS, ...JSON.parse(saved) };
    } catch {
      // fallback
    }
    return INITIAL_SETTINGS;
  });

  const [currentScreen, setCurrentScreen] = useState<GameScreen>('menu');
  const [activeRaceLevel, setActiveRaceLevel] = useState<number>(1);

  // Sync settings with audio engine
  useEffect(() => {
    soundManager.setSettings(settings.soundEnabled, settings.sfxVolume, settings.musicVolume);
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  // Sync progress with local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progress));
    } catch {
      // ignore
    }
  }, [progress]);

  const updateSettings = useCallback((newSettings: Partial<GameSettings>) => {
    soundManager.playClick();
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const setScreen = useCallback((screen: GameScreen) => {
    soundManager.playClick();
    setCurrentScreen(screen);
  }, []);

  const startRace = useCallback((levelId: number) => {
    soundManager.playClick();
    setActiveRaceLevel(levelId);
    setCurrentScreen('race');
  }, []);

  const selectCar = useCallback((carId: string) => {
    soundManager.playClick();
    setProgress(prev => ({ ...prev, currentCarId: carId }));
  }, []);

  const unlockCar = useCallback((carId: string): boolean => {
    const car = CAR_CATALOG.find(c => c.id === carId);
    if (!car) return false;

    if (progress.coins >= car.price && !progress.unlockedCars.includes(carId)) {
      soundManager.playUpgrade();
      setProgress(prev => ({
        ...prev,
        coins: prev.coins - car.price,
        unlockedCars: [...prev.unlockedCars, carId],
        currentCarId: carId,
        carUpgrades: {
          ...prev.carUpgrades,
          [carId]: prev.carUpgrades[carId] || { ...DEFAULT_UPGRADES }
        }
      }));
      return true;
    }
    return false;
  }, [progress.coins, progress.unlockedCars]);

  const setCarColor = useCallback((carId: string, colorHex: string) => {
    soundManager.playClick();
    setProgress(prev => ({
      ...prev,
      carColors: {
        ...prev.carColors,
        [carId]: colorHex
      }
    }));
  }, []);

  const buyUpgrade = useCallback((carId: string, stat: StatType): boolean => {
    const currentUpgrades = progress.carUpgrades[carId] || { ...DEFAULT_UPGRADES };
    const currentLevel = currentUpgrades[stat];
    if (currentLevel >= UPGRADE_CONFIG[stat].maxLevel) return false;

    const cost = getUpgradeCost(currentLevel, stat);
    if (progress.coins >= cost) {
      soundManager.playUpgrade();
      setProgress(prev => ({
        ...prev,
        coins: prev.coins - cost,
        carUpgrades: {
          ...prev.carUpgrades,
          [carId]: {
            ...currentUpgrades,
            [stat]: currentLevel + 1
          }
        }
      }));
      return true;
    }
    return false;
  }, [progress.coins, progress.carUpgrades]);

  const getCarEffectiveStats = useCallback((carId: string): CarStats => {
    const carDef = CAR_CATALOG.find(c => c.id === carId) || CAR_CATALOG[0];
    const upgrades = progress.carUpgrades[carId] || { ...DEFAULT_UPGRADES };

    return {
      topSpeed: carDef.baseStats.topSpeed + (upgrades.topSpeed - 1) * UPGRADE_CONFIG.topSpeed.bonusPerLevel,
      acceleration: Math.min(10, carDef.baseStats.acceleration + (upgrades.acceleration - 1) * UPGRADE_CONFIG.acceleration.bonusPerLevel),
      handling: Math.min(10, carDef.baseStats.handling + (upgrades.handling - 1) * UPGRADE_CONFIG.handling.bonusPerLevel),
      braking: Math.min(10, carDef.baseStats.braking + (upgrades.braking - 1) * UPGRADE_CONFIG.braking.bonusPerLevel),
      nitro: Math.min(10, carDef.baseStats.nitro + (upgrades.nitro - 1) * UPGRADE_CONFIG.nitro.bonusPerLevel),
      durability: Math.min(10, (carDef.baseStats.durability || 5) + ((upgrades.durability || 1) - 1) * UPGRADE_CONFIG.durability.bonusPerLevel)
    };
  }, [progress.carUpgrades]);

  // Check and refresh 24-hour daily missions
  useEffect(() => {
    const today = getTodayDateKey();
    if (!progress.dailyMissions || progress.dailyMissions.lastDateKey !== today) {
      setProgress(prev => ({
        ...prev,
        dailyMissions: generateDailyMissions(today)
      }));
    }
  }, [progress.dailyMissions]);

  const claimMissionReward = useCallback((missionId: string) => {
    setProgress(prev => {
      if (!prev.dailyMissions) return prev;
      const mission = prev.dailyMissions.missions.find(m => m.id === missionId);
      if (!mission || !mission.completed || mission.claimed) return prev;

      soundManager.playUpgrade();

      const updatedMissions = prev.dailyMissions.missions.map(m =>
        m.id === missionId ? { ...m, claimed: true } : m
      );

      return {
        ...prev,
        coins: prev.coins + mission.rewardCoins,
        dailyMissions: {
          ...prev.dailyMissions,
          missions: updatedMissions
        }
      };
    });
  }, []);

  const claimDailyGrandBonus = useCallback(() => {
    setProgress(prev => {
      if (!prev.dailyMissions || prev.dailyMissions.bonusClaimed) return prev;
      const allCompleted = prev.dailyMissions.missions.every(m => m.completed);
      if (!allCompleted) return prev;

      soundManager.playWin();

      return {
        ...prev,
        coins: prev.coins + prev.dailyMissions.grandBonusCoins,
        dailyMissions: {
          ...prev.dailyMissions,
          bonusClaimed: true
        }
      };
    });
  }, []);

  const claimMilestone = useCallback((levelNumber: number) => {
    if (progress.claimedMilestones.includes(levelNumber)) return;
    const levelConfig = ALL_LEVELS.find(l => l.id === levelNumber);
    const reward = levelConfig?.milestoneReward;
    if (!reward) return;

    soundManager.playWin();

    setProgress(prev => {
      const nextUnlockedCars = [...prev.unlockedCars];
      if (reward.carUnlockId && !nextUnlockedCars.includes(reward.carUnlockId)) {
        nextUnlockedCars.push(reward.carUnlockId);
      }

      return {
        ...prev,
        coins: prev.coins + reward.coins,
        unlockedCars: nextUnlockedCars,
        claimedMilestones: [...prev.claimedMilestones, levelNumber]
      };
    });
  }, [progress.claimedMilestones]);

  const recordRaceResult = useCallback((result: RaceResult, levelId: number) => {
    setProgress(prev => {
      const nextCoins = prev.coins + result.coinsEarned.total;
      const nextStars = {
        ...prev.levelStars,
        [levelId]: Math.max(prev.levelStars[levelId] || 0, result.stars)
      };

      const prevBest = prev.levelBestTimes[levelId];
      const nextBestTimes = {
        ...prev.levelBestTimes,
        [levelId]: prevBest ? Math.min(prevBest, result.time) : result.time
      };

      // Unlock next level if race was won/completed
      let nextHighest = prev.highestUnlockedLevel;
      if (result.completed && levelId === prev.highestUnlockedLevel && levelId < 100) {
        nextHighest = levelId + 1;
      }

      // Check if milestone reward unlocked
      let nextClaimed = [...prev.claimedMilestones];
      let nextUnlockedCars = [...prev.unlockedCars];
      if (result.milestoneUnlocked && !nextClaimed.includes(levelId)) {
        nextClaimed.push(levelId);
        if (result.milestoneUnlocked.carUnlockId && !nextUnlockedCars.includes(result.milestoneUnlocked.carUnlockId)) {
          nextUnlockedCars.push(result.milestoneUnlocked.carUnlockId);
        }
      }

      // Update Daily Missions
      let nextDailyMissions = prev.dailyMissions;
      if (nextDailyMissions) {
        const levelConfig = getLevelConfig(levelId);
        const { updatedMissions, newlyCompleted } = updateMissionsOnRaceFinish(
          nextDailyMissions.missions,
          result,
          levelConfig
        );
        if (newlyCompleted.length > 0) {
          soundManager.playWin();
        }
        nextDailyMissions = {
          ...nextDailyMissions,
          missions: updatedMissions
        };
      }

      // Update local lap records
      const existingRecord = prev.localLapRecords?.[levelId];
      const isNewBest = !existingRecord || result.time < existingRecord.timeSeconds;
      const nextLocalRecords = {
        ...(prev.localLapRecords || {}),
        [levelId]: isNewBest
          ? {
              levelId,
              timeSeconds: result.time,
              formattedTime: formatLapTime(result.time),
              carId: prev.currentCarId,
              carColor: prev.carColors[prev.currentCarId] || '#1d4ed8',
              date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              stars: Math.max(existingRecord?.stars || 0, result.stars)
            }
          : existingRecord
      };

      return {
        ...prev,
        coins: nextCoins,
        levelStars: nextStars,
        levelBestTimes: nextBestTimes,
        localLapRecords: nextLocalRecords,
        highestUnlockedLevel: nextHighest,
        claimedMilestones: nextClaimed,
        unlockedCars: nextUnlockedCars,
        dailyMissions: nextDailyMissions
      };
    });
  }, []);

  const updatePlayerProfile = useCallback((name: string, country: string) => {
    setProgress(prev => ({
      ...prev,
      playerName: name.trim() || 'ApexPilot',
      playerCountry: country || '🇺🇸'
    }));
  }, []);

  const resetProgress = useCallback(() => {
    soundManager.playClick();
    setProgress(INITIAL_PROGRESS);
    setSettings(INITIAL_SETTINGS);
  }, []);

  const value = useMemo(() => ({
    progress,
    settings,
    currentScreen,
    activeRaceLevel,
    setScreen,
    startRace,
    selectCar,
    unlockCar,
    setCarColor,
    buyUpgrade,
    recordRaceResult,
    updateSettings,
    updatePlayerProfile,
    claimMilestone,
    claimMissionReward,
    claimDailyGrandBonus,
    getCarEffectiveStats,
    resetProgress
  }), [
    progress,
    settings,
    currentScreen,
    activeRaceLevel,
    setScreen,
    startRace,
    selectCar,
    unlockCar,
    setCarColor,
    buyUpgrade,
    recordRaceResult,
    updateSettings,
    updatePlayerProfile,
    claimMilestone,
    claimMissionReward,
    claimDailyGrandBonus,
    getCarEffectiveStats,
    resetProgress
  ]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
};
