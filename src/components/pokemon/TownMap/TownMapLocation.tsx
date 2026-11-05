import styles from "./styles.module.css";
import { Location } from "@/types/pokemon";
import { getLocationBox } from "./geometry";

function TownMapLocation({ location, onClick }: { location: Location, onClick: () => void }) {
    const { left, top, width, height } = getLocationBox(location);

    return (
        <button
            type="button"
            className={styles.townMapLoc}
            style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` }}
            title={location.title}
            aria-label={location.title}
            onClick={onClick}
        />
    );
}

export default TownMapLocation;
