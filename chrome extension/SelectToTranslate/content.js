// 翻译气泡元素
let translationBubble = null;
let isTranslating = false;

// 创建翻译气泡
function createTranslationBubble() {
  const bubble = document.createElement('div');
  bubble.id = 'translation-bubble';
  bubble.style.cssText = `
    position: absolute;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    max-width: 300px;
    font-size: 14px;
    line-height: 1.4;
    display: none;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  
  bubble.innerHTML = `
    <div style="margin-bottom: 8px; font-weight: bold; color: #333;">翻译结果</div>
    <div id="translation-result" style="color: #666; min-height: 20px;">翻译中...</div>
    <div style="margin-top: 8px; text-align: right;">
      <button id="close-translation" style="background: none; border: none; color: #999; cursor: pointer; font-size: 12px;">✕</button>
    </div>
  `;
  
  document.body.appendChild(bubble);
  
  // 关闭按钮事件
  bubble.querySelector('#close-translation').addEventListener('click', hideTranslationBubble);
  
  return bubble;
}

// 显示翻译气泡
function showTranslationBubble(x, y, text) {
  if (!translationBubble) {
    translationBubble = createTranslationBubble();
  }
  
  const resultDiv = translationBubble.querySelector('#translation-result');
  resultDiv.textContent = '翻译中...';
  
  // 位置调整
  translationBubble.style.left = Math.min(x, window.innerWidth - 320) + 'px';
  translationBubble.style.top = (y - 10) + 'px';
  translationBubble.style.display = 'block';
  
  // 请求翻译
  chrome.runtime.sendMessage({
    action: 'translate',
    text: text
  }, (response) => {
    if (response && response.translation) {
      resultDiv.textContent = response.translation;
    } else {
      resultDiv.textContent = '翻译失败，请重试';
    }
  });
}

// 隐藏翻译气泡
function hideTranslationBubble() {
  if (translationBubble) {
    translationBubble.style.display = 'none';
  }
}

// 检测文本选择
function handleTextSelection() {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  
  if (selectedText && selectedText.length > 0 && selectedText.length < 500) {
    // 检查是否是英文文本
    if (/^[a-zA-Z\s\.,!?;:'"()-]+$/.test(selectedText)) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // 显示翻译气泡
      showTranslationBubble(
        rect.left + window.scrollX,
        rect.top + window.scrollY - 80,
        selectedText
      );
    }
  } else {
    hideTranslationBubble();
  }
}

// 延迟处理选择，避免频繁触发
let selectionTimeout;
document.addEventListener('mouseup', () => {
  clearTimeout(selectionTimeout);
  selectionTimeout = setTimeout(handleTextSelection, 200);
});

// 点击其他地方时隐藏气泡
document.addEventListener('click', (e) => {
  if (translationBubble && !translationBubble.contains(e.target)) {
    hideTranslationBubble();
  }
});

// 滚动时隐藏气泡
document.addEventListener('scroll', hideTranslationBubble);

console.log('划词翻译插件已加载'); 