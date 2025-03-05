import React from 'react';
import GameButton from './GameButton';
import styles from './styles.module.css';

function GameControls() {
    return (
        <>
            <GameButton     className={styles.gbButton} elementId={styles.aButton}      keyCode="88" />
            <GameButton     className={styles.gbButton} elementId={styles.bButton}      keyCode="90" />
            <div className={styles.joypad}>
                <GameButton className={styles.gbButton} elementId={styles.upButton}     keyCode="38" />
                <GameButton className={styles.gbButton} elementId={styles.downButton}   keyCode="40" />
                <GameButton className={styles.gbButton} elementId={styles.leftButton}   keyCode="37" />
                <GameButton className={styles.gbButton} elementId={styles.rightButton}  keyCode="39" />
            </div>
            <GameButton     className={`${styles.gbButton} ${styles.stSel}`} elementId={styles.startButton}  keyCode="13" />
            <GameButton     className={`${styles.gbButton} ${styles.stSel}`} elementId={styles.selectButton} keyCode="16" />
        </>
    );
}

export default GameControls;
