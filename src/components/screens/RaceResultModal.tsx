/**
 * Apex Nitro 3D - Race Result Modal (Victory/Defeat, Stars, Coins, Milestone Unlocks)
 */

import React from 'react';
import { Star, Trophy, ArrowRight, RotateCcw, Home, Sparkles, CheckCircle2, Gift } from 'lucide-react';
import { RaceResult, LevelConfig } from '../../types/game';
import { useGame } from '../../context/GameContext';

interface RaceResultModalProps {
  result: RaceResult;
  level: LevelConfig;
  onNextLevel: () => void;
  onRestart: () => void;
  onGarage: () => void;
  onMenu: () => void;
}

export const RaceResultModal: React.FC<RaceResultModalProps> = ({
  result,
  level,
  onNextLevel,
  onRestart,
  onGarage,
  onMenu
}) => {
  const { progress, setScreen } = useGame();
  const isWinner = result.position === 1;

  const dailyMissions = progress.dailyMissions?.missions || [];
  const claimableMissions = dailyMissions.filter(m => m.completed && !m.claimed);
  const claimableRewardSum = claimableMissions.reduce((acc, m) => acc + m.rewardCoins, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-md bg-slate-900 border border-white/20 rounded-3xl p-6 shadow-2xl text-white overflow-hidden">
        {/* Header Title */}
        <div className="flex flex-col items-center text-center mb-5">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-xl ${
              isWinner
                ? 'bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950'
                : 'bg-slate-800 text-cyan-400 border border-white/10'
            }`}
          >
            <Trophy className="w-9 h-9 stroke-[2.2]" />
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-wider text-white">
            {isWinner ? 'VICTORY!' : 'RACE FINISHED'}
          </h2>
          <span className="text-xs font-semibold text-slate-400 mt-0.5">
            {level.name}
          </span>
        </div>

        {/* Stars Earned */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {[1, 2, 3].map((starIdx) => {
            const hasStar = starIdx <= result.stars;
            return (
              <div
                key={starIdx}
                className={`p-2 rounded-2xl border transition-all transform ${
                  hasStar
                    ? 'bg-amber-400/20 border-amber-400 text-amber-300 scale-110 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-800/50 border-white/10 text-slate-600 scale-95'
                }`}
              >
                <Star className={`w-8 h-8 ${hasStar ? 'fill-amber-400' : ''}`} />
              </div>
            );
          })}
        </div>

        {/* Stats Grid: Position, Time, Target */}
        <div className="grid grid-cols-3 gap-2.5 mb-5 text-center">
          <div className="bg-slate-800/80 border border-white/10 rounded-2xl p-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Position
            </span>
            <span className="font-display text-lg font-black text-white">
              {result.position}
              <span className="text-xs text-slate-400">/{result.totalRacers}</span>
            </span>
          </div>

          <div className="bg-slate-800/80 border border-white/10 rounded-2xl p-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Time
            </span>
            <span className="font-mono-numbers text-lg font-black text-cyan-400">
              {result.time.toFixed(2)}s
            </span>
          </div>

          <div className="bg-slate-800/80 border border-white/10 rounded-2xl p-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Target
            </span>
            <span className="font-mono-numbers text-lg font-black text-slate-300">
              {result.targetTime}s
            </span>
          </div>
        </div>

        {/* Coins Rewards Breakdown */}
        <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-3.5 mb-5 space-y-1.5 text-xs font-semibold text-slate-300">
          <div className="flex justify-between items-center text-slate-400">
            <span>Base Completion Reward</span>
            <span className="font-mono-numbers text-white">+{result.coinsEarned.base}</span>
          </div>
          {result.coinsEarned.positionBonus > 0 && (
            <div className="flex justify-between items-center text-amber-300">
              <span>Position Bonus ({result.position === 1 ? '1st Place' : '2nd Place'})</span>
              <span className="font-mono-numbers">+{result.coinsEarned.positionBonus}</span>
            </div>
          )}
          {result.coinsEarned.timeBonus > 0 && (
            <div className="flex justify-between items-center text-emerald-400">
              <span>Beat Target Time Bonus</span>
              <span className="font-mono-numbers">+{result.coinsEarned.timeBonus}</span>
            </div>
          )}
          {result.coinsEarned.collectedCoins > 0 && (
            <div className="flex justify-between items-center text-yellow-300">
              <span>Coins Picked on Track</span>
              <span className="font-mono-numbers">+{result.coinsEarned.collectedCoins}</span>
            </div>
          )}
          <div className="pt-2 border-t border-white/10 flex justify-between items-center text-sm font-bold text-white">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" /> Total Coins Won
            </span>
            <span className="font-mono-numbers text-base text-amber-400 font-black">
              +{result.coinsEarned.total}
            </span>
          </div>
        </div>

        {/* Milestone Reward Notification if Level 5, 10, 15... */}
        {result.milestoneUnlocked && (
          <div className="mb-5 p-3.5 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-pink-500/20 border border-amber-400/40 rounded-2xl flex items-start gap-3">
            <div className="p-2 bg-amber-400 text-slate-950 rounded-xl mt-0.5">
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 block">
                SPECIAL MILESTONE CLAIMED!
              </span>
              <h4 className="text-sm font-bold text-white">
                {result.milestoneUnlocked.title}
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                {result.milestoneUnlocked.description}
              </p>
            </div>
          </div>
        )}

        {/* Global World Standing on this track */}
        <div
          onClick={() => {
            onMenu();
            setScreen('leaderboard');
          }}
          className="mb-4 p-3 bg-gradient-to-r from-amber-500/15 via-slate-800 to-slate-800 border border-amber-400/30 rounded-2xl flex items-center justify-between cursor-pointer hover:border-amber-400/60 transition-colors"
          title="Open Leaderboards"
        >
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">
                GLOBAL LEADERBOARDS
              </span>
              <span className="text-xs font-bold text-white">
                Compare your {result.time.toFixed(2)}s lap on Level #{level.id}
              </span>
            </div>
          </div>
          <span className="text-xs font-extrabold text-cyan-400 flex items-center gap-1">
            <span>Ranks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Daily Missions Progress Highlight */}
        {claimableMissions.length > 0 && (
          <div className="mb-4 p-3 bg-cyan-500/15 border border-cyan-400/30 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Gift className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300 block">
                  DAILY TASK COMPLETED!
                </span>
                <span className="text-xs font-bold text-white">
                  {claimableMissions.length} {claimableMissions.length === 1 ? 'Task' : 'Tasks'} ready to claim (+{claimableRewardSum} C)
                </span>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-400/20 px-2 py-1 rounded-lg border border-amber-400/30">
              Claim in Menu
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          {level.id < 100 ? (
            <button
              onClick={onNextLevel}
              className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-display font-black text-sm uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30 active:scale-98 transition-all"
            >
              <span>Next Level ({level.id + 1})</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={onMenu}
              className="w-full h-12 bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-black text-sm uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-400/30 active:scale-98 transition-all"
            >
              <span>CHAMPIONSHIP COMPLETED!</span>
            </button>
          )}

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={onRestart}
              className="h-11 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-white/10 flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry</span>
            </button>

            <button
              onClick={onGarage}
              className="h-11 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold rounded-xl border border-white/10 flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
            >
              <Trophy className="w-4 h-4" />
              <span>Garage</span>
            </button>

            <button
              onClick={onMenu}
              className="h-11 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-white/10 flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
            >
              <Home className="w-4 h-4" />
              <span>Menu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
