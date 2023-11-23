import React, { useState } from 'react';

function GymBadge({ badge, earned }) {
    const [gleam, setGleam] = useState(false);
    const badgeImgPath = 'https://assets.letmedemo.com/public/gameboy/images/pokemon/badges/';
    const badgeClass = earned ? 'earned' : 'unearned';

    const handleGleam = () => {
        setGleam(true);
        // Optional: Remove the gleam effect after animation
        setTimeout(() => setGleam(false), 1000); // 1000 ms should match the CSS animation duration
    };

    return (
        <div className={`badge ${badgeClass}`}>
            <div className={`badge-image-wrapper ${gleam ? 'gleam' : ''}`} onClick={handleGleam}>
                <img
                    src={`${badgeImgPath}${badge.image}`}
                    alt={badge.name}
                    className={earned ? '' : 'silhouette'}
                />
            </div>
        </div>
    );
}



export default GymBadge;
