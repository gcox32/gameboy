import { RefObject } from 'react';
import GameControls from './GameControls';
import GameDisplay from './GameDisplay';
import OnLight from './OnLight';
import styles from './styles.module.css';

interface ConsoleProps {
    isEmulatorOn: boolean;
    mainCanvasRef: RefObject<HTMLCanvasElement> | undefined;
}

function Console({ isEmulatorOn, mainCanvasRef }: ConsoleProps) {

    return (
        <div className={styles.consoleContainer} id={styles.console}>
            <OnLight isEmulatorOn={isEmulatorOn} />
            <GameDisplay mainCanvasRef={mainCanvasRef} />
            <GameControls />
        </div>
    );
}

export default Console;


