/**
 * Apex Nitro 3D - Settings & Mobile Options Screen
 */

import React, { useState } from 'react';
import { ArrowLeft, Volume2, VolumeX, Smartphone, Monitor, Video, RotateCcw, Check } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { soundManager } from '../../audio/soundManager';

export const SettingsScreen: React.FC = () => {
  const { settings, updateSettings, setScreen, resetProgress } = useGame();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  return (
    <div className="relative w-full h-full overflow-y-auto bg-slate-950 text-white select-none">
      <div className="relative z-10 max-w-lg mx-auto p-4 md:p-6 pb-20">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setScreen('menu')}
            className="h-10 px-3 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl border border-white/15 flex items-center gap-1.5 text-xs font-semibold backdrop-blur-md active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Menu</span>
          </button>

          <h2 className="font-display text-lg md:text-xl font-black uppercase tracking-wider text-white">
            GAME SETTINGS
          </h2>

          <div className="w-16" />
        </div>

        <div className="space-y-4">
          {/* Audio Settings Card */}
          <div className="bg-slate-900/90 border border-white/15 rounded-3xl p-5 backdrop-blur-md shadow-xl">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-cyan-400 mb-4 flex items-center gap-2">
              <Volume2 className="w-4 h-4" /> Audio & Soundtracks
            </h3>

            {/* Master Sound Toggle */}
            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <div>
                <span className="text-sm font-bold text-white block">Master Audio</span>
                <span className="text-xs text-slate-400">Enable synthesized engine and music</span>
              </div>
              <button
                onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                className={`w-12 h-7 rounded-full p-1 transition-colors ${
                  settings.soundEnabled ? 'bg-cyan-500' : 'bg-slate-800 border border-white/10'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* SFX Volume */}
            <div className="py-3 border-b border-white/10">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-semibold text-slate-300">Sound Effects (Engine & Screech)</span>
                <span className="font-mono-numbers text-xs text-cyan-400">{Math.round(settings.sfxVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.sfxVolume}
                disabled={!settings.soundEnabled}
                onChange={(e) => updateSettings({ sfxVolume: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Music Volume */}
            <div className="pt-3">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-semibold text-slate-300">Synthesizer Background Music</span>
                <span className="font-mono-numbers text-xs text-cyan-400">{Math.round(settings.musicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.musicVolume}
                disabled={!settings.soundEnabled}
                onChange={(e) => updateSettings({ musicVolume: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Graphics Quality */}
          <div className="bg-slate-900/90 border border-white/15 rounded-3xl p-5 backdrop-blur-md shadow-xl">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-cyan-400 mb-3 flex items-center gap-2">
              <Monitor className="w-4 h-4" /> Graphics Quality & Performance
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => updateSettings({ graphicsQuality: 'high' })}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  settings.graphicsQuality === 'high'
                    ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md shadow-cyan-500/20'
                    : 'bg-slate-950/60 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-xs">High Visuals</span>
                  {settings.graphicsQuality === 'high' && <Check className="w-4 h-4 text-cyan-400" />}
                </div>
                <p className="text-[11px] text-slate-400">Soft shadows & full antialiasing</p>
              </button>

              <button
                onClick={() => updateSettings({ graphicsQuality: 'low' })}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  settings.graphicsQuality === 'low'
                    ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md shadow-cyan-500/20'
                    : 'bg-slate-950/60 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-xs">Battery Saver</span>
                  {settings.graphicsQuality === 'low' && <Check className="w-4 h-4 text-cyan-400" />}
                </div>
                <p className="text-[11px] text-slate-400">Fast 60fps for older phones</p>
              </button>
            </div>
          </div>

          {/* Mobile & Camera Controls */}
          <div className="bg-slate-900/90 border border-white/15 rounded-3xl p-5 backdrop-blur-md shadow-xl">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-cyan-400 mb-3 flex items-center gap-2">
              <Video className="w-4 h-4" /> Camera Angle View
            </h3>

            <div className="grid grid-cols-3 gap-2">
              {(['chase', 'close', 'hood'] as const).map((view) => (
                <button
                  key={view}
                  onClick={() => updateSettings({ cameraView: view })}
                  className={`py-2.5 px-2 rounded-2xl border text-center transition-all ${
                    settings.cameraView === view
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                      : 'bg-slate-950/60 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-xs capitalize">{view} View</span>
                </button>
              ))}
            </div>

            {/* Mobile Haptic Vibration */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-xs font-bold text-white block">Mobile Haptic Feedback</span>
                  <span className="text-[11px] text-slate-400">Vibrate on nitro & drift</span>
                </div>
              </div>

              <button
                onClick={() => updateSettings({ vibration: !settings.vibration })}
                className={`w-12 h-7 rounded-full p-1 transition-colors ${
                  settings.vibration ? 'bg-cyan-500' : 'bg-slate-800 border border-white/10'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.vibration ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Reset Save Data */}
          <div className="pt-4 text-center">
            {showResetConfirm ? (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 space-y-3">
                <p className="text-xs text-red-300 font-semibold">
                  Reset all 100 level progress, coins, and car upgrades?
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-4 py-2 bg-slate-800 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      resetProgress();
                      setShowResetConfirm(false);
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-xs font-bold rounded-xl text-white shadow-md shadow-red-600/30"
                  >
                    Yes, Reset Everything
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1.5 mx-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Save Progress</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
