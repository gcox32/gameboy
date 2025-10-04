/**
 * React component for viewing and editing SRAM data
 * Demonstrates the comprehensive type system for Pokémon save data
 */

import React, { useState } from 'react';
import { useSRAMData } from '@/hooks/useSRAMData';
import { SRAMArray } from '@/types/sram';

interface SRAMViewerProps {
  initialData?: SRAMArray;
  onDataChange?: (data: SRAMArray) => void;
}

export const SRAMViewer: React.FC<SRAMViewerProps> = ({
  initialData,
  onDataChange
}) => {
  const [fileInput, setFileInput] = useState<HTMLInputElement | null>(null);
  
  const {
    sramData,
    playerName,
    rivalName,
    party,
    currentBox,
    boxes,
    mainData,
    pokedex,
    money,
    gameOptions,
    badges,
    playTime,
    isLoading,
    isValid,
    error,
    loadSRAM,
    updatePlayerName,
    updateRivalName,
    updateMoney,
    updateGameOptions,
    updateBadges,
    updatePlayTime,
    getPokemonFromParty,
    isPokemonOwned,
    isPokemonSeen,
    setPokemonOwned,
    setPokemonSeen,
    exportSRAM,
    reset
  } = useSRAMData();

  // Load initial data
  React.useEffect(() => {
    if (initialData) {
      loadSRAM(initialData);
    }
  }, [initialData, loadSRAM]);

  // Notify parent of data changes
  React.useEffect(() => {
    if (sramData && onDataChange) {
      onDataChange(sramData.raw);
    }
  }, [sramData, onDataChange]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const uint8Array = new Uint8Array(arrayBuffer);
      const sramArray = Array.from(uint8Array) as SRAMArray;
      loadSRAM(sramArray);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExport = () => {
    const data = exportSRAM();
    if (!data) return;

    const blob = new Blob([new Uint8Array(data)], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'save_data.sav';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <div className="sram-viewer">Loading SRAM data...</div>;
  }

  if (error) {
    return (
      <div className="sram-viewer">
        <div className="error">Error: {error}</div>
        <button onClick={reset}>Reset</button>
      </div>
    );
  }

  if (!sramData) {
    return (
      <div className="sram-viewer">
        <h2>SRAM Data Viewer</h2>
        <div className="upload-section">
          <input
            ref={setFileInput}
            type="file"
            accept=".sav,.srm"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <button onClick={() => fileInput?.click()}>
            Load Save File
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sram-viewer">
      <div className="header">
        <h2>SRAM Data Viewer</h2>
        <div className="status">
          <span className={`validity ${isValid ? 'valid' : 'invalid'}`}>
            {isValid ? 'Valid' : 'Invalid'} Checksum
          </span>
          <button onClick={handleExport}>Export Save</button>
          <button onClick={reset}>Reset</button>
        </div>
      </div>

      <div className="tabs">
        <div className="tab-content">
          {/* Player Info Tab */}
          <div className="tab-panel">
            <h3>Player Information</h3>
            <div className="form-group">
              <label>Player Name:</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => updatePlayerName(e.target.value)}
                maxLength={10}
              />
            </div>
            <div className="form-group">
              <label>Rival Name:</label>
              <input
                type="text"
                value={rivalName}
                onChange={(e) => updateRivalName(e.target.value)}
                maxLength={10}
              />
            </div>
            <div className="form-group">
              <label>Money:</label>
              <input
                type="number"
                value={money?.amount || 0}
                onChange={(e) => updateMoney(parseInt(e.target.value) || 0)}
                min={0}
                max={999999}
              />
            </div>
          </div>

          {/* Game Options Tab */}
          <div className="tab-panel">
            <h3>Game Options</h3>
            {gameOptions && (
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={gameOptions.battleEffects}
                    onChange={(e) => updateGameOptions({ battleEffects: e.target.checked })}
                  />
                  Battle Effects
                </label>
              </div>
            )}
            {gameOptions && (
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={gameOptions.battleStyle}
                    onChange={(e) => updateGameOptions({ battleStyle: e.target.checked })}
                  />
                  Set Battle Style
                </label>
              </div>
            )}
            {gameOptions && (
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={gameOptions.sound}
                    onChange={(e) => updateGameOptions({ sound: e.target.checked })}
                  />
                  Stereo Sound
                </label>
              </div>
            )}
            {gameOptions && (
              <div className="form-group">
                <label>Text Speed:</label>
                <select
                  value={gameOptions.textSpeed}
                  onChange={(e) => updateGameOptions({ textSpeed: parseInt(e.target.value) })}
                >
                  <option value={1}>Fast</option>
                  <option value={3}>Normal</option>
                  <option value={5}>Slow</option>
                </select>
              </div>
            )}
          </div>

          {/* Badges Tab */}
          <div className="tab-panel">
            <h3>Badges</h3>
            {badges && (
              <div className="badges-grid">
                {Object.entries(badges).map(([badgeName, hasBadge]) => (
                  <div key={badgeName} className="badge-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={hasBadge}
                        onChange={(e) => updateBadges({ [badgeName]: e.target.checked })}
                      />
                      {badgeName.charAt(0).toUpperCase() + badgeName.slice(1)} Badge
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Play Time Tab */}
          <div className="tab-panel">
            <h3>Play Time</h3>
            {playTime && (
              <div className="play-time">
                <div className="form-group">
                  <label>Hours:</label>
                  <input
                    type="number"
                    value={playTime.hours}
                    onChange={(e) => updatePlayTime({ hours: parseInt(e.target.value) || 0 })}
                    min={0}
                    max={255}
                  />
                </div>
                <div className="form-group">
                  <label>Minutes:</label>
                  <input
                    type="number"
                    value={playTime.minutes}
                    onChange={(e) => updatePlayTime({ minutes: parseInt(e.target.value) || 0 })}
                    min={0}
                    max={59}
                  />
                </div>
                <div className="form-group">
                  <label>Seconds:</label>
                  <input
                    type="number"
                    value={playTime.seconds}
                    onChange={(e) => updatePlayTime({ seconds: parseInt(e.target.value) || 0 })}
                    min={0}
                    max={59}
                  />
                </div>
                <div className="form-group">
                  <label>Frames:</label>
                  <input
                    type="number"
                    value={playTime.frames}
                    onChange={(e) => updatePlayTime({ frames: parseInt(e.target.value) || 0 })}
                    min={0}
                    max={59}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Party Tab */}
          <div className="tab-panel">
            <h3>Pokémon Party</h3>
            {party && (
              <div className="party-grid">
                {Array.from({ length: 6 }, (_, i) => {
                  const pokemon = getPokemonFromParty(i);
                  return (
                    <div key={i} className="pokemon-slot">
                      <h4>Slot {i + 1}</h4>
                      {pokemon ? (
                        <div className="pokemon-info">
                          <p>Species: {pokemon.species}</p>
                          <p>Level: {pokemon.level}</p>
                          <p>HP: {pokemon.hp}/{pokemon.maxHp}</p>
                          <p>Status: {pokemon.status}</p>
                        </div>
                      ) : (
                        <p>Empty</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pokédex Tab */}
          <div className="tab-panel">
            <h3>Pokédex</h3>
            {pokedex && (
              <div className="pokedex-section">
                <h4>Pokémon Status</h4>
                <div className="pokemon-list">
                  {Array.from({ length: 152 }, (_, i) => {
                    const owned = isPokemonOwned(i);
                    const seen = isPokemonSeen(i);
                    return (
                      <div key={i} className="pokemon-entry">
                        <span className="pokemon-number">#{i + 1}</span>
                        <label>
                          <input
                            type="checkbox"
                            checked={owned}
                            onChange={(e) => setPokemonOwned(i, e.target.checked)}
                          />
                          Owned
                        </label>
                        <label>
                          <input
                            type="checkbox"
                            checked={seen}
                            onChange={(e) => setPokemonSeen(i, e.target.checked)}
                          />
                          Seen
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SRAMViewer;
