const fs = require('fs');
const { createCanvas } = require('canvas');

// 生成不同尺寸的图标
const sizes = [16, 48, 128];

sizes.forEach(size => {
  // 创建canvas
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // 绘制圆形背景
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2 - 1, 0, 2 * Math.PI);
  ctx.fillStyle = '#4285F4';
  ctx.fill();
  ctx.strokeStyle = '#3367D6';
  ctx.lineWidth = size/16;
  ctx.stroke();
  
  // 绘制时钟中心点
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/16, 0, 2 * Math.PI);
  ctx.fillStyle = 'white';
  ctx.fill();
  
  // 时针
  ctx.beginPath();
  ctx.moveTo(size/2, size/2);
  ctx.lineTo(size/2 + size/3 * Math.cos(Math.PI/3), size/2 + size/3 * Math.sin(Math.PI/3));
  ctx.strokeStyle = 'white';
  ctx.lineWidth = size/12;
  ctx.lineCap = 'round';
  ctx.stroke();
  
  // 分针
  ctx.beginPath();
  ctx.moveTo(size/2, size/2);
  ctx.lineTo(size/2 + size/2.5 * Math.cos(Math.PI*5/3), size/2 + size/2.5 * Math.sin(Math.PI*5/3));
  ctx.strokeStyle = 'white';
  ctx.lineWidth = size/16;
  ctx.lineCap = 'round';
  ctx.stroke();
  
  // 将canvas转换为图片并保存
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`./images/icon${size}.png`, buffer);
  console.log(`生成了图标: icon${size}.png`);
});

console.log('所有图标已生成完毕！'); 