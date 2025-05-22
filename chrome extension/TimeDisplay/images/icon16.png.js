// 创建一个16x16的PNG图标
const canvas = document.createElement('canvas');
canvas.width = 16;
canvas.height = 16;
const ctx = canvas.getContext('2d');

// 绘制圆形背景
ctx.beginPath();
ctx.arc(8, 8, 7, 0, 2 * Math.PI);
ctx.fillStyle = '#4285F4';
ctx.fill();
ctx.strokeStyle = '#3367D6';
ctx.lineWidth = 1;
ctx.stroke();

// 绘制时钟中心点
ctx.beginPath();
ctx.arc(8, 8, 1, 0, 2 * Math.PI);
ctx.fillStyle = 'white';
ctx.fill();

// 时针
ctx.beginPath();
ctx.moveTo(8, 8);
ctx.lineTo(11, 10);
ctx.strokeStyle = 'white';
ctx.lineWidth = 1.5;
ctx.lineCap = 'round';
ctx.stroke();

// 分针
ctx.beginPath();
ctx.moveTo(8, 8);
ctx.lineTo(5, 5);
ctx.strokeStyle = 'white';
ctx.lineWidth = 1;
ctx.lineCap = 'round';
ctx.stroke();

// 将canvas转换为图片数据
const imgData = canvas.toDataURL('image/png');
console.log('图标已生成，数据：', imgData); 