import React, { useState } from "react";
import PartySlot from "./PartySlot";
import '../../styles/pokemon.css';
import { useMBCRamWatcher } from "../../utils/MBCRamWatcher";
import { parseParty } from "../../utils/pokemon/parse";

function ActiveParty({ MBCRam }) {
    const [partyData, setPartyData] = useState([]);

    useMBCRamWatcher(MBCRam, '0x2F2C', '0x194', (array) => {
        const parsedData = parseParty(array);
        setPartyData(parsedData.pokemonList);
    });

    return (
        <div className="active-party">
            {partyData.map((pokemon, index) => (
                <PartySlot key={index} pokemon={pokemon} />
            ))}
        </div>
    );
}


export default ActiveParty;