/**
 * Build script for the extension
 * Compiles TypeScript and copies static files
 */

const fs = require('fs');
const path = require('path');

// Ensure dist directory exists
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Create subdirectories
const subdirs = ['content', 'background', 'popup', 'components'];
subdirs.forEach(dir => {
  const dirPath = path.join(distDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Copy CSS files
console.log('Copying CSS files...');
fs.copyFileSync(
  path.join(__dirname, 'src', 'content', 'styles.css'),
  path.join(distDir, 'content', 'styles.css')
);

fs.copyFileSync(
  path.join(__dirname, 'src', 'popup', 'popup.css'),
  path.join(distDir, 'popup', 'popup.css')
);

// Copy HTML files
console.log('Copying HTML files...');
fs.copyFileSync(
  path.join(__dirname, 'src', 'popup', 'popup.html'),
  path.join(distDir, 'popup', 'popup.html')
);

console.log('Build preparation complete. Run TypeScript compiler next.');
