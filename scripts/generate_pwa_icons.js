import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateIcons() {
  const svgPath = path.join(__dirname, '../public/icon.svg');
  const publicDir = path.join(__dirname, '../public');

  if (!fs.existsSync(svgPath)) {
    console.error('icon.svg not found!');
    process.exit(1);
  }

  const svgBuffer = fs.readFileSync(svgPath);

  // 1. 192x192
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Generated pwa-192x192.png');

  // 2. 512x512
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Generated pwa-512x512.png');

  // 3. Apple touch icon 180x180
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  // 4. Maskable 512x512 with safe margin padding (80% inner size)
  const innerSize512 = Math.round(512 * 0.8);
  const innerBuffer512 = await sharp(svgBuffer).resize(innerSize512, innerSize512).png().toBuffer();
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: '#047857' // brand background
    }
  })
    .composite([{ input: innerBuffer512, gravity: 'center' }])
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Generated pwa-maskable-512x512.png');

  // 5. Maskable 192x192 with safe margin padding (80% inner size)
  const innerSize192 = Math.round(192 * 0.8);
  const innerBuffer192 = await sharp(svgBuffer).resize(innerSize192, innerSize192).png().toBuffer();
  await sharp({
    create: {
      width: 192,
      height: 192,
      channels: 4,
      background: '#047857' // brand background
    }
  })
    .composite([{ input: innerBuffer192, gravity: 'center' }])
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-192x192.png'));
  console.log('Generated pwa-maskable-192x192.png');

  console.log('All PWA PNG icons generated successfully!');
}

generateIcons().catch(err => {
  console.error(err);
  process.exit(1);
});
