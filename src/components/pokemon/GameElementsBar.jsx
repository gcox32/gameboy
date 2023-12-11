import React from "react";
import { BadgesIcon, CameraIcon, MapIcon, PokedexIcon, TeamIcon } from "./GameElementsIcons";

function GameElementsBar({ 
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
   }) {
    return (
      <div className="game-elements-bar">
        <div title="Active Party" className={`icon ${showActiveParty ? 'active' : ''}`} onClick={onActivePartyClick}>
          <TeamIcon width={'40px'}/>
        </div>
        <div title="Badges" className={`icon ${showGymBadgeCase ? 'active' : ''}`} onClick={onGymBadgeCaseClick}>
          <BadgesIcon width={'40px'}/>
        </div>
        <div title="Town Map" className={`icon ${showMap ? 'active' : ''}`} onClick={onMapClick}>
          <MapIcon width={'40px'}/>
        </div>
        <div title="Pokedex" className={`icon ${showPokedex ? 'active' : ''}`} onClick={onPokedexClick}>
          <PokedexIcon width={'40px'}/>
        </div>
        <div title="Photoshoot" className={`icon ${showTeamPhoto ? 'active' : ''}`} onClick={onCameraClick}>
          <CameraIcon width={'40px'}/>
        </div>  
      </div>
    );
  }
  

export default GameElementsBar;