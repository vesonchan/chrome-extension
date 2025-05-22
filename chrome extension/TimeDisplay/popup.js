// 获取并显示北京时间
document.addEventListener('DOMContentLoaded', function() {
  // 获取DOM元素
  const beijingTimeElement = document.getElementById('beijing-time');
  const dateElement = document.getElementById('date');
  const statusElement = document.getElementById('status');
  
  // MV3中无法直接访问background脚本，使用消息传递
  chrome.runtime.sendMessage({action: "getTimeOffset"}, function(response) {
    if (response && response.timeOffset !== undefined) {
      statusElement.textContent = `时间已同步 (偏移: ${Math.round(response.timeOffset/1000)}秒)`;
      updateWithOffset(response.timeOffset);
    } else {
      // 如果无法获取偏移量，则使用API获取时间
      statusElement.textContent = '正在从API获取时间...';
      fetchTimeFromAPI();
    }
  });
  
  // 使用偏移量更新时间
  function updateWithOffset(offset) {
    // 计算北京时间
    const localTime = new Date();
    const utcTime = new Date(localTime.getTime() + localTime.getTimezoneOffset() * 60 * 1000);
    const beijingOffset = 8 * 60 * 60 * 1000; // 北京时区UTC+8
    const beijingTime = new Date(utcTime.getTime() + beijingOffset + offset);
    
    // 更新显示
    updateDisplay(beijingTime);
    
    // 每秒更新一次
    setInterval(function() {
      const now = new Date();
      const utc = new Date(now.getTime() + now.getTimezoneOffset() * 60 * 1000);
      const bjTime = new Date(utc.getTime() + beijingOffset + offset);
      updateDisplay(bjTime);
    }, 1000);
  }
  
  // 从API获取时间
  function fetchTimeFromAPI() {
    beijingTimeElement.textContent = "正在获取...";
    
    // 使用WorldTime API获取北京时间
    fetch('https://worldtimeapi.org/api/timezone/Asia/Shanghai')
      .then(response => {
        if (!response.ok) {
          throw new Error('网络响应不正常');
        }
        return response.json();
      })
      .then(data => {
        // 处理API返回的数据
        const dateTime = new Date(data.datetime);
        
        // 计算本地时间与服务器时间的偏移量
        const localTime = new Date();
        const utcTime = new Date(localTime.getTime() + localTime.getTimezoneOffset() * 60 * 1000);
        const beijingOffset = 8 * 60 * 60 * 1000; // 北京时区UTC+8
        const localBeijingTime = new Date(utcTime.getTime() + beijingOffset);
        const offset = dateTime.getTime() - localBeijingTime.getTime();
        
        // 更新状态
        statusElement.textContent = `时间已同步 (偏移: ${Math.round(offset/1000)}秒)`;
        
        // 更新显示
        updateWithOffset(offset);
      })
      .catch(error => {
        console.error('获取时间失败:', error);
        // 使用本地时间作为备选
        updateWithOffset(0);
        statusElement.textContent = '获取API时间失败，使用本地时间';
        statusElement.classList.add('error');
      });
  }
  
  // 更新时间显示
  function updateDisplay(dateTime) {
    // 移除加载中状态
    beijingTimeElement.classList.remove('loading');
    
    // 格式化时间 HH:MM:SS
    const hours = dateTime.getHours().toString().padStart(2, '0');
    const minutes = dateTime.getMinutes().toString().padStart(2, '0');
    const seconds = dateTime.getSeconds().toString().padStart(2, '0');
    
    // 清除现有内容
    beijingTimeElement.innerHTML = '';
    
    // 创建时分元素
    const timeSpan = document.createElement('span');
    timeSpan.textContent = `${hours}:${minutes}:`;
    beijingTimeElement.appendChild(timeSpan);
    
    // 创建秒元素，使用不同颜色
    const secondsSpan = document.createElement('span');
    secondsSpan.textContent = seconds;
    secondsSpan.className = 'seconds';
    beijingTimeElement.appendChild(secondsSpan);
    
    // 格式化日期
    const year = dateTime.getFullYear();
    const month = (dateTime.getMonth() + 1).toString().padStart(2, '0');
    const day = dateTime.getDate().toString().padStart(2, '0');
    const weekday = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][dateTime.getDay()];
    dateElement.textContent = `${year}年${month}月${day}日 ${weekday}`;
  }
}); 