/**
 * Apex Nitro 3D - Main Menu Screen
 */

import React, { useEffect, useRef, useState } from 'react';
import { Play, Wrench, Trophy, Settings as SettingsIcon, Coins, ArrowRight, Sparkles, ShieldCheck, Gift, Volume2, Flame, Zap, CheckCircle2 } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { CAR_CATALOG } from '../../data/carModels';
import { getLevelConfig } from '../../data/levelsData';
import { GarageEngine } from '../../game3d/garageEngine';
import { DailyMissionsModal } from '../ui/DailyMissionsModal';
import { soundManager } from '../../audio/soundManager';

export const MainMenu: React.FC = () => {
  const { progress, setScreen, startRace, setCarColor, getCarEffectiveStats } = useGame();
  const [isMissionsOpen, setIsMissionsOpen] = useState(false);
  const [isRevving, setIsRevving] = useState(false);

  const currentCar = CAR_CATALOG.find(c => c.id === progress.currentCarId) || CAR_CATALOG[0];
  const nextLevel = getLevelConfig(progress.highestUnlockedLevel);
  const effectiveStats = getCarEffectiveStats(currentCar.id);
  const currentColor = progress.carColors[currentCar.id] || currentCar.defaultColor;

  const totalStars = Object.values(progress.levelStars).reduce((sum, s) => sum + s, 0);

  const dailyMissions = progress.dailyMissions?.missions || [];
  const completedMissionsCount = dailyMissions.filter(m => m.completed).length;
  const hasUnclaimedMissions = dailyMissions.some(m => m.completed && !m.claimed) || 
    (dailyMissions.length > 0 && dailyMissions.every(m => m.completed) && !progress.dailyMissions?.bonusClaimed);

  const carPreviewRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GarageEngine | null>(null);

  // Live 3D turntable preview on Main Menu
  useEffect(() => {
    if (!carPreviewRef.current) return;

    const engine = new GarageEngine(
      carPreviewRef.current,
      currentCar.id,
      currentColor
    );
    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [currentCar.id, currentColor]);

  const handleQuickColor = (e: React.MouseEvent, colorHex: string) => {
    e.stopPropagation();
    setCarColor(currentCar.id, colorHex);
    if (engineRef.current) {
      engineRef.current.updateColor(colorHex);
    }
  };

  const handleRevEngine = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRevving) return;
    setIsRevving(true);
    soundManager.startEngine(currentCar.soundType === 'v8' ? 'v8' : 'sport');
    soundManager.updateEngine(140, 200, true, false);

    setTimeout(() => {
      soundManager.updateEngine(190, 200, true, true);
    }, 400);

    setTimeout(() => {
      soundManager.stopEngine();
      setIsRevving(false);
    }, 1200);
  };

  return (
    <div className="relative w-full h-full overflow-y-auto bg-slate-950 text-white select-none">
      {/* Main Content Container */}
      <div className="relative z-10 max-w-lg md:max-w-2xl mx-auto min-h-full flex flex-col justify-between p-4 sm:p-6 md:p-8">
        {/* Top Bar: Title & Player Coin Balance & Missions */}
        <div className="flex items-center justify-between gap-2 pt-2">
          <div>
            <span className="text-[10px] sm:text-[11px] font-extrabold tracking-widest uppercase text-cyan-400 block">
              High-Speed Mobile Racing
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-black italic tracking-wider text-white">
              FASTER NITRO <span className="text-cyan-400">3D</span>
            </h1>
          </div>

          {/* Daily Missions, Coins & Stars Pills */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Daily Missions Trigger */}
            <button
              onClick={() => {
                soundManager.playClick();
                setIsMissionsOpen(true);
              }}
              className="relative flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 border border-amber-400/40 rounded-2xl px-2.5 sm:px-3 py-1.5 backdrop-blur-md active:scale-95 transition-all shadow-md cursor-pointer"
              title="Daily Missions (24h Reset)"
            >
              <Gift className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] font-bold text-white hidden sm:inline">Tasks</span>
              <span className="font-mono-numbers text-[10px] font-black text-amber-300 bg-amber-400/20 px-1.5 py-0.5 rounded-lg border border-amber-400/30">
                {completedMissionsCount}/3
              </span>
              {hasUnclaimedMissions && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
              )}
            </button>

            {/* Leaderboards Trigger */}
            <button
              onClick={() => {
                soundManager.playClick();
                setScreen('leaderboard');
              }}
              className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 border border-amber-400/40 rounded-2xl px-2.5 sm:px-3 py-1.5 backdrop-blur-md active:scale-95 transition-all shadow-md cursor-pointer text-amber-300"
              title="Global & Local Leaderboards"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] font-bold text-white hidden sm:inline">Ranks</span>
            </button>

            {/* Coins */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-amber-400/30 rounded-2xl px-2.5 sm:px-3.5 py-1.5 backdrop-blur-md shadow-lg shadow-amber-500/10">
              <Coins className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="font-mono-numbers text-xs sm:text-sm font-black text-amber-300">
                {progress.coins.toLocaleString()}
              </span>
            </div>

            {/* Stars */}
            <div className="flex items-center gap-1 bg-slate-900/90 border border-white/10 rounded-2xl px-2 sm:px-2.5 py-1.5 backdrop-blur-md">
              <span className="text-amber-400 text-xs">★</span>
              <span className="font-mono-numbers text-xs font-bold text-slate-200">
                {totalStars}
              </span>
            </div>
          </div>
        </div>

        {/* Center Card: Active Car Spotlight & Next Level Prompt */}
        <div className="my-4 sm:my-6 space-y-4">
          {/* Active Car Showcase Banner with Live 3D Canvas */}
          <div
            onClick={() => setScreen('garage')}
            className="group relative bg-slate-900/80 hover:bg-slate-900/95 border border-white/15 hover:border-cyan-400/50 rounded-3xl p-4 sm:p-5 backdrop-blur-xl transition-all cursor-pointer shadow-xl overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Current Vehicle
                </span>
                <h3 className="font-display text-xl sm:text-2xl font-black text-white group-hover:text-cyan-300 transition-colors">
                  {currentCar.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {currentCar.tagline}
                </p>
              </div>

              <div
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white/30 shadow-md shrink-0"
                style={{ backgroundColor: currentColor }}
              />
            </div>

            {/* 3D Car Turntable Display */}
            <div
              ref={carPreviewRef}
              className="w-full h-44 sm:h-56 my-2 rounded-2xl bg-black border border-dotted border-cyan-400/40 relative overflow-hidden"
            />

            {/* Quick Paint Swatches & Rev Engine Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 my-2 px-1">
              <div className="flex items-center gap-1.5 bg-slate-950/70 p-1.5 rounded-xl border border-white/10">
                <span className="text-[9px] font-extrabold uppercase text-slate-400 mr-0.5">Paint:</span>
                {currentCar.colors.slice(0, 6).map(color => (
                  <button
                    key={color}
                    onClick={(e) => handleQuickColor(e, color)}
                    className={`w-5 h-5 rounded-full border transition-transform ${
                      currentColor === color ? 'scale-125 border-white ring-2 ring-cyan-400' : 'border-black/50 opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: color }}
                    title="Change Car Color"
                  />
                ))}
              </div>

              <button
                onClick={handleRevEngine}
                disabled={isRevving}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                  isRevving
                    ? 'bg-red-500/25 border-red-500 text-red-300 animate-pulse'
                    : 'bg-slate-950/70 hover:bg-slate-800 border-white/10 text-cyan-400 hover:border-cyan-400/40'
                }`}
                title="Rev Engine Audio"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-wider">{isRevving ? 'REVVING...' : 'REV ENGINE'}</span>
              </button>
            </div>

            {/* Quick Stat Bars */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-white/10">
              <div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                  <span>Top Speed</span>
                  <span className="font-mono-numbers text-white">{effectiveStats.topSpeed} km/h</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 rounded-full"
                    style={{ width: `${Math.min(100, (effectiveStats.topSpeed / 320) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                  <span>Acceleration</span>
                  <span className="font-mono-numbers text-white">{effectiveStats.acceleration.toFixed(1)}/10</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full"
                    style={{ width: `${(effectiveStats.acceleration / 10) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                  <span>Handling</span>
                  <span className="font-mono-numbers text-white">{effectiveStats.handling.toFixed(1)}/10</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-400 rounded-full"
                    style={{ width: `${(effectiveStats.handling / 10) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                  <span>Nitro</span>
                  <span className="font-mono-numbers text-white">{effectiveStats.nitro.toFixed(1)}/10</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: `${(effectiveStats.nitro / 10) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform">
              <span>Inspect & Customize in Garage</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Next Level Play Card */}
          <div className="bg-gradient-to-r from-cyan-950/60 to-slate-900 border border-cyan-500/30 rounded-3xl p-4 sm:p-5 flex items-center justify-between backdrop-blur-md">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Next Challenge
              </span>
              <h4 className="font-display text-base sm:text-lg font-bold text-white mt-0.5 truncate max-w-[180px] sm:max-w-[280px]">
                Level {nextLevel.id}: {nextLevel.name.split(':')[1] || nextLevel.name}
              </h4>
              <span className="text-xs text-slate-400">
                Reward: +{nextLevel.coinReward} Coins · {nextLevel.trackLength}m
              </span>
            </div>

            <button
              onClick={() => startRace(nextLevel.id)}
              className="h-13 sm:h-14 px-5 sm:px-6 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-display font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl flex items-center gap-2 shadow-lg shadow-cyan-500/30 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>RACE</span>
            </button>
          </div>

          {/* Daily Challenges Interactive Card */}
          <div
            onClick={() => {
              soundManager.playClick();
              setIsMissionsOpen(true);
            }}
            className="group relative bg-slate-900/80 hover:bg-slate-900/95 border border-amber-400/30 hover:border-amber-400/60 rounded-3xl p-4 sm:p-5 backdrop-blur-xl transition-all cursor-pointer shadow-xl overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-sm sm:text-base font-black uppercase tracking-wider text-white">
                      Daily Challenges
                    </h3>
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-400/30">
                      {completedMissionsCount}/{dailyMissions.length} Complete
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Complete objectives to earn bonus coins & nitro refills
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
                <span className="hidden sm:inline">View Tasks</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Quick Challenge Previews */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-white/10">
              {dailyMissions.slice(0, 3).map((m) => {
                const ratio = Math.min(1, m.currentProgress / m.targetCount);
                return (
                  <div key={m.id} className="bg-slate-950/60 rounded-xl p-2.5 border border-white/5 flex flex-col justify-between gap-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-200 truncate pr-1" title={m.title}>
                        {m.title}
                      </span>
                      {m.completed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <span className="font-mono-numbers text-[10px] text-amber-300 font-bold shrink-0">
                          +{m.rewardCoins}C
                        </span>
                      )}
                    </div>
                    {/* Mini progress bar */}
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          m.completed ? 'bg-emerald-400' : 'bg-amber-400'
                        }`}
                        style={{ width: `${ratio * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono-numbers">
                      <span>{m.currentProgress} / {m.targetCount}</span>
                      {m.rewardNitroRefills ? (
                        <span className="text-cyan-400 font-bold flex items-center gap-0.5">
                          <Zap className="w-2.5 h-2.5" /> +{m.rewardNitroRefills} Nitro
                        </span>
                      ) : (
                        <span>+{m.rewardCoins} Coins</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Navigation Menu Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Garage */}
          <button
            onClick={() => setScreen('garage')}
            className="h-20 bg-slate-900/90 hover:bg-slate-800/90 border border-white/10 hover:border-cyan-400/40 rounded-2xl p-4 flex flex-col justify-between text-left backdrop-blur-md active:scale-98 transition-all cursor-pointer shadow-lg"
          >
            <div className="flex items-center justify-between text-cyan-400">
              <Wrench className="w-6 h-6 stroke-[2.2]" />
              <span className="text-[10px] font-bold uppercase text-slate-400">{progress.unlockedCars.length}/6 Cars</span>
            </div>
            <div>
              <span className="font-display text-sm font-bold text-white block">Garage</span>
              <span className="text-[10px] text-slate-400">View & Paint</span>
            </div>
          </button>

          {/* Car Upgrades */}
          <button
            onClick={() => setScreen('upgrades')}
            className="h-20 bg-slate-900/90 hover:bg-slate-800/90 border border-white/10 hover:border-emerald-400/40 rounded-2xl p-4 flex flex-col justify-between text-left backdrop-blur-md active:scale-98 transition-all cursor-pointer shadow-lg"
          >
            <div className="flex items-center justify-between text-emerald-400">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
              <span className="text-[10px] font-bold uppercase text-emerald-400">Upgrade Shop</span>
            </div>
            <div>
              <span className="font-display text-sm font-bold text-white block">Upgrades</span>
              <span className="text-[10px] text-slate-400">Tune Speed & Nitro</span>
            </div>
          </button>

          {/* 100 Levels Map */}
          <button
            onClick={() => setScreen('levels')}
            className="h-20 bg-slate-900/90 hover:bg-slate-800/90 border border-white/10 hover:border-amber-400/40 rounded-2xl p-4 flex flex-col justify-between text-left backdrop-blur-md active:scale-98 transition-all cursor-pointer shadow-lg"
          >
            <div className="flex items-center justify-between text-amber-400">
              <Trophy className="w-6 h-6 stroke-[2.2]" />
              <span className="text-[10px] font-bold uppercase text-amber-400 font-mono-numbers">{progress.highestUnlockedLevel}/100</span>
            </div>
            <div>
              <span className="font-display text-sm font-bold text-white block">Level Select</span>
              <span className="text-[10px] text-slate-400">100 Tracks & Rewards</span>
            </div>
          </button>

          {/* Global & Local Leaderboards */}
          <button
            onClick={() => setScreen('leaderboard')}
            className="h-20 bg-slate-900/90 hover:bg-slate-800/90 border border-white/10 hover:border-cyan-400/40 rounded-2xl p-4 flex flex-col justify-between text-left backdrop-blur-md active:scale-98 transition-all cursor-pointer shadow-lg"
          >
            <div className="flex items-center justify-between text-cyan-400">
              <Trophy className="w-6 h-6 stroke-[2.2] text-amber-400" />
              <span className="text-[10px] font-bold uppercase text-amber-400">World Records</span>
            </div>
            <div>
              <span className="font-display text-sm font-bold text-white block">Leaderboard</span>
              <span className="text-[10px] text-slate-400">Global & Local</span>
            </div>
          </button>

          {/* Settings */}
          <button
            onClick={() => setScreen('settings')}
            className="h-20 bg-slate-900/90 hover:bg-slate-800/90 border border-white/10 hover:border-white/30 rounded-2xl p-4 flex flex-col justify-between text-left backdrop-blur-md active:scale-98 transition-all cursor-pointer shadow-lg col-span-2 sm:col-span-1"
          >
            <div className="flex items-center justify-between text-slate-300">
              <SettingsIcon className="w-6 h-6 stroke-[2.2]" />
              <span className="text-[10px] font-bold uppercase text-slate-400">Audio / Gfx</span>
            </div>
            <div>
              <span className="font-display text-sm font-bold text-white block">Settings</span>
              <span className="text-[10px] text-slate-400">Controls & Sound</span>
            </div>
          </button>
        </div>

        {/* Footer info */}
        <div className="text-center pt-2 text-[11px] text-slate-500 font-medium">
          Faster Nitro 3D Racing · Android Mobile Edition
        </div>
      </div>

      {/* Daily Missions Modal */}
      <DailyMissionsModal
        isOpen={isMissionsOpen}
        onClose={() => setIsMissionsOpen(false)}
      />
    </div>
  );
};
