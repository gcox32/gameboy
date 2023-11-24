import React, { useState } from 'react';
import { badgeImgPath } from '../../config';

function GymBadge({ badge, earned }) {
    const [gleam, setGleam] = useState(false);
    const badgeClass = earned ? 'earned' : 'unearned';

    const handleGleam = () => {
        setGleam(true);
        setTimeout(() => setGleam(false), 1000);
    };

    return (
        <div className={`badge ${badgeClass}`}>
            <div className={`badge-image-wrapper ${gleam ? 'gleam' : ''}`} onClick={handleGleam}>
                <img
                    src={`${badgeImgPath}${badge.image}`}
                    alt={badge.name}
                    title={badge.name}
                    className={earned ? '' : 'silhouette'}
                    loading="lazy"
                    draggable="false"
                    style={earned ? {} : { userSelect: 'none', pointerEvents: 'none' }}
                />
            </div>
        </div>
    );
}



export default GymBadge;
