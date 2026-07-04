import fs from 'node:fs';

const requiredPaths = [
  'src/app',
  'src/modules',
  'src/shared',
  'src/config',
  'docs'
];

const missing = requiredPaths.filter((path) => !fs.existsSync(path));

if (missing.length) {
  console.error('Missing required paths:', missing.join(', '));
  process.exit(1);
}

console.log('PRO-CHISTKA Hub structure is OK');
