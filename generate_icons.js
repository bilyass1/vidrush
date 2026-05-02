const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'apps', 'desktop', 'src-tauri', 'icons');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Minimal valid 1x1 transparent .ico file in base64
const icoBase64 = "AAABAAEAAQEAAAEAIAAwAAAAFgAAACgAAAABAAAAAgAAAAEAIAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==";
const buffer = Buffer.from(icoBase64, 'base64');

fs.writeFileSync(path.join(dir, 'icon.ico'), buffer);
fs.writeFileSync(path.join(dir, 'icon.png'), buffer);
fs.writeFileSync(path.join(dir, '32x32.png'), buffer);
fs.writeFileSync(path.join(dir, '128x128.png'), buffer);
fs.writeFileSync(path.join(dir, '128x128@2x.png'), buffer);
fs.writeFileSync(path.join(dir, 'icon.icns'), buffer);

console.log('Dummy icons generated');
