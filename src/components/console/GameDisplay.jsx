import React from 'react';

function GameDisplay({ mainCanvasRef }) {
    return (
        <div id="GameBoy" className="window">
            <div id="gfx">
                <canvas id="mainCanvas" ref={mainCanvasRef}></canvas>
            </div>
        </div>
    );
}


export default GameDisplay;
