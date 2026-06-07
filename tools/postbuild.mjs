/* Copies static assets from src/ into dist/ after Babel compiles js/. */
import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const jobs = [
  ['src/index.html',  'dist/index.html'],
  ['src/index.html',  'dist/200.html'],   // Surge SPA fallback — any path serves the app
  ['src/styles.css',  'dist/styles.css'],
  ['src/hitech.png',  'dist/uploads/hitech.png'],
];

for (const [from, to] of jobs) {
  await mkdir(dirname(resolve(root, to)), { recursive: true });
  await copyFile(resolve(root, from), resolve(root, to));
  console.log(`  copied  ${from}  →  ${to}`);
}
console.log('postbuild: static assets in place.');
