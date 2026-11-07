'use client';

import { ReactNode } from 'react';
import styles from '../lab.module.css';

interface LabStageProps {
    panel: ReactNode;
    platform: ReactNode;
    monitor: ReactNode;
}

/** The action panel, the platform in the middle, and the monitor on the right */
export function LabStage({ panel, platform, monitor }: LabStageProps) {
    return (
        <div className={styles.stage}>
            <div className={styles.stagePanel}>{panel}</div>
            <div className={styles.stagePlatform}>{platform}</div>
            <div className={styles.stageMonitor}>{monitor}</div>
        </div>
    );
}
