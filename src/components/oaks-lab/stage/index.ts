/** The Lab's fixtures: the platform, the monitor, the decks and their controls, and how modes feed them */
export { Platform, entryModel } from './Platform';
export { ModelMonitor } from './ModelMonitor';
export { FedModelMonitor, FedMonitor, FedPlatform, StageFeedProvider, useFeed, useFeedStage, useFeedStore } from './feed';
export type { FeedStore, StageFeed } from './feed';
export { Monitor } from './Monitor';
export type { MonitorScreen, MonitorSource } from './Monitor';
export { SlideSwitch } from './SlideSwitch';
export { LabDeck, DeckAck, DeckBusy, DeckKey, DeckPill, DeckResult } from './Deck';
export { press } from './press';
export { UI_MS } from './timing';
export type { LabEntry, LabResult } from './types';
