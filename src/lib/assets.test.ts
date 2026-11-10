import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    ASSETS_BASE_URL, artUrl, badgeUrl, cryUrl, figureUrl, migrateLegacyAssetUrl, padDex, spriteUrl, townMapUrl,
} from './assets';

const at = (path: string) => `${ASSETS_BASE_URL}${path}`;

test('padDex pads to three digits whatever form the number comes in', () => {
    assert.equal(padDex(25), '025');
    assert.equal(padDex('25'), '025');
    assert.equal(padDex('025'), '025');
    assert.equal(padDex(251), '251');
});

test('species assets are keyed by padded Dex number', () => {
    assert.equal(spriteUrl('025', '3ds'), at('pokemon/sprites/3ds/025.gif'));
    assert.equal(spriteUrl(152, 'stadium', { shiny: true }), at('pokemon/sprites/stadium/shiny/152.gif'));
    assert.equal(artUrl('091', 'sugimori-rb'), at('pokemon/art/sugimori-rb/091.png'));
    assert.equal(cryUrl(7), at('pokemon/cries/007.wav'));
});

test('region and map assets', () => {
    assert.equal(badgeUrl('kanto', 'boulder.png'), at('regions/kanto/badges/boulder.png'));
    assert.equal(figureUrl('johto', 'falkner'), at('regions/johto/figures/falkner.png'));
    assert.equal(townMapUrl(2), at('maps/town-map-gen2.png'));
});

test('migrateLegacyAssetUrl moves stored S3 URLs to Blob', () => {
    const s3 = 'https://assets.letmedemo.com/public/gameboy/images/';
    assert.equal(migrateLegacyAssetUrl(`${s3}fullscreen/default.jpeg`), at('app/backgrounds/default.jpeg'));
    assert.equal(migrateLegacyAssetUrl(`${s3}cover-art/cover-art-red.jpg`), at('app/cover-art/red.jpg'));
    assert.equal(migrateLegacyAssetUrl(`${s3}users/default-avatar.png`), at('app/avatars/default.png'));
});

test('migrateLegacyAssetUrl leaves other URLs alone', () => {
    const uploaded = 'https://9jns7teaeekjmmlp.public.blob.vercel-storage.com/games/x/cover-abc.png';
    assert.equal(migrateLegacyAssetUrl(uploaded), uploaded);
    assert.equal(migrateLegacyAssetUrl(at('app/cover-art/red.jpg')), at('app/cover-art/red.jpg'));
    assert.equal(migrateLegacyAssetUrl(''), '');
});
