import React from "react";

function PartySlot({ idx }) {
    return (
        <div className="party-slot gray-border" id={`party-slot-${idx}`}>
            <div className="img-wrap" id={`img-wrap-${idx}`}>
                <img className="party-slot-img" id={`party-slot-img-${idx}`} alt="" />
            </div>
            <div className="lvl" id={`lvl-${idx}`}></div>
        </div>
    )
}

export default PartySlot;