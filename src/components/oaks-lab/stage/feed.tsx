'use client';

import { ReactNode, createContext, useContext, useLayoutEffect, useState, useSyncExternalStore } from 'react';
import { Monitor, MonitorScreen, MonitorSource } from './Monitor';
import { Platform } from './Platform';
import type { LabEntry } from './types';

/*
 * The platform and the monitor belong to the room, so OaksLab renders them once and they
 * never remount. Each mode only feeds them: what its screens show, and who's on the pad.
 *
 * A mode's screens hold new handlers on every render, so it can't hand them up through
 * OaksLab's state without looping. It writes them to this store instead, after each render,
 * and only the fixtures subscribe.
 */

export interface StageFeed {
    /** What the monitor shows on each input in this mode. An input left out shows static. */
    screens: Partial<Record<MonitorSource, MonitorScreen>>;
    /** The Pokémon on the platform */
    platform: LabEntry | null;
}

const EMPTY: StageFeed = { screens: {}, platform: null };

function createFeedStore() {
    let feed = EMPTY;
    const listeners = new Set<() => void>();
    return {
        get: () => feed,
        set(next: StageFeed) {
            feed = next;
            listeners.forEach(l => l());
        },
        subscribe(listener: () => void) {
            listeners.add(listener);
            return () => { listeners.delete(listener); };
        },
    };
}

type FeedStore = ReturnType<typeof createFeedStore>;

const FeedContext = createContext<FeedStore | null>(null);

/** The store for one Lab, which OaksLab makes and provides */
export function useFeedStore(): FeedStore {
    const [store] = useState(createFeedStore);
    return store;
}

export function StageFeedProvider({ store, children }: { store: FeedStore; children: ReactNode }) {
    return <FeedContext.Provider value={store}>{children}</FeedContext.Provider>;
}

/** For a mode: puts what it has to show on the fixtures, and takes it off when the mode goes */
export function useFeedStage(feed: StageFeed) {
    const store = useContext(FeedContext);
    if (!store) throw new Error('useFeedStage must be used inside StageFeedProvider');
    useLayoutEffect(() => { store.set(feed); });
    useLayoutEffect(() => () => store.set(EMPTY), [store]);
}

function useFeed(store: FeedStore) {
    return useSyncExternalStore(store.subscribe, store.get, store.get);
}

/** Nothing on this input in this mode, so there's only snow */
const NO_SIGNAL: MonitorScreen = {
    title: 'Oak’s Lab',
    entries: [],
    cursorKey: '',
    onPick: () => {},
    onCursor: () => {},
    loading: true,
};

export function FedPlatform({ store }: { store: FeedStore }) {
    return <Platform entry={useFeed(store).platform} />;
}

interface FedMonitorProps {
    store: FeedStore;
    /** Where the switch is */
    source: MonitorSource;
    /** What the screen shows, which follows the switch once its thumb gets there */
    shownSource: MonitorSource;
    onSourceChange: (source: MonitorSource) => void;
}

export function FedMonitor({ store, source, shownSource, onSourceChange }: FedMonitorProps) {
    const screen = useFeed(store).screens[shownSource] ?? NO_SIGNAL;
    return (
        <Monitor
            {...screen}
            // Snow while the switch moves over, too
            loading={screen.loading || source !== shownSource}
            source={source}
            onSourceChange={onSourceChange}
        />
    );
}
