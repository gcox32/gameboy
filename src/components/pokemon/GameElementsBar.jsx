import React from "react";
import { BadgesIcon, CameraIcon, MapIcon, PokedexIcon, TeamIcon } from "./GameElementsIcons";

function GameElementsBar({ onActivePartyClick, onGymBadgeCaseClick, onMapClick, onPokedexClick, onCameraClick }) {
    return (
      <div className="game-elements-bar">
        <div className="icon" onClick={onActivePartyClick}>
          <TeamIcon width={'60px'}/>
        </div>
        <div className="icon" onClick={onGymBadgeCaseClick}>
          <BadgesIcon width={'60px'}/>
        </div>
        <div className="icon" onClick={onMapClick}>
          <MapIcon width={'60px'}/>
        </div>
        <div className="icon" onClick={onPokedexClick}>
          <PokedexIcon width={'60px'}/>
        </div>
        <div className="icon" onClick={onCameraClick}>
          <CameraIcon width={'60px'}/>
        </div>  
      </div>
    );
  }
  

export default GameElementsBar;