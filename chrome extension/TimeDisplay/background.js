// 后台脚本，负责获取北京时间并在图标上显示

// 北京时区偏移量(UTC+8)
const BEIJING_OFFSET = 8 * 60 * 60 * 1000;
let timeOffset = 0; // 本地时间与服务器时间的偏移量

// 初始化徽章样式
chrome.runtime.onInstalled.addListener(() => {
  // 设置徽章文字样式
  chrome.action.setBadgeBackgroundColor({ color: '#4285F4' });
  chrome.action.setBadgeTextColor({ color: '#FFFFFF' });
  
  // 立即更新时间显示
  updateBadgeTime();
  
  // 尝试从API获取准确时间
  fetchAccurateTime();
  
  // 每分钟尝试从API同步一次时间
  setInterval(fetchAccurateTime, 60 * 1000);
});

// 更新图标上显示的时间
function updateBadgeTime() {
  // 使用本地时间计算北京时间
  const localTime = new Date();
  const utcTime = new Date(localTime.getTime() + localTime.getTimezoneOffset() * 60 * 1000);
  const beijingTime = new Date(utcTime.getTime() + BEIJING_OFFSET + timeOffset);

  // 获取小时和分钟
  const hours = beijingTime.getHours();
  const minutes = beijingTime.getMinutes();
  
  // 为所有尺寸创建图标
  const imageData = {};
  const sizes = [16, 32, 48, 128];
  
  sizes.forEach(size => {
    // 创建图标 - 小时和分钟垂直排列
    const canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // 设置背景
    ctx.fillStyle = '#4285F4';
    ctx.fillRect(0, 0, size, size);
    
    // 设置文本样式
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';
    
    // 调整字体大小 - 避免重叠
    const hoursFontSize = Math.floor(size * 0.6); // 适当减小字体尺寸
    const minutesFontSize = Math.floor(size * 0.6); // 适当减小字体尺寸
    
    // 调整位置 - 增加上下间距
    const hoursPosY = size * 0.4; // 小时显示位置
    const minutesPosY = size * 0.9; // 分钟显示位置
    
    // 绘制小时（上）
    ctx.font = `bold ${hoursFontSize}px Arial`;
    ctx.fillText(hours.toString().padStart(2, '0'), size/2, hoursPosY);
    
    // 绘制分钟（下）
    ctx.font = `bold ${minutesFontSize}px Arial`;
    ctx.fillText(minutes.toString().padStart(2, '0'), size/2, minutesPosY);
    
    // 存储图像数据
    imageData[size] = ctx.getImageData(0, 0, size, size);
  });
  
  // 设置图标
  chrome.action.setIcon({ imageData: imageData });
  
  // 清除徽章文本
  chrome.action.setBadgeText({ text: '' });
  
  // 每秒更新一次时间
  setTimeout(updateBadgeTime, 1000);
}

// 尝试从更可靠的API获取准确的北京时间
function fetchAccurateTime() {
  // 使用苏宁易购的API获取时间
  fetch('https://f.m.suning.com/api/ct.do')
    .then(response => {
      if (!response.ok) {
        throw new Error('苏宁易购API无法访问');
      }
      return response.json();
    })
    .then(data => {
      // 解析苏宁易购的时间API返回的数据
      // 返回格式如: {"api":"time","code":"1","currentTime": 1747890762411,"msg":""}
      if (!data.currentTime) {
        throw new Error('无法解析苏宁易购API返回的时间数据');
      }
      
      // 获取时间戳（毫秒）
      const timestamp = data.currentTime;
      const serverTime = new Date(timestamp);
      
      // 计算本地时间与服务器时间的偏移量
      const localTime = new Date();
      const utcTime = new Date(localTime.getTime() + localTime.getTimezoneOffset() * 60 * 1000);
      const localBeijingTime = new Date(utcTime.getTime() + BEIJING_OFFSET);
      
      // 计算偏移量（毫秒）
      timeOffset = serverTime.getTime() - localBeijingTime.getTime();
      
      // 设置徽章背景颜色为绿色，表示同步成功
      chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
      console.log('成功从苏宁易购API获取北京时间，偏移量：', timeOffset, 'ms');
    })
    .catch(error => {
      console.error('获取时间失败:', error);
      // 设置徽章背景颜色为橙色，表示使用本地计算的时间
      chrome.action.setBadgeBackgroundColor({ color: '#FF9800' });
    });
}

// 监听来自popup的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "getTimeOffset") {
    sendResponse({timeOffset: timeOffset});
  }
  return true; // 保持通道开放，支持异步响应
});

// 当浏览器启动时也运行
chrome.runtime.onStartup.addListener(() => {
  updateBadgeTime();
  fetchAccurateTime();
}); 