import React from "react";
import { BadgesIcon, CameraIcon, MapIcon, PokedexIcon, TeamIcon } from "./GameElementsIcons";

function GameElementsBar({ onActivePartyClick, onGymBadgeCaseClick, onMapClick, onPokedexClick, onCameraClick }) {
    return (
      <div className="game-elements-bar">
        <div title="Active Party" className="icon" onClick={onActivePartyClick}>
          <TeamIcon width={'40px'}/>
        </div>
        <div title="Badges" className="icon" onClick={onGymBadgeCaseClick}>
          <BadgesIcon width={'40px'}/>
        </div>
        <div title="Town Map" className="icon" onClick={onMapClick}>
          <MapIcon width={'40px'}/>
        </div>
        <div title="Pokedex" className="icon" onClick={onPokedexClick}>
          <PokedexIcon width={'40px'}/>
        </div>
        <div title="Photoshoot" className="icon" onClick={onCameraClick}>
          <CameraIcon width={'40px'}/>
        </div>  
      </div>
    );
  }
  

export default GameElementsBar;