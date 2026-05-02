const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'apps/web/public/stickers');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// 1x1 transparent PNG base64
const emptyPng = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const buffer = Buffer.from(emptyPng, 'base64');

const EMOJIS = ['fire', 'star', '100', 'heart', 'thumbsup', 'laugh', 'party', 'rocket', 'muscle', 'eyes', 'clapper', 'music', 'phone', 'money', 'sparkle', 'magic', 'trophy', 'gem', 'key', 'megaphone'];
const SHAPES = ['circle', 'square', 'triangle', 'arrow', 'star_shape', 'heart_shape', 'diamond', 'badge', 'burst', 'ribbon', 'banner', 'cloud', 'hexagon', 'pentagon', 'cross'];
const DECORATIONS = ['confetti', 'sparkles', 'fireworks', 'crown', 'lightning', 'rainbow', 'flower', 'wave', 'dotted_border', 'neon_frame', 'glitch', 'retro_badge', 'sale_tag', 'new_badge', 'hot_badge'];

[...EMOJIS, ...SHAPES, ...DECORATIONS].forEach(name => {
  fs.writeFileSync(path.join(dir, `${name}.png`), buffer);
});

console.log('Stickers created successfully!');
