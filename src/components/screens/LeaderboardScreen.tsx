/**
 * Faster Nitro 3D - Global & Local Leaderboard Screen
 * Tracks and displays fastest lap times across all 100 levels with interactive
 * level selector, personal best records, and global world ranking comparisons.
 */

import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Trophy,
  Globe,
  User,
  Medal,
  Clock,
  Play,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Flame,
  Check,
  Search,
  Flag,
  Share2
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { ALL_LEVELS, BIOME_CONFIGS, getLevelConfig } from '../../data/levelsData';
import { getGlobalLeaderboard, formatLapTime, COUNTRY_OPTIONS } from '../../data/leaderboardData';
import { CAR_CATALOG } from '../../data/carModels';
import { soundManager } from '../../audio/soundManager';

export const LeaderboardScreen: React.FC = () => {
  const { progress, setScreen, startRace, updatePlayerProfile } = useGame();

  const [activeTab, setActiveTab] = useState<'global' | 'local' | 'profile'>('global');
  const [selectedLevelId, setSelectedLevelId] = useState<number>(() => {
    // Default to highest unlocked level or level 1
    return Math.min(progress.highestUnlockedLevel || 1, 100);
  });

  // Profile editing state
  const [editingName, setEditingName] = useState(progress.playerName || 'ApexPilot');
  const [editingCountry, setEditingCountry] = useState(progress.playerCountry || '🇺🇸');
  const [profileSaved, setProfileSaved] = useState(false);

  // Search filter for local records
  const [searchQuery, setSearchQuery] = useState('');

  const currentLevel = useMemo(() => getLevelConfig(selectedLevelId), [selectedLevelId]);
  const currentBiome = BIOME_CONFIGS[currentLevel.biome];

  const playerLocalRecord = progress.localLapRecords?.[selectedLevelId];

  // Fetch global leaderboard for selected level
  const globalEntries = useMemo(() => {
    return getGlobalLeaderboard(
      selectedLevelId,
      playerLocalRecord,
      progress.playerName || 'ApexPilot',
      progress.playerCountry || '🇺🇸'
    );
  }, [selectedLevelId, playerLocalRecord, progress.playerName, progress.playerCountry]);

  // World Record holder (Rank 1)
  const worldRecordEntry = globalEntries[0];

  // Player's entry in this level's global rankings
  const playerGlobalEntry = globalEntries.find(e => e.isPlayer);

  // All local personal records across all levels
  const localRecordsList = useMemo(() => {
    const records = Object.values(progress.localLapRecords || {});
    records.sort((a, b) => a.levelId - b.levelId);
    if (!searchQuery) return records;
    return records.filter(r => {
      const lvl = getLevelConfig(r.levelId);
      return lvl.name.toLowerCase().includes(searchQuery.toLowerCase()) || String(r.levelId).includes(searchQuery);
    });
  }, [progress.localLapRecords, searchQuery]);

  // Career Statistics
  const careerStats = useMemo(() => {
    const records = Object.values(progress.localLapRecords || {});
    const totalRecorded = records.length;
    let worldRecords = 0;
    let podiums = 0;

    records.forEach(rec => {
      const gBoard = getGlobalLeaderboard(rec.levelId, rec);
      const playerPos = gBoard.findIndex(e => e.isPlayer) + 1;
      if (playerPos === 1) worldRecords++;
      if (playerPos <= 3) podiums++;
    });

    return { totalRecorded, worldRecords, podiums };
  }, [progress.localLapRecords]);

  const handlePrevLevel = () => {
    soundManager.playClick();
    setSelectedLevelId(prev => (prev > 1 ? prev - 1 : 100));
  };

  const handleNextLevel = () => {
    soundManager.playClick();
    setSelectedLevelId(prev => (prev < 100 ? prev + 1 : 1));
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playClick();
    updatePlayerProfile(editingName, editingCountry);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  return (
    <div className="relative w-full h-full overflow-y-auto bg-slate-950 text-white select-none">
      <div className="relative z-10 max-w-3xl mx-auto p-4 md:p-6 pb-24">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <button
            onClick={() => {
              soundManager.playClick();
              setScreen('menu');
            }}
            className="h-10 px-3 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl border border-white/15 flex items-center gap-1.5 text-xs font-semibold backdrop-blur-md active:scale-95 transition-transform cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Menu</span>
          </button>

          <div className="text-center">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400 block">
              100 Championship Tracks
            </span>
            <h2 className="font-display text-xl sm:text-2xl font-black uppercase tracking-wider text-white flex items-center justify-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              LEADERBOARDS
            </h2>
          </div>

          {/* Quick Profile Pill */}
          <button
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-1.5 bg-slate-900/80 hover:bg-slate-800 border border-white/15 rounded-xl px-2.5 py-1.5 backdrop-blur-md text-xs font-bold active:scale-95 transition-all cursor-pointer"
            title="Edit Racer Profile"
          >
            <span className="text-base">{progress.playerCountry || '🇺🇸'}</span>
            <span className="max-w-[70px] sm:max-w-[100px] truncate text-slate-200">
              {progress.playerName || 'ApexPilot'}
            </span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-900/90 border border-white/10 rounded-2xl p-1 mb-5 backdrop-blur-md">
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('global');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'global'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Global World Ranks</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('local');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'local'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Medal className="w-4 h-4" />
            <span>Personal Lap Bests ({careerStats.totalRecorded}/100)</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('profile');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Racer Tag</span>
          </button>
        </div>

        {/* TAB 1: GLOBAL LEADERBOARD */}
        {activeTab === 'global' && (
          <div className="space-y-4">
            {/* Level Selector Bar */}
            <div className="bg-slate-900/90 border border-white/15 rounded-3xl p-4 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between">
                <button
                  onClick={handlePrevLevel}
                  className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center border border-white/10 active:scale-95 transition-transform cursor-pointer"
                  title="Previous Level"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-300" />
                </button>

                {/* Level selector dropdown */}
                <select
                  value={selectedLevelId}
                  onChange={(e) => {
                    soundManager.playClick();
                    setSelectedLevelId(Number(e.target.value));
                  }}
                  className="bg-slate-950 border border-white/20 rounded-xl px-3 py-1.5 text-xs font-extrabold text-cyan-400 focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  {ALL_LEVELS.map(lvl => (
                    <option key={lvl.id} value={lvl.id}>
                      Level {lvl.id}: {lvl.name.split(':')[1] || lvl.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleNextLevel}
                  className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center border border-white/10 active:scale-95 transition-transform cursor-pointer"
                  title="Next Level"
                >
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </button>
              </div>

              {/* Level track info */}
              <div className="flex items-center gap-2.5 text-xs">
                <span
                  className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border"
                  style={{
                    backgroundColor: `${currentBiome.accentColor}20`,
                    borderColor: currentBiome.accentColor,
                    color: currentBiome.accentColor
                  }}
                >
                  {currentBiome.name}
                </span>

                <span className="text-slate-400 text-[11px] font-semibold">
                  Length: <strong className="text-white font-mono-numbers">{currentLevel.trackLength}m</strong>
                </span>

                <span className="text-slate-400 text-[11px] font-semibold">
                  Gold Target: <strong className="text-amber-400 font-mono-numbers">{formatLapTime(currentLevel.targetTime)}</strong>
                </span>
              </div>

              {/* Play / Race Level Button */}
              <button
                onClick={() => {
                  soundManager.playClick();
                  startRace(selectedLevelId);
                }}
                className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Race Track</span>
              </button>
            </div>

            {/* Hero World Record & Player Placement Banner */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* World Record Card */}
              <div className="bg-gradient-to-br from-amber-500/20 via-slate-900/90 to-slate-900 border border-amber-400/40 rounded-3xl p-4 backdrop-blur-md shadow-xl flex items-center justify-between">
                <div>
                  <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-300">
                    <Trophy className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    WORLD RECORD (RANK #1)
                  </span>
                  <h4 className="font-display text-lg font-black text-white mt-1 flex items-center gap-1.5">
                    <span>{worldRecordEntry?.country}</span>
                    <span>{worldRecordEntry?.racerName}</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Vehicle: <span className="text-slate-200 font-semibold">{worldRecordEntry?.carName}</span>
                  </p>
                </div>

                <div className="text-right">
                  <span className="font-mono-numbers text-2xl font-black text-amber-300 block drop-shadow-md">
                    {worldRecordEntry?.formattedTime}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {worldRecordEntry?.date}
                  </span>
                </div>
              </div>

              {/* Player Standing Card */}
              <div className={`border rounded-3xl p-4 backdrop-blur-md shadow-xl flex items-center justify-between ${
                playerGlobalEntry
                  ? 'bg-gradient-to-br from-cyan-500/20 via-slate-900/90 to-slate-900 border-cyan-400/50'
                  : 'bg-slate-900/80 border-white/10'
              }`}>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 block">
                    YOUR PERFORMANCE
                  </span>
                  {playerGlobalEntry ? (
                    <>
                      <h4 className="font-display text-lg font-black text-white mt-1 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-lg bg-cyan-400/20 border border-cyan-400/40 text-cyan-300 text-xs font-black">
                          RANK #{playerGlobalEntry.rank}
                        </span>
                        <span>{playerGlobalEntry.racerName}</span>
                      </h4>
                      <p className="text-xs text-slate-400">
                        Gap to #1: <strong className={playerGlobalEntry.deltaSeconds === 0 ? 'text-amber-400' : 'text-cyan-400'}>
                          {playerGlobalEntry.deltaSeconds === 0 ? 'WORLD RECORD HOLDER!' : `+${playerGlobalEntry.deltaSeconds}s`}
                        </strong>
                      </p>
                    </>
                  ) : (
                    <div className="mt-1">
                      <p className="text-xs font-bold text-slate-300">No Lap Recorded Yet</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Beat this track to place on global boards!</p>
                    </div>
                  )}
                </div>

                <div className="text-right">
                  {playerGlobalEntry ? (
                    <>
                      <span className="font-mono-numbers text-2xl font-black text-cyan-300 block drop-shadow-md">
                        {playerGlobalEntry.formattedTime}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {playerGlobalEntry.date}
                      </span>
                    </>
                  ) : (
                    <button
                      onClick={() => startRace(selectedLevelId)}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 text-xs font-bold active:scale-95 transition-all"
                    >
                      Race Now
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Global Leaderboard Table */}
            <div className="bg-slate-900/90 border border-white/15 rounded-3xl backdrop-blur-xl shadow-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                  Global World Top 18 Competitors
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  Sorted by Fastest Lap Time
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 text-[10px] uppercase font-bold text-slate-400 border-b border-white/5">
                    <tr>
                      <th className="py-2.5 px-4 w-14">Rank</th>
                      <th className="py-2.5 px-4">Racer</th>
                      <th className="py-2.5 px-4 hidden sm:table-cell">Vehicle</th>
                      <th className="py-2.5 px-4 text-right">Lap Time</th>
                      <th className="py-2.5 px-4 text-right">Gap to #1</th>
                      <th className="py-2.5 px-4 text-right hidden sm:table-cell">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {globalEntries.map((entry) => {
                      const isTop3 = entry.rank <= 3;
                      const rankColors = [
                        'bg-amber-400 text-slate-950 font-black', // 1st Gold
                        'bg-slate-300 text-slate-950 font-black',  // 2nd Silver
                        'bg-amber-700 text-amber-100 font-black'   // 3rd Bronze
                      ];

                      return (
                        <tr
                          key={`${entry.rank}-${entry.racerName}`}
                          className={`transition-colors ${
                            entry.isPlayer
                              ? 'bg-cyan-500/15 border-l-4 border-l-cyan-400 font-bold'
                              : 'hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="py-3 px-4 font-mono-numbers">
                            {isTop3 ? (
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs ${rankColors[entry.rank - 1]}`}>
                                {entry.rank}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-semibold pl-2">#{entry.rank}</span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{entry.country}</span>
                              <span className={`font-semibold ${entry.isPlayer ? 'text-cyan-300' : 'text-white'}`}>
                                {entry.racerName}
                              </span>
                              {entry.isPlayer && (
                                <span className="text-[9px] font-black uppercase tracking-wider bg-cyan-400 text-slate-950 px-1.5 py-0.2 rounded font-mono">
                                  YOU
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4 text-slate-300 hidden sm:table-cell">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0"
                                style={{ backgroundColor: entry.carColor }}
                              />
                              <span className="truncate max-w-[140px]">{entry.carName}</span>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-right font-mono-numbers text-sm font-black text-white">
                            {entry.formattedTime}
                          </td>

                          <td className="py-3 px-4 text-right font-mono-numbers text-xs">
                            {entry.deltaSeconds === 0 ? (
                              <span className="text-amber-400 font-black">FASTEST</span>
                            ) : (
                              <span className="text-slate-400">+{entry.deltaSeconds.toFixed(2)}s</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right text-slate-400 text-[11px] hidden sm:table-cell">
                            {entry.date}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LOCAL PERSONAL RECORDS */}
        {activeTab === 'local' && (
          <div className="space-y-4">
            {/* Overview Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-3 text-center backdrop-blur-md shadow-lg">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Tracks Recorded
                </span>
                <span className="font-display text-xl sm:text-2xl font-black text-cyan-400">
                  {careerStats.totalRecorded} <span className="text-xs text-slate-400 font-normal">/100</span>
                </span>
              </div>

              <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-3 text-center backdrop-blur-md shadow-lg">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  World Records
                </span>
                <span className="font-display text-xl sm:text-2xl font-black text-amber-400">
                  {careerStats.worldRecords} 👑
                </span>
              </div>

              <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-3 text-center backdrop-blur-md shadow-lg">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Global Podiums
                </span>
                <span className="font-display text-xl sm:text-2xl font-black text-emerald-400">
                  {careerStats.podiums} 🏆
                </span>
              </div>
            </div>

            {/* Filter Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search level number or track name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/90 border border-white/15 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Personal Lap Records Table */}
            {localRecordsList.length > 0 ? (
              <div className="bg-slate-900/90 border border-white/15 rounded-3xl backdrop-blur-xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/60 text-[10px] uppercase font-bold text-slate-400 border-b border-white/5">
                      <tr>
                        <th className="py-2.5 px-4">Level</th>
                        <th className="py-2.5 px-4">Track Name</th>
                        <th className="py-2.5 px-4 hidden sm:table-cell">Car Used</th>
                        <th className="py-2.5 px-4 text-center">Stars</th>
                        <th className="py-2.5 px-4 text-right">Personal Best</th>
                        <th className="py-2.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {localRecordsList.map((rec) => {
                        const lvl = getLevelConfig(rec.levelId);
                        const car = CAR_CATALOG.find(c => c.id === rec.carId);
                        return (
                          <tr key={rec.levelId} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-4 font-mono-numbers font-black text-cyan-400">
                              Lvl {rec.levelId}
                            </td>

                            <td className="py-3 px-4 font-semibold text-white">
                              {lvl.name.split(':')[1] || lvl.name}
                            </td>

                            <td className="py-3 px-4 text-slate-300 hidden sm:table-cell">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0"
                                  style={{ backgroundColor: rec.carColor }}
                                />
                                <span className="truncate max-w-[120px]">{car?.name || rec.carId}</span>
                              </div>
                            </td>

                            <td className="py-3 px-4 text-center text-amber-400">
                              {'★'.repeat(rec.stars)}{'☆'.repeat(3 - rec.stars)}
                            </td>

                            <td className="py-3 px-4 text-right font-mono-numbers text-sm font-black text-white">
                              {rec.formattedTime}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => {
                                  soundManager.playClick();
                                  startRace(rec.levelId);
                                }}
                                className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 rounded-lg text-[11px] font-bold active:scale-95 transition-all cursor-pointer"
                              >
                                Race
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-8 text-center backdrop-blur-md">
                <Clock className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <h4 className="font-display text-base font-bold text-slate-300">No Lap Records Yet</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                  Complete races to log your fastest lap times, stars, and vehicle setups.
                </p>
                <button
                  onClick={() => {
                    soundManager.playClick();
                    startRace(progress.highestUnlockedLevel);
                  }}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/25 active:scale-95 transition-all cursor-pointer"
                >
                  Race Current Level #{progress.highestUnlockedLevel}
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: RACER PROFILE CUSTOMIZATION */}
        {activeTab === 'profile' && (
          <div className="max-w-md mx-auto bg-slate-900/90 border border-white/15 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-5">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg shadow-cyan-500/10">
                {editingCountry}
              </div>
              <h3 className="font-display text-lg font-black uppercase tracking-wider text-white">
                Racer Identification
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Customize your display name and country flag shown on Global World Leaderboards.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Racer Call-Sign / Nickname
                </label>
                <input
                  type="text"
                  maxLength={18}
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-cyan-400"
                  placeholder="Enter racer name..."
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Country Flag
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {COUNTRY_OPTIONS.map((c) => (
                    <button
                      type="button"
                      key={c.code}
                      onClick={() => setEditingCountry(c.flag)}
                      className={`h-11 rounded-xl border flex flex-col items-center justify-center text-lg transition-transform cursor-pointer ${
                        editingCountry === c.flag
                          ? 'bg-cyan-500/20 border-cyan-400 scale-105 ring-2 ring-cyan-400/40'
                          : 'bg-slate-950 border-white/10 hover:border-white/30'
                      }`}
                      title={c.name}
                    >
                      <span>{c.flag}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-cyan-500/25 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-4"
              >
                {profileSaved ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Profile Saved!</span>
                  </>
                ) : (
                  <span>Save Racer Tag</span>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
