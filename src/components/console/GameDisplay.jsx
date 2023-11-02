import React, { useRef, useEffect } from 'react';

function GameDisplay({ gameBoyInstance, ROMImage }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (canvasRef.current && ROMImage) {
            gameBoyInstance.current.run(canvasRef.current, ROMImage);
        }
    }, [ROMImage, gameBoyInstance]);

    return (
        <div id="GameBoy" className="window">
            <div id="gfx">
                <canvas id="mainCanvas" ref={canvasRef}></canvas>
            </div>
        </div>
    );
}

export default GameDisplay;
