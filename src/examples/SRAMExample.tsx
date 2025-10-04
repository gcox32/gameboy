/**
 * Example component demonstrating the comprehensive SRAM type system
 * Shows how to work with Pokémon save data in a type-safe way
 */

import React, { useState } from 'react';
import { useSRAMData } from '@/hooks/useSRAMData';
import { SRAMArray } from '@/types/sram';

export const SRAMExample: React.FC = () => {
  const [sramData, setSramData] = useState<SRAMArray | null>(null);
  
  const {
    playerName,
    rivalName,
    party,
    money,
    gameOptions,
    badges,
    playTime,
    pokedex,
    isValid,
    loadSRAM,
    updatePlayerName,
    updateMoney,
    updateBadges,
    isPokemonOwned,
    setPokemonOwned,
    exportSRAM
  } = useSRAMData();

  // Load sample data
  const loadSampleData = () => {
    // Create a sample 32KB SRAM array (all zeros for demo)
    const sampleData: SRAMArray = new Array(0x8000).fill(0);
    
    // Set some sample values
    sampleData[0x2598] = 0x50; // Player name terminator
    sampleData[0x25F3] = 0x00; // Money (BCD)
    sampleData[0x25F4] = 0x00;
    sampleData[0x25F5] = 0x00;
    sampleData[0x2601] = 0x00; // Game options
    sampleData[0x2602] = 0x00; // Badges
    sampleData[0x2CED] = 0x00; // Play time hours
    sampleData[0x2CEE] = 0x00; // Play time minutes
    sampleData[0x2CEF] = 0x00; // Play time seconds
    sampleData[0x2CF0] = 0x00; // Play time frames
    
    loadSRAM(sampleData);
    setSramData(sampleData);
  };

  const handleExport = () => {
    const data = exportSRAM();
    if (data) {
      console.log('Exported SRAM data:', data.length, 'bytes');
      // In a real app, you'd save this to a file
    }
  };

  return (
    <div className="sram-example">
      <h1>SRAM Type System Example</h1>
      
      <div className="controls">
        <button onClick={loadSampleData}>
          Load Sample Data
        </button>
        <button onClick={handleExport} disabled={!sramData}>
          Export SRAM
        </button>
      </div>

      {sramData && (
        <div className="sram-info">
          <h2>Save Data Information</h2>
          
          <div className="status">
            <p>Status: {isValid ? 'Valid' : 'Invalid'} Checksum</p>
            <p>Data Size: {sramData.length} bytes (32KB)</p>
          </div>

          <div className="player-info">
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
                readOnly
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

          <div className="game-state">
            <h3>Game State</h3>
            {gameOptions && (
              <div className="options">
                <h4>Game Options</h4>
                <label>
                  <input
                    type="checkbox"
                    checked={gameOptions.battleEffects}
                    onChange={(e) => updateGameOptions({ battleEffects: e.target.checked })}
                  />
                  Battle Effects
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={gameOptions.battleStyle}
                    onChange={(e) => updateGameOptions({ battleStyle: e.target.checked })}
                  />
                  Set Battle Style
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={gameOptions.sound}
                    onChange={(e) => updateGameOptions({ sound: e.target.checked })}
                  />
                  Stereo Sound
                </label>
                <div>
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
              </div>
            )}

            {badges && (
              <div className="badges">
                <h4>Badges</h4>
                <div className="badge-grid">
                  {Object.entries(badges).map(([badgeName, hasBadge]) => (
                    <label key={badgeName} className="badge-item">
                      <input
                        type="checkbox"
                        checked={hasBadge}
                        onChange={(e) => updateBadges({ [badgeName]: e.target.checked })}
                      />
                      {badgeName.charAt(0).toUpperCase() + badgeName.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {playTime && (
              <div className="play-time">
                <h4>Play Time</h4>
                <p>
                  {playTime.hours.toString().padStart(2, '0')}:
                  {playTime.minutes.toString().padStart(2, '0')}:
                  {playTime.seconds.toString().padStart(2, '0')}
                </p>
              </div>
            )}
          </div>

          <div className="pokemon-info">
            <h3>Pokémon Information</h3>
            {party && (
              <div className="party">
                <h4>Party ({party.count} Pokémon)</h4>
                <div className="party-grid">
                  {Array.from({ length: 6 }, (_, i) => {
                    const pokemon = party.pokemon[i];
                    return (
                      <div key={i} className="pokemon-slot">
                        <h5>Slot {i + 1}</h5>
                        {pokemon ? (
                          <div>
                            <p>Species: {pokemon.species}</p>
                            <p>Level: {pokemon.level}</p>
                            <p>HP: {pokemon.hp}/{pokemon.maxHp}</p>
                          </div>
                        ) : (
                          <p>Empty</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {pokedex && (
              <div className="pokedex">
                <h4>Pokédex</h4>
                <div className="pokedex-stats">
                  <p>Total Pokémon: 152</p>
                  <div className="pokemon-list">
                    {Array.from({ length: 10 }, (_, i) => {
                      const owned = isPokemonOwned(i);
                      const seen = isPokemonSeen(i);
                      return (
                        <div key={i} className="pokemon-entry">
                          <span>#{i + 1}</span>
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
              </div>
            )}
          </div>

          <div className="technical-info">
            <h3>Technical Information</h3>
            <div className="info-grid">
              <div>
                <h4>Memory Layout</h4>
                <ul>
                  <li>Bank 0: Scratch & Hall of Fame (8KB)</li>
                  <li>Bank 1: Main Data (8KB)</li>
                  <li>Bank 2: PC Boxes 1-6 (8KB)</li>
                  <li>Bank 3: PC Boxes 7-12 (8KB)</li>
                </ul>
              </div>
              <div>
                <h4>Data Types</h4>
                <ul>
                  <li>Text: Custom encoding (0x50 terminator)</li>
                  <li>Money: Binary Coded Decimal</li>
                  <li>Flags: Bit fields</li>
                  <li>Pokémon: 33-44 byte structures</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SRAMExample;
