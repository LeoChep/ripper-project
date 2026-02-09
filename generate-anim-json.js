import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
    const args = {};
    for (let i = 2; i < argv.length; i += 1) {
        const arg = argv[i];
        if (!arg.startsWith("--")) {
            continue;
        }
        const key = arg.slice(2);
        const next = argv[i + 1];
        if (next && !next.startsWith("--")) {
            args[key] = next;
            i += 1;
        } else {
            args[key] = true;
        }
    }
    return args;
}

function usage() {
    return [
        "Usage:",
        "  node generate-anim-json.js --name walk --frames 9 --width 172 --height 172 --output ./walk.json",
        "Options:",
        "  --name    Animation base name (e.g. walk)",
        "  --frames  Frames per direction row (e.g. 9)",
        "  --width   Frame width in pixels",
        "  --height  Frame height in pixels",
        "  --output  Output JSON file path",
        "  --dirs    Optional comma list of directions (default: w,a,s,d)",
    ].join("\n");
}

const args = parseArgs(process.argv);
const name = args.name;
const framesPerRow = Number(args.frames);
const frameW = Number(args.width);
const frameH = Number(args.height);
const outputPath = args.output;
const dirs = (args.dirs ? String(args.dirs) : "w,a,s,d").split(",").map((d) => d.trim()).filter(Boolean);

if (!name || !framesPerRow || !frameW || !frameH || !outputPath || dirs.length === 0) {
    console.error(usage());
    process.exit(1);
}

const frames = {};
const animations = {};

for (let row = 0; row < dirs.length; row += 1) {
    const dir = dirs[row];
    const animKey = `${name}_${dir}`;
    animations[animKey] = [];

    for (let col = 0; col < framesPerRow; col += 1) {
        const fileName = `${name}_${dir}_${col}.png`;
        frames[fileName] = {
            frame: { x: col * frameW, y: row * frameH, w: frameW, h: frameH },
            rotated: false,
            trimmed: false,
            spriteSourceSize: { x: 0, y: 0, w: frameW, h: frameH },
            sourceSize: { w: frameW, h: frameH },
        };
        animations[animKey].push(fileName);
    }
}

const data = {
    frames,
    animations,
    meta: {
        version: "1.0",
        format: "RGBA8888",
        size: { w: frameW * framesPerRow, h: frameH * dirs.length },
        scale: "1",
    },
};

const outDir = path.dirname(outputPath);
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(data, null, 4), "utf8");
console.log(`Wrote ${outputPath}`);
