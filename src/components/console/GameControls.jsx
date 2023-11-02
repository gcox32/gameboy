import React from 'react';
import GameButton from './GameButton';

function GameControls({ gameBoy }) {
    return (
        <>
            <GameButton className="gb-btn a-b"    elementId="a-btn"      action={() => gameBoy.pressA(88)} />
            <GameButton className="gb-btn a-b"    elementId="b-btn"      action={() => gameBoy.pressB(90)} />
            <GameButton className="gb-btn joypad" elementId="up-btn"     action={() => gameBoy.pressUp(38)} />
            <GameButton className="gb-btn joypad" elementId="down-btn"   action={() => gameBoy.pressDown(40)} />
            <GameButton className="gb-btn joypad" elementId="left-btn"   action={() => gameBoy.pressLeft(37)} />
            <GameButton className="gb-btn joypad" elementId="right-btn"  action={() => gameBoy.pressRight(39)} />
            <GameButton className="gb-btn st-sel" elementId="start-btn"  action={() => gameBoy.pressStart(13)} />
            <GameButton className="gb-btn st-sel" elementId="select-btn" action={() => gameBoy.pressSelect(16)} />
        </>
    );
}

export default GameControls;
