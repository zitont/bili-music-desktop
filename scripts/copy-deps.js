const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const buildDir = path.join(rootDir, 'build');

// 需要复制的文件列表
const files = ['db.js', 'windows.js'];

// 需要复制的目录列表
const dirs = ['preload', 'assets', 'data'];

// 确保 build 目录存在
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// 复制文件
files.forEach(file => {
  const src = path.join(rootDir, file);
  const dst = path.join(buildDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dst);
    console.log(`复制: ${file}`);
  } else {
    console.warn(`文件不存在: ${file}`);
  }
});

// 复制目录
dirs.forEach(dir => {
  const srcDir = path.join(rootDir, dir);
  const dstDir = path.join(buildDir, dir);
  if (!fs.existsSync(srcDir)) {
    console.warn(`目录不存在: ${dir}`);
    return;
  }
  if (!fs.existsSync(dstDir)) {
    fs.mkdirSync(dstDir, { recursive: true });
  }
  fs.readdirSync(srcDir).forEach(file => {
    fs.copyFileSync(path.join(srcDir, file), path.join(dstDir, file));
  });
  console.log(`复制目录: ${dir}`);
});

console.log('依赖文件复制完成');
