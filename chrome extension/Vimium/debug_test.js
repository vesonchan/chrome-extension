// 调试测试脚本
// 在浏览器控制台中运行来测试消息传递

function testMessagePassing() {
  console.log('=== 开始测试消息传递 ===');
  
  // 测试新建标签页
  console.log('1. 测试新建标签页...');
  chrome.runtime.sendMessage({ action: 'newTab' }, (response) => {
    console.log('新建标签页响应:', response);
    if (chrome.runtime.lastError) {
      console.error('新建标签页错误:', chrome.runtime.lastError);
    }
  });
  
  // 测试获取所有标签页
  setTimeout(() => {
    console.log('2. 测试获取所有标签页...');
    chrome.runtime.sendMessage({ action: 'getAllTabs' }, (response) => {
      console.log('获取标签页响应:', response);
      if (chrome.runtime.lastError) {
        console.error('获取标签页错误:', chrome.runtime.lastError);
      }
    });
  }, 1000);
  
  // 测试标签页切换
  setTimeout(() => {
    console.log('3. 测试标签页切换...');
    chrome.runtime.sendMessage({ action: 'nextTab' }, (response) => {
      console.log('标签页切换响应:', response);
      if (chrome.runtime.lastError) {
        console.error('标签页切换错误:', chrome.runtime.lastError);
      }
    });
  }, 2000);
  
  // 测试后退
  setTimeout(() => {
    console.log('4. 测试后退...');
    chrome.runtime.sendMessage({ action: 'goBack' }, (response) => {
      console.log('后退响应:', response);
      if (chrome.runtime.lastError) {
        console.error('后退错误:', chrome.runtime.lastError);
      }
    });
  }, 3000);
}

// 检查运行环境
function checkEnvironment() {
  console.log('=== 检查运行环境 ===');
  
  // 检查Chrome API
  if (typeof chrome !== 'undefined') {
    console.log('✅ Chrome API可用');
    
    if (chrome.runtime) {
      console.log('✅ chrome.runtime API可用');
      console.log('Extension ID:', chrome.runtime.id);
    } else {
      console.log('❌ chrome.runtime API不可用');
    }
    
    if (chrome.tabs) {
      console.log('✅ chrome.tabs API可用');
    } else {
      console.log('❌ chrome.tabs API不可用');
    }
  } else {
    console.log('❌ Chrome API不可用');
  }
  
  // 检查Vimium实例
  if (typeof vimium !== 'undefined') {
    console.log('✅ Vimium实例存在');
    console.log('Vimium enabled:', vimium.enabled);
  } else {
    console.log('❌ Vimium实例不存在');
  }
}

// 测试键盘事件
function testKeyboardEvent() {
  console.log('=== 测试键盘事件 ===');
  
  // 模拟键盘事件
  const event = new KeyboardEvent('keydown', {
    key: 't',
    code: 'KeyT',
    bubbles: true,
    cancelable: true
  });
  
  console.log('发送模拟键盘事件:', event);
  document.dispatchEvent(event);
}

// 运行所有测试
function runAllTests() {
  checkEnvironment();
  setTimeout(() => testMessagePassing(), 500);
  setTimeout(() => testKeyboardEvent(), 4000);
}

// 导出测试函数
window.debugVimium = {
  checkEnvironment,
  testMessagePassing,
  testKeyboardEvent,
  runAllTests
};

console.log('调试脚本已加载，使用方法：');
console.log('- debugVimium.checkEnvironment() - 检查运行环境');
console.log('- debugVimium.testMessagePassing() - 测试消息传递');
console.log('- debugVimium.testKeyboardEvent() - 测试键盘事件');
console.log('- debugVimium.runAllTests() - 运行所有测试'); 