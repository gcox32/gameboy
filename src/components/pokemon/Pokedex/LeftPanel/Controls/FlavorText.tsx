import styles from './styles.module.css';

interface FlavorTextProps {
    flavorText: string;
    showFullDetails: boolean;
}

export default function FlavorText({ flavorText, showFullDetails }: FlavorTextProps) {
    return (
        <div className={styles.pokemonDescription}>
            {showFullDetails && (
                <>{flavorText}</>
            )}
        </div>
    );
}