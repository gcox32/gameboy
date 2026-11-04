import { useMemo, useState } from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';
import RadarChart from './RadarChart';
import { PokemonDetails } from '@/types/pokemon';

const STAT_LABELS = ['HP', 'ATK', 'DEF', 'SPD', 'SPC'];

const MODES = {
    Stats: { max: 500, color: '#8bc34a' }, // Bar scale only: very high stats fill the bar, the number stays exact
    EVs: { max: 65535, color: '#ff6b6b' },
    IVs: { max: 15, color: '#4ecdc4' },
};
type Mode = keyof typeof MODES;

export default function StatsPanel({ structure }: { structure: PokemonDetails['structure'] }) {
    const [mode, setMode] = useState<Mode>('Stats');
    const { levelStats, EVs, IVs } = structure;
    const { max, color } = MODES[mode];

    // Memoized so the radar only redraws when the numbers change
    const values = useMemo(() => ({
        Stats: [levelStats.maxHP, levelStats.attack, levelStats.defense, levelStats.speed, levelStats.special],
        EVs: [EVs.hp, EVs.attack, EVs.defense, EVs.speed, EVs.special],
        IVs: [IVs.hp, IVs.attack, IVs.defense, IVs.speed, IVs.special],
    }[mode]), [mode, levelStats, EVs, IVs]);

    return (
        <div>
            <div className={styles.modes}>
                {(Object.keys(MODES) as Mode[]).map(modeName => (
                    <button
                        key={modeName}
                        type="button"
                        className={clsx(styles.mode, mode === modeName && styles.modeActive)}
                        onClick={() => setMode(modeName)}
                        aria-pressed={mode === modeName}
                    >
                        {modeName}
                    </button>
                ))}
            </div>
            <div className={styles.statsLayout}>
                <div className={styles.statRows}>
                    {STAT_LABELS.map((label, index) => (
                        <div key={label} className={styles.statRow}>
                            <span>{label}</span>
                            <span className={styles.statBar}>
                                <span
                                    className={styles.statFill}
                                    style={{ width: `${Math.min((values[index] / max) * 100, 100)}%`, background: color }}
                                />
                            </span>
                            <span className={styles.statValue}>{values[index]}</span>
                        </div>
                    ))}
                </div>
                <div className={styles.radar}>
                    <RadarChart labels={STAT_LABELS} values={values} max={max} color={color} />
                </div>
            </div>
        </div>
    );
}
