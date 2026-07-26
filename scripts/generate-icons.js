const { Jimp } = require('jimp');
const pngToIco = require('png-to-ico').default;
const fs = require('fs');
const path = require('path');

const LOGO_PATH = path.join(__dirname, '../electron/assets/logo.png');
const ASSETS_DIR = path.join(__dirname, '../electron/assets');

async function generateIcons() {
  console.log('🚀 Starting icon generation from:', LOGO_PATH);

  if (!fs.existsSync(LOGO_PATH)) {
    console.error('❌ Logo not found at:', LOGO_PATH);
    process.exit(1);
  }

  const logo = await Jimp.read(LOGO_PATH);

  // 1. Generate multi-size ICO
  console.log('📦 Generating icon.ico...');
  const icoBuffer = await pngToIco(LOGO_PATH);
  fs.writeFileSync(path.join(ASSETS_DIR, 'icon.ico'), icoBuffer);

  // 2. Generate Installer Sidebar (164x314) - Premium dark gradient
  console.log('🎨 Generating premium installer sidebar...');
  const sidebar = new Jimp({ width: 164, height: 314, color: 0x0A0A0AFF });

  for (let y = 0; y < 314; y++) {
    const blend = y / 313;
    const r = Math.round(10 + blend * 22);
    const g = Math.round(12 + blend * 10);
    const b = Math.round(24 + blend * 20);
    const rowColor = Jimp.rgbaToInt(r, g, b, 255);
    for (let x = 0; x < 164; x++) {
      sidebar.setPixelColor(rowColor, x, y);
    }
  }

  const overlay = new Jimp(164, 314, Jimp.rgbaToInt(255, 255, 255, 10));
  overlay.scan(0, 0, overlay.bitmap.width, overlay.bitmap.height, (x, y, idx) => {
    const distance = Math.sqrt(Math.pow(x - 82, 2) + Math.pow(y - 70, 2));
    const alpha = Math.max(0, 44 - distance);
    overlay.bitmap.data[idx + 3] = alpha;
  });
  sidebar.composite(overlay, 0, 0);

  const resizedLogoSidebar = await logo.clone().resize({ w: 110, h: 110 });
  sidebar.composite(resizedLogoSidebar, 27, 40);
  await sidebar.write(path.join(ASSETS_DIR, 'installerSidebar.bmp'));

  // 3. Generate Installer Header (150x57) - Match dark theme
  console.log('🖼️ Generating premium installer header...');
  const header = new Jimp({ width: 150, height: 57, color: 0x0A0A0AFF });
  const headerGradient = new Jimp(150, 57, Jimp.rgbaToInt(34, 41, 71, 255));
  for (let y = 0; y < 57; y++) {
    const blend = y / 56;
    const r = Math.round(25 + blend * 18);
    const g = Math.round(29 + blend * 12);
    const b = Math.round(63 + blend * 24);
    const rowColor = Jimp.rgbaToInt(r, g, b, 255);
    for (let x = 0; x < 150; x++) {
      headerGradient.setPixelColor(rowColor, x, y);
    }
  }
  header.composite(headerGradient, 0, 0);
  const resizedLogoHeader = await logo.clone().resize({ w: 42, h: 42 });
  header.composite(resizedLogoHeader, 16, 7);
  await header.write(path.join(ASSETS_DIR, 'installerHeader.bmp'));

  console.log('✅ Premium graphics generated in electron/assets/');
}

generateIcons().catch(err => {
  console.error('❌ Error generating icons:', err);
  process.exit(1);
});
