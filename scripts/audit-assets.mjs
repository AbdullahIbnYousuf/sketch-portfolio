import { access, readdir, stat } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
    CORE_TEXTURES,
    IMAGE_ASSETS,
    ROOM_TEXTURES,
} from '../src/config/texturePreloadList.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = path.join(projectRoot, 'public');
const distRoot = path.join(projectRoot, 'dist');
const MEBIBYTE = 1024 * 1024;
const PUBLIC_LIMIT = 30 * MEBIBYTE;
const DIST_LIMIT = 32 * MEBIBYTE;

const forbiddenAssetPath = /(^|\/)(backups?|tmp)(\/|$)|(?:^|[_-])(?:original|backup|tmp)(?:[_.-]|$)|\.tmp$/i;

async function pathExists(target) {
    try {
        await access(target, constants.F_OK);
        return true;
    } catch {
        return false;
    }
}

async function walkFiles(directory) {
    if (!(await pathExists(directory))) return [];

    const entries = await readdir(directory, { withFileTypes: true });
    const nested = await Promise.all(entries.map(async entry => {
        const absolutePath = path.join(directory, entry.name);
        return entry.isDirectory() ? walkFiles(absolutePath) : [absolutePath];
    }));

    return nested.flat();
}

async function directorySize(directory) {
    const files = await walkFiles(directory);
    const sizes = await Promise.all(files.map(file => stat(file).then(details => details.size)));
    return sizes.reduce((total, size) => total + size, 0);
}

const formatSize = bytes => `${(bytes / MEBIBYTE).toFixed(2)} MiB`;

const manifestAssets = [...new Set([
    ...CORE_TEXTURES,
    ...IMAGE_ASSETS,
    ...Object.values(ROOM_TEXTURES).flat(),
])];

const publicFiles = await walkFiles(publicRoot);
const forbiddenFiles = publicFiles
    .map(file => path.relative(publicRoot, file).split(path.sep).join('/'))
    .filter(file => forbiddenAssetPath.test(file));

const missingManifestAssets = [];
for (const assetUrl of manifestAssets) {
    const assetPath = path.join(publicRoot, assetUrl.replace(/^\//, ''));
    if (!(await pathExists(assetPath))) missingManifestAssets.push(assetUrl);
}

const publicSize = await directorySize(publicRoot);
const distExists = await pathExists(distRoot);
const distSize = distExists ? await directorySize(distRoot) : 0;
const failures = [];

if (forbiddenFiles.length) {
    failures.push(`Forbidden backup/temporary assets:\n  ${forbiddenFiles.join('\n  ')}`);
}
if (missingManifestAssets.length) {
    failures.push(`Missing manifest assets:\n  ${missingManifestAssets.join('\n  ')}`);
}
if (publicSize >= PUBLIC_LIMIT) {
    failures.push(`public is ${formatSize(publicSize)}; limit is below ${formatSize(PUBLIC_LIMIT)}.`);
}
if (distExists && distSize >= DIST_LIMIT) {
    failures.push(`dist is ${formatSize(distSize)}; limit is below ${formatSize(DIST_LIMIT)}.`);
}

console.log(`Asset audit: public ${formatSize(publicSize)}${distExists ? `, dist ${formatSize(distSize)}` : ', dist not generated'}.`);
console.log(`Verified ${manifestAssets.length} unique manifest assets.`);

if (failures.length) {
    console.error(`\n${failures.join('\n\n')}`);
    process.exitCode = 1;
} else {
    console.log('Asset audit passed.');
}
