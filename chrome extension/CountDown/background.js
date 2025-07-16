// 初始化扩展
chrome.runtime.onInstalled.addListener(function(details) {
  console.log('🚀 扩展安装/更新，原因:', details.reason);
  
  // 清除所有现有的alarms
  chrome.alarms.clearAll();
  
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
  // 首先检查通知权限
  if (!chrome.notifications) {
    console.error('Notifications API not available');
    return;
  }
  
  // 创建通知ID以便追踪
  const notificationId = `timer-${Date.now()}`;
  
  try {
    chrome.notifications.create(notificationId, {
      type: 'basic',
      iconUrl: 'images/icon128.png',
      title: '⏰ 计时器完成',
      message: `${minutes}分钟的倒计时已完成！`,
      priority: 2,
      requireInteraction: false, // 允许自动关闭
      silent: false // 确保有声音提示
    }, function(createdNotificationId) {
      if (chrome.runtime.lastError) {
        console.error('创建通知失败:', chrome.runtime.lastError.message);
        // 降级为自定义通知方案，避免使用alert
        console.log('使用控制台日志作为备选通知方案');
        window.console.log(`⏰ 倒计时完成提醒: ${minutes}分钟的倒计时已完成！`);
      } else {
        console.log('通知创建成功:', createdNotificationId);
        
        // 5秒后自动清除通知
        setTimeout(() => {
          chrome.notifications.clear(notificationId, function(wasCleared) {
            if (wasCleared) {
              console.log('通知已自动清除:', notificationId);
            }
          });
        }, 3000);
      }
    });
  } catch (error) {
    console.error('通知创建异常:', error);
    // 异常情况下也不使用alert，避免阻塞用户
    console.log('使用控制台日志作为备选通知方案');
    window.console.log(`⏰ 倒计时完成提醒: ${minutes}分钟的倒计时已完成！`);
  }
}

// 处理通知点击事件
chrome.notifications.onClicked.addListener(function(notificationId) {
  // 点击通知时打开扩展弹窗
  chrome.action.openPopup();
  // 关闭通知
  chrome.notifications.clear(notificationId);
});

// 监听消息
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === 'startAllTimers') {
    startAllTimers();
  } else if (message.action === 'stopAllTimers') {
    stopAllTimers();
  } else if (message.action === 'updateSchedule') {
    // 当定时设置更新时，记录日志
    console.log('定时设置已更新，重新检查定时');
    
    // 检查是否设置了开始时间，如果设置了并且当前正在运行，需要先停止
    chrome.storage.local.get(['scheduleSettings', 'isRunning'], function(result) {
      const scheduleSettings = result.scheduleSettings || {};
      const isRunning = result.isRunning || false;
      
      if (scheduleSettings.startTime && isRunning) {
        console.log('检测到设置了开始时间且当前正在运行，将在开始时间启动，现在先停止当前运行的倒计时');
        stopAllTimers();
      }
      
      // 立即检查一次定时设置
      checkSchedule();
    });
  } else if (message.action === 'testScheduleCheck') {
    // 测试定时检查功能
    console.log('🧪 手动触发定时检查测试');
    checkSchedule();
    sendResponse({ success: true });
    return true; // 保持消息通道开放
  }
});

// 定期检查计时器状态，确保在重启浏览器后能够继续运行
chrome.runtime.onStartup.addListener(function() {
  console.log('🔄 浏览器启动，重新初始化扩展');
  // 启动定时检查器
  startScheduleChecker();
  
  chrome.storage.local.get(['isRunning'], function(result) {
    if (result.isRunning) {
      startAllTimers();
    }
  });
});



// 定时检查器 - 检查是否到了开始或停止时间
function startScheduleChecker() {
  // 创建Chrome Alarms以确保定时检查的可靠性
  chrome.alarms.create('scheduleChecker', {
    delayInMinutes: 0, // 立即开始
    periodInMinutes: 0.0167 // 每秒检查一次（1/60分钟）
  });
  
  // 立即检查一次
  checkSchedule();
}

// 监听Alarms事件
chrome.alarms.onAlarm.addListener(function(alarm) {
  if (alarm.name === 'scheduleChecker') {
    checkSchedule();
  }
});

// 时间匹配函数 - 支持HH:MM和HH:MM:SS格式比较
function isTimeMatch(setTime, currentTime) {
  if (!setTime || !currentTime) return false;
  
  // 如果设置的时间是HH:MM格式，只比较小时和分钟
  if (setTime.length === 5 && setTime.includes(':')) {
    // 设置时间格式：HH:MM，当前时间格式：HH:MM:SS
    const currentHM = currentTime.substring(0, 5); // 取前5位 HH:MM
    return setTime === currentHM;
  }
  
  // 如果设置的时间是HH:MM:SS格式，精确比较
  if (setTime.length === 8 && setTime.split(':').length === 3) {
    return setTime === currentTime;
  }
  
  return false;
}

// 检查定时设置
function checkSchedule() {
  chrome.storage.local.get(['scheduleSettings', 'isRunning', 'timers'], function(result) {
    const scheduleSettings = result.scheduleSettings || {};
    const isRunning = result.isRunning || false;
    const timers = result.timers || [];
    
    // 如果没有设置，则不执行任何操作
    if (!scheduleSettings.startTime && !scheduleSettings.stopTime) {
      return;
    }
    
    // 获取当前时间（精确到秒）
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentSeconds = now.getSeconds();
    const currentTimeString = `${currentHours.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}:${currentSeconds.toString().padStart(2, '0')}`;
    
    // 增加更详细的日志（每10秒记录一次，避免日志过多）
    if (currentSeconds % 10 === 0) {
      console.log('🕐 定时检查详情:');
      console.log('- 当前时间:', currentTimeString);
      console.log('- 设置开始时间:', scheduleSettings.startTime);
      console.log('- 设置停止时间:', scheduleSettings.stopTime);
      console.log('- 运行状态:', isRunning);
      console.log('- 倒计时器数量:', timers.length);
    }
    
    // 检查是否到了开始时间（支持HH:MM和HH:MM:SS格式）
    if (scheduleSettings.startTime && isTimeMatch(scheduleSettings.startTime, currentTimeString) && !isRunning) {
      console.log('🚀 到达开始时间，准备启动倒计时!');
      // 确保有倒计时器存在才启动
      if (timers.length > 0) {
        console.log('✅ 启动所有倒计时器');
        startAllTimers();
        
        // 发送通知告知用户已自动开始
        if (chrome.notifications) {
          const startNotificationId = `auto-start-${Date.now()}`;
          chrome.notifications.create(startNotificationId, {
            type: 'basic',
            iconUrl: 'images/icon128.png',
            title: '⏰ 定时启动',
            message: `倒计时已按计划在 ${scheduleSettings.startTime} 自动开始！`,
            priority: 1,
            requireInteraction: false
          }, function(createdId) {
            if (createdId) {
              // 3秒后自动清除通知
              setTimeout(() => {
                chrome.notifications.clear(startNotificationId);
              }, 3000);
            }
          });
        }
      } else {
        console.log('❌ 没有倒计时器，无法启动');
      }
    }
    
    // 检查是否到了停止时间（支持HH:MM和HH:MM:SS格式）
    if (scheduleSettings.stopTime && isTimeMatch(scheduleSettings.stopTime, currentTimeString) && isRunning) {
      console.log('🛑 到达停止时间，停止倒计时');
      stopAllTimers();
      
      // 发送通知告知用户已自动停止
      if (chrome.notifications) {
        const stopNotificationId = `auto-stop-${Date.now()}`;
        chrome.notifications.create(stopNotificationId, {
          type: 'basic',
          iconUrl: 'images/icon128.png',
          title: '⏹️ 定时停止',
          message: `倒计时已按计划在 ${scheduleSettings.stopTime} 自动停止！`,
          priority: 1,
          requireInteraction: false
        }, function(createdId) {
          if (createdId) {
            // 3秒后自动清除通知
            setTimeout(() => {
              chrome.notifications.clear(stopNotificationId);
            }, 3000);
          }
        });
      }
    }
  });
} 