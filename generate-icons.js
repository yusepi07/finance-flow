const fs = require('fs');
const path = require('path');

const sizes = [192, 512];

function createPNG(size) {
  const width = size;
  const height = size;

  // Minimal PNG: blue background square
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);  // width
  ihdrData.writeUInt32BE(height, 4); // height
  ihdrData.writeUInt8(8, 8);         // bit depth
  ihdrData.writeUInt8(2, 9);         // color type (RGB)
  ihdrData.writeUInt8(0, 10);        // compression
  ihdrData.writeUInt8(0, 11);        // filter
  ihdrData.writeUInt8(0, 12);        // interlace

  const ihdr = createChunk('IHDR', ihdrData);

  // IDAT chunk - raw pixel data
  const rawData = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0); // filter byte (none)
    for (let x = 0; x < width; x++) {
      const cx = width / 2;
      const cy = height / 2;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = Math.min(width, height) / 2;

      // Blue gradient circle
      const t = dist / maxDist;
      const r = Math.round(26 + (15 - 26) * t);
      const g = Math.round(86 + (40 - 86) * t);
      const b = Math.round(219 + (168 - 219) * t);

      if (dist < maxDist) {
        rawData.push(Math.max(0, Math.min(255, r)));
        rawData.push(Math.max(0, Math.min(255, g)));
        rawData.push(Math.max(0, Math.min(255, b)));
      } else {
        rawData.push(15, 25, 35);
      }
    }
  }

  const rawBuffer = Buffer.from(rawData);
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(rawBuffer);
  const idat = createChunk('IDAT', compressed);

  // IEND chunk
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcData);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc);
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      if (crc & 1) {
        crc = (crc >>> 1) ^ 0xEDB88320;
      } else {
        crc >>>= 1;
      }
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

sizes.forEach(size => {
  const png = createPNG(size);
  const filePath = path.join(__dirname, 'icons', `icon-${size}.png`);
  fs.writeFileSync(filePath, png);
  console.log(`✓ Icono ${size}x${size} creado (${png.length} bytes)`);
});
