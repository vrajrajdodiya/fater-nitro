/**
 * Apex Nitro 3D - Daily Missions Modal & 24h Countdown
 */

import React, { useEffect, useState } from 'react';
import { X, Trophy, Coins, Clock, Flag, Flame, Check, Gift, Sparkles, AlertCircle } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { getSecondsUntilMidnight, formatCountdown } from '../../data/missionsData';
import { DailyMission } from '../../types/game';

interface DailyMissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DailyMissionsModal: React.FC<DailyMissionsModalProps> = ({ isOpen, onClose }) => {
  const { progress, claimMissionReward, claimDailyGrandBonus } = useGame();
  const [secondsLeft, setSecondsLeft] = useState(getSecondsUntilMidnight());

  // 1-second interval ticking countdown to midnight
  useEffect(() => {
    if (!isOpen) return;
    setSecondsLeft(getSecondsUntilMidnight());

    const timer = setInterval(() => {
      setSecondsLeft(getSecondsUntilMidnight());
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const missionsState = progress.dailyMissions;
  const missions = missionsState?.missions || [];
  const allCompleted = missions.length > 0 && missions.every(m => m.completed);
  const bonusClaimed = missionsState?.bonusClaimed || false;
  const completedCount = missions.filter(m => m.completed).length;

  const renderIcon = (type: DailyMission['icon']) => {
    switch (type) {
      case 'trophy':
        return <Trophy className="w-5 h-5 text-amber-400" />;
      case 'coins':
        return <Coins className="w-5 h-5 text-yellow-400" />;
      case 'clock':
        return <Clock className="w-5 h-5 text-cyan-400" />;
      case 'flag':
        return <Flag className="w-5 h-5 text-emerald-400" />;
      case 'flame':
      default:
        return <Flame className="w-5 h-5 text-orange-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-lg bg-slate-900 border border-white/20 rounded-3xl p-5 sm:p-6 shadow-2xl text-white overflow-hidden max-h-[90vh] flex flex-col">
        {/* Top Header */}
        <div className="flex items-start justify-between pb-3 border-b border-white/10 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
                24-Hour Tasks
              </span>
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-cyan-400" />
                Resets in: <span className="font-mono-numbers text-cyan-300 font-bold">{formatCountdown(secondsLeft)}</span>
              </span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-black uppercase tracking-wider text-white mt-0.5">
              DAILY MISSIONS
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center border border-white/10 active:scale-95 transition-transform"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Missions List */}
        <div className="overflow-y-auto py-4 space-y-3 flex-1 scrollbar-none">
          {missions.map(mission => {
            const isFinished = mission.completed;
            const isClaimed = mission.claimed;
            const progressRatio = Math.min(1, mission.currentProgress / mission.targetCount);

            return (
              <div
                key={mission.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isClaimed
                    ? 'bg-slate-950/40 border-white/5 opacity-70'
                    : isFinished
                    ? 'bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border-amber-400/40 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-950/60 border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-800/80 border border-white/10 shrink-0 mt-0.5">
                      {renderIcon(mission.icon)}
                    </div>
                    <div>
                      <h4 className="font-display text-sm font-bold text-white">
                        {mission.title}
                      </h4>
                      <p className="text-xs text-slate-300 mt-0.5">
                        {mission.description}
                      </p>
                    </div>
                  </div>

                  {/* Reward / Action Button */}
                  <div className="shrink-0 text-right">
                    {isClaimed ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-xl">
                        <Check className="w-3 h-3" /> Claimed
                      </span>
                    ) : isFinished ? (
                      <button
                        onClick={() => claimMissionReward(mission.id)}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-display font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-400/30 active:scale-95 transition-all animate-pulse"
                      >
                        CLAIM +{mission.rewardCoins}{mission.rewardNitroRefills ? ` +${mission.rewardNitroRefills}⚡` : ''}
                      </button>
                    ) : (
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-mono-numbers text-xs font-bold text-amber-300 bg-slate-800/80 border border-white/10 px-2.5 py-1 rounded-xl block">
                          +{mission.rewardCoins} C
                        </span>
                        {!!mission.rewardNitroRefills && (
                          <span className="font-mono-numbers text-[10px] font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-400/30 px-2 py-0.5 rounded-lg flex items-center gap-1">
                            <Flame className="w-2.5 h-2.5 text-cyan-400" />
                            +{mission.rewardNitroRefills} Nitro Refill
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Bar & Numerical Counter */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                    <span>Task Progress</span>
                    <span className="font-mono-numbers text-white font-bold">
                      {mission.currentProgress} / {mission.targetCount}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isFinished ? 'bg-gradient-to-r from-amber-400 to-emerald-400' : 'bg-cyan-400'
                      }`}
                      style={{ width: `${progressRatio * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Grand Daily Completion Crate */}
          <div className="p-4 rounded-2xl border border-amber-400/30 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-slate-900 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-400/20 text-amber-300 rounded-2xl border border-amber-400/30 shrink-0">
                <Gift className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Grand Daily Crate
                </span>
                <h4 className="font-display text-sm font-bold text-white mt-0.5">
                  Complete All 3 Tasks ({completedCount}/3)
                </h4>
                <p className="text-[11px] text-slate-400">
                  Earn a massive +{missionsState?.grandBonusCoins || 1200} Coins jackpot!
                </p>
              </div>
            </div>

            <div className="shrink-0">
              {bonusClaimed ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                  <Check className="w-3.5 h-3.5" /> Claimed
                </span>
              ) : allCompleted ? (
                <button
                  onClick={claimDailyGrandBonus}
                  className="px-4 py-2 bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 text-slate-950 font-display font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-400/40 active:scale-95 transition-all animate-bounce"
                >
                  CLAIM BONUS
                </button>
              ) : (
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-white/5 block text-center">
                  Locked
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 shrink-0 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-cyan-400" />
            Missions refresh automatically every 24 hours.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs active:scale-95 transition-transform"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
