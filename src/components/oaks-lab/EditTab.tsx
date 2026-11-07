'use client';

import { useState } from 'react';
import { SlotPokemon } from '@/utils/pokemon/gen1Save';
import { StoredIVs } from '@/utils/pokemon/stats';
import IvEditor from './IvEditor';
import { LabStage, Platform } from './LabStage';
import { SaveMonitor, slotEntry, slotKey } from './LabSave';
import type { LabSave } from './useLabSave';

export default function EditTab({ lab }: { lab: LabSave }) {
    const { contents, loadedFilePath, refresh, notify } = lab;
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
                notify(`${pokemon.nickname}'s IVs saved.`, 'success');
            } else {
                const err = await res.json().catch(() => ({}));
                notify(err.error ?? 'Something went wrong.', 'error');
                // The Pokémon may be in another slot now, so choose again from what's there.
                if (res.status === 409) setEditingKey('');
            }
            await refresh();
        } catch {
            notify('Something went wrong. Check your connection and try again.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const select = (s: SlotPokemon) => setEditingKey(slotKey(s));

    return (
        <LabStage
            panel={
                <IvEditor
                    key={`${editingKey}-${loadedFilePath}`}
                    pokemon={editing}
                    saving={saving || lab.loadingSave}
                    onSave={ivs => editing && handleSave(editing, ivs)}
                />
            }
            platform={<Platform entries={editing ? [slotEntry(editing)] : []} emptyText="No Pokémon on the platform" />}
            monitor={
                <SaveMonitor
                    lab={lab}
                    cursorKey={editingKey}
                    onPick={select}
                    onCursor={select}
                />
            }
        />
    );
}
