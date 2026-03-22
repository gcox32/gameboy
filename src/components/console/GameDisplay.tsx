import { RefObject } from 'react';
import styles from './styles.module.css';

interface GameDisplayProps {
    mainCanvasRef: RefObject<HTMLCanvasElement> | undefined;
    mobileZoom: boolean;
}

function GameDisplay({ mainCanvasRef, mobileZoom }: GameDisplayProps) {
    return (
        <div id={styles.GameBoy} className={`${styles.window} ${mobileZoom ? styles.zoom : ''}`}>
            <div id={styles.gfx}>
                <canvas id={styles.mainCanvas} ref={mainCanvasRef}></canvas>
            </div>
        </div>
    );
}


export default GameDisplay;
