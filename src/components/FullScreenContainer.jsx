import React from 'react';

function FullScreenContainer({ background }) {
    return (
        <div id="fullscreenContainer" style={{ backgroundImage: `url(${background})` }}>
            <canvas id="fullscreen" className="maximum"></canvas>
        </div>
    );
}

export default FullScreenContainer;
