const sharp = require('sharp');
const pngToIco = require('png-to-ico').default || require('png-to-ico');
const fs = require('fs');
const path = require('path');

const SVG = path.join(__dirname, '../public/favicon.svg');
const OUT = path.join(__dirname, '../public');

async function run() {
  const svgBuf = fs.readFileSync(SVG);

  // apple-touch-icon 180×180
  await sharp(svgBuf).resize(180, 180).png({ quality: 100 }).toFile(path.join(OUT, 'apple-touch-icon.png'));
  console.log('✓ apple-touch-icon.png');

  // PWA icons
  await sharp(svgBuf).resize(192, 192).png({ quality: 100 }).toFile(path.join(OUT, 'icon-192.png'));
  console.log('✓ icon-192.png');

  await sharp(svgBuf).resize(512, 512).png({ quality: 100 }).toFile(path.join(OUT, 'icon-512.png'));
  console.log('✓ icon-512.png');

  // 32×32 PNG → ICO
  const png32Path = path.join(OUT, '_favicon-32.png');
  await sharp(svgBuf).resize(32, 32).png({ quality: 100 }).toFile(png32Path);
  const icoBuf = await pngToIco([png32Path]);
  fs.writeFileSync(path.join(OUT, 'favicon.ico'), icoBuf);
  fs.unlinkSync(png32Path);
  console.log('✓ favicon.ico');

  console.log('\nAll favicons generated.');
}

run().catch(console.error);
