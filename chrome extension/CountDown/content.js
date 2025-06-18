// 内容脚本 - 处理来自后台脚本的消息
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === 'showAlert') {
    // 显示浏览器原生alert作为通知的备选方案
    alert(message.message);
    sendResponse({success: true});
  }
});

// 检查是否已经注入脚本，避免重复注入
if (!window.timerExtensionInjected) {
  window.timerExtensionInjected = true;
  console.log('倒计时器扩展内容脚本已加载');
} 