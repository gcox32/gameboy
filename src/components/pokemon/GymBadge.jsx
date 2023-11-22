import React from 'react';

function GymBadge({ badge, earned }) {
    const badgeImgPath = 'https://assets.letmedemo.com/public/gameboy/images/pokemon/badges/'
    return (
        <div className={`badge ${earned ? 'earned' : 'unearned'}`}>
            <img
                src={`${badgeImgPath}${badge.image}`}
                alt={badge.name}
                className={earned ? '' : 'silhouette'}
            />
        </div>
    );
}

export default GymBadge;
