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

    useInGameMemoryWatcher(inGameMem, '0xD2F6', '0x5F', '0x1', (array) => {
        const badgesBinary = array.toString(2).padStart(8, '0');
        const newBadges = badgesBinary.split('').reverse().map((bit, index) => ({
            ...badgesInfo[index],
            earned: bit === '1'
        }));
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
