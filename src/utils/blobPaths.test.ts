import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isUserSaveUrl, saveBlobPath } from './blobPaths';

const USER = { id: '64f0c2aa11', email: 'ash@pallet.town' };
const HOST = 'https://abc123.public.blob.vercel-storage.com';

describe('isUserSaveUrl', () => {
    it('accepts the path the app itself uploads to', () => {
        const path = saveBlobPath(USER.email, 'Pokémon Red', 'Main run', 'a3f8b21c9d');
        assert.ok(isUserSaveUrl(`${HOST}/${path.replace('save.sav', 'save-eWNkrcQi.sav')}`, USER));
    });

    it('accepts older paths holding the user id', () => {
        assert.ok(isUserSaveUrl(`${HOST}/saves/${USER.id}/red/save.sav`, USER));
    });

    it("rejects another user's save", () => {
        assert.equal(isUserSaveUrl(`${HOST}/saves/misty_at_cerulean-gym/red/save.sav`, USER), false);
    });

    it('rejects anything outside our blob store', () => {
        const email = 'ash_at_pallet-town';
        for (const url of [
            `https://evil.test/saves/${email}/save.sav`,
            `https://abc123.public.blob.vercel-storage.com.evil.test/saves/${email}/save.sav`,
            `http://abc123.public.blob.vercel-storage.com/saves/${email}/save.sav`,
            `http://169.254.169.254/latest/${USER.id}`,
            'not a url',
            '',
            { $ne: '' },
        ]) {
            assert.equal(isUserSaveUrl(url, USER), false, String(url));
        }
    });
});
