import React from "react";
import styles from "./styles.module.css";
import { Location } from "@/types/pokemon";

function TownMapLocation({ locData, onClick }: { locData: Location | null, onClick: () => void }) {
    if (!locData) return null;
    const { x, y, height, width, locType, title } = locData;
    const locStyle = {
        left: `${x}px`, 
        bottom: `${y}px`, 
        height: `${height}px`, 
        width: `${width}px`
    };

    return (
        <div
            className={`${styles.townMapLoc} ${locType}`}
            style={locStyle}
            title={title}
            onClick={onClick}
        >
        </div>
    )
}


export default TownMapLocation;