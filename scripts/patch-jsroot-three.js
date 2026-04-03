/**
 * Patch jsroot's inlined three.js to re-export from the project's single three.js instance.
 * This prevents the "Multiple instances of Three.js being imported" warning.
 * See: https://github.com/HSF/phoenix/issues/655
 */
const fs = require('fs');
const path = require('path');

const jsrootThree = path.resolve(
  __dirname,
  '../node_modules/jsroot/modules/three.mjs',
);

if (fs.existsSync(jsrootThree)) {
  fs.writeFileSync(jsrootThree, "export * from 'three';\n");
  console.log(
    'Patched jsroot/modules/three.mjs to re-export from project three.js',
  );
} else {
  console.log('jsroot/modules/three.mjs not found, skipping patch');
}
