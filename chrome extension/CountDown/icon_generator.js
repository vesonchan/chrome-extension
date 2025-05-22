// 使用固定的图标数据
const iconSizes = [16, 48, 128];
const iconCache = {};

// 为每个尺寸预生成图标数据
function preGenerateIcons() {
  // 对于0-59分钟
  for (let m = 0; m < 60; m++) {
    // 对于0-59秒
    for (let s = 0; s < 60; s++) {
      const key = `${m}:${s}`;
      
      // 为每个尺寸生成图标
      iconSizes.forEach(size => {
        const canvas = new OffscreenCanvas(size, size);
        const ctx = canvas.getContext('2d');
        
        // 绘制背景
        ctx.fillStyle = '#888888';
        ctx.fillRect(0, 0, size, size);
        
        // 设置文本样式
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFFFFF';
        
        // 计算字体大小（根据图标尺寸自适应）
        const minutesFontSize = Math.floor(size * 0.47);
        const secondsFontSize = Math.floor(size * 0.39);
        
        // 绘制分钟（上）
        ctx.font = `bold ${minutesFontSize}px Arial`;
        ctx.fillText(m.toString(), size/2, size * 0.47);
        
        // 绘制秒数（下）
        ctx.font = `bold ${secondsFontSize}px Arial`;
        ctx.fillText(s.toString().padStart(2, '0'), size/2, size * 0.86);
        
        // 存储图像数据
        const imageData = ctx.getImageData(0, 0, size, size);
        
        // 缓存这个图标
        if (!iconCache[size]) iconCache[size] = {};
        iconCache[size][key] = imageData;
      });
    }
  }
  
  console.log('预生成的图标数量:', Object.keys(iconCache[16]).length);
}

// 获取指定时间的图标
function getTimerIcon(minutes, seconds, size) {
  minutes = Math.min(59, Math.max(0, minutes)); // 限制在0-59范围内
  seconds = Math.min(59, Math.max(0, seconds)); // 限制在0-59范围内
  
  const key = `${minutes}:${seconds}`;
  
  // 如果缓存中有这个图标，直接返回
  if (iconCache[size] && iconCache[size][key]) {
    return iconCache[size][key];
  }
  
  // 如果没有缓存，即时生成一个
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // 绘制背景
  ctx.fillStyle = '#888888';
  ctx.fillRect(0, 0, size, size);
  
  // 设置文本样式
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFFFFF';
  
  // 计算字体大小
  const minutesFontSize = Math.floor(size * 0.47);
  const secondsFontSize = Math.floor(size * 0.39);
  
  // 绘制分钟（上）
  ctx.font = `bold ${minutesFontSize}px Arial`;
  ctx.fillText(minutes.toString(), size/2, size * 0.47);
  
  // 绘制秒数（下）
  ctx.font = `bold ${secondsFontSize}px Arial`;
  ctx.fillText(seconds.toString().padStart(2, '0'), size/2, size * 0.86);
  
  return ctx.getImageData(0, 0, size, size);
}

// 开始预生成图标
console.log('开始预生成图标...');
preGenerateIcons();
console.log('图标预生成完成!');

// 导出函数
export { getTimerIcon }; 