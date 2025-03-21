import React from 'react';
import GameButton from './GameButton';
import styles from './styles.module.css';

function GameControls() {
    return (
        <>
            <GameButton className={`${styles.gbButton} ${styles.aButton}`} button="a" />
            <GameButton className={`${styles.gbButton} ${styles.bButton}`} button="b" />
            <div className={styles.joypad}>
                <GameButton className={`${styles.gbButton} ${styles.upButton}`} button="up" />
                <GameButton className={`${styles.gbButton} ${styles.downButton}`} button="down" />
                <GameButton className={`${styles.gbButton} ${styles.leftButton}`} button="left" />
                <GameButton className={`${styles.gbButton} ${styles.rightButton}`} button="right" />
            </div>
            <GameButton className={`${styles.gbButton} ${styles.startButton}`} button="start" />
            <GameButton className={`${styles.gbButton} ${styles.selectButton}`} button="select" />
        </>
    );
}

export default GameControls;
