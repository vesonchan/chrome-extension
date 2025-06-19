// Vimium Clone - 内容脚本
class VimiumClone {
  constructor() {
    this.enabled = true;
    this.linkHintsVisible = false;
    this.hintElements = [];
    this.hintMarkers = [];
    this.currentHintPrefix = '';
    this.scrollStep = 60;
    
    // 长按滚动相关
    this.keyRepeatTimer = null;
    this.keyRepeatDelay = 300; // 首次重复延迟
    this.keyRepeatInterval = 16; // 后续重复间隔 (~60fps)
    this.pressedKeys = new Set();
    this.smoothScrolling = false;
    this.smoothScrollTimer = null;
    
    // 标签搜索相关
    this.tabSearchVisible = false;
    this.tabSearchResults = [];
    
    this.init();
  }
  
  init() {
    this.bindEvents();
    this.loadSettings();
  }
  
  bindEvents() {
    // 键盘事件监听
    document.addEventListener('keydown', (e) => {
      if (!this.enabled) return;
      
      // 如果正在输入框中，不处理快捷键
      if (this.isInInputField(e.target)) return;
      
      // 如果标签搜索可见，处理搜索输入
      if (this.tabSearchVisible) {
        this.handleTabSearchKey(e);
        return;
      }
      
      this.handleKeyDown(e);
    });
    
    // 键盘抬起事件，用于停止长按滚动
    document.addEventListener('keyup', (e) => {
      if (!this.enabled) return;
      
      this.handleKeyUp(e);
    });
    
    // 防止在输入框中触发快捷键
    document.addEventListener('focusin', (e) => {
      if (this.isInInputField(e.target)) {
        this.hideHints();
        this.hideTabSearch();
      }
    });
  }
  
  isInInputField(element) {
    const inputTypes = ['input', 'textarea', 'select'];
    const editableElements = element.isContentEditable;
    return inputTypes.includes(element.tagName.toLowerCase()) || editableElements;
  }
  
  handleKeyDown(e) {
    console.log('Vimium: 按键事件 - enabled:', this.enabled, 'key:', e.key, 'target:', e.target.tagName);
    
    // 如果链接提示正在显示，处理提示选择
    if (this.linkHintsVisible) {
      this.handleHintKey(e);
      return;
    }
    
    const key = e.key.toLowerCase();
    
    // 处理长按滚动
    if (['j', 'k', 'h', 'l'].includes(key)) {
      this.pressedKeys.add(key);
      if (!this.keyRepeatTimer) {
        this.startKeyRepeat(key);
      }
    }
    
    // 处理普通快捷键
    switch(key) {
      case 'j':
        e.preventDefault();
        this.scrollDown();
        break;
      case 'k':
        e.preventDefault();
        this.scrollUp();
        break;
      case 'h':
        e.preventDefault();
        this.scrollLeft();
        break;
      case 'l':
        e.preventDefault();
        this.scrollRight();
        break;
      case 'f':
        e.preventDefault();
        this.showLinkHints();
        break;
              case 'a':
          e.preventDefault();
          console.log('Vimium: 按下 a - 后退');
          this.goBack();
          break;
        case 's':
          e.preventDefault();
          console.log('Vimium: 按下 s - 前进');
          this.goForward();
          break;
        case 'q':
          e.preventDefault();
          console.log('Vimium: 按下 q - 前一个标签页');
          this.switchToPrevTab();
          break;
        case 'w':
          e.preventDefault();
          console.log('Vimium: 按下 w - 后一个标签页');
          this.switchToNextTab();
          break;
        case 'e':
          e.preventDefault();
          console.log('Vimium: 按下 e - 最后一个标签页');
          this.switchToLastTab();
          break;
              case 't':
          if (e.shiftKey) {
            // T - 显示标签搜索
            e.preventDefault();
            console.log('Vimium: 按下 T - 显示标签搜索');
            this.showTabSearch();
          } else {
            // t - 新建标签页
            e.preventDefault();
            console.log('Vimium: 按下 t - 新建标签页');
            this.newTab();
          }
          break;
        case 'x':
          if (e.shiftKey) {
            // X - 恢复关闭的标签页
            e.preventDefault();
            console.log('Vimium: 按下 X - 恢复标签页');
            this.restoreTab();
          } else {
            // x - 关闭当前标签页
            e.preventDefault();
            console.log('Vimium: 按下 x - 关闭标签页');
            this.closeTab();
          }
          break;
      case 'g':
        if (e.shiftKey) {
          e.preventDefault();
          this.scrollToBottom();
        } else {
          // 等待第二个g
          this.handleGKey(e);
        }
        break;
      case 'r':
        e.preventDefault();
        location.reload();
        break;
      case 'y':
        if (e.shiftKey) {
          e.preventDefault();
          this.copyUrl();
        }
        break;
      case 'escape':
        e.preventDefault();
        this.hideHints();
        this.hideTabSearch();
        break;
    }
  }
  
  handleKeyUp(e) {
    const key = e.key.toLowerCase();
    
    // 停止长按滚动
    if (['j', 'k', 'h', 'l'].includes(key)) {
      this.pressedKeys.delete(key);
      if (this.pressedKeys.size === 0) {
        this.stopKeyRepeat();
      }
    }
  }
  
  handleGKey(e) {
    e.preventDefault();
    // 设置一个短暂的监听器来等待第二个g
    const secondGListener = (e2) => {
      if (e2.key.toLowerCase() === 'g') {
        e2.preventDefault();
        this.scrollToTop();
      }
      document.removeEventListener('keydown', secondGListener);
    };
    
    document.addEventListener('keydown', secondGListener);
    
    // 500ms后自动移除监听器
    setTimeout(() => {
      document.removeEventListener('keydown', secondGListener);
    }, 500);
  }
  
  // 滚动功能
  scrollDown() {
    this.smoothScroll(0, this.scrollStep);
  }
  
  scrollUp() {
    this.smoothScroll(0, -this.scrollStep);
  }
  
  scrollLeft() {
    this.smoothScroll(-this.scrollStep, 0);
  }
  
  scrollRight() {
    this.smoothScroll(this.scrollStep, 0);
  }
  
  smoothScroll(x, y) {
    // 使用smooth滚动行为
    window.scrollBy({
      left: x,
      top: y,
      behavior: 'smooth'
    });
  }
  
  scrollToTop() {
    window.scrollTo(0, 0);
  }
  
  scrollToBottom() {
    window.scrollTo(0, document.body.scrollHeight);
  }
  
  // 长按滚动功能
  startKeyRepeat(key) {
    // 首次延迟后开始重复
    this.keyRepeatTimer = setTimeout(() => {
      this.keyRepeatTimer = setInterval(() => {
        if (this.pressedKeys.has(key)) {
          // 长按时使用小步长快速滚动，不使用smooth
          const smallStep = Math.ceil(this.scrollStep / 3);
          switch(key) {
            case 'j':
              window.scrollBy(0, smallStep);
              break;
            case 'k':
              window.scrollBy(0, -smallStep);
              break;
            case 'h':
              window.scrollBy(-smallStep, 0);
              break;
            case 'l':
              window.scrollBy(smallStep, 0);
              break;
          }
        }
      }, this.keyRepeatInterval);
    }, this.keyRepeatDelay);
  }
  
  stopKeyRepeat() {
    if (this.keyRepeatTimer) {
      clearTimeout(this.keyRepeatTimer);
      clearInterval(this.keyRepeatTimer);
      this.keyRepeatTimer = null;
    }
  }
  
  // 链接提示功能
  showLinkHints() {
    if (this.linkHintsVisible) return;
    
    this.linkHintsVisible = true;
    this.currentHintPrefix = '';
    
    // 获取所有可点击元素
    this.hintElements = this.getClickableElements();
    
    // 生成提示标签
    this.generateHints();
    
    // 显示提示
    this.displayHints();
  }
  
  getClickableElements() {
    const selectors = [
      'a[href]',
      'button',
      'input[type="button"]',
      'input[type="submit"]',
      'input[type="reset"]',
      'select',
      '[onclick]',
      '[role="button"]',
      '[tabindex]:not([tabindex="-1"])'
    ];
    
    const elements = [];
    selectors.forEach(selector => {
      const found = document.querySelectorAll(selector);
      found.forEach(el => {
        if (this.isElementVisible(el)) {
          elements.push(el);
        }
      });
    });
    
    return elements;
  }
  
  isElementVisible(el) {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    
    return rect.width > 0 && 
           rect.height > 0 && 
           rect.top < window.innerHeight && 
           rect.bottom > 0 && 
           rect.left < window.innerWidth && 
           rect.right > 0 &&
           style.visibility !== 'hidden' && 
           style.display !== 'none';
  }
  
  generateHints() {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    const hints = [];
    
    // 生成足够的提示标签
    let hintIndex = 0;
    for (let i = 0; i < this.hintElements.length; i++) {
      if (hintIndex < alphabet.length) {
        hints.push(alphabet[hintIndex]);
      } else {
        // 如果元素太多，使用两字母组合
        const first = Math.floor((hintIndex - alphabet.length) / alphabet.length);
        const second = (hintIndex - alphabet.length) % alphabet.length;
        hints.push(alphabet[first] + alphabet[second]);
      }
      hintIndex++;
    }
    
    return hints;
  }
  
  displayHints() {
    this.hintMarkers = [];
    const hints = this.generateHints();
    
    this.hintElements.forEach((element, index) => {
      const hint = hints[index];
      const marker = this.createHintMarker(hint, element);
      this.hintMarkers.push(marker);
      document.body.appendChild(marker);
    });
  }
  
  createHintMarker(hint, element) {
    const rect = element.getBoundingClientRect();
    const marker = document.createElement('div');
    
    marker.className = 'vimium-hint';
    marker.textContent = hint.toUpperCase();
    marker.style.position = 'fixed';
    marker.style.left = rect.left + 'px';
    marker.style.top = rect.top + 'px';
    marker.style.zIndex = '2147483647';
    
    return marker;
  }
  
  handleHintKey(e) {
    e.preventDefault();
    
    if (e.key === 'Escape') {
      this.hideHints();
      return;
    }
    
    const key = e.key.toLowerCase();
    if (/^[a-z]$/.test(key)) {
      this.currentHintPrefix += key;
      this.filterHints();
    }
  }
  
  filterHints() {
    let matchedIndex = -1;
    let matchCount = 0;
    
    this.hintMarkers.forEach((marker, index) => {
      const hintText = marker.textContent.toLowerCase();
      if (hintText.startsWith(this.currentHintPrefix)) {
        matchCount++;
        matchedIndex = index;
        marker.style.display = 'block';
        
        // 高亮匹配的字符
        this.highlightMatchedChars(marker, this.currentHintPrefix.length);
      } else {
        marker.style.display = 'none';
      }
    });
    
    // 如果只有一个匹配，自动点击
    if (matchCount === 1) {
      this.clickElement(this.hintElements[matchedIndex]);
      this.hideHints();
    } else if (matchCount === 0) {
      this.hideHints();
    }
  }
  
  highlightMatchedChars(marker, matchedLength) {
    const text = marker.textContent;
    const matched = text.substring(0, matchedLength);
    const remaining = text.substring(matchedLength);
    
    marker.innerHTML = `<span class="vimium-hint-matched">${matched}</span>${remaining}`;
  }
  
  clickElement(element) {
    // 触发点击事件
    element.focus();
    element.click();
  }
  
  hideHints() {
    this.linkHintsVisible = false;
    this.currentHintPrefix = '';
    
    this.hintMarkers.forEach(marker => {
      if (marker.parentNode) {
        marker.parentNode.removeChild(marker);
      }
    });
    
    this.hintMarkers = [];
    this.hintElements = [];
  }
  
  // 复制URL
  copyUrl() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      this.showMessage('URL已复制到剪贴板');
    }).catch(() => {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.showMessage('URL已复制到剪贴板');
    });
  }
  
  showMessage(text) {
    const message = document.createElement('div');
    message.className = 'vimium-message';
    message.textContent = text;
    message.style.position = 'fixed';
    message.style.top = '10px';
    message.style.right = '10px';
    message.style.zIndex = '2147483647';
    
    document.body.appendChild(message);
    
    setTimeout(() => {
      if (message.parentNode) {
        message.parentNode.removeChild(message);
      }
    }, 2000);
  }
  
  // 浏览器导航
  goBack() {
    chrome.runtime.sendMessage({ action: 'goBack' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Go back error:', chrome.runtime.lastError);
        this.showMessage('后退失败');
        return;
      }
      if (response && response.success) {
        this.showMessage('已后退');
      } else {
        this.showMessage('后退失败');
      }
    });
  }
  
  goForward() {
    chrome.runtime.sendMessage({ action: 'goForward' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Go forward error:', chrome.runtime.lastError);
        this.showMessage('前进失败');
        return;
      }
      if (response && response.success) {
        this.showMessage('已前进');
      } else {
        this.showMessage('前进失败');
      }
    });
  }
  
  // 标签页操作
  newTab() {
    console.log('Vimium: 发送新建标签页消息');
    try {
      chrome.runtime.sendMessage({ action: 'newTab' }, (response) => {
        console.log('Vimium: 新建标签页响应:', response);
        console.log('Vimium: chrome.runtime.lastError:', chrome.runtime.lastError);
        if (chrome.runtime.lastError) {
          console.error('New tab error:', chrome.runtime.lastError);
          this.showMessage('新标签页打开失败: ' + chrome.runtime.lastError.message);
          return;
        }
        if (response && response.success) {
          this.showMessage('新标签页已打开');
        } else {
          console.error('New tab failed, response:', response);
          this.showMessage('新标签页打开失败: ' + (response ? response.error : '无响应'));
        }
      });
    } catch (error) {
      console.error('发送消息异常:', error);
      this.showMessage('发送消息异常: ' + error.message);
    }
  }
  
  closeTab() {
    chrome.runtime.sendMessage({ action: 'closeTab' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Close tab error:', chrome.runtime.lastError);
        this.showMessage('标签页关闭失败');
        return;
      }
      if (response && response.success) {
        this.showMessage('标签页已关闭');
      } else {
        this.showMessage('标签页关闭失败');
      }
    });
  }
  
  restoreTab() {
    chrome.runtime.sendMessage({ action: 'restoreTab' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Restore tab error:', chrome.runtime.lastError);
        this.showMessage('标签页恢复失败');
        return;
      }
      if (response && response.success) {
        this.showMessage('标签页已恢复');
      } else {
        this.showMessage(response.error || '没有可恢复的标签页');
      }
    });
  }
  
  switchToPrevTab() {
    chrome.runtime.sendMessage({ action: 'previousTab' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Previous tab error:', chrome.runtime.lastError);
        this.showMessage('切换标签页失败');
        return;
      }
      if (response && response.success) {
        this.showMessage('已切换到前一个标签页');
      } else {
        this.showMessage('切换标签页失败');
      }
    });
  }
  
  switchToNextTab() {
    chrome.runtime.sendMessage({ action: 'nextTab' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Next tab error:', chrome.runtime.lastError);
        this.showMessage('切换标签页失败');
        return;
      }
      if (response && response.success) {
        this.showMessage('已切换到后一个标签页');
      } else {
        this.showMessage('切换标签页失败');
      }
    });
  }
  
  switchToLastTab() {
    chrome.runtime.sendMessage({ action: 'lastTab' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Last tab error:', chrome.runtime.lastError);
        this.showMessage('切换标签页失败');
        return;
      }
      if (response && response.success) {
        this.showMessage('已切换到最后一个标签页');
      } else {
        this.showMessage('切换标签页失败');
      }
    });
  }
  
  // 标签页搜索功能
  showTabSearch() {
    if (this.tabSearchVisible) return;
    
    this.tabSearchVisible = true;
    
    // 创建搜索界面
    const searchContainer = document.createElement('div');
    searchContainer.className = 'vimium-tab-search';
    searchContainer.innerHTML = `
      <div class="vimium-tab-search-header">
        <input type="text" class="vimium-tab-search-input" placeholder="搜索标签页..." />
        <div class="vimium-tab-search-help">输入标签页标题或URL进行搜索</div>
      </div>
      <div class="vimium-tab-search-results"></div>
    `;
    
    document.body.appendChild(searchContainer);
    
    // 自动聚焦搜索框
    const searchInput = searchContainer.querySelector('.vimium-tab-search-input');
    searchInput.focus();
    
    // 获取所有标签页
    chrome.runtime.sendMessage({ action: 'getAllTabs' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Get all tabs error:', chrome.runtime.lastError);
        this.hideTabSearch();
        this.showMessage('获取标签页列表失败');
        return;
      }
      if (response && response.tabs) {
        this.tabSearchResults = response.tabs;
        this.renderTabSearchResults('');
      } else {
        this.hideTabSearch();
        this.showMessage('获取标签页列表失败');
      }
    });
    
    // 监听搜索输入
    searchInput.addEventListener('input', (e) => {
      this.renderTabSearchResults(e.target.value);
    });
  }
  
  renderTabSearchResults(query) {
    const resultsContainer = document.querySelector('.vimium-tab-search-results');
    if (!resultsContainer) return;
    
    const filteredTabs = this.tabSearchResults.filter(tab => 
      tab.title.toLowerCase().includes(query.toLowerCase()) ||
      tab.url.toLowerCase().includes(query.toLowerCase())
    );
    
    resultsContainer.innerHTML = '';
    
    filteredTabs.slice(0, 10).forEach((tab, index) => {
      const resultItem = document.createElement('div');
      resultItem.className = 'vimium-tab-search-item';
      if (index === 0) resultItem.classList.add('selected');
      
      resultItem.innerHTML = `
        <div class="vimium-tab-search-item-title">${this.escapeHtml(tab.title)}</div>
        <div class="vimium-tab-search-item-url">${this.escapeHtml(tab.url)}</div>
      `;
      
      resultItem.addEventListener('click', () => {
        this.switchToTab(tab.id);
      });
      
      resultsContainer.appendChild(resultItem);
    });
  }
  
  handleTabSearchKey(e) {
    const searchContainer = document.querySelector('.vimium-tab-search');
    if (!searchContainer) return;
    
    const searchInput = searchContainer.querySelector('.vimium-tab-search-input');
    const items = searchContainer.querySelectorAll('.vimium-tab-search-item');
    const selectedItem = searchContainer.querySelector('.vimium-tab-search-item.selected');
    
    switch(e.key) {
      case 'Escape':
        e.preventDefault();
        this.hideTabSearch();
        break;
        
      case 'Enter':
        e.preventDefault();
        if (selectedItem) {
          const index = Array.from(items).indexOf(selectedItem);
          const filteredTabs = this.getFilteredTabs(searchInput.value);
          if (filteredTabs[index]) {
            this.switchToTab(filteredTabs[index].id);
          }
        }
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        this.moveTabSearchSelection(1);
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        this.moveTabSearchSelection(-1);
        break;
    }
  }
  
  getFilteredTabs(query) {
    return this.tabSearchResults.filter(tab => 
      tab.title.toLowerCase().includes(query.toLowerCase()) ||
      tab.url.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10);
  }
  
  moveTabSearchSelection(direction) {
    const items = document.querySelectorAll('.vimium-tab-search-item');
    const selectedItem = document.querySelector('.vimium-tab-search-item.selected');
    
    if (items.length === 0) return;
    
    let selectedIndex = 0;
    if (selectedItem) {
      selectedIndex = Array.from(items).indexOf(selectedItem);
      selectedItem.classList.remove('selected');
    }
    
    selectedIndex = (selectedIndex + direction + items.length) % items.length;
    items[selectedIndex].classList.add('selected');
  }
  
  switchToTab(tabId) {
    chrome.runtime.sendMessage({ action: 'switchToTab', tabId }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Switch to tab error:', chrome.runtime.lastError);
        this.showMessage('切换标签页失败');
        return;
      }
      if (response && response.success) {
        this.hideTabSearch();
        this.showMessage('已切换到标签页');
      } else {
        this.showMessage('切换标签页失败');
      }
    });
  }
  
  hideTabSearch() {
    const searchContainer = document.querySelector('.vimium-tab-search');
    if (searchContainer) {
      searchContainer.parentNode.removeChild(searchContainer);
    }
    this.tabSearchVisible = false;
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  loadSettings() {
    // 从chrome.storage加载设置
    chrome.storage.sync.get(['vimiumEnabled', 'scrollStep'], (result) => {
      this.enabled = result.vimiumEnabled !== false;
      this.scrollStep = result.scrollStep || 60;
    });
  }
}

// 初始化Vimium
const vimium = new VimiumClone();

// 监听来自background script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch(request.action) {
    case 'toggle':
      vimium.enabled = !vimium.enabled;
      vimium.showMessage(vimium.enabled ? 'Vimium已启用' : 'Vimium已禁用');
      break;
    case 'showHints':
      vimium.showLinkHints();
      break;
    case 'updateSettings':
      if (request.settings) {
        vimium.enabled = request.settings.enabled;
        vimium.scrollStep = request.settings.scrollStep;
      }
      break;
    case 'executeBack':
      try {
        window.history.back();
        sendResponse({ success: true });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
      break;
    case 'executeForward':
      try {
        window.history.forward();
        sendResponse({ success: true });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
      break;
  }
  return true; // 保持异步响应通道开放
});

console.log('Vimium Clone已加载'); 