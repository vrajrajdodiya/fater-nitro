/**
 * Apex Nitro 3D - 3D Showroom & Garage Screen
 */

import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft, Coins, Lock, Check, Wrench, Play } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { CAR_CATALOG } from '../../data/carModels';
import { GarageEngine } from '../../game3d/garageEngine';
import { soundManager } from '../../audio/soundManager';

export const GarageScreen: React.FC = () => {
  const {
    progress,
    setScreen,
    selectCar,
    unlockCar,
    setCarColor,
    getCarEffectiveStats,
    startRace
  } = useGame();

  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GarageEngine | null>(null);

  // Car index selection
  const initialIndex = CAR_CATALOG.findIndex(c => c.id === progress.currentCarId);
  const [selectedIdx, setSelectedIdx] = useState(initialIndex >= 0 ? initialIndex : 0);

  const car = CAR_CATALOG[selectedIdx];
  const isUnlocked = progress.unlockedCars.includes(car.id);
  const isCurrent = progress.currentCarId === car.id;
  const currentColor = progress.carColors[car.id] || car.defaultColor;
  const stats = getCarEffectiveStats(car.id);

  // Initialize 3D Showroom
  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new GarageEngine(containerRef.current, car.id, currentColor);
    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Update 3D car when index changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.loadCar(car.id, currentColor);
    }
  }, [car.id, currentColor]);

  const handlePrevCar = () => {
    soundManager.playClick();
    setSelectedIdx(prev => (prev > 0 ? prev - 1 : CAR_CATALOG.length - 1));
  };

  const handleNextCar = () => {
    soundManager.playClick();
    setSelectedIdx(prev => (prev < CAR_CATALOG.length - 1 ? prev + 1 : 0));
  };

  const handleSelectColor = (colorHex: string) => {
    setCarColor(car.id, colorHex);
    if (engineRef.current) {
      engineRef.current.updateColor(colorHex);
    }
  };

  const handleUnlock = () => {
    const success = unlockCar(car.id);
    if (!success) {
      soundManager.playCrash();
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 text-white select-none flex flex-col justify-between">
      {/* 3D Turntable Showroom Canvas */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* Top Header Bar */}
      <div className="relative z-10 flex items-center justify-between p-4 md:p-6 backdrop-blur-sm bg-slate-950/40 border-b border-white/10">
        <button
          onClick={() => setScreen('menu')}
          className="h-10 px-3 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl border border-white/15 flex items-center gap-1.5 text-xs font-semibold backdrop-blur-md active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Menu</span>
        </button>

        <h2 className="font-display text-lg md:text-xl font-black uppercase tracking-wider text-white">
          SHOWROOM GARAGE
        </h2>

        {/* Coins Badge */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-amber-400/30 rounded-xl px-3 py-1.5 backdrop-blur-md shadow-md">
          <Coins className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span className="font-mono-numbers text-xs md:text-sm font-black text-amber-300">
            {progress.coins.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Center Left/Right Arrow Navigation Overlays */}
      <div className="relative z-10 flex items-center justify-between px-3 md:px-6 pointer-events-none">
        <button
          onClick={handlePrevCar}
          className="pointer-events-auto w-12 h-12 bg-slate-900/80 hover:bg-slate-800 text-white rounded-2xl border border-white/15 flex items-center justify-center backdrop-blur-md active:scale-90 transition-transform shadow-xl"
        >
          <ChevronLeft className="w-7 h-7 stroke-[2.5]" />
        </button>

        <button
          onClick={handleNextCar}
          className="pointer-events-auto w-12 h-12 bg-slate-900/80 hover:bg-slate-800 text-white rounded-2xl border border-white/15 flex items-center justify-center backdrop-blur-md active:scale-90 transition-transform shadow-xl"
        >
          <ChevronRight className="w-7 h-7 stroke-[2.5]" />
        </button>
      </div>

      {/* Bottom Panel: Car Specs, Color Chooser, Upgrade & Action Buttons */}
      <div className="relative z-10 p-4 md:p-6 backdrop-blur-xl bg-slate-950/85 border-t border-white/15 max-w-2xl mx-auto w-full rounded-t-3xl shadow-2xl">
        {/* Car Title & Tagline */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {car.type}
              </span>
              <span className="text-xs text-slate-400">
                Unlocked at Level {car.unlockedAtLevel}
              </span>
            </div>
            <h3 className="font-display text-xl md:text-2xl font-black text-white mt-1">
              {car.name}
            </h3>
            <p className="text-xs text-slate-300">
              {car.tagline}
            </p>
          </div>

          {/* Color Palette Picker */}
          {isUnlocked && (
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Custom Paint
              </span>
              <div className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-white/10">
                {car.colors.map(col => (
                  <button
                    key={col}
                    onClick={() => handleSelectColor(col)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      currentColor === col ? 'scale-125 border-white ring-2 ring-cyan-400' : 'border-black/50 opacity-80'
                    }`}
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3">
          <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-2">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
              <span>Top Speed</span>
              <span className="font-mono-numbers text-white">{stats.topSpeed} km/h</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${(stats.topSpeed / 320) * 100}%` }} />
            </div>
          </div>

          <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-2">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
              <span>Acceleration</span>
              <span className="font-mono-numbers text-white">{stats.acceleration.toFixed(1)}/10</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${(stats.acceleration / 10) * 100}%` }} />
            </div>
          </div>

          <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-2">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
              <span>Handling</span>
              <span className="font-mono-numbers text-white">{stats.handling.toFixed(1)}/10</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-400 rounded-full" style={{ width: `${(stats.handling / 10) * 100}%` }} />
            </div>
          </div>

          <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-2">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
              <span>Nitro Boost</span>
              <span className="font-mono-numbers text-white">{stats.nitro.toFixed(1)}/10</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(stats.nitro / 10) * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Action Controls: Select / Unlock / Upgrade */}
        <div className="flex items-center gap-2.5 pt-1">
          {isUnlocked ? (
            <>
              {isCurrent ? (
                <div className="flex-1 h-12 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-display font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Selected & Ready</span>
                </div>
              ) : (
                <button
                  onClick={() => selectCar(car.id)}
                  className="flex-1 h-12 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-98 transition-all"
                >
                  <span>Select Car</span>
                </button>
              )}

              <button
                onClick={() => setScreen('upgrades')}
                className="h-12 px-4 bg-slate-900 hover:bg-slate-800 border border-white/15 text-white font-semibold text-xs rounded-xl flex items-center gap-2 active:scale-95 transition-transform"
                title="Open Performance Upgrades"
              >
                <Wrench className="w-4 h-4 text-cyan-400" />
                <span>Upgrades</span>
              </button>

              <button
                onClick={() => startRace(progress.highestUnlockedLevel)}
                className="h-12 px-5 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-display font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Race</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={handleUnlock}
                disabled={progress.coins < car.price}
                className={`flex-1 h-12 font-display font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all ${
                  progress.coins >= car.price
                    ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg shadow-amber-400/25 active:scale-98 cursor-pointer'
                    : 'bg-slate-800 border border-white/10 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>Unlock for {car.price.toLocaleString()} Coins</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
