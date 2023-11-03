import React from 'react';
import GameButton from './GameButton';

function GameControls() {
    return (
        <>
            <GameButton className="gb-btn a-b"    elementId="a-btn"      keyCode="88" />
            <GameButton className="gb-btn a-b"    elementId="b-btn"      keyCode="90" />
            <GameButton className="gb-btn joypad" elementId="up-btn"     keyCode="38" />
            <GameButton className="gb-btn joypad" elementId="down-btn"   keyCode="40" />
            <GameButton className="gb-btn joypad" elementId="left-btn"   keyCode="37" />
            <GameButton className="gb-btn joypad" elementId="right-btn"  keyCode="39" />
            <GameButton className="gb-btn st-sel" elementId="start-btn"  keyCode="13" />
            <GameButton className="gb-btn st-sel" elementId="select-btn" keyCode="16" />
        </>
    );
}

export default GameControls;
