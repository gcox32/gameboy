import React from 'react';
import GameButton from './GameButton';
import styles from './styles.module.css';

function GameControls() {
    return (
        <>
            <GameButton className={`${styles.gbButton} ${styles.aButton}`} keyCode="88" />
            <GameButton className={`${styles.gbButton} ${styles.bButton}`} keyCode="90" />
            <div className={styles.joypad}>
                <GameButton className={`${styles.gbButton} ${styles.upButton}`} keyCode="38" />
                <GameButton className={`${styles.gbButton} ${styles.downButton}`} keyCode="40" />
                <GameButton className={`${styles.gbButton} ${styles.leftButton}`} keyCode="37" />
                <GameButton className={`${styles.gbButton} ${styles.rightButton}`} keyCode="39" />
            </div>
            <GameButton className={`${styles.gbButton} ${styles.startButton}`} keyCode="13" />
            <GameButton className={`${styles.gbButton} ${styles.selectButton}`} keyCode="16" />
        </>
    );
}

export default GameControls;
