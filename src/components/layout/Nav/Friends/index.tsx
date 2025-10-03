import { FaUserFriends } from 'react-icons/fa';
import iconStyles from '@/styles/icons.module.css';

export default function Friends({ handleFriendsClick }: { handleFriendsClick: () => void }) {
    return (
        <div>
            <button 
            className={iconStyles.navIconButton} 
            onClick={handleFriendsClick}
            aria-label="Friends"
            >
                <FaUserFriends />
                <span className={iconStyles.label}>Friends</span>
            </button>
        </div>
    );
}