import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputFolder = './src/assets/effect/iceRay';
const outputFolder = './src/assets/effect/iceRay_compressed';
const scalePercent = 0.2; // 缩小到20%

if (!fs.existsSync(outputFolder)) {
  fs.mkdirSync(outputFolder, { recursive: true });
}

const files = fs.readdirSync(inputFolder).filter(file => file.endsWith('.png'));

console.log(`找到 ${files.length} 个PNG文件，开始压缩...`);

let completed = 0;
const startTime = Date.now();

Promise.all(
  files.map(async (file) => {
    const inputPath = path.join(inputFolder, file);
    const outputPath = path.join(outputFolder, file);
    try {
      const inputStats = fs.statSync(inputPath);
      const inputSize = inputStats.size;
      const metadata = await sharp(inputPath).metadata();
      const newWidth = Math.round(metadata.width * scalePercent);
      const newHeight = Math.round(metadata.height * scalePercent);
      await sharp(inputPath)
        .resize(newWidth, newHeight, {
          kernel: sharp.kernel.lanczos3,
          fit: 'fill'
        })
        .png({
          quality: 85,
          compressionLevel: 9,
          adaptiveFiltering: true,
          palette: true
        })
        .toFile(outputPath);
      const outputStats = fs.statSync(outputPath);
      const outputSize = outputStats.size;
      const reduction = ((1 - outputSize / inputSize) * 100).toFixed(2);
      completed++;
      console.log(`[${completed}/${files.length}] ${file}: ${metadata.width}x${metadata.height} → ${newWidth}x${newHeight}, ${(inputSize/1024).toFixed(2)}KB → ${(outputSize/1024).toFixed(2)}KB (减少 ${reduction}%)`);
    } catch (error) {
      console.error(`处理 ${file} 时出错:`, error.message);
    }
  })
).then(() => {
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  console.log(`\n✅ 压缩完成！共处理 ${completed} 个文件，耗时 ${duration} 秒`);
  console.log(`压缩后的文件保存在: ${outputFolder}`);
}).catch(error => {
  console.error('批量处理出错:', error);
});
