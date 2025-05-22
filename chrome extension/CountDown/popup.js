document.addEventListener('DOMContentLoaded', function() {
  // 获取DOM元素
  const timersContainer = document.getElementById('timers-container');
  const minutesInput = document.getElementById('minutes-input');
  const addTimerBtn = document.getElementById('add-timer-btn');
  const startAllBtn = document.getElementById('start-all-btn');
  const stopAllBtn = document.getElementById('stop-all-btn');
  
  // 定时控制元素
  const startTimeInput = document.getElementById('start-time');
  const stopTimeInput = document.getElementById('stop-time');
  const saveScheduleBtn = document.getElementById('save-schedule-btn');
  
  // 初始化加载保存的计时器
  loadTimers();
  
  // 加载定时设置
  loadSchedule();
  
  // 添加计时器按钮点击事件
  addTimerBtn.addEventListener('click', function() {
    const minutes = parseInt(minutesInput.value);
    if (isNaN(minutes) || minutes <= 0) {
      alert('请输入有效的分钟数！');
      return;
    }
    
    addTimer(minutes);
    minutesInput.value = '';
  });
  
  // 开始所有计时器按钮点击事件
  startAllBtn.addEventListener('click', function() {
    chrome.runtime.sendMessage({ action: 'startAllTimers' });
    window.close(); // 关闭弹出窗口
  });
  
  // 停止所有计时器按钮点击事件
  stopAllBtn.addEventListener('click', function() {
    chrome.runtime.sendMessage({ action: 'stopAllTimers' });
    updateTimersUI();
  });
  
  // 保存定时设置按钮点击事件
  saveScheduleBtn.addEventListener('click', function() {
    const startTime = startTimeInput.value;
    const stopTime = stopTimeInput.value;
    
    // 保存到存储
    chrome.storage.local.set({
      scheduleSettings: {
        startTime: startTime,
        stopTime: stopTime
      }
    }, function() {
      // 发送消息给后台更新定时器
      chrome.runtime.sendMessage({ action: 'updateSchedule' });
      alert('定时设置已保存！');
    });
  });
  
  // 从存储中加载定时设置
  function loadSchedule() {
    chrome.storage.local.get(['scheduleSettings'], function(result) {
      if (result.scheduleSettings) {
        startTimeInput.value = result.scheduleSettings.startTime || '';
        stopTimeInput.value = result.scheduleSettings.stopTime || '';
      }
    });
  }
  
  // 从存储中加载计时器
  function loadTimers() {
    chrome.storage.local.get(['timers', 'isRunning'], function(result) {
      const timers = result.timers || [];
      
      // 清空计时器容器
      timersContainer.innerHTML = '';
      
      if (timers.length === 0) {
        timersContainer.innerHTML = '<p class="no-timers">没有设置倒计时</p>';
        return;
      }
      
      // 添加每个计时器到UI
      timers.forEach((timer, index) => {
        createTimerElement(timer, index);
      });
    });
  }
  
  // 添加新计时器
  function addTimer(minutes) {
    chrome.storage.local.get(['timers'], function(result) {
      const timers = result.timers || [];
      
      // 创建新计时器对象
      const newTimer = {
        id: Date.now(),
        minutes: minutes,
        totalSeconds: minutes * 60,
        remainingSeconds: minutes * 60
      };
      
      // 添加到计时器数组
      timers.push(newTimer);
      
      // 保存到存储
      chrome.storage.local.set({ timers: timers }, function() {
        // 更新UI
        createTimerElement(newTimer, timers.length - 1);
        
        // 如果没有其他计时器，移除"没有计时器"的消息
        const noTimersMsg = document.querySelector('.no-timers');
        if (noTimersMsg) {
          noTimersMsg.remove();
        }
      });
    });
  }
  
  // 创建计时器元素
  function createTimerElement(timer, index) {
    const timerElement = document.createElement('div');
    timerElement.className = 'timer-item';
    timerElement.dataset.id = timer.id;
    
    const minutes = Math.floor(timer.remainingSeconds / 60);
    const seconds = timer.remainingSeconds % 60;
    
    timerElement.innerHTML = `
      <div class="timer-info">
        <span class="timer-duration">${timer.minutes}分钟</span>
        <span class="timer-remaining">${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}</span>
      </div>
      <div class="timer-actions">
        <button class="delete-timer-btn" data-index="${index}">删除</button>
      </div>
    `;
    
    timersContainer.appendChild(timerElement);
    
    // 添加删除按钮点击事件
    timerElement.querySelector('.delete-timer-btn').addEventListener('click', function() {
      deleteTimer(index);
    });
  }
  
  // 删除计时器
  function deleteTimer(index) {
    chrome.storage.local.get(['timers'], function(result) {
      const timers = result.timers || [];
      
      // 移除指定索引的计时器
      timers.splice(index, 1);
      
      // 保存到存储
      chrome.storage.local.set({ timers: timers }, function() {
        // 重新加载UI
        loadTimers();
      });
    });
  }
  
  // 更新计时器UI
  function updateTimersUI() {
    loadTimers();
  }
});

// 监听来自后台的消息
chrome.runtime.onMessage.addListener(function(message) {
  if (message.action === 'updateTimers') {
    // 当计时器状态改变时更新UI
    const timersContainer = document.getElementById('timers-container');
    if (timersContainer) {
      loadTimers();
    }
  }
}); 