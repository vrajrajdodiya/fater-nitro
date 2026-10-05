/**
 * Apex Nitro 3D - 100 Levels Selection Screen & Milestone Rewards
 */

import React, { useState } from 'react';
import { ArrowLeft, Coins, Lock, Star, Trophy, Sparkles, Play, Flag, Gift, CheckCircle2 } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { ALL_LEVELS, BIOME_CONFIGS } from '../../data/levelsData';
import { LevelConfig, BiomeType } from '../../types/game';
import { soundManager } from '../../audio/soundManager';

export const LevelSelectScreen: React.FC = () => {
  const { progress, setScreen, startRace, claimMilestone } = useGame();
  const [selectedBiome, setSelectedBiome] = useState<BiomeType | 'all'>('all');
  const [activeLevelDetails, setActiveLevelDetails] = useState<LevelConfig | null>(null);

  const biomes: Array<{ id: BiomeType | 'all'; label: string }> = [
    { id: 'all', label: 'All 100 Tracks' },
    { id: 'city', label: '1-10 City' },
    { id: 'highway', label: '11-20 Highway' },
    { id: 'forest', label: '21-30 Forest' },
    { id: 'mountain', label: '31-40 Mountain' },
    { id: 'desert', label: '41-50 Desert' },
    { id: 'night', label: '51-60 Night City' },
    { id: 'rainy_highway', label: '61-70 Rainy' },
    { id: 'snow_mountain', label: '71-80 Snow' },
    { id: 'coastal_road', label: '81-90 Coastal' },
    { id: 'extreme_storm', label: '91-99 Storm' },
    { id: 'championship', label: '100 Final' }
  ];

  const filteredLevels = selectedBiome === 'all'
    ? ALL_LEVELS
    : ALL_LEVELS.filter(l => l.biome === selectedBiome);

  const handleLevelClick = (lvl: LevelConfig) => {
    soundManager.playClick();
    if (lvl.id <= progress.highestUnlockedLevel) {
      setActiveLevelDetails(lvl);
    }
  };

  const handleClaim = (e: React.MouseEvent, lvlNum: number) => {
    e.stopPropagation();
    claimMilestone(lvlNum);
  };

  return (
    <div className="relative w-full h-full overflow-y-auto bg-slate-950 text-white select-none">
      {/* Main Container */}
      <div className="relative z-10 max-w-2xl mx-auto p-4 md:p-6 pb-24">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setScreen('menu')}
            className="h-10 px-3 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl border border-white/15 flex items-center gap-1.5 text-xs font-semibold backdrop-blur-md active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Menu</span>
          </button>

          <div className="text-center">
            <h2 className="font-display text-lg md:text-xl font-black uppercase tracking-wider text-white">
              CHAMPIONSHIP MAP
            </h2>
            <span className="text-[11px] font-semibold text-cyan-400">
              {progress.highestUnlockedLevel}/100 Levels Unlocked
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-amber-400/30 rounded-xl px-3 py-1.5 backdrop-blur-md shadow-md">
            <Coins className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="font-mono-numbers text-xs md:text-sm font-black text-amber-300">
              {progress.coins.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Biome Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
          {biomes.map(b => (
            <button
              key={b.id}
              onClick={() => {
                soundManager.playClick();
                setSelectedBiome(b.id);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                selectedBiome === b.id
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900/70 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>

        {/* Milestone Rewards Banner Info */}
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-purple-500/15 border border-amber-400/30 rounded-2xl p-3 mb-5 flex items-center gap-3">
          <div className="p-2 bg-amber-400/20 rounded-xl text-amber-300 shrink-0">
            <Trophy className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 block">
              MILESTONE REWARDS
            </span>
            <p className="text-xs text-slate-300">
              Special crates, supercars, and paints unlock every 5th level (5, 10, 15, 20... 100)!
            </p>
          </div>
        </div>

        {/* 100 Levels Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filteredLevels.map(lvl => {
            const isUnlocked = lvl.id <= progress.highestUnlockedLevel;
            const isCompleted = (progress.levelStars[lvl.id] || 0) > 0;
            const stars = progress.levelStars[lvl.id] || 0;
            const isMilestone = lvl.id % 5 === 0;
            const isMilestoneClaimed = progress.claimedMilestones.includes(lvl.id);
            const canClaimMilestone = isMilestone && isCompleted && !isMilestoneClaimed;
            const biomeInfo = BIOME_CONFIGS[lvl.biome];

            return (
              <div
                key={lvl.id}
                onClick={() => handleLevelClick(lvl)}
                className={`relative rounded-2xl p-3 border transition-all flex flex-col justify-between min-h-[110px] ${
                  isUnlocked
                    ? isMilestone
                      ? 'bg-slate-900/90 border-amber-400/50 hover:border-amber-400 shadow-lg shadow-amber-500/10 cursor-pointer active:scale-95'
                      : 'bg-slate-900/80 border-white/15 hover:border-cyan-400/50 shadow-md cursor-pointer active:scale-95'
                    : 'bg-slate-950/60 border-white/5 opacity-55 cursor-not-allowed'
                }`}
              >
                {/* Milestone Badge Pill */}
                {isMilestone && (
                  <div className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[9px] font-black uppercase tracking-wider rounded-md shadow-md flex items-center gap-0.5">
                    <Trophy className="w-2.5 h-2.5" />
                    <span>L{lvl.id} Gift</span>
                  </div>
                )}

                {/* Level Number & Biome */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-display text-base font-black text-white">
                      #{lvl.id}
                    </span>
                    {!isUnlocked ? (
                      <Lock className="w-3.5 h-3.5 text-slate-500" />
                    ) : isCompleted ? (
                      <div className="flex items-center text-amber-400 text-xs">
                        {Array.from({ length: 3 }).map((_, s) => (
                          <span key={s} className={s < stars ? 'text-amber-400' : 'text-slate-700'}>
                            ★
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[9px] font-extrabold text-cyan-400 uppercase tracking-wider">
                        Ready
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] font-semibold text-slate-400 truncate block mt-0.5">
                    {biomeInfo.name}
                  </span>
                </div>

                {/* Bottom Details & Claim */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-mono-numbers">
                    +{lvl.coinReward} C
                  </span>

                  {canClaimMilestone ? (
                    <button
                      onClick={(e) => handleClaim(e, lvl.id)}
                      className="px-2 py-0.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg flex items-center gap-1 animate-pulse shadow-sm"
                    >
                      <Gift className="w-3 h-3" />
                      <span>CLAIM</span>
                    </button>
                  ) : isMilestoneClaimed ? (
                    <span className="text-emerald-400 flex items-center gap-0.5 font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                    </span>
                  ) : (
                    <span className="text-slate-500 font-mono-numbers">
                      {lvl.trackLength}m
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Level Details Modal / Drawer */}
        {activeLevelDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="w-full max-w-sm bg-slate-900 border border-white/20 rounded-3xl p-5 text-white shadow-2xl">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
                    Level {activeLevelDetails.id} · {activeLevelDetails.biome.toUpperCase()}
                  </span>
                  <h3 className="font-display text-xl font-black text-white mt-0.5">
                    {activeLevelDetails.name}
                  </h3>
                </div>

                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: BIOME_CONFIGS[activeLevelDetails.biome].accentColor }}
                />
              </div>

              {/* Specs */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-3 rounded-2xl mb-4 border border-white/10">
                <div>
                  <span className="text-slate-400 block text-[10px]">Track Length</span>
                  <span className="font-bold text-white">{activeLevelDetails.trackLength} Meters</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Difficulty</span>
                  <span className="font-bold text-amber-400">{'★'.repeat(activeLevelDetails.turnsDifficulty)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">3-Star Target</span>
                  <span className="font-bold text-cyan-400 font-mono-numbers">{activeLevelDetails.targetTime}s</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">AI Opponents</span>
                  <span className="font-bold text-white">{activeLevelDetails.opponentCount} Cars</span>
                </div>
              </div>

              {/* Milestone Details if present */}
              {activeLevelDetails.milestoneReward && (
                <div className="bg-amber-500/15 border border-amber-400/30 rounded-2xl p-3 mb-4">
                  <span className="text-[10px] font-black uppercase text-amber-300 block">
                    MILESTONE REWARD ON FINISH:
                  </span>
                  <span className="text-xs font-bold text-white block mt-0.5">
                    {activeLevelDetails.milestoneReward.title}
                  </span>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    {activeLevelDetails.milestoneReward.description}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveLevelDetails(null)}
                  className="flex-1 h-12 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl border border-white/10"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    startRace(activeLevelDetails.id);
                  }}
                  className="flex-1 h-12 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-display font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/30"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>START RACE</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
