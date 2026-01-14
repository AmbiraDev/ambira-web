#!/usr/bin/env node
/**
 * Logo Generator Script
 * Generates all favicon and icon sizes for the Focumo app
 *
 * Creates a white background with rounded corners and green bold "F"
 * using the Nunito font and Duolingo Green (#58CC02)
 */

import puppeteer from 'puppeteer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const GREEN_COLOR = '#58CC02';
const BACKGROUND_COLOR = '#FFFFFF';
const BORDER_RADIUS = 80; // pixels at 512x512, will scale proportionally

// Output directory
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// All sizes needed
const SIZES = {
  // Favicons
  'favicon-16x16.png': 16,
  'favicon-32x32.png': 32,

  // Apple
  'apple-touch-icon.png': 180,

  // Android Chrome
  'android-chrome-192x192.png': 192,
  'android-chrome-512x512.png': 512,

  // PWA Icons
  'icon-48x48.png': 48,
  'icon-72x72.png': 72,
  'icon-96x96.png': 96,
  'icon-128x128.png': 128,
  'icon-144x144.png': 144,
  'icon-152x152.png': 152,
  'icon-192x192.png': 192,
  'icon-256x256.png': 256,
  'icon-384x384.png': 384,
  'icon-512x512.png': 512,

  // Main logo
  'ambira_logo.png': 512,
};

// HTML template for the logo
const createLogoHTML = (size = 512) => {
  const borderRadius = Math.round((BORDER_RADIUS / 512) * size);
  const fontSize = Math.round(size * 0.7);
  const paddingTop = Math.round(size * 0.05); // Slight adjustment to center the F visually

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@800&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      width: ${size}px;
      height: ${size}px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
    }
    .logo {
      width: ${size}px;
      height: ${size}px;
      background-color: ${BACKGROUND_COLOR};
      border-radius: ${borderRadius}px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding-top: ${paddingTop}px;
    }
    .letter {
      font-family: 'Nunito', sans-serif;
      font-weight: 800;
      font-size: ${fontSize}px;
      color: ${GREEN_COLOR};
      line-height: 1;
    }
  </style>
</head>
<body>
  <div class="logo">
    <span class="letter">F</span>
  </div>
</body>
</html>
`;
};

// Create SVG logo
const createLogoSVG = () => {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" ry="80" fill="${BACKGROUND_COLOR}"/>
  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle"
        font-family="Nunito, system-ui, sans-serif" font-weight="800"
        font-size="360" fill="${GREEN_COLOR}">F</text>
</svg>`;
};

async function generateLogos() {
  console.log('Starting logo generation...');

  // Launch puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Generate the base 512x512 image
  console.log('Generating base 512x512 image...');

  await page.setViewport({ width: 512, height: 512, deviceScaleFactor: 2 });
  await page.setContent(createLogoHTML(512), { waitUntil: 'networkidle0' });

  // Wait for font to load
  await page.evaluateHandle('document.fonts.ready');
  await new Promise(resolve => setTimeout(resolve, 500));

  const baseImageBuffer = await page.screenshot({
    type: 'png',
    omitBackground: true,
    clip: { x: 0, y: 0, width: 512, height: 512 }
  });

  await browser.close();

  // Generate all PNG sizes using sharp
  console.log('Generating PNG files at various sizes...');

  for (const [filename, size] of Object.entries(SIZES)) {
    const outputPath = path.join(PUBLIC_DIR, filename);

    await sharp(baseImageBuffer)
      .resize(size, size, {
        kernel: sharp.kernel.lanczos3,
        fit: 'cover'
      })
      .png()
      .toFile(outputPath);

    console.log(`  Created: ${filename} (${size}x${size})`);
  }

  // Generate favicon.ico (multi-size ICO file)
  console.log('Generating favicon.ico...');

  // ICO files need 16x16 and 32x32 sizes
  const ico16Buffer = await sharp(baseImageBuffer)
    .resize(16, 16, { kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();

  const ico32Buffer = await sharp(baseImageBuffer)
    .resize(32, 32, { kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();

  // Create ICO file manually (ICO format)
  const icoBuffer = createIcoFile([ico16Buffer, ico32Buffer], [16, 32]);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), icoBuffer);
  console.log('  Created: favicon.ico');

  // Generate SVG logo
  console.log('Generating SVG logo...');
  const svgContent = createLogoSVG();
  fs.writeFileSync(path.join(PUBLIC_DIR, 'logo.svg'), svgContent);
  console.log('  Created: logo.svg');

  console.log('\nLogo generation complete!');
}

// Create ICO file from PNG buffers
// ICO format: https://en.wikipedia.org/wiki/ICO_(file_format)
function createIcoFile(pngBuffers, sizes) {
  const numImages = pngBuffers.length;

  // ICO header: 6 bytes
  const headerSize = 6;
  // Directory entry: 16 bytes per image
  const directorySize = 16 * numImages;

  // Calculate total size
  let totalSize = headerSize + directorySize;
  const imageOffsets = [];

  for (const buffer of pngBuffers) {
    imageOffsets.push(totalSize);
    totalSize += buffer.length;
  }

  // Create the ICO buffer
  const icoBuffer = Buffer.alloc(totalSize);
  let offset = 0;

  // Write ICO header
  icoBuffer.writeUInt16LE(0, offset); // Reserved
  offset += 2;
  icoBuffer.writeUInt16LE(1, offset); // Type: 1 = ICO
  offset += 2;
  icoBuffer.writeUInt16LE(numImages, offset); // Number of images
  offset += 2;

  // Write directory entries
  for (let i = 0; i < numImages; i++) {
    const size = sizes[i];
    const pngBuffer = pngBuffers[i];

    icoBuffer.writeUInt8(size === 256 ? 0 : size, offset); // Width
    offset += 1;
    icoBuffer.writeUInt8(size === 256 ? 0 : size, offset); // Height
    offset += 1;
    icoBuffer.writeUInt8(0, offset); // Color palette
    offset += 1;
    icoBuffer.writeUInt8(0, offset); // Reserved
    offset += 1;
    icoBuffer.writeUInt16LE(1, offset); // Color planes
    offset += 2;
    icoBuffer.writeUInt16LE(32, offset); // Bits per pixel
    offset += 2;
    icoBuffer.writeUInt32LE(pngBuffer.length, offset); // Image size
    offset += 4;
    icoBuffer.writeUInt32LE(imageOffsets[i], offset); // Image offset
    offset += 4;
  }

  // Write image data
  for (const pngBuffer of pngBuffers) {
    pngBuffer.copy(icoBuffer, offset);
    offset += pngBuffer.length;
  }

  return icoBuffer;
}

// Run the script
generateLogos().catch(console.error);
