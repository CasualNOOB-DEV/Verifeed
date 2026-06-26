/**
 * Create simple PNG icon placeholders
 * Uses base64 encoded minimal PNG data
 */

const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Minimal 16x16 yellow square PNG (base64)
const png16 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAARUlEQVR42mP4TwAc' +
  'OHDgPzJmIBYwkKKZZAPINQBZM1EGkGMAsmaiDCDHAGTNRBlAjgHImokygBwDkDUT' +
  'ZQA5BiBrJtoAAMnrGM1biAJOAAAAAElFTkSuQmCC',
  'base64'
);

// Minimal 48x48 yellow square PNG (base64)
const png48 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAnklEQVR42u3Y0Q2A' +
  'IAxF0YqjOIqjOIqjOIqjOAr+mBCMQltAE3J+/PDSDwghhBBCCCGEEEIIIYQQQggh' +
  'hBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBC' +
  'CCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBC/AcL' +
  'gBfLVjnpHgAAAABJRU5ErkJggg==',
  'base64'
);

// Minimal 128x128 yellow square PNG (base64)
const png128 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAACXUlEQVR42u3a0Q2D' +
  'MAxF0YqRGIVRGIVRGIVRGIVRGIU+VUJCJrGx7djO+QeJ3qcYMwAAAAAAAAAAAADA' +
  '//Z8Xdz7OI5ut9tdD6C5BlQAqABQAaACQAWACgAVACoAVACoAFABoAJABYAKABUA' +
  'KgBUAKgAUAGgAkAFgAoAFQAqAFQAqABQAaACQAWACgAVACoAVACoAFABoAJABYAK' +
  'ABUAKgBUAKgAUAGgAkAFgAoAFQAqAFQAqABQAaACQAWACgAVACoAVACoAFABoAJA' +
  'BYAKABUAKgBUAKgAUAGgAkAFgAoAFQAqAFQAqABQAaACQAWACgAVACoAVACoAFAB' +
  'oAJABYAKABUAKgBUAKgAUAGgAkAFgAoAFQAqAFQAqABQAaACQAWACgAVACoAVACo' +
  'AFABoAJABYAKABUAKgBUAKgAUAGgAkAFgAoAFQAqAFQAqABQAaACQAWACgAVACcA' +
  'AAAAAAAAAAAA/wW/FwBQAKgAUAGgAkAFgAoAFQAqAFQAqABQAaACQAWACgAVACo' +
  'AVACoAFABoAJABYAKABUAKgBUAKgAUAGgAkAFgAoAFQAqAFQAqABQAaACQAWACg' +
  'AVACoAVACoAFABoAJABYAKABUAKgBUAKgAUAGgAkAFgAoAFQAqAFQAqABQAaACQA' +
  'WACgAVACoAVACoAFABoAJABYAKABUAKgBUAKgAUAGgAkAFgAoAFQAqAFQAqABQAa' +
  'ACQAWACgAVACoAVACoAFABoAJABYAKABUAKgBUAKgAUAGgAkAFgAoAFQAqAFQAqA' +
  'BQAaACQAWACgAVACoAVACoAFABoAJABcAJAAAAAAAAAAAAwH/xAd0Tw6YW+o6PAAA' +
  'AABJRU5ErkJggg==',
  'base64'
);

// Write the PNG files
fs.writeFileSync(path.join(iconsDir, 'icon16.png'), png16);
fs.writeFileSync(path.join(iconsDir, 'icon48.png'), png48);
fs.writeFileSync(path.join(iconsDir, 'icon128.png'), png128);

console.log('Created PNG icons:');
console.log('  - icon16.png');
console.log('  - icon48.png');
console.log('  - icon128.png');
console.log('\nThese are simple placeholders. Replace with proper icons for production.');
