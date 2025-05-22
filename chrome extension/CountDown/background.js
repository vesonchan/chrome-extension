// 初始化扩展
chrome.runtime.onInstalled.addListener(function() {
  // 初始化存储
  chrome.storage.local.set({
    timers: [],
    isRunning: false,
    timerInterval: null,
    scheduleSettings: {
      startTime: '',
      stopTime: ''
    }
  });
  
  // 设置徽章样式
  chrome.action.setBadgeBackgroundColor({ color: '#888888' });
  chrome.action.setBadgeTextColor({ color: '#FFFFFF' });
  
  // 启动定时检查
  startScheduleChecker();
});

// 每秒更新倒计时
let timerInterval = null;

// 启动所有计时器
function startAllTimers() {
  chrome.storage.local.get(['timers'], function(result) {
    const timers = result.timers || [];
    
    if (timers.length === 0) {
      return;
    }
    
    // 设置正在运行状态
    chrome.storage.local.set({ isRunning: true });
    
    // 清除之前的计时器
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    
    // 创建新的计时器
    timerInterval = setInterval(updateTimers, 1000);
    
    // 立即更新一次，以显示最新状态
    updateTimers();
  });
}

// 停止所有计时器
function stopAllTimers() {
  // 清除计时器
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  // 设置为非运行状态
  chrome.storage.local.set({ isRunning: false });
  
  // 恢复所有计时器到初始状态
  chrome.storage.local.get(['timers'], function(result) {
    const timers = result.timers || [];
    
    const resetTimers = timers.map(timer => ({
      ...timer,
      remainingSeconds: timer.totalSeconds
    }));
    
    chrome.storage.local.set({ timers: resetTimers });
    
    // 更新图标
    updateBadgeText();
  });
}

// 更新所有计时器
function updateTimers() {
  chrome.storage.local.get(['timers', 'isRunning'], function(result) {
    const timers = result.timers || [];
    const isRunning = result.isRunning;
    
    if (!isRunning || timers.length === 0) {
      return;
    }
    
    let timerCompleted = false;
    let completedTimerMinutes = 0;
    
    // 更新每个计时器的剩余时间
    const updatedTimers = timers.map(timer => {
      if (timer.remainingSeconds <= 0) {
        // 计时器已结束，重置为初始状态开始新一轮
        timerCompleted = true;
        completedTimerMinutes = timer.minutes;
        return {
          ...timer,
          remainingSeconds: timer.totalSeconds
        };
      } else {
        // 减少剩余时间
        return {
          ...timer,
          remainingSeconds: timer.remainingSeconds - 1
        };
      }
    });
    
    // 保存更新后的计时器
    chrome.storage.local.set({ timers: updatedTimers });
    
    // 更新图标
    updateBadgeText();
    
    // 如果有计时器完成，显示通知
    if (timerCompleted) {
      showTimerCompletedNotification(completedTimerMinutes);
    }
  });
}

// 更新图标上的文本
function updateBadgeText() {
  chrome.storage.local.get(['timers', 'isRunning'], function(result) {
    const timers = result.timers || [];
    const isRunning = result.isRunning;
    
    if (!isRunning || timers.length === 0) {
      // 如果没有运行中的计时器，清除图标上的文本
      chrome.action.setBadgeText({ text: '' });
      return;
    }
    
    // 找出剩余时间最少的计时器
    const shortestTimer = timers.reduce((shortest, current) => {
      return (shortest.remainingSeconds < current.remainingSeconds) ? shortest : current;
    }, timers[0]);
    
    // 计算分钟和秒
    const minutes = Math.floor(shortestTimer.remainingSeconds / 60);
    const seconds = shortestTimer.remainingSeconds % 60;
    
    // 为所有尺寸创建图标
    const imageData = {};
    const sizes = [16, 32, 48, 128];
    
    sizes.forEach(size => {
      // 创建图标 - 分钟和秒数垂直排列
      const canvas = new OffscreenCanvas(size, size);
      const ctx = canvas.getContext('2d');
      
      // 设置背景 - 橙色背景
      ctx.fillStyle = '#FF9800'; // 橙色背景
      ctx.fillRect(0, 0, size, size);
      
      // 设置文本样式
      ctx.textAlign = 'center';
      ctx.fillStyle = 'white';
      
      // 计算字体大小 - 大幅增大以填满图标
      const minutesFontSize = Math.floor(size * 0.65); // 大幅增大字体尺寸
      const secondsFontSize = Math.floor(size * 0.65); // 大幅增大字体尺寸
      
      // 绘制分钟（上）
      ctx.font = `bold ${minutesFontSize}px Arial`;
      ctx.fillText(minutes.toString().padStart(2, '0'), size/2, size * 0.45);
      
      // 绘制秒数（下）
      ctx.font = `bold ${secondsFontSize}px Arial`;
      ctx.fillText(seconds.toString().padStart(2, '0'), size/2, size * 0.90);
      
      // 存储图像数据
      imageData[size] = ctx.getImageData(0, 0, size, size);
    });
    
    // 设置图标
    chrome.action.setIcon({ imageData: imageData });
    
    // 清除徽章文本
    chrome.action.setBadgeText({ text: '' });
  });
}

// 显示计时器完成通知
function showTimerCompletedNotification(minutes) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'images/icon128.png',
    title: '计时器完成',
    message: `${minutes}分钟的倒计时已完成！`,
    priority: 2
  });
}

// 监听消息
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === 'startAllTimers') {
    startAllTimers();
  } else if (message.action === 'stopAllTimers') {
    stopAllTimers();
  } else if (message.action === 'updateSchedule') {
    // 当定时设置更新时，记录日志
    console.log('定时设置已更新，重新检查定时');
    checkSchedule(); // 立即检查一次
  }
});

// 定期检查计时器状态，确保在重启浏览器后能够继续运行
chrome.runtime.onStartup.addListener(function() {
  chrome.storage.local.get(['isRunning'], function(result) {
    if (result.isRunning) {
      startAllTimers();
    }
  });
});

// 定时检查器 - 检查是否到了开始或停止时间
function startScheduleChecker() {
  // 每分钟检查一次
  setInterval(checkSchedule, 60 * 1000);
  // 立即检查一次
  checkSchedule();
}

// 检查定时设置
function checkSchedule() {
  chrome.storage.local.get(['scheduleSettings', 'isRunning'], function(result) {
    const scheduleSettings = result.scheduleSettings || {};
    const isRunning = result.isRunning || false;
    
    // 如果没有设置，则不执行任何操作
    if (!scheduleSettings.startTime && !scheduleSettings.stopTime) {
      return;
    }
    
    // 获取当前时间
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeString = `${currentHours.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;
    
    console.log('定时检查 - 当前时间:', currentTimeString);
    
    // 检查是否到了开始时间
    if (scheduleSettings.startTime && scheduleSettings.startTime === currentTimeString && !isRunning) {
      console.log('到达开始时间，启动倒计时');
      startAllTimers();
    }
    
    // 检查是否到了停止时间
    if (scheduleSettings.stopTime && scheduleSettings.stopTime === currentTimeString && isRunning) {
      console.log('到达停止时间，停止倒计时');
      stopAllTimers();
    }
  });
} 