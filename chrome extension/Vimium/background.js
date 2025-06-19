// Vimium Clone - 后台服务脚本

class VimiumBackground {
  constructor() {
    this.recentlyClosedTabs = [];
    this.init();
  }
  
  init() {
    this.bindEvents();
    this.setupCommands();
  }
  
  bindEvents() {
    // 监听插件图标点击
    chrome.action.onClicked.addListener((tab) => {
      this.toggleVimium(tab);
    });
    
    // 监听来自content脚本的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // 保持异步响应通道开放
    });
    
    // 监听键盘命令
    chrome.commands.onCommand.addListener((command) => {
      this.handleCommand(command);
    });
  }
  
  setupCommands() {
    // 设置键盘快捷键处理
  }
  
  async handleCommand(command) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      switch(command) {
        case 'toggle-vimium':
          chrome.tabs.sendMessage(tab.id, { action: 'toggle' });
          break;
        case 'show-link-hints':
          chrome.tabs.sendMessage(tab.id, { action: 'showHints' });
          break;
      }
    } catch (error) {
      console.error('Command error:', error);
    }
  }
  
  async handleMessage(request, sender, sendResponse) {
    console.log('Vimium Background: 收到消息:', request);
    
    try {
      switch(request.action) {
        case 'newTab':
          console.log('Background: 处理新建标签页请求');
          const newTab = await chrome.tabs.create({ 
            url: request.url || 'chrome://newtab/',
            active: true
          });
          console.log('Background: 新标签页创建成功:', newTab.id);
          sendResponse({ success: true, tabId: newTab.id });
          break;
          
        case 'closeTab':
          if (sender.tab && sender.tab.id) {
            const tabToClose = await chrome.tabs.get(sender.tab.id);
            // 保存关闭的标签页信息
            if (!tabToClose.url.startsWith('chrome://') && !tabToClose.url.startsWith('chrome-extension://')) {
              this.recentlyClosedTabs.push({
                url: tabToClose.url,
                title: tabToClose.title,
                index: tabToClose.index,
                timestamp: Date.now()
              });
              if (this.recentlyClosedTabs.length > 10) {
                this.recentlyClosedTabs.shift();
              }
            }
            
            await chrome.tabs.remove(sender.tab.id);
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false, error: '无法获取标签页信息' });
          }
          break;
        
        case 'restoreTab':
          if (this.recentlyClosedTabs.length > 0) {
            const tabInfo = this.recentlyClosedTabs.pop();
            const restoredTab = await chrome.tabs.create({
              url: tabInfo.url,
              active: true
            });
            sendResponse({ success: true, tabId: restoredTab.id });
          } else {
            sendResponse({ success: false, error: '没有可恢复的标签页' });
          }
          break;
          
        case 'getAllTabs':
          const tabs = await chrome.tabs.query({ currentWindow: true });
          const tabsInfo = tabs.map(tab => ({
            id: tab.id,
            title: tab.title || '无标题',
            url: tab.url || '',
            active: tab.active
          }));
          sendResponse({ success: true, tabs: tabsInfo });
          break;
          
        case 'switchToTab':
          await chrome.tabs.update(request.tabId, { active: true });
          sendResponse({ success: true });
          break;
          
        case 'goBack':
          await chrome.tabs.sendMessage(sender.tab.id, { action: 'executeBack' });
          sendResponse({ success: true });
          break;
          
        case 'goForward':
          await chrome.tabs.sendMessage(sender.tab.id, { action: 'executeForward' });
          sendResponse({ success: true });
          break;
          
        case 'duplicateTab':
          const duplicatedTab = await chrome.tabs.duplicate(sender.tab.id);
          sendResponse({ success: true, tabId: duplicatedTab.id });
          break;
          
        case 'nextTab':
          await this.switchToNextTab();
          sendResponse({ success: true });
          break;
          
        case 'previousTab':
          await this.switchToPreviousTab();
          sendResponse({ success: true });
          break;
          
        case 'lastTab':
          await this.switchToLastTab();
          sendResponse({ success: true });
          break;
          
        case 'searchBookmarks':
          const bookmarks = await this.searchBookmarks(request.query);
          sendResponse({ bookmarks });
          break;
          
        case 'searchHistory':
          const history = await this.searchHistory(request.query);
          sendResponse({ history });
          break;
          
        default:
          sendResponse({ error: '未知的操作: ' + request.action });
      }
    } catch (error) {
      console.error('Background script error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }
  
  async toggleVimium(tab) {
    try {
      await chrome.tabs.sendMessage(tab.id, { action: 'toggle' });
    } catch (error) {
      console.log('无法向标签页发送消息:', error);
    }
  }
  
  async switchToNextTab() {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    if (tabs.length <= 1) return;
    
    const currentTab = tabs.find(tab => tab.active);
    const currentIndex = tabs.indexOf(currentTab);
    const nextIndex = (currentIndex + 1) % tabs.length;
    
    await chrome.tabs.update(tabs[nextIndex].id, { active: true });
  }
  
  async switchToPreviousTab() {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    if (tabs.length <= 1) return;
    
    const currentTab = tabs.find(tab => tab.active);
    const currentIndex = tabs.indexOf(currentTab);
    const previousIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
    
    await chrome.tabs.update(tabs[previousIndex].id, { active: true });
  }
  
  async switchToLastTab() {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    if (tabs.length === 0) return;
    
    const lastTab = tabs[tabs.length - 1];
    await chrome.tabs.update(lastTab.id, { active: true });
  }
  
  async searchBookmarks(query) {
    if (!query) return [];
    
    try {
      const bookmarks = await chrome.bookmarks.search(query);
      return bookmarks.filter(bookmark => bookmark.url).map(bookmark => ({
        title: bookmark.title,
        url: bookmark.url
      }));
    } catch (error) {
      console.error('Search bookmarks error:', error);
      return [];
    }
  }
  
  async searchHistory(query) {
    if (!query) return [];
    
    try {
      const history = await chrome.history.search({
        text: query,
        maxResults: 10
      });
      
      return history.map(item => ({
        title: item.title,
        url: item.url,
        visitCount: item.visitCount
      }));
    } catch (error) {
      console.error('Search history error:', error);
      return [];
    }
  }
}

// 初始化后台脚本
try {
  const vimiumBackground = new VimiumBackground();
  console.log('Vimium Clone后台脚本已加载');
} catch (error) {
  console.error('Background script initialization error:', error);
} 