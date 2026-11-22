import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isPrivateBlobUrl, ownsBlobPath, ownsBlobUrl } from './blob';

const USER = { id: '64b7f0c2a1b2c3d4e5f60718', email: 'ash@pallet.town' };
const SLUG = 'ash_at_pallet-town';
const PUBLIC = 'https://abc123.public.blob.vercel-storage.com';
const PRIVATE = 'https://abc123.private.blob.vercel-storage.com';

describe('ownsBlobPath', () => {
    it('accepts files in the user\'s own folders, by email or id', () => {
        assert.ok(ownsBlobPath(`games/${SLUG}/red-64b7f0c2/red.gb`, USER));
        assert.ok(ownsBlobPath(`saves/${SLUG}/red/main-64b7f0c2/save.sav`, USER));
        assert.ok(ownsBlobPath(`avatars/${USER.id}/1700000000000.png`, USER));
        assert.ok(ownsBlobPath(`/saves/${USER.id}/red/save.sav`, USER));
    });

    it('rejects other users\' files', () => {
        assert.equal(ownsBlobPath('games/misty_at_cerulean-gym/red/red.gb', USER), false);
        assert.equal(ownsBlobPath('avatars/000000000000000000000000/1.png', USER), false);
    });

    it('rejects app assets and anything outside the user folders', () => {
        assert.equal(ownsBlobPath(`assets/${SLUG}/x.png`, USER), false);
        assert.equal(ownsBlobPath(`${SLUG}/x.png`, USER), false);
    });

    it('does not count a file name that merely matches the user', () => {
        assert.equal(ownsBlobPath(`games/misty_at_cerulean-gym/${SLUG}`, USER), false);
    });
});

describe('ownsBlobUrl', () => {
    it('accepts the user\'s files in either store', () => {
        assert.ok(ownsBlobUrl(`${PUBLIC}/saves/${SLUG}/red/save-abc.sav`, USER));
        assert.ok(ownsBlobUrl(`${PRIVATE}/games/${SLUG}/red-1/red.gb`, USER));
    });

    it('ignores the query string, so appending your own email to someone else\'s file fails', () => {
        assert.equal(ownsBlobUrl(`${PUBLIC}/saves/misty_at_cerulean-gym/red/save.sav?${SLUG}`, USER), false);
        assert.equal(ownsBlobUrl(`${PUBLIC}/saves/misty_at_cerulean-gym/red/save.sav?x=${USER.id}`, USER), false);
        assert.equal(ownsBlobUrl(`${PUBLIC}/saves/misty_at_cerulean-gym/red/save.sav#${SLUG}`, USER), false);
    });

    it('rejects hosts that aren\'t our blob stores', () => {
        assert.equal(ownsBlobUrl(`https://evil.example/saves/${SLUG}/red/save.sav`, USER), false);
        assert.equal(ownsBlobUrl(`http://abc123.public.blob.vercel-storage.com/saves/${SLUG}/x/save.sav`, USER), false);
        assert.equal(ownsBlobUrl('not a url', USER), false);
    });
});

describe('isPrivateBlobUrl', () => {
    it('tells the stores apart', () => {
        assert.ok(isPrivateBlobUrl(`${PRIVATE}/saves/x/save.sav`));
        assert.equal(isPrivateBlobUrl(`${PUBLIC}/saves/x/save.sav`), false);
        assert.equal(isPrivateBlobUrl('/api/blob/file?url=x'), false);
    });
});
