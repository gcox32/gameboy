import React from 'react';
import GameControls from './GameControls';
import GameDisplay from './GameDisplay';
import OnLight from './OnLight';
import styles from './styles.module.css';

interface ConsoleProps {
    isEmulatorOn: boolean;
    mainCanvasRef: React.RefObject<HTMLCanvasElement>;
    mobileZoom: boolean;
}

function Console({ isEmulatorOn, mainCanvasRef, mobileZoom }: ConsoleProps) {

    return (
        <div className={styles.consoleContainer} id={styles.console}>
            <OnLight isEmulatorOn={isEmulatorOn} />
            <GameDisplay mainCanvasRef={mainCanvasRef} mobileZoom={mobileZoom}/>
            <GameControls />
        </div>
    );
}

export default Console;


