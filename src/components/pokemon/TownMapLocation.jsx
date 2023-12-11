import React from "react";

function TownMapLocation ( locData ) {
    const styleData = locData.locData;
    const locStyle={
        left: `${styleData.x}px`, 
        bottom: `${styleData.y}px`, 
        height: `${styleData.height}px`, 
        width: `${styleData.width}px`
    }

    return (
        <div className={`town-map-loc ${locData.locData.locType}`} style={locStyle} title={locData.locData.title}>
        </div>
    )
}

export default TownMapLocation;