import React, { useState } from 'react';
import GymBadge from './GymBadge';
import { useInGameMemoryWatcher } from '../../utils/MemoryWatcher';

const badgesInfo = [
    { name: "Boulder Badge", image: "boulder.png" },
    { name: "Cascade Badge", image: "cascade.png" },
    { name: "Thunder Badge", image: "thunder.png" },
    { name: "Rainbow Badge", image: "rainbow.png" },
    { name: "Soul Badge",    image: "soul.png" },
    { name: "Marsh Badge",   image: "marsh.png" },
    { name: "Volcano Badge", image: "volcano.png" },
    { name: "Earth Badge",   image: "earth.png" },    
];

function GymBadgeCase({ inGameMem }) {
    const [badges, setBadges] = useState([0,0,0,0,0,0,0,0]);
    const [prevBadges, setPrevBadges] = useState([0,0,0,0,0,0,0,0]);

    useInGameMemoryWatcher(inGameMem, '0xD2F7', '0x5F', '0x1', (array) => {
        // Ensure the byte is correctly interpreted
        const badgesByte = array[0];
        const badgesBinary = badgesByte.toString(2).padStart(8, '0');
        // Parse the binary string to an array of badge objects
        const newBadges = badgesBinary.split('').reverse().map((bit, index) => ({
            ...badgesInfo[index],
            earned: bit === '1'
        }));

        // Update states
        setPrevBadges(badges);
        setBadges(newBadges);
    }, 3000);

    return (
        <div className="badges-case">
            {badges.map((badge, index) => (
                <GymBadge 
                    key={index} 
                    badge={badge} 
                    earned={badge.earned} 
                    justEarned={badge.earned && !prevBadges[index].earned} 
                />
            ))}
        </div>
    );
}


export default GymBadgeCase;
