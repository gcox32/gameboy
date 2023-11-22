import React from "react";
import TeamIcon from './icons/TeamIcon';
import BadgesIcon from './icons/BadgesIcon';
import MapIcon from './icons/MapIcon';
import PokedexIcon from './icons/PokedexIcon';

function GameElementsBar({ onActivePartyClick, onGymBadgeCaseClick /*, ... other handlers */ }) {
    return (
      <div className="game-elements-bar">
        <div className="icon" onClick={onActivePartyClick}>
          <TeamIcon width={'60px'}/>
        </div>
        <div className="icon" onClick={onGymBadgeCaseClick}>
          <BadgesIcon width={'60px'}/>
        </div>
        <div className="icon">
          <MapIcon width={'60px'}/>
        </div>
        <div className="icon">
          <PokedexIcon width={'60px'}/>
        </div>
      </div>
    );
  }
  

export default GameElementsBar;