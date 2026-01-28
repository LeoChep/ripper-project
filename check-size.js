import sharp from 'sharp';

const imagePath = './src/assets/effect/FireballExplosion/frame_0000_alpha.png';
const metadata = await sharp(imagePath).metadata();
console.log(`原始尺寸: ${metadata.width}x${metadata.height}px`);
