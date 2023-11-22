import React from 'react';
import GymBadge from './GymBadge';

const badgesInfo = [
    { name: "Boulder Badge", image: "boulder.png" },
    { name: "Cascade Badge", image: "cascade.png" },
    { name: "Thunder Badge", image: "thunder.png" },
    { name: "Rainbow Badge", image: "rainbow.png" },
    { name: "Soul Badge",    image: "soul.png" },
    { name: "Marsh Badge",   image: "marsh.png" },
    { name: "Volcano Badge", image: "volcano.png" },
    { name: "Earth Badge",   image: "earth.png" },    
    // ... other badges
];

function GymBadgeCase({ MBCRamRef }) {
    const badgesByte = MBCRamRef[0x2602];
    const badgesBinary = badgesByte.toString(2).padStart(8, '0');

    const badges = badgesBinary.split('').reverse().map((bit, index) => ({
        ...badgesInfo[index],
        earned: bit === '1'
    }));

    return (
        <div className="badges-case">
            {badges.map((badge, index) => (
                <GymBadge key={index} badge={badge} earned={badge.earned} />
            ))}
        </div>
    );
}

export default GymBadgeCase;
