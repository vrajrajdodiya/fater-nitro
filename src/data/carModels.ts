/**
 * Apex Nitro 3D - Car Models & Specifications
 */

import { CarDefinition } from '../types/game';

export const CAR_CATALOG: CarDefinition[] = [
  {
    id: 'bmw_m4',
    name: 'BMW M4 Competition',
    tagline: '503 HP Twin-Turbo with signature vertical kidney grilles & M carbon roof',
    type: 'Tuner',
    unlockedAtLevel: 1,
    price: 0,
    baseStats: {
      topSpeed: 195,    // km/h (M Driver's package)
      acceleration: 6,  // 1-10
      handling: 7,      // 1-10
      braking: 6,       // 1-10
      nitro: 5,         // 1-10
      durability: 6     // 1-10
    },
    defaultColor: '#1d4ed8', // Portimao Blue
    colors: ['#1d4ed8', '#065f46', '#eab308', '#dc2626', '#f8fafc', '#0f172a', '#64748b'],
    soundType: 'sport'
  },
  {
    id: 'hyper_sport',
    name: 'Hyper Sport V10',
    tagline: 'High-downforce aerodynamic track champion',
    type: 'Supercar',
    unlockedAtLevel: 10,
    price: 3500,
    baseStats: {
      topSpeed: 215,
      acceleration: 6,
      handling: 7,
      braking: 6,
      nitro: 6,
      durability: 5
    },
    defaultColor: '#f97316', // Sunset Orange
    colors: ['#f97316', '#06b6d4', '#e11d48', '#84cc16', '#1e293b', '#fafafa'],
    soundType: 'v10'
  },
  {
    id: 'muscle_beast',
    name: 'V8 Thunder Beast',
    tagline: 'Raw American muscle with asphalt-tearing torque',
    type: 'Muscle',
    unlockedAtLevel: 20,
    price: 8000,
    baseStats: {
      topSpeed: 230,
      acceleration: 8,
      handling: 5,
      braking: 5,
      nitro: 7,
      durability: 9
    },
    defaultColor: '#1e293b', // Matte Stealth Black
    colors: ['#1e293b', '#dc2626', '#eab308', '#2563eb', '#f8fafc'],
    soundType: 'v8'
  },
  {
    id: 'formula_apex',
    name: 'Apex Formula 1',
    tagline: 'Open-wheel single-seater with surgical cornering',
    type: 'Formula',
    unlockedAtLevel: 30,
    price: 15000,
    baseStats: {
      topSpeed: 260,
      acceleration: 9,
      handling: 9,
      braking: 9,
      nitro: 8,
      durability: 4
    },
    defaultColor: '#06b6d4', // Cyan Racing
    colors: ['#06b6d4', '#e11d48', '#facc15', '#10b981', '#18181b'],
    soundType: 'f1'
  },
  {
    id: 'cyber_gtr',
    name: 'Cyber Phantom GT-R',
    tagline: 'Neo-Tokyo street weapon with twin-turbo AWD',
    type: 'Hypercar',
    unlockedAtLevel: 40,
    price: 24000,
    baseStats: {
      topSpeed: 285,
      acceleration: 9.5,
      handling: 8.5,
      braking: 8.5,
      nitro: 9,
      durability: 8
    },
    defaultColor: '#8b5cf6', // Electric Violet
    colors: ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#0f172a', '#e2e8f0'],
    soundType: 'v10'
  },
  {
    id: 'titan_hyper',
    name: 'Titan Nebula Spec-X',
    tagline: 'Active-aero hybrid prototype built for Mach 1',
    type: 'Prototype',
    unlockedAtLevel: 50,
    price: 40000,
    baseStats: {
      topSpeed: 310,
      acceleration: 10,
      handling: 10,
      braking: 10,
      nitro: 10,
      durability: 9
    },
    defaultColor: '#eab308', // Cyber Gold
    colors: ['#eab308', '#06b6d4', '#e11d48', '#3b82f6', '#090d16'],
    soundType: 'f1'
  }
];

export const UPGRADE_CONFIG = {
  topSpeed: {
    label: 'Engine: Top Speed',
    description: 'Increases maximum velocity on straights',
    icon: 'Gauge',
    maxLevel: 10,
    baseCost: 200,
    costMultiplier: 1.6,
    bonusPerLevel: 12 // km/h
  },
  acceleration: {
    label: 'Engine: Acceleration',
    description: 'Boosts engine torque and 0-100 km/h sprint',
    icon: 'Zap',
    maxLevel: 10,
    baseCost: 220,
    costMultiplier: 1.6,
    bonusPerLevel: 0.6
  },
  handling: {
    label: 'Handling & Grip',
    description: 'Improves high-speed steering and drift control',
    icon: 'Compass',
    maxLevel: 10,
    baseCost: 180,
    costMultiplier: 1.55,
    bonusPerLevel: 0.55
  },
  braking: {
    label: 'Braking Power',
    description: 'Shortens stopping distance before sharp hairpins',
    icon: 'Shield',
    maxLevel: 10,
    baseCost: 150,
    costMultiplier: 1.5,
    bonusPerLevel: 0.6
  },
  nitro: {
    label: 'Nitro System',
    description: 'Expands nitro capacity, refill rate and duration',
    icon: 'Flame',
    maxLevel: 10,
    baseCost: 250,
    costMultiplier: 1.65,
    bonusPerLevel: 0.7
  },
  durability: {
    label: 'Chassis Durability',
    description: 'Reduces collision speed loss and obstacle penalties',
    icon: 'ShieldCheck',
    maxLevel: 10,
    baseCost: 160,
    costMultiplier: 1.5,
    bonusPerLevel: 0.6
  }
};

export function getUpgradeCost(currentLevel: number, statKey: keyof typeof UPGRADE_CONFIG): number {
  if (currentLevel >= UPGRADE_CONFIG[statKey].maxLevel) return 0;
  const config = UPGRADE_CONFIG[statKey];
  return Math.round(config.baseCost * Math.pow(config.costMultiplier, currentLevel - 1));
}
