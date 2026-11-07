'use client';

import { useEffect, useState } from 'react';
import { getRawBytes } from '@/components/ranch/types';
import type { RanchPokemon } from '@/components/ranch/types';
import { SlotPokemon } from '@/utils/pokemon/gen1Save';
import { StoredIVs, decodeIVs } from '@/utils/pokemon/stats';
import IvEditor, { EditablePokemon } from './IvEditor';
import { LabResult, MonitorSource, useFeedStage } from '../stage';
import { slotEntry, slotKey, useSaveScreen } from '../save/LabSave';
import { ranchEntry, ranchKey, ranchScreen } from '../ranch/ranchScreen';
import { useLabRanch } from '../ranch/useLabRanch';
import type { LabSave } from '../save/useLabSave';

const editableFromRanch = (p: RanchPokemon): EditablePokemon => ({
    speciesIndex: p.speciesIndex,
    nickname: p.nickname,
    level: p.level,
    ivs: decodeIVs(getRawBytes(p.rawBoxData)),
});

interface EditTabProps {
    lab: LabSave;
    /** A Ranch Pokémon to start on, as when sent here from the Ranch */
    ranchId?: string;
    /** Where the monitor's switch is */
    source: MonitorSource;
    /** What the monitor shows, which follows the switch */
    shownSource: MonitorSource;
}

/** Enhance a Pokémon: edit one in a save or at the Ranch, where it stays */
export default function EditTab({ lab, ranchId, source, shownSource }: EditTabProps) {
    const { contents, loadedFilePath, refresh } = lab;
    // Starts loading as soon as the switch heads its way
    const ranch = useLabRanch(source === 'ranch');
    const [editingKey, setEditingKey] = useState(ranchId ? ranchKey(ranchId) : '');
    const [saving, setSaving] = useState(false);
    // How the last save went, until it's acknowledged
    const [result, setResult] = useState<LabResult | null>(null);

    // Sent here with a Ranch Pokémon: once the Ranch is in, turn to its pen
    const [penToShow, setPenToShow] = useState(ranchId);
    const { pokemon: ranchPokemon, showPenOf } = ranch;
    useEffect(() => {
        if (!penToShow || ranchPokemon.length === 0) return;
        showPenOf(penToShow);
        setPenToShow(undefined);
    }, [penToShow, ranchPokemon, showPenOf]);

    // Looked up each time, so it follows the data and goes away if the Pokémon is gone
    const slots = shownSource === 'save' && contents ? [...contents.party, ...contents.boxes.flat()] : [];
    const editingSlot = slots.find(s => slotKey(s) === editingKey) ?? null;
    const editingMon = shownSource === 'ranch'
        ? ranchPokemon.find(p => ranchKey(p.id) === editingKey) ?? null
        : null;
    const editing: EditablePokemon | null = editingSlot ?? (editingMon && editableFromRanch(editingMon));

    const select = (key: string) => {
        setEditingKey(key);
        setResult(null);
    };

    // A new source means choosing again from what it shows
    useEffect(() => {
        setEditingKey(k => (k.startsWith('ranch-') === (shownSource === 'ranch') ? k : ''));
        setResult(null);
    }, [shownSource]);

    /**
     * Runs a save and reports how it went. `onOk` takes in what the server sent back, and
     * `always` runs however it went (told whether it worked), before the deck is free again.
     */
    const run = async (
        name: string,
        request: () => Promise<Response>,
        { onOk, always }: { onOk?: (res: Response) => Promise<void>; always?: (ok: boolean) => Promise<void> },
    ) => {
        setSaving(true);
        setResult(null);
        try {
            const res = await request();
            if (res.ok) {
                await onOk?.(res);
                setResult({ tone: 'success', text: `${name}'s IVs saved.` });
            } else {
                const err = await res.json().catch(() => ({}));
                setResult({ tone: 'error', text: err.error ?? 'Something went wrong.' });
                // The Pokémon may be somewhere else now, so choose again from what's there.
                if (res.status === 409) setEditingKey('');
            }
            await always?.(res.ok);
        } catch {
            setResult({ tone: 'error', text: 'Something went wrong. Check your connection and try again.' });
        } finally {
            setSaving(false);
        }
    };

    const saveToSlot = (pokemon: SlotPokemon, ivs: StoredIVs) => {
        const { location, boxNumber, slotIndex } = pokemon;
        return run(
            pokemon.nickname,
            () => fetch(`/api/save-states/${lab.selectedSave?.id}/pokemon/ivs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slot: { location, boxNumber, slotIndex },
                    ivs,
                    expectedFilePath: loadedFilePath,
                }),
            }),
            // The file changed either way, or someone else changed it
            { always: async () => { await refresh(); } },
        );
    };

    const saveAtRanch = (pokemon: RanchPokemon, ivs: StoredIVs) => run(
        pokemon.nickname,
        () => fetch(`/api/pokemon/stored/${pokemon.id}/ivs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ivs }),
        }),
        {
            onOk: async res => { ranch.replace(await res.json()); },
            // A conflict means the Ranch changed underneath, so see it as it is now
            always: async ok => { if (!ok) await ranch.refresh(); },
        },
    );

    const handleSave = (ivs: StoredIVs) => {
        if (editingSlot) saveToSlot(editingSlot, ivs);
        else if (editingMon) saveAtRanch(editingMon, ivs);
    };

    // Both sources on the monitor, and whoever's being edited on the pad
    const saveScreen = useSaveScreen(lab, {
        cursorKey: editingKey,
        onPick: sl => select(slotKey(sl)),
        onCursor: sl => select(slotKey(sl)),
    });
    useFeedStage({
        screens: {
            save: saveScreen.screen,
            ranch: ranchScreen(ranch, {
                cursorKey: editingKey,
                onPick: p => select(ranchKey(p.id)),
                onCursor: p => select(ranchKey(p.id)),
            }),
        },
        platform: editingSlot ? slotEntry(editingSlot) : editingMon ? ranchEntry(editingMon) : null,
    });

    // The deck starts again from the saved IVs whenever they change
    const savedIvs = editing ? `${editing.ivs.attack}${editing.ivs.defense}${editing.ivs.speed}${editing.ivs.special}` : '';
    const editorKey = shownSource === 'save' ? `${editingKey}-${loadedFilePath}` : `${editingKey}-${savedIvs}`;

    return (
        <>
            <IvEditor
                key={editorKey}
                pokemon={editing}
                emptyText={shownSource === 'ranch'
                    ? 'Choose a Pokémon on the monitor to edit it at the Ranch.'
                    : undefined}
                saving={saving || (shownSource === 'save' && lab.loadingSave)}
                busy={saving ? 'Saving...' : undefined}
                onSave={handleSave}
                result={result}
                onDismissResult={() => setResult(null)}
            />
            {saveScreen.connectModal}
        </>
    );
}
