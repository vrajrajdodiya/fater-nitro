/**
 * Apex Nitro 3D - Race Screen Viewport
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { RacingEngine, CarInputs } from '../../game3d/racingEngine';
import { RaceHUD } from '../ui/RaceHUD';
import { TouchControls } from '../ui/TouchControls';
import { RaceResultModal } from './RaceResultModal';
import { getLevelConfig } from '../../data/levelsData';
import { RaceResult } from '../../types/game';
import { soundManager } from '../../audio/soundManager';
import { Play, RotateCcw, Home, Volume2, VolumeX, Wrench } from 'lucide-react';

export const RaceScreen: React.FC = () => {
  const {
    activeRaceLevel,
    progress,
    settings,
    getCarEffectiveStats,
    setScreen,
    startRace,
    recordRaceResult,
    updateSettings
  } = useGame();

  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<RacingEngine | null>(null);

  const level = useMemo(() => getLevelConfig(activeRaceLevel), [activeRaceLevel]);
  const currentCarId = progress.currentCarId;
  const currentCarColor = progress.carColors[currentCarId] || '#e11d48';
  const effectiveStats = useMemo(() => getCarEffectiveStats(currentCarId), [
    currentCarId,
    progress.carUpgrades,
    getCarEffectiveStats
  ]);

  const [raceResult, setRaceResult] = useState<RaceResult | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [countdownText, setCountdownText] = useState<string | null>('3');
  const [headlightsOn, setHeadlightsOn] = useState(true);

  // Live HUD telemetry state
  const [hudData, setHudData] = useState({
    speedKmh: 0,
    rpm: 1000,
    nitroPercent: 100,
    elapsedTime: 0,
    position: 1,
    totalRacers: level.opponentCount + 1,
    progressPercent: 0,
    coinsCollected: 0,
    totalCoins: 10,
    checkpointsPassed: 0,
    totalCheckpoints: 3,
    nearMissCount: 0,
    nearMissCombo: 1,
    driftMeters: 0,
    isBossRace: level.id === 5,
    activeNotification: null as { text: string; subtext?: string; type: string } | null
  });

  // Handle countdown text overlay
  useEffect(() => {
    setCountdownText('3');
    const t1 = setTimeout(() => setCountdownText('2'), 1000);
    const t2 = setTimeout(() => setCountdownText('1'), 2000);
    const t3 = setTimeout(() => setCountdownText('GO!'), 3000);
    const t4 = setTimeout(() => setCountdownText(null), 3800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [activeRaceLevel]);

  // Handle Race Finish
  const handleFinish = useCallback((result: RaceResult) => {
    setRaceResult(result);
    recordRaceResult(result, activeRaceLevel);
  }, [activeRaceLevel, recordRaceResult]);

  const handleFinishRef = useRef(handleFinish);
  handleFinishRef.current = handleFinish;

  const onUpdateHudRef = useRef(setHudData);
  onUpdateHudRef.current = setHudData;

  // Mount 3D Racing Engine
  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new RacingEngine(
      containerRef.current,
      level,
      currentCarId,
      currentCarColor,
      effectiveStats,
      settings,
      (result) => handleFinishRef.current(result),
      (data) => onUpdateHudRef.current(data)
    );

    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [activeRaceLevel, currentCarId]);

  // Inputs relay
  const handleInputsChange = useCallback((inputs: Partial<CarInputs>) => {
    if (engineRef.current && !isPaused && !raceResult) {
      engineRef.current.setInputs(inputs);
    }
  }, [isPaused, raceResult]);

  // Camera cycle
  const handleCycleCamera = useCallback(() => {
    soundManager.playClick();
    const modes: Array<'chase' | 'close' | 'hood'> = ['chase', 'close', 'hood'];
    const currentIndex = modes.indexOf(settings.cameraView);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    updateSettings({ cameraView: nextMode });
    if (engineRef.current) {
      engineRef.current.setCameraView(nextMode);
    }
  }, [settings.cameraView, updateSettings]);

  // Headlights & Horn Handlers
  const handleToggleHeadlights = useCallback(() => {
    if (engineRef.current) {
      const newState = engineRef.current.toggleHeadlights();
      setHeadlightsOn(newState);
    }
  }, []);

  const handleHornStart = useCallback(() => {
    if (engineRef.current && !isPaused && !raceResult) {
      engineRef.current.startHorn();
    }
  }, [isPaused, raceResult]);

  const handleHornEnd = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.stopHorn();
    }
  }, []);

  // Keyboard shortcut listener for Lights (L) and Horn (H)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused || raceResult) return;
      if (e.code === 'KeyL') {
        handleToggleHeadlights();
      } else if (e.code === 'KeyH') {
        handleHornStart();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyH') {
        handleHornEnd();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleToggleHeadlights, handleHornStart, handleHornEnd, isPaused, raceResult]);

  // Pause Controls
  const handlePause = () => {
    soundManager.playClick();
    setIsPaused(true);
    if (engineRef.current) {
      engineRef.current.raceState = 'paused';
    }
    soundManager.stopEngine();
    soundManager.stopMusic();
  };

  const handleResume = () => {
    soundManager.playClick();
    setIsPaused(false);
    if (engineRef.current) {
      engineRef.current.raceState = 'racing';
      soundManager.startEngine();
      soundManager.startMusic();
    }
  };

  const handleRestart = () => {
    soundManager.playClick();
    setIsPaused(false);
    setRaceResult(null);
    startRace(activeRaceLevel);
  };

  const handleNextLevel = () => {
    soundManager.playClick();
    setRaceResult(null);
    if (activeRaceLevel < 100) {
      startRace(activeRaceLevel + 1);
    } else {
      setScreen('menu');
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* In-Game HUD Overlay */}
      {!raceResult && (
        <RaceHUD
          level={level}
          speedKmh={hudData.speedKmh}
          rpm={hudData.rpm}
          nitroPercent={hudData.nitroPercent}
          elapsedTime={hudData.elapsedTime}
          position={hudData.position}
          totalRacers={hudData.totalRacers}
          progressPercent={hudData.progressPercent}
          coinsCollected={hudData.coinsCollected}
          totalCoins={hudData.totalCoins}
          checkpointsPassed={hudData.checkpointsPassed}
          totalCheckpoints={hudData.totalCheckpoints}
          headlightsOn={headlightsOn}
          nearMissCount={hudData.nearMissCount}
          nearMissCombo={hudData.nearMissCombo}
          driftMeters={hudData.driftMeters}
          isBossRace={hudData.isBossRace}
          activeNotification={hudData.activeNotification}
          onToggleHeadlights={handleToggleHeadlights}
          onHornStart={handleHornStart}
          onHornEnd={handleHornEnd}
          onPause={handlePause}
        />
      )}

      {/* Touch & Keyboard Controls */}
      {!raceResult && !isPaused && (
        <TouchControls
          onInputsChange={handleInputsChange}
          onCycleCamera={handleCycleCamera}
        />
      )}

      {/* Starting 3, 2, 1, GO! Countdown Banner */}
      {countdownText && !isPaused && !raceResult && (
        <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
          <div className="text-center animate-bounce">
            <span className={`font-display text-8xl md:text-9xl font-black drop-shadow-2xl tracking-widest ${
              countdownText === 'GO!' ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {countdownText}
            </span>
          </div>
        </div>
      )}

      {/* Pause Menu Modal */}
      {isPaused && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-slate-900 border border-white/20 rounded-3xl p-6 text-white text-center shadow-2xl space-y-4">
            <h3 className="font-display text-2xl font-black tracking-wider uppercase text-cyan-400">
              RACE PAUSED
            </h3>
            <p className="text-xs text-slate-400">
              {level.name}
            </p>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                onClick={handleResume}
                className="w-full h-12 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display font-black text-sm uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 active:scale-98 transition-all"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Resume Race</span>
              </button>

              <button
                onClick={handleRestart}
                className="w-full h-11 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl border border-white/10 flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restart Level</span>
              </button>

              <button
                onClick={() => {
                  soundManager.playClick();
                  setScreen('garage');
                }}
                className="w-full h-11 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold text-xs rounded-xl border border-white/10 flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <Wrench className="w-4 h-4" />
                <span>Go To Garage</span>
              </button>

              {/* Sound Toggle Shortcut */}
              <button
                onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                className="w-full h-11 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-white/10 flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-red-400" />}
                <span>Sound: {settings.soundEnabled ? 'ON' : 'OFF'}</span>
              </button>

              <button
                onClick={() => {
                  soundManager.playClick();
                  setScreen('menu');
                }}
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-slate-400 font-semibold text-xs rounded-xl border border-white/10 flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <Home className="w-4 h-4" />
                <span>Exit to Main Menu</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Win/Lose Result Modal */}
      {raceResult && (
        <RaceResultModal
          result={raceResult}
          level={level}
          onNextLevel={handleNextLevel}
          onRestart={handleRestart}
          onGarage={() => {
            soundManager.playClick();
            setScreen('garage');
          }}
          onMenu={() => {
            soundManager.playClick();
            setScreen('menu');
          }}
        />
      )}
    </div>
  );
};
