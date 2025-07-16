// 内容脚本 - 处理来自后台脚本的消息
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === 'showAlert') {
    // 不再使用alert，改为在控制台记录日志
    window.console.log('倒计时完成通知:', message.message);
    sendResponse({success: true});
  }
});

// 检查是否已经注入脚本，避免重复注入
if (!window.timerExtensionInjected) {
  window.timerExtensionInjected = true;
  console.log('倒计时器扩展内容脚本已加载');
} 