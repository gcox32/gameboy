import React from "react";

function TownMapLocation({ locData, onClick }) {
    const { x, y, height, width, locType, title } = locData;
    const locStyle = {
        left: `${x}px`, 
        bottom: `${y}px`, 
        height: `${height}px`, 
        width: `${width}px`
    };

    return (
        <div
            className={`town-map-loc ${locType}`}
            style={locStyle}
            title={title}
            onClick={onClick} // Add this line to handle clicks
        >
        </div>
    )
}


export default TownMapLocation;