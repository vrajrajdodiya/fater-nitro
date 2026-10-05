/**
 * Apex Nitro 3D - Race HUD (Speedometer, Nitro, Position, Timer, Checkpoints)
 */

import React, { useEffect, useRef } from 'react';
import { Pause, Coins, Flame, Flag, Clock, Lightbulb, Volume2, Zap, ShieldAlert, Trophy } from 'lucide-react';
import { LevelConfig } from '../../types/game';

interface RaceHUDProps {
  level: LevelConfig;
  speedKmh: number;
  rpm: number;
  nitroPercent: number;
  elapsedTime: number;
  position: number;
  totalRacers: number;
  progressPercent: number;
  coinsCollected: number;
  totalCoins: number;
  checkpointsPassed: number;
  totalCheckpoints: number;
  headlightsOn?: boolean;
  nearMissCount?: number;
  nearMissCombo?: number;
  driftMeters?: number;
  isBossRace?: boolean;
  activeNotification?: { text: string; subtext?: string; type: string } | null;
  onToggleHeadlights?: () => void;
  onHornStart?: () => void;
  onHornEnd?: () => void;
  onPause: () => void;
}

export const RaceHUD: React.FC<RaceHUDProps> = ({
  level,
  speedKmh,
  nitroPercent,
  elapsedTime,
  position,
  totalRacers,
  progressPercent,
  coinsCollected,
  checkpointsPassed,
  totalCheckpoints,
  headlightsOn = true,
  nearMissCount = 0,
  nearMissCombo = 1,
  driftMeters = 0,
  isBossRace = false,
  activeNotification = null,
  onToggleHeadlights,
  onHornStart,
  onHornEnd,
  onPause
}) => {
  const speedLinesRef = useRef<HTMLCanvasElement | null>(null);

  // Speed lines animation overlay during high speed (>170km/h) or nitro
  useEffect(() => {
    const canvas = speedLinesRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const lines: Array<{ x: number; y: number; length: number; speed: number; angle: number }> = [];

    const handleResize = () => {
      canvas.width = canvas.clientWidth || window.innerWidth;
      canvas.height = canvas.clientHeight || window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (speedKmh > 160) {
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const intensity = Math.min(1.0, (speedKmh - 160) / 90);
        const count = Math.floor(18 * intensity);

        // Spawn new speed lines
        while (lines.length < count) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 80 + Math.random() * (canvas.width * 0.4);
          lines.push({
            x: cx + Math.cos(angle) * dist,
            y: cy + Math.sin(angle) * dist,
            length: 30 + Math.random() * 60 * intensity,
            speed: 12 + Math.random() * 20,
            angle
          });
        }

        ctx.strokeStyle = `rgba(103, 232, 249, ${0.35 * intensity})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();

        for (let i = lines.length - 1; i >= 0; i--) {
          const l = lines[i];
          const x2 = l.x + Math.cos(l.angle) * l.length;
          const y2 = l.y + Math.sin(l.angle) * l.length;
          ctx.moveTo(l.x, l.y);
          ctx.lineTo(x2, y2);

          l.x += Math.cos(l.angle) * l.speed;
          l.y += Math.sin(l.angle) * l.speed;

          if (l.x < -100 || l.x > canvas.width + 100 || l.y < -100 || l.y > canvas.height + 100) {
            lines.splice(i, 1);
          }
        }
        ctx.stroke();
      } else {
        lines.length = 0;
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [speedKmh]);

  // Format seconds to mm:ss.ms
  const minutes = Math.floor(elapsedTime / 60);
  const seconds = Math.floor(elapsedTime % 60);
  const centiseconds = Math.floor((elapsedTime % 1) * 100);
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;

  const targetMinutes = Math.floor(level.targetTime / 60);
  const targetSeconds = Math.floor(level.targetTime % 60);
  const formattedTarget = `${String(targetMinutes).padStart(2, '0')}:${String(targetSeconds).padStart(2, '0')}`;

  // Position ordinal suffix
  const ordinals = ['1st', '2nd', '3rd', '4th', '5th', '6th'];
  const rankLabel = ordinals[position - 1] || `${position}th`;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-3 md:p-5 select-none overflow-hidden">
      {/* High-speed motion lines canvas overlay */}
      <canvas
        ref={speedLinesRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Top Header Bar */}
      <div className="relative z-10 flex items-center justify-between gap-3 w-full">
        {/* Left: Pause + Level Badge + Position */}
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={onPause}
            className="pointer-events-auto p-2.5 bg-slate-900/80 hover:bg-slate-800 text-white rounded-2xl border border-white/15 backdrop-blur-md active:scale-95 transition-transform flex items-center justify-center shadow-lg cursor-pointer"
            title="Pause Race"
          >
            <Pause className="w-5 h-5" />
          </button>

          {/* Level Info */}
          <div className="bg-slate-900/80 border border-white/15 backdrop-blur-md rounded-2xl px-3 py-1.5 flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">
              Level {level.id}
            </span>
            <span className="text-xs font-bold text-white truncate max-w-[120px] sm:max-w-[180px]">
              {level.name.split(':')[1] || level.name}
            </span>
          </div>

          {/* Position Rank: 1st / 6 */}
          <div className={`border backdrop-blur-md rounded-2xl px-3.5 py-1.5 flex items-baseline gap-1 text-slate-950 font-display shadow-lg ${
            position === 1
              ? 'bg-gradient-to-r from-amber-400 to-yellow-500 border-amber-300/40 shadow-amber-500/20'
              : position <= 3
              ? 'bg-gradient-to-r from-cyan-400 to-blue-500 border-cyan-300/40 shadow-cyan-500/20'
              : 'bg-slate-800 border-white/20 text-white'
          }`}>
            <span className="text-lg md:text-xl font-black">{rankLabel}</span>
            <span className="text-xs font-extrabold opacity-75">/ {totalRacers}</span>
          </div>
        </div>

        {/* Center: Boss Badge or Track Progress Bar */}
        <div className="hidden sm:flex flex-col items-center max-w-[220px] w-full">
          {isBossRace ? (
            <div className="flex items-center gap-2 bg-red-950/85 border border-red-500/60 rounded-full px-4 py-1 backdrop-blur-md shadow-lg shadow-red-600/30 animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="font-display text-[11px] font-black uppercase tracking-wider text-red-200">
                BOSS: SHADOW PHANTOM
              </span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between w-full text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                <span className="flex items-center gap-1">
                  <Flag className="w-3 h-3 text-cyan-400" /> Track Progress
                </span>
                <span className="font-mono-numbers text-cyan-300">{progressPercent}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-900/80 border border-white/15 rounded-full overflow-hidden p-0.5 backdrop-blur-sm">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-150"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </>
          )}
        </div>

        {/* Right: Race Timer & Coins Collected */}
        <div className="flex items-center gap-2">
          {/* Coins In-Race */}
          <div className="bg-slate-900/80 border border-white/15 backdrop-blur-md rounded-2xl px-3 py-1.5 flex items-center gap-1.5 shadow-lg">
            <Coins className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="font-mono-numbers text-xs md:text-sm font-bold text-amber-300">
              +{coinsCollected * 25}
            </span>
          </div>

          {/* Race Timer */}
          <div className="bg-slate-900/80 border border-white/15 backdrop-blur-md rounded-2xl px-3 py-1.5 flex flex-col items-end shadow-lg">
            <div className="flex items-center gap-1 text-[9px] uppercase font-bold text-slate-400">
              <Clock className="w-3 h-3 text-cyan-400" /> Target {formattedTarget}
            </div>
            <span className="font-mono-numbers text-base md:text-lg font-black text-white tracking-wider">
              {formattedTime}
            </span>
          </div>
        </div>
      </div>

      {/* Floating Center Notification (Near Miss, Nitro Surge, Combos) */}
      {activeNotification && (
        <div className="relative z-20 self-center bg-gradient-to-r from-slate-950/95 via-cyan-950/95 to-slate-950/95 border-2 border-cyan-400 rounded-3xl px-6 py-2.5 backdrop-blur-xl shadow-2xl shadow-cyan-500/40 flex flex-col items-center animate-bounce">
          <span className="font-display text-lg sm:text-2xl font-black text-cyan-300 tracking-wider drop-shadow-md">
            {activeNotification.text}
          </span>
          {activeNotification.subtext && (
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-amber-300">
              {activeNotification.subtext}
            </span>
          )}
        </div>
      )}

      {/* Middle Center: Checkpoints Indicator & Drift Counter */}
      <div className="relative z-10 flex flex-col items-center gap-1 w-full">
        {totalCheckpoints > 0 && (
          <div className="bg-slate-900/70 border border-white/10 backdrop-blur-sm rounded-full px-3 py-1 text-[11px] font-semibold text-slate-300 flex items-center gap-2">
            <span>Checkpoints:</span>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalCheckpoints }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    i < checkpointsPassed ? 'bg-emerald-400 ring-2 ring-emerald-400/30' : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {driftMeters > 20 && (
          <div className="bg-slate-950/80 border border-amber-400/40 rounded-full px-3 py-0.5 text-[10px] font-extrabold text-amber-300 flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span>Drift: {driftMeters}m</span>
          </div>
        )}
      </div>

      {/* Bottom Center: Controls & Cyber Speedometer */}
      <div className="relative z-10 flex flex-col items-center justify-end pb-2">
        {/* Lights & Horn Quick Action Buttons */}
        <div className="flex items-center gap-2.5 mb-2">
          {onToggleHeadlights && (
            <button
              onClick={onToggleHeadlights}
              className={`pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border backdrop-blur-md shadow-lg active:scale-95 transition-all cursor-pointer ${
                headlightsOn
                  ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-cyan-500/20'
                  : 'bg-slate-900/80 border-white/15 text-slate-400'
              }`}
              title="Toggle Headlights [L]"
            >
              <Lightbulb className={`w-3.5 h-3.5 ${headlightsOn ? 'text-cyan-300 fill-cyan-300 animate-pulse' : 'text-slate-500'}`} />
              <span className="text-[10px] font-black uppercase tracking-wider">
                {headlightsOn ? 'LIGHTS ON' : 'LIGHTS OFF'}
              </span>
            </button>
          )}

          {onHornStart && (
            <button
              onPointerDown={onHornStart}
              onPointerUp={onHornEnd}
              onPointerLeave={onHornEnd}
              className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 backdrop-blur-md shadow-lg shadow-amber-500/10 active:scale-95 active:bg-amber-500/40 transition-all cursor-pointer select-none"
              title="Honk Horn [H]"
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-[10px] font-black uppercase tracking-wider">HONK HORN</span>
            </button>
          )}
        </div>

        {/* Speed & Nitro HUD cluster */}
        <div className="flex flex-col items-center bg-slate-950/85 border border-white/15 backdrop-blur-xl rounded-3xl p-3 px-6 shadow-2xl">
          {/* Speed Digital Readout */}
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-4xl sm:text-5xl font-black tracking-tight text-white drop-shadow-md">
              {speedKmh}
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-cyan-400 uppercase tracking-widest">
              KM/H
            </span>
          </div>

          {/* Nitro Fuel Bar */}
          <div className="flex items-center gap-2 w-48 sm:w-56 mt-1">
            <Flame className={`w-4 h-4 ${nitroPercent > 20 ? 'text-cyan-400 fill-cyan-400 animate-pulse' : 'text-slate-500'}`} />
            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-indigo-400 rounded-full transition-all duration-100 shadow-sm shadow-cyan-400"
                style={{ width: `${nitroPercent}%` }}
              />
            </div>
            <span className="font-mono-numbers text-[10px] font-bold text-cyan-300 w-8 text-right">
              {nitroPercent}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
