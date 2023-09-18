import React from "react";
import PartySlot from "./PartySlot";

function PartySlots({ indexes = [0, 1, 2, 3, 4, 5] }) {
    return (
        <div className="drawer" id="active-party" >
            {
                indexes.map((idx) => (
                    <PartySlot key={idx} />
                ))
            }
        </div>
    )
}

export default PartySlots;