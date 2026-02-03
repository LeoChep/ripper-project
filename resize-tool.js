import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// 您可以修改这里的文件名
const inputPath = 'resize_input.png';
const outputPath = 'resize_output.png';

console.log(`正在寻找文件: ${inputPath}...`);

if (!fs.existsSync(inputPath)) {
    console.error(`错误: 找不到文件 "${inputPath}"。请将您要压缩的图片保存到项目根目录并重命名为 "${inputPath}"。`);
    process.exit(1);
}

// 对于像素画风格，使用 nearest 邻近插值可以保持边缘清晰
sharp(inputPath)
    .resize(20, 20, {
        kernel: sharp.kernel.nearest, // 邻近插值，适合像素画
        fit: 'fill'
    })
    .png()
    .toFile(outputPath)
    .then(info => {
        console.log(`成功! 图片已压缩并保存为: ${outputPath}`);
        console.log(`尺寸: ${info.width}x${info.height}`);
    })
    .catch(err => {
        console.error("处理图片时出错:", err);
    });
