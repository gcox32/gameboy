'use client';

import { useState } from 'react';
import { SlotPokemon } from '@/utils/pokemon/gen1Save';
import { StoredIVs } from '@/utils/pokemon/stats';
import { GameModel } from '@/types';
import IvEditor from './IvEditor';
import { LabSavePickers, LabSaveSidebar, SlotGrid, slotKey } from './LabSave';
import { useLabSave } from './useLabSave';
import styles from './styles.module.css';

export default function EditTab({ games }: { games: GameModel[] }) {
    const lab = useLabSave();
    const { contents, loadedFilePath, refresh, setToast } = lab;
    const [editingKey, setEditingKey] = useState('');
    const [saving, setSaving] = useState(false);

    // Looked up each time, so it follows the file and goes away if the slot is gone
    const all = contents ? [...contents.party, ...contents.boxes.flat()] : [];
    const editing = all.find(s => slotKey(s) === editingKey) ?? null;

    const handleSave = async (pokemon: SlotPokemon, ivs: StoredIVs) => {
        setSaving(true);
        try {
            const { location, boxNumber, slotIndex } = pokemon;
            const res = await fetch(`/api/save-states/${lab.selectedSave?.id}/pokemon/ivs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slot: { location, boxNumber, slotIndex },
                    ivs,
                    expectedFilePath: loadedFilePath,
                }),
            });
            if (res.ok) {
                setToast(`${pokemon.nickname}'s IVs saved.`);
            } else {
                const err = await res.json().catch(() => ({}));
                setToast(err.error ?? 'Something went wrong.');
                // The Pokémon may be in another slot now, so choose again from what's there.
                if (res.status === 409) setEditingKey('');
            }
            await refresh();
        } catch {
            setToast('Something went wrong. Check your connection and try again.');
        } finally {
            setSaving(false);
            setTimeout(() => setToast(''), 4000);
        }
    };

    const selectSlot = (s: SlotPokemon) => setEditingKey(slotKey(s));
    const selectedKeys = new Set(editing ? [slotKey(editing)] : []);

    return (
        <div className={styles.twoCol}>
            <LabSaveSidebar lab={lab} />

            <div className={styles.content}>
                {lab.toast && <p style={{ color: '#c8a0f0', marginBottom: '1rem' }}>{lab.toast}</p>}
                {lab.loadingSave && !contents && <p style={{ color: 'rgba(232,224,244,0.5)' }}>Loading save file...</p>}

                {lab.showContents && (
                    <>
                        {editing ? (
                            <IvEditor
                                key={`${editingKey}-${loadedFilePath}`}
                                pokemon={editing}
                                saving={saving || lab.loadingSave}
                                onSave={ivs => handleSave(editing, ivs)}
                            />
                        ) : (
                            <p className={styles.infoNote}>Choose a Pokémon to edit it inside this save.</p>
                        )}
                        <SlotGrid label="Party" slots={contents?.party ?? []} selectedKeys={selectedKeys} onSelect={selectSlot} />
                        <SlotGrid
                            label={`Box ${lab.selectedBox + 1}`}
                            slots={contents?.boxes[lab.selectedBox] ?? []}
                            selectedKeys={selectedKeys}
                            onSelect={selectSlot}
                        />
                    </>
                )}
            </div>

            <LabSavePickers lab={lab} games={games} />
        </div>
    );
}
