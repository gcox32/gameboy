import React from 'react';
import styles from './styles.module.css';

function OnLight({ isEmulatorOn }: { isEmulatorOn: boolean }) {
    const lightStyle = {
        opacity: isEmulatorOn ? 1 : 0,
    };

    return (
        <div id={styles.onLight} style={lightStyle}></div>
    );
}
export default OnLight;
