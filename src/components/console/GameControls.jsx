import React from 'react';
import GameButton from './GameButton';

function GameControls() {
    return (
        <>
            <GameButton     className="gb-btn" elementId="a-btn"      keyCode="88" />
            <GameButton     className="gb-btn" elementId="b-btn"      keyCode="90" />
            <div className="joypad">
                <GameButton className="gb-btn" elementId="up-btn"     keyCode="38" />
                <GameButton className="gb-btn" elementId="down-btn"   keyCode="40" />
                <GameButton className="gb-btn" elementId="left-btn"   keyCode="37" />
                <GameButton className="gb-btn" elementId="right-btn"  keyCode="39" />
            </div>
            <GameButton     className="gb-btn" elementId="start-btn"  keyCode="13" />
            <GameButton     className="gb-btn" elementId="select-btn" keyCode="16" />
        </>
    );
}

export default GameControls;
