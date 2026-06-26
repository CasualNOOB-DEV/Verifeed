/**
 * ESBuild configuration for bundling the Chrome extension
 */

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// Ensure dist directories exist
const distDirs = ['dist', 'dist/content', 'dist/background', 'dist/popup', 'dist/components', 'dist/options'];
distDirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Copy static files
console.log('Copying static files...');

// Copy CSS
fs.copyFileSync(
  path.join(__dirname, 'src/content/styles.css'),
  path.join(__dirname, 'dist/content/styles.css')
);

fs.copyFileSync(
  path.join(__dirname, 'src/popup/popup.css'),
  path.join(__dirname, 'dist/popup/popup.css')
);

fs.copyFileSync(
  path.join(__dirname, 'src/options/options.css'),
  path.join(__dirname, 'dist/options/options.css')
);

// Copy HTML
fs.copyFileSync(
  path.join(__dirname, 'src/popup/popup.html'),
  path.join(__dirname, 'dist/popup/popup.html')
);

fs.copyFileSync(
  path.join(__dirname, 'src/options/options.html'),
  path.join(__dirname, 'dist/options/options.html')
);

console.log('Building JavaScript bundles...');

// Build content script
esbuild.build({
  entryPoints: ['src/content/content.ts'],
  bundle: true,
  outfile: 'dist/content/content.js',
  format: 'iife', // Immediately Invoked Function Expression
  platform: 'browser',
  target: 'chrome90',
  sourcemap: true,
}).then(() => {
  console.log('✓ Content script bundled');
}).catch(() => process.exit(1));

// Build background script
esbuild.build({
  entryPoints: ['src/background/background.ts'],
  bundle: true,
  outfile: 'dist/background/background.js',
  format: 'iife',
  platform: 'browser',
  target: 'chrome90',
  sourcemap: true,
}).then(() => {
  console.log('✓ Background script bundled');
}).catch(() => process.exit(1));

// Build popup script
esbuild.build({
  entryPoints: ['src/popup/popup.ts'],
  bundle: true,
  outfile: 'dist/popup/popup.js',
  format: 'iife',
  platform: 'browser',
  target: 'chrome90',
  sourcemap: true,
}).then(() => {
  console.log('✓ Popup script bundled');
}).catch(() => process.exit(1));

// Build options script
esbuild.build({
  entryPoints: ['src/options/options.ts'],
  bundle: true,
  outfile: 'dist/options/options.js',
  format: 'iife',
  platform: 'browser',
  target: 'chrome90',
  sourcemap: true,
}).then(() => {
  console.log('✓ Options script bundled');
  console.log('');
  console.log('Build complete! Extension ready to load in Chrome.');
}).catch(() => process.exit(1));
