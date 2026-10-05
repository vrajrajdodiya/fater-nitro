/**
 * Apex Nitro 3D - Mobile Touch & Keyboard Controls Component
 * Ergonomic thumb zones, multi-touch support, and visual tactile feedback.
 */

import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Zap, ShieldAlert, Video } from 'lucide-react';
import { CarInputs } from '../../game3d/racingEngine';

interface TouchControlsProps {
  onInputsChange: (inputs: Partial<CarInputs>) => void;
  onCycleCamera: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ onInputsChange, onCycleCamera }) => {
  const [activeKeys, setActiveKeys] = useState<{
    left: boolean;
    right: boolean;
    accel: boolean;
    brake: boolean;
    nitro: boolean;
  }>({
    left: false,
    right: false,
    accel: false,
    brake: false,
    nitro: false
  });

  // Keyboard controls for PC testing & dual input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const key = e.key.toLowerCase();

      if (key === 'arrowleft' || key === 'a') {
        setActiveKeys(prev => ({ ...prev, left: true }));
        onInputsChange({ steerLeft: true });
      } else if (key === 'arrowright' || key === 'd') {
        setActiveKeys(prev => ({ ...prev, right: true }));
        onInputsChange({ steerRight: true });
      } else if (key === 'arrowup' || key === 'w') {
        setActiveKeys(prev => ({ ...prev, accel: true }));
        onInputsChange({ accelerate: true });
      } else if (key === 'arrowdown' || key === 's' || key === ' ') {
        setActiveKeys(prev => ({ ...prev, brake: true }));
        onInputsChange({ brakeReverse: true });
      } else if (key === 'shift') {
        setActiveKeys(prev => ({ ...prev, nitro: true }));
        onInputsChange({ nitro: true });
      } else if (key === 'c') {
        onCycleCamera();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (key === 'arrowleft' || key === 'a') {
        setActiveKeys(prev => ({ ...prev, left: false }));
        onInputsChange({ steerLeft: false });
      } else if (key === 'arrowright' || key === 'd') {
        setActiveKeys(prev => ({ ...prev, right: false }));
        onInputsChange({ steerRight: false });
      } else if (key === 'arrowup' || key === 'w') {
        setActiveKeys(prev => ({ ...prev, accel: false }));
        onInputsChange({ accelerate: false });
      } else if (key === 'arrowdown' || key === 's' || key === ' ') {
        setActiveKeys(prev => ({ ...prev, brake: false }));
        onInputsChange({ brakeReverse: false });
      } else if (key === 'shift') {
        setActiveKeys(prev => ({ ...prev, nitro: false }));
        onInputsChange({ nitro: false });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onInputsChange, onCycleCamera]);

  // Pointer Handlers for buttons
  const bindTouch = (action: keyof CarInputs, keyName: keyof typeof activeKeys) => {
    return {
      onPointerDown: (e: React.PointerEvent) => {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        setActiveKeys(prev => ({ ...prev, [keyName]: true }));
        onInputsChange({ [action]: true });
      },
      onPointerUp: (e: React.PointerEvent) => {
        try {
          (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
        setActiveKeys(prev => ({ ...prev, [keyName]: false }));
        onInputsChange({ [action]: false });
      },
      onPointerCancel: () => {
        setActiveKeys(prev => ({ ...prev, [keyName]: false }));
        onInputsChange({ [action]: false });
      }
    };
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 flex flex-col justify-between p-4 md:p-6 pb-6">
      {/* Top right camera angle button */}
      <div className="flex justify-end pt-12 md:pt-4">
        <button
          onClick={onCycleCamera}
          className="pointer-events-auto p-3 bg-slate-900/75 hover:bg-slate-800 text-white rounded-2xl border border-white/15 backdrop-blur-md active:scale-95 transition-transform flex items-center gap-2 text-xs font-semibold shadow-lg shadow-black/40"
          title="Switch Camera View (C)"
        >
          <Video className="w-5 h-5 text-cyan-400" />
          <span className="hidden sm:inline">Cam</span>
        </button>
      </div>

      {/* Bottom Thumb Zones: Left (Steering) & Right (Pedals & Nitro) */}
      <div className="flex items-end justify-between w-full">
        {/* Left Side: Steering Arrows */}
        <div className="flex items-center gap-3 pointer-events-auto">
          {/* Left Turn */}
          <button
            {...bindTouch('steerLeft', 'left')}
            className={`w-20 h-20 sm:w-22 sm:h-22 rounded-3xl flex flex-col items-center justify-center border transition-all duration-100 touch-none shadow-xl ${
              activeKeys.left
                ? 'bg-cyan-500/40 border-cyan-400 text-cyan-300 scale-95 shadow-cyan-500/30'
                : 'bg-slate-900/80 border-white/20 text-slate-200 hover:border-cyan-400/50'
            } backdrop-blur-md`}
          >
            <ArrowLeft className="w-9 h-9 stroke-[2.5]" />
            <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5 opacity-70">Left</span>
          </button>

          {/* Right Turn */}
          <button
            {...bindTouch('steerRight', 'right')}
            className={`w-20 h-20 sm:w-22 sm:h-22 rounded-3xl flex flex-col items-center justify-center border transition-all duration-100 touch-none shadow-xl ${
              activeKeys.right
                ? 'bg-cyan-500/40 border-cyan-400 text-cyan-300 scale-95 shadow-cyan-500/30'
                : 'bg-slate-900/80 border-white/20 text-slate-200 hover:border-cyan-400/50'
            } backdrop-blur-md`}
          >
            <ArrowRight className="w-9 h-9 stroke-[2.5]" />
            <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5 opacity-70">Right</span>
          </button>
        </div>

        {/* Right Side: Nitro, Brake, Accelerate */}
        <div className="flex items-end gap-3 pointer-events-auto">
          {/* Nitro Rocket Button */}
          <button
            {...bindTouch('nitro', 'nitro')}
            className={`w-16 h-16 sm:w-18 sm:h-18 rounded-3xl flex flex-col items-center justify-center border transition-all duration-100 touch-none shadow-xl ${
              activeKeys.nitro
                ? 'bg-cyan-400 border-cyan-300 text-slate-950 scale-95 shadow-cyan-400/50'
                : 'bg-cyan-950/80 border-cyan-500/40 text-cyan-400 hover:border-cyan-400'
            } backdrop-blur-md mb-2`}
          >
            <Zap className="w-7 h-7 stroke-[2.5]" />
            <span className="text-[9px] font-extrabold tracking-wider">NITRO</span>
          </button>

          {/* Brake / Reverse */}
          <button
            {...bindTouch('brakeReverse', 'brake')}
            className={`w-18 h-20 sm:w-20 sm:h-22 rounded-3xl flex flex-col items-center justify-center border transition-all duration-100 touch-none shadow-xl ${
              activeKeys.brake
                ? 'bg-red-500/40 border-red-400 text-red-300 scale-95 shadow-red-500/30'
                : 'bg-slate-900/80 border-white/20 text-slate-200 hover:border-red-400/50'
            } backdrop-blur-md`}
          >
            <ShieldAlert className="w-8 h-8 stroke-[2.2]" />
            <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5 opacity-70">Brake</span>
          </button>

          {/* Accelerate / Gas */}
          <button
            {...bindTouch('accelerate', 'accel')}
            className={`w-20 h-24 sm:w-22 sm:h-26 rounded-3xl flex flex-col items-center justify-center border transition-all duration-100 touch-none shadow-xl ${
              activeKeys.accel
                ? 'bg-emerald-500/50 border-emerald-400 text-white scale-95 shadow-emerald-500/40'
                : 'bg-slate-900/85 border-emerald-500/40 text-emerald-400 hover:border-emerald-400'
            } backdrop-blur-md`}
          >
            <div className="w-1.5 h-6 bg-emerald-400 rounded-full mb-1" />
            <span className="text-xs font-black uppercase tracking-wider">GAS</span>
            <span className="text-[9px] font-bold opacity-60">Drive</span>
          </button>
        </div>
      </div>
    </div>
  );
};
