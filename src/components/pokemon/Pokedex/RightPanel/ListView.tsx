import styles from './styles.module.css';
import { dexDict } from '@/utils/pokemon/dicts';

const PADDING_LENGTH = 35;

interface ListViewProps {   
    pokemonIds: number[];
    isPokemonOwned: (index: number) => boolean;
    isPokemonSeen: (index: number) => boolean;
    onSelect: (pokemonId: number) => void;
}

export default function ListView({ pokemonIds, isPokemonOwned, isPokemonSeen, onSelect }: ListViewProps) {

    // Helper function to find Pokemon name by pokedexNo
    function getPokemonNameByPokedexNo(pokedexNo: number, owned: boolean): string | null {
        const pokedexNoStr = pokedexNo.toString().padStart(3, '0');
        for (const [index, data] of Object.entries(dexDict)) {
            if (data.pokedexNo === pokedexNoStr) {
                const name = data.name.toUpperCase();
                if (owned) {
                    return `${name} •`.padStart(PADDING_LENGTH, '.');
                } else {
                    return name.padStart(PADDING_LENGTH, '.');
                }
            }
        }
        return null;
}

    return (
        <div className={styles.pokemonListScreen}>
            <div className={styles.pokemonList}>
                {pokemonIds.map((pokemonId) => {
                    const owned = isPokemonOwned(pokemonId - 1);
                    const seen = isPokemonSeen(pokemonId - 1);

                    // Get Pokemon name from dexDict if seen or owned
                    const pokemonName = (seen || owned) ? getPokemonNameByPokedexNo(pokemonId, owned) : null;

                    return (
                        <div
                            key={pokemonId}
                            className={`${styles.pokemonListItem}`}
                            onClick={() => onSelect(pokemonId)}
                        >
                            <div className={styles.pokemonListInfo}>
                                <div className={styles.pokemonListNumber}>
                                    {`#${pokemonId.toString().padStart(3, '0')}`} {pokemonName ? ` ${pokemonName}` : '.'.repeat(PADDING_LENGTH)}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}