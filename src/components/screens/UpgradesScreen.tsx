/**
 * Apex Nitro 3D - Performance Tuning & Upgrade Workshop
 */

import React, { useState } from 'react';
import { ArrowLeft, Coins, Gauge, Zap, Compass, Shield, Flame, Wrench, Check, Play } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { CAR_CATALOG, UPGRADE_CONFIG, getUpgradeCost } from '../../data/carModels';
import { StatType } from '../../types/game';
import { soundManager } from '../../audio/soundManager';

export const UpgradesScreen: React.FC = () => {
  const {
    progress,
    setScreen,
    buyUpgrade,
    getCarEffectiveStats,
    startRace
  } = useGame();

  const [selectedCarId, setSelectedCarId] = useState(progress.currentCarId);
  const car = CAR_CATALOG.find(c => c.id === selectedCarId) || CAR_CATALOG[0];
  const upgrades = progress.carUpgrades[car.id] || {
    topSpeed: 1,
    acceleration: 1,
    handling: 1,
    braking: 1,
    nitro: 1,
    durability: 1
  };
  const stats = getCarEffectiveStats(car.id);

  const statIcons: Record<StatType, React.ElementType> = {
    topSpeed: Gauge,
    acceleration: Zap,
    handling: Compass,
    braking: Shield,
    nitro: Flame,
    durability: Wrench
  };

  const handleBuy = (stat: StatType) => {
    const success = buyUpgrade(car.id, stat);
    if (!success) {
      soundManager.playCrash();
    }
  };

  return (
    <div className="relative w-full h-full overflow-y-auto bg-slate-950 text-white select-none">
      {/* Main container */}
      <div className="relative z-10 max-w-xl mx-auto p-4 md:p-6 pb-20">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setScreen('garage')}
            className="h-10 px-3 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl border border-white/15 flex items-center gap-1.5 text-xs font-semibold backdrop-blur-md active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Garage</span>
          </button>

          <h2 className="font-display text-lg md:text-xl font-black uppercase tracking-wider text-white">
            PERFORMANCE TUNING
          </h2>

          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-amber-400/30 rounded-xl px-3 py-1.5 backdrop-blur-md shadow-md">
            <Coins className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="font-mono-numbers text-xs md:text-sm font-black text-amber-300">
              {progress.coins.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Car Selector Chips (Only Unlocked Cars) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
          {CAR_CATALOG.filter(c => progress.unlockedCars.includes(c.id)).map(c => (
            <button
              key={c.id}
              onClick={() => {
                soundManager.playClick();
                setSelectedCarId(c.id);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
                selectedCarId === c.id
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900/70 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: progress.carColors[c.id] || c.defaultColor }}
              />
              <span>{c.name}</span>
            </button>
          ))}
        </div>

        {/* Selected Car Banner */}
        <div className="bg-slate-900/80 border border-white/15 rounded-3xl p-4 mb-4 backdrop-blur-md">
          <div className="flex justify-between items-baseline mb-2">
            <h3 className="font-display text-lg font-black text-white">
              {car.name}
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">
              {car.type} Class
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="bg-slate-950/60 rounded-xl p-2">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Top Speed</span>
              <span className="font-mono-numbers text-sm font-black text-cyan-400">{stats.topSpeed} km/h</span>
            </div>
            <div className="bg-slate-950/60 rounded-xl p-2">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Acceleration</span>
              <span className="font-mono-numbers text-sm font-black text-emerald-400">{stats.acceleration.toFixed(1)}/10</span>
            </div>
            <div className="bg-slate-950/60 rounded-xl p-2">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Nitro Tank</span>
              <span className="font-mono-numbers text-sm font-black text-amber-400">{stats.nitro.toFixed(1)}/10</span>
            </div>
            <div className="bg-slate-950/60 rounded-xl p-2">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Durability</span>
              <span className="font-mono-numbers text-sm font-black text-blue-400">{(stats.durability || 5).toFixed(1)}/10</span>
            </div>
          </div>
        </div>

        {/* Upgrade Cards List */}
        <div className="space-y-3">
          {(Object.keys(UPGRADE_CONFIG) as StatType[]).map(statKey => {
            const config = UPGRADE_CONFIG[statKey];
            const currentLevel = upgrades[statKey];
            const isMax = currentLevel >= config.maxLevel;
            const cost = getUpgradeCost(currentLevel, statKey);
            const canAfford = progress.coins >= cost;
            const Icon = statIcons[statKey];

            return (
              <div
                key={statKey}
                className="bg-slate-900/90 border border-white/15 rounded-2xl p-4 backdrop-blur-md shadow-lg flex flex-col gap-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-cyan-400">
                      <Icon className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-display text-sm font-black text-white">
                          {config.label}
                        </h4>
                        <span className="text-[10px] font-bold text-slate-400">
                          Lv. {currentLevel}/{config.maxLevel}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {config.description}
                      </p>
                    </div>
                  </div>

                  {/* Buy / Max Button */}
                  <div>
                    {isMax ? (
                      <div className="h-9 px-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>MAXED</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleBuy(statKey)}
                        disabled={!canAfford}
                        className={`h-9 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                          canAfford
                            ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md shadow-amber-400/20 active:scale-95 cursor-pointer'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                        }`}
                      >
                        <Coins className="w-3.5 h-3.5 fill-current" />
                        <span>{cost.toLocaleString()}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Level Pip Progress Indicator */}
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: config.maxLevel }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-2 flex-1 rounded-full transition-all ${
                        i < currentLevel
                          ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 shadow-sm shadow-cyan-400/30'
                          : 'bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Race Shortcut */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/90 backdrop-blur-xl border-t border-white/10 z-20">
          <div className="max-w-xl mx-auto flex items-center gap-3">
            <button
              onClick={() => setScreen('garage')}
              className="h-12 px-5 bg-slate-900 hover:bg-slate-800 border border-white/15 text-white font-semibold text-xs rounded-xl flex items-center justify-center active:scale-95 transition-transform"
            >
              <span>Back to Garage</span>
            </button>

            <button
              onClick={() => startRace(progress.highestUnlockedLevel)}
              className="flex-1 h-12 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-display font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 active:scale-98 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Race Level {progress.highestUnlockedLevel}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
