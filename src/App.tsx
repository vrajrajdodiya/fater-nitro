/**
 * Apex Nitro 3D - Mobile Car Racing Root App
 */

import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { MainMenu } from './components/screens/MainMenu';
import { GarageScreen } from './components/screens/GarageScreen';
import { UpgradesScreen } from './components/screens/UpgradesScreen';
import { LevelSelectScreen } from './components/screens/LevelSelectScreen';
import { LeaderboardScreen } from './components/screens/LeaderboardScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { RaceScreen } from './components/screens/RaceScreen';

const ScreenRouter: React.FC = () => {
  const { currentScreen } = useGame();

  switch (currentScreen) {
    case 'garage':
      return <GarageScreen />;
    case 'upgrades':
      return <UpgradesScreen />;
    case 'levels':
      return <LevelSelectScreen />;
    case 'leaderboard':
      return <LeaderboardScreen />;
    case 'settings':
      return <SettingsScreen />;
    case 'race':
      return <RaceScreen />;
    case 'menu':
    default:
      return <MainMenu />;
  }
};

export default function App() {
  return (
    <GameProvider>
      <main className="w-screen h-screen overflow-hidden select-none bg-slate-950 font-sans">
        <ScreenRouter />
      </main>
    </GameProvider>
  );
}
