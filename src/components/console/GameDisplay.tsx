import { RefObject } from 'react';
import styles from './styles.module.css';

interface GameDisplayProps {
    mainCanvasRef: RefObject<HTMLCanvasElement> | undefined;
}

function GameDisplay({ mainCanvasRef }: GameDisplayProps) {
    return (
        <div id={styles.GameBoy} className={styles.window}>
            <div id={styles.gfx}>
                <canvas id={styles.mainCanvas} ref={mainCanvasRef}></canvas>
            </div>
        </div>
    );
}


export default GameDisplay;
