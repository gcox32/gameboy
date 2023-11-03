import React from 'react';

function OnLight({ isEmulatorOn }) {
    const lightStyle = {
        opacity: isEmulatorOn ? 1 : 0,
    };

    return (
        <div id="on-light" style={lightStyle}></div>
    );
}
export default OnLight;
