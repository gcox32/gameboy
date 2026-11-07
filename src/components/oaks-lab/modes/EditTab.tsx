'use client';

import { useState } from 'react';
import { SlotPokemon } from '@/utils/pokemon/gen1Save';
import { StoredIVs } from '@/utils/pokemon/stats';
import IvEditor from './IvEditor';
import { LabResult, LabStage, Platform } from '../stage';
import { SaveMonitor, slotEntry, slotKey } from '../save/LabSave';
import type { LabSave } from '../save/useLabSave';

export default function EditTab({ lab }: { lab: LabSave }) {
    const { contents, loadedFilePath, refresh } = lab;
    const [editingKey, setEditingKey] = useState('');
    const [saving, setSaving] = useState(false);
    // How the last save went, until it's acknowledged
    const [result, setResult] = useState<LabResult | null>(null);

    // Looked up each time, so it follows the file and goes away if the slot is gone
    const all = contents ? [...contents.party, ...contents.boxes.flat()] : [];
    const editing = all.find(s => slotKey(s) === editingKey) ?? null;

    const handleSave = async (pokemon: SlotPokemon, ivs: StoredIVs) => {
        setSaving(true);
        setResult(null);
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
                setResult({ tone: 'success', text: `${pokemon.nickname}'s IVs saved.` });
            } else {
                const err = await res.json().catch(() => ({}));
                setResult({ tone: 'error', text: err.error ?? 'Something went wrong.' });
                // The Pokémon may be in another slot now, so choose again from what's there.
                if (res.status === 409) setEditingKey('');
            }
            await refresh();
        } catch {
            setResult({ tone: 'error', text: 'Something went wrong. Check your connection and try again.' });
        } finally {
            setSaving(false);
        }
    };

    const select = (s: SlotPokemon) => {
        setEditingKey(slotKey(s));
        setResult(null);
    };

    return (
        <LabStage
            panel={
                <IvEditor
                    key={`${editingKey}-${loadedFilePath}`}
                    pokemon={editing}
                    saving={saving || lab.loadingSave}
                    busy={saving ? 'Saving...' : undefined}
                    onSave={ivs => editing && handleSave(editing, ivs)}
                    result={result}
                    onDismissResult={() => setResult(null)}
                />
            }
            platform={<Platform entry={editing ? slotEntry(editing) : null} />}
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
