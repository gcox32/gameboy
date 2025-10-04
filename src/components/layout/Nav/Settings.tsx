import { FaCog } from "react-icons/fa";
import iconStyles from "@/styles/icons.module.css";

export default function Settings({ handleSettingsClick }: { handleSettingsClick: () => void }) {
    return (
        <button
            className={iconStyles.navIconButton}
            onClick={handleSettingsClick}
            aria-label="Settings"
        >
            <FaCog />
            <span className={iconStyles.label}>Settings</span>
        </button>
    );
}