import React from 'react';

function FullScreenContainer({ background, fullscreenCanvasRef, fullscreenContainerRef }) {
  return (
    <div id="fullscreenContainer" ref={fullscreenContainerRef} style={{ backgroundImage: `url(${background})` }}>
      <canvas id="fullscreen" ref={fullscreenCanvasRef}></canvas>
    </div>
  );
}

export default FullScreenContainer;
