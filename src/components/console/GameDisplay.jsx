import React from 'react';

function GameDisplay({ mainCanvasRef, mobileZoom }) {
    return (
        <div id="GameBoy" className={`window ${mobileZoom ? 'zoom' : ''}`}>
            <div id="gfx">
                <canvas id="mainCanvas" ref={mainCanvasRef}></canvas>
            </div>
        </div>
    );
}


export default GameDisplay;
