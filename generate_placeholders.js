const fs = require('fs')
const path = require('path')

const SHAPES = ['circle', 'square', 'triangle', 'arrow', 'star', 'heart', 'diamond', 'badge', 'burst', 'ribbon', 'banner', 'cloud', 'hexagon', 'pentagon', 'cross']
const DECORATIONS = ['confetti', 'sparkles', 'fireworks', 'crown', 'lightning', 'rainbow', 'flower', 'wave', 'dotted-border', 'neon-frame', 'glitch', 'retro-badge', 'sale-tag', 'new-badge', 'hot-badge']

const outputDir = path.join(__dirname, 'apps/web/public/stickers')

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

const colors = ['#f87171', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#f472b6']

function getSvg(name, color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="${color}" rx="20" />
  <text x="50" y="55" font-family="sans-serif" font-size="12" fill="white" font-weight="bold" text-anchor="middle">${name}</text>
</svg>`
}

SHAPES.forEach((name, i) => {
  const color = colors[i % colors.length]
  fs.writeFileSync(path.join(outputDir, `${name}.svg`), getSvg(name, color))
})

DECORATIONS.forEach((name, i) => {
  const color = colors[(i + 3) % colors.length]
  fs.writeFileSync(path.join(outputDir, `${name}.svg`), getSvg(name, color))
})

console.log('Generated SVG placeholders.')
