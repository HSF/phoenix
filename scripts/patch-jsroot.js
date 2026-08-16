/**
 * Patches applied to the installed jsroot after every install.
 *
 * 1. three.mjs — re-export from the project's single three.js instance, to avoid
 *    the "Multiple instances of Three.js being imported" warning.
 *    See: https://github.com/HSF/phoenix/issues/655
 * 2. base/lzma.mjs — decode complete xz streams instead of a single LZMA2 chunk,
 *    so ROOT files compressed with LZMA (every ATLAS ESD/AOD) can be read.
 *    See: https://github.com/HSF/phoenix/issues/926 — remove once the fix is
 *    released upstream in jsroot.
 */
const fs = require('fs');
const path = require('path');

const jsrootModules = path.resolve(__dirname, '../node_modules/jsroot/modules');

// --- 1. three.mjs ---------------------------------------------------------

const jsrootThree = path.join(jsrootModules, 'three.mjs');

if (fs.existsSync(jsrootThree)) {
  // Also re-export Timer explicitly: it lives in three/examples, not the main bundle,
  // but jsroot imports it from ./three.mjs via `export *`.
  fs.writeFileSync(
    jsrootThree,
    "export * from 'three';\nexport { Timer } from 'three/examples/jsm/misc/Timer.js';\n",
  );
  console.log(
    'Patched jsroot/modules/three.mjs to re-export from project three.js',
  );
} else {
  console.log('jsroot/modules/three.mjs not found, skipping patch');
}

// --- 2. base/lzma.mjs -----------------------------------------------------

const jsrootLzma = path.join(jsrootModules, 'base/lzma.mjs');
const patchedLzma = path.join(__dirname, 'jsroot-patch/lzma.mjs');
/** Marker carried by our patched file, so an older copy can be upgraded. */
const PATCH_MARKER = 'phoenix-jsroot-lzma2-patch';

if (!fs.existsSync(patchedLzma)) {
  // Never fail the install over a missing patch payload — a broken jsroot is
  // recoverable, a broken `yarn install` is not.
  console.warn(
    `WARNING: ${path.relative(process.cwd(), patchedLzma)} is missing, so jsroot ` +
      'was left unpatched. ROOT files compressed with LZMA (ATLAS ESD/AOD) will ' +
      'fail to load until it is restored.',
  );
} else if (!fs.existsSync(jsrootLzma)) {
  console.log('jsroot/modules/base/lzma.mjs not found, skipping patch');
} else {
  const installed = fs.readFileSync(jsrootLzma, 'utf8');
  const patched = fs.readFileSync(patchedLzma, 'utf8');

  if (installed === patched) {
    console.log('jsroot/modules/base/lzma.mjs already patched');
  } else if (
    // The pristine upstream file — `decompress` is built on the single-stream
    // decompressor we replace.
    installed.includes('$LZMAByteArrayDecompressor') ||
    // Or an older copy of this patch, which must be upgraded in place.
    installed.includes(PATCH_MARKER)
  ) {
    fs.copyFileSync(patchedLzma, jsrootLzma);
    console.log(
      'Patched jsroot/modules/base/lzma.mjs for multi-chunk LZMA2 support',
    );
  } else {
    // Neither ours nor the version we forked from — most likely jsroot has been
    // upgraded and carries its own fix. Leave it alone and say so loudly.
    console.warn(
      'WARNING: jsroot/modules/base/lzma.mjs is not the version this patch was ' +
        'written against. Leaving it untouched — check whether ' +
        'scripts/jsroot-patch/lzma.mjs is still needed.',
    );
  }
}
