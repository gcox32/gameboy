import React from "react";
import { 
  FaUsers, 
  FaMedal, 
  FaMap, 
  FaBook, 
  FaCamera 
} from 'react-icons/fa';
import styles from './styles.module.css';

interface GameElementsBarProps {
  elementsEnabled: boolean;
  onActivePartyClick: () => void;
  onGymBadgeCaseClick: () => void;
  onMapClick: () => void;
  onPokedexClick: () => void;
  onCameraClick: () => void;
  showActiveParty: boolean;
  showGymBadgeCase: boolean;
  showMap: boolean;
  showPokedex: boolean;
  showTeamPhoto: boolean;
}

function GameElementsBar({ 
  elementsEnabled,
  onActivePartyClick, 
  onGymBadgeCaseClick, 
  onMapClick, 
  onPokedexClick, 
  onCameraClick,
  showActiveParty,
  showGymBadgeCase,
  showMap,
  showPokedex,
  showTeamPhoto
}: GameElementsBarProps) {
  return (
    <div className={styles.gameElementsBar}>
      <button 
        title="Active Party" 
        className={`${styles.iconButton} ${showActiveParty ? styles.active : ''}`}
        onClick={onActivePartyClick}
        disabled={!elementsEnabled}
      >
        <FaUsers size={24} />
      </button>
      
      <button 
        title="Badges" 
        className={`${styles.iconButton} ${showGymBadgeCase ? styles.active : ''}`}
        onClick={onGymBadgeCaseClick}
        disabled={!elementsEnabled}
      >
        <FaMedal size={24} />
      </button>
      
      <button 
        title="Town Map" 
        className={`${styles.iconButton} ${showMap ? styles.active : ''}`}
        onClick={onMapClick}
        disabled={!elementsEnabled}
      >
        <FaMap size={24} />
      </button>
      
      <button 
        title="Pokedex" 
        className={`${styles.iconButton} ${showPokedex ? styles.active : ''}`}
        onClick={onPokedexClick}
        disabled={!elementsEnabled}
      >
        <FaBook size={24} />
      </button>
      
      <button 
        title="Photoshoot" 
        className={`${styles.iconButton} ${showTeamPhoto ? styles.active : ''}`}
        onClick={onCameraClick}
        disabled={true}
      >
        <FaCamera size={24} />
      </button>
    </div>
  );
}

export default GameElementsBar;