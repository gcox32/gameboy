import React from "react";

function Arrows() {
    return (
        <div className="arrows">
            <img className="arrow" id="party-arrow" alt="" />
            <img className="arrow" id="cartridge-arrow" style={{transform:'rotate(180deg)'}} alt="" />
            <img className="arrow" id="settings-arrow" alt="" />
        </div>
    )
}

export default Arrows;