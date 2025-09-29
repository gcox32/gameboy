import { FaCog } from "react-icons/fa";
import styles from "./styles.module.css";

export default function Settings({ handleSettingsClick }: { handleSettingsClick: () => void }) {
    return (
        <button
            className={styles.settingsButton}
            onClick={handleSettingsClick}
            aria-label="Settings"
        >
            <FaCog />
            <span className={styles.label}>Settings</span>
        </button>
    );
}