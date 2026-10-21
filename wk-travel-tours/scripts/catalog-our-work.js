import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const sourceDir = 'C:\\Users\\DELL\\wk travel agency web\\images\\our work';

function getJpegDimensions(buffer) {
  let offset = 2; // skip SOI (0xFFD8)
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xFF) {
      break;
    }
    const marker = buffer[offset + 1];
    // Standalone markers
    if (marker === 0xD9 || marker === 0xDA) break; // EOI or SOS
    const length = buffer.readUInt16BE(offset + 2);
    // SOF0 (0xC0) or SOF2 (0xC2)
    if (marker === 0xC0 || marker === 0xC2) {
      const height = buffer.readUInt16BE(offset + 5);
      const width = buffer.readUInt16BE(offset + 7);
      return { width, height };
    }
    offset += 2 + length;
  }
  return null;
}

const files = fs.readdirSync(sourceDir);
console.log(`Found ${files.length} files in ${sourceDir}\n`);

const catalog = [];
for (const file of files) {
  const fullPath = path.join(sourceDir, file);
  const stat = fs.statSync(fullPath);
  const buffer = fs.readFileSync(fullPath);
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  const dims = getJpegDimensions(buffer);

  catalog.push({
    name: file,
    size: stat.size,
    hash: hash.substring(0, 12),
    dims: dims ? `${dims.width}x${dims.height}` : 'unknown',
    valid: !!dims
  });
}

console.table(catalog);

