import BlackButtons from './BlackButtons';
import WhiteButtons from './WhiteButtons';
import ToggleButton from './ToggleButton';
import styles from './styles.module.css';

interface ControlsProps {
    onClick: () => void;
}

export default function Controls({ onClick }: ControlsProps) {
    return (
        <div className={styles.controls}>
            <WhiteButtons />
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', height: '100px' }}>
                <BlackButtons />
                <ToggleButton onClick={onClick} />
            </div>
        </div>
    );
}