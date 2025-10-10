import React from 'react';
import styles from './styles.module.css';
import TopLights from './TopLights';
import Image from 'next/image';
import CryRow from './CryRow';

interface SpriteFrameProps {
    useDefault: boolean;
    showUnknownSprite: boolean;
    spritePath: string;
    pokemonId: number | null;
    isOwned: boolean;
}

const SpriteFrame = React.memo(function SpriteFrame({
    useDefault,
    showUnknownSprite,
    spritePath,
    pokemonId,
    isOwned
}: SpriteFrameProps) {

    // Unknown Pokemon sprite component
    function UnknownPokemonSprite() {
        return (
            <div className={styles.unknownSprite}>
                <div className={styles.unknownIcon}>
                    <div className={styles.questionMark}>?</div>
                </div>
            </div>
        );
    }

    // Default/blank Pokemon sprite component
    function DefaultPokemonSprite() {
        return (
            <div className={styles.defaultSprite}>
                {/* Empty div to maintain shape */}
            </div>
        );
    }

    function SpriteImage() {
        if (useDefault) {
            return <DefaultPokemonSprite />;
        }
        if (showUnknownSprite) {
            return <UnknownPokemonSprite />;
        }
        return (
            <div className={styles.spriteImage}>
                <Image
                    src={spritePath}
                    alt="pokemon"
                    width={220}
                    height={214}
                    onError={(e) => {
                        e.currentTarget.src = '/images/pokemon/missingNo.png';
                    }} />
            </div>
        )
    }

    return (
        <div className={styles.pokemonSprite}>
            <div className={styles.spriteFrame}>
                <TopLights activePokemon={!useDefault} />
                <SpriteImage />
                <CryRow pokemonId={pokemonId} owned={isOwned} />
            </div>
        </div>
    );
});

export default SpriteFrame;