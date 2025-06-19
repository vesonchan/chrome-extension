// Vimium Clone - 弹出页面脚本

class VimiumPopup {
  constructor() {
    this.init();
  }
  
  async init() {
    await this.loadSettings();
    this.bindEvents();
    this.updateUI();
  }
  
  bindEvents() {
    // 切换开关
    const toggleSwitch = document.getElementById('toggleSwitch');
    toggleSwitch.addEventListener('click', () => {
      this.toggleEnabled();
    });
    
    // 滚动步长设置
    const scrollStepInput = document.getElementById('scrollStep');
    scrollStepInput.addEventListener('change', (e) => {
      this.saveScrollStep(parseInt(e.target.value));
    });
    
    // 输入框失焦时保存设置
    scrollStepInput.addEventListener('blur', (e) => {
      this.saveScrollStep(parseInt(e.target.value));
    });
  }
  
  async loadSettings() {
    const result = await chrome.storage.sync.get(['vimiumEnabled', 'scrollStep']);
    this.settings = {
      enabled: result.vimiumEnabled !== false, // 默认启用
      scrollStep: result.scrollStep || 60
    };
    
    console.log('加载的设置:', this.settings);
  }
  
  async saveSettings() {
    await chrome.storage.sync.set({
      vimiumEnabled: this.settings.enabled,
      scrollStep: this.settings.scrollStep
    });
    
    // 同时通知所有标签页更新设置
    this.notifyAllTabs();
  }
  
  async notifyAllTabs() {
    const tabs = await chrome.tabs.query({});
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'updateSettings',
        settings: this.settings
      }).catch(() => {
        // 忽略无法发送消息的标签页（如chrome://页面）
      });
    });
  }
  
  updateUI() {
    const toggleSwitch = document.getElementById('toggleSwitch');
    const scrollStepInput = document.getElementById('scrollStep');
    
    // 更新开关状态
    if (this.settings.enabled) {
      toggleSwitch.classList.add('active');
    } else {
      toggleSwitch.classList.remove('active');
    }
    
    // 更新滚动步长
    scrollStepInput.value = this.settings.scrollStep;
  }
  
  async toggleEnabled() {
    this.settings.enabled = !this.settings.enabled;
    await this.saveSettings();
    this.updateUI();
    
    // 显示状态反馈
    this.showToast(`Vimium ${this.settings.enabled ? '已启用' : '已禁用'}`);
  }
  
  async saveScrollStep(value) {
    if (value >= 10 && value <= 200) {
      this.settings.scrollStep = value;
      await this.saveSettings();
      this.showToast(`滚动步长已设置为 ${value} 像素`);
    }
  }
  
  showToast(message) {
    // 创建临时提示信息
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background-color: #333;
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.3s;
    `;
    
    document.body.appendChild(toast);
    
    // 显示动画
    setTimeout(() => {
      toast.style.opacity = '1';
    }, 10);
    
    // 自动消失
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 2000);
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  const popup = new VimiumPopup();
  console.log('Vimium Clone弹出页面已加载');
}); 