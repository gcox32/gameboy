import React from "react";
import PokeModal from "./PokeModal";

function PartyModals({ indexes = [0, 1, 2, 3, 4, 5] }) {
    return (
        indexes.map((idx) => (
            <PokeModal key={idx} />
        ))
    )
}

export default PartyModals;