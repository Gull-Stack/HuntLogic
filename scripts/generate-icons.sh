#!/usr/bin/env bash
# =============================================================================
# Generate PWA icons from SVG source using sharp (via inline Node.js script)
# =============================================================================
# Generates:
#   /public/favicon.ico        (32x32)
#   /public/apple-touch-icon.png (180x180)
#   /public/icons/icon-192x192.png (192x192)
#   /public/icons/icon-512x512.png (512x512)
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "[generate-icons] Generating PWA icons..."

mkdir -p "$PROJECT_ROOT/public/icons"

node -e "
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const publicDir = path.join('${PROJECT_ROOT}', 'public');
const iconsDir = path.join(publicDir, 'icons');

// Brand forest color
const BRAND_FOREST = '#1A3C2A';
const BRAND_GOLD = '#D4A03C';

// Create an SVG with the crosshair/mountain icon matching favicon.svg
function createIconSvg(size) {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;
  const r = s * 0.44; // background circle radius
  const cr = s * 0.117; // crosshair circle radius
  const crossY = s * 0.45; // crosshair vertical center

  return Buffer.from(\`<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"\${s}\" height=\"\${s}\" viewBox=\"0 0 \${s} \${s}\">
    <rect width=\"\${s}\" height=\"\${s}\" rx=\"\${s * 0.18}\" fill=\"\${BRAND_FOREST}\"/>
    <circle cx=\"\${cx}\" cy=\"\${crossY}\" r=\"\${cr}\" fill=\"none\" stroke=\"\${BRAND_GOLD}\" stroke-width=\"\${Math.max(1, s * 0.012)}\"/>
    <line x1=\"\${cx}\" y1=\"\${crossY - cr * 1.5}\" x2=\"\${cx}\" y2=\"\${crossY - cr * 0.35}\" stroke=\"\${BRAND_GOLD}\" stroke-width=\"\${Math.max(1, s * 0.01)}\"/>
    <line x1=\"\${cx}\" y1=\"\${crossY + cr * 0.35}\" x2=\"\${cx}\" y2=\"\${crossY + cr * 1.5}\" stroke=\"\${BRAND_GOLD}\" stroke-width=\"\${Math.max(1, s * 0.01)}\"/>
    <line x1=\"\${cx - cr * 1.5}\" y1=\"\${crossY}\" x2=\"\${cx - cr * 0.35}\" y2=\"\${crossY}\" stroke=\"\${BRAND_GOLD}\" stroke-width=\"\${Math.max(1, s * 0.01)}\"/>
    <line x1=\"\${cx + cr * 0.35}\" y1=\"\${crossY}\" x2=\"\${cx + cr * 1.5}\" y2=\"\${crossY}\" stroke=\"\${BRAND_GOLD}\" stroke-width=\"\${Math.max(1, s * 0.01)}\"/>
    <circle cx=\"\${cx}\" cy=\"\${crossY}\" r=\"\${Math.max(1, s * 0.008)}\" fill=\"\${BRAND_GOLD}\"/>
    <text x=\"\${cx}\" y=\"\${s * 0.78}\" text-anchor=\"middle\" font-family=\"system-ui, sans-serif\" font-weight=\"700\" font-size=\"\${s * 0.15}\" fill=\"#F5F5F0\">HL</text>
  </svg>\`);
}

async function generate() {
  const sizes = [
    { name: 'favicon.ico', size: 32, dir: publicDir, format: 'png' },
    { name: 'apple-touch-icon.png', size: 180, dir: publicDir, format: 'png' },
    { name: 'icon-192x192.png', size: 192, dir: iconsDir, format: 'png' },
    { name: 'icon-512x512.png', size: 512, dir: iconsDir, format: 'png' },
  ];

  for (const { name, size, dir, format } of sizes) {
    const svg = createIconSvg(size);
    const outputPath = path.join(dir, name);

    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(outputPath);

    console.log('  Created:', outputPath, '(' + size + 'x' + size + ')');
  }

  console.log('[generate-icons] Done!');
}

generate().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
"
