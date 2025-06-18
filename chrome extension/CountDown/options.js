document.addEventListener('DOMContentLoaded', function() {
  const notificationStatus = document.getElementById('notification-status');
  const testNotificationBtn = document.getElementById('test-notification');
  const checkPermissionsBtn = document.getElementById('check-permissions');
  const clearStorageBtn = document.getElementById('clear-storage');
  const reloadExtensionBtn = document.getElementById('reload-extension');
  const debugInfo = document.getElementById('debug-info');

  // 检查通知权限状态
  function checkNotificationPermissions() {
    notificationStatus.textContent = '检查中...';
    notificationStatus.className = 'status';
    
    try {
      // 检查Notifications API是否可用
      if (!chrome.notifications) {
        notificationStatus.textContent = '❌ 通知API不可用';
        notificationStatus.className = 'status error';
        return;
      }
      
      // 检查权限
      chrome.permissions.contains({
        permissions: ['notifications']
      }, function(hasPermission) {
        if (hasPermission) {
          notificationStatus.textContent = '✅ 通知权限已启用';
          notificationStatus.className = 'status success';
          
          // 显示额外的调试信息
          showDebugInfo();
        } else {
          notificationStatus.textContent = '⚠️ 通知权限未启用，请在Chrome扩展管理页面中启用';
          notificationStatus.className = 'status warning';
        }
      });
    } catch (error) {
      notificationStatus.textContent = `❌ 检查权限时出错: ${error.message}`;
      notificationStatus.className = 'status error';
    }
  }

  // 显示调试信息
  function showDebugInfo() {
    const userAgent = navigator.userAgent;
    const isMac = /Mac OS X/.test(userAgent);
    const chromeVersion = userAgent.match(/Chrome\/(\d+)/);
    
    let debugText = `系统信息:\n`;
    debugText += `操作系统: ${isMac ? 'macOS' : '其他'}\n`;
    debugText += `浏览器: ${chromeVersion ? `Chrome ${chromeVersion[1]}` : '未知'}\n`;
    debugText += `扩展API版本: ${chrome.runtime.getManifest().manifest_version}\n`;
    debugText += `通知API可用: ${chrome.notifications ? '是' : '否'}\n`;
    
    debugInfo.textContent = debugText;
  }

  // 测试通知
  function testNotification() {
    testNotificationBtn.disabled = true;
    testNotificationBtn.textContent = '发送中...';
    
    try {
      const notificationId = `test-${Date.now()}`;
      
      chrome.notifications.create(notificationId, {
        type: 'basic',
        iconUrl: 'images/icon128.png',
        title: '🧪 测试通知',
        message: '如果您看到这条消息，说明通知功能正常工作！',
        priority: 2,
        requireInteraction: true,
        silent: false
      }, function(createdId) {
        testNotificationBtn.disabled = false;
        testNotificationBtn.textContent = '测试通知';
        
        if (chrome.runtime.lastError) {
          alert(`测试通知失败: ${chrome.runtime.lastError.message}\n\n请检查系统通知设置。`);
        } else {
          console.log('测试通知发送成功:', createdId);
          
          // 3秒后自动清除测试通知
          setTimeout(() => {
            chrome.notifications.clear(notificationId);
          }, 3000);
        }
      });
    } catch (error) {
      testNotificationBtn.disabled = false;
      testNotificationBtn.textContent = '测试通知';
      alert(`测试通知异常: ${error.message}`);
    }
  }

  // 清除扩展数据
  function clearStorage() {
    if (confirm('确定要清除所有倒计时器数据吗？这将删除所有设置的计时器。')) {
      chrome.storage.local.clear(function() {
        if (chrome.runtime.lastError) {
          alert(`清除数据失败: ${chrome.runtime.lastError.message}`);
        } else {
          alert('扩展数据已清除，请重新设置倒计时器。');
        }
      });
    }
  }

  // 重新加载扩展
  function reloadExtension() {
    if (confirm('重新加载扩展将停止所有正在运行的倒计时器，确定继续吗？')) {
      chrome.runtime.reload();
    }
  }

  // 绑定事件监听器
  testNotificationBtn.addEventListener('click', testNotification);
  checkPermissionsBtn.addEventListener('click', checkNotificationPermissions);
  clearStorageBtn.addEventListener('click', clearStorage);
  reloadExtensionBtn.addEventListener('click', reloadExtension);

  // 页面加载时检查权限
  checkNotificationPermissions();
  
  // 监听通知点击事件
  if (chrome.notifications && chrome.notifications.onClicked) {
    chrome.notifications.onClicked.addListener(function(notificationId) {
      if (notificationId.startsWith('test-')) {
        chrome.notifications.clear(notificationId);
        alert('测试通知点击成功！通知功能正常。');
      }
    });
  }
}); 