// DOM 元素
const translationServiceSelect = document.getElementById('translationService');
const openaiSettings = document.getElementById('openaiSettings');
const geminiSettings = document.getElementById('geminiSettings');
const grokSettings = document.getElementById('grokSettings');
const openaiApiKeyInput = document.getElementById('openaiApiKey');
const geminiApiKeyInput = document.getElementById('geminiApiKey');
const grokApiKeyInput = document.getElementById('grokApiKey');
const saveBtn = document.getElementById('saveBtn');
const statusDiv = document.getElementById('status');

// 显示状态消息
function showStatus(message, isError = false) {
  statusDiv.textContent = message;
  statusDiv.className = `status ${isError ? 'error' : 'success'}`;
  statusDiv.classList.remove('hidden');
  
  setTimeout(() => {
    statusDiv.classList.add('hidden');
  }, 3000);
}

// 切换API密钥输入框显示
function toggleApiKeyInputs() {
  const service = translationServiceSelect.value;
  
  // 隐藏所有API密钥输入框
  openaiSettings.classList.add('hidden');
  geminiSettings.classList.add('hidden');
  grokSettings.classList.add('hidden');
  
  // 显示对应的API密钥输入框
  switch (service) {
    case 'openai':
      openaiSettings.classList.remove('hidden');
      break;
    case 'gemini':
      geminiSettings.classList.remove('hidden');
      break;
    case 'grok':
      grokSettings.classList.remove('hidden');
      break;
  }
}

// 加载设置
async function loadSettings() {
  try {
    const settings = await chrome.storage.sync.get({
      translationService: 'mymemory',
      openaiApiKey: '',
      geminiApiKey: '',
      grokApiKey: ''
    });
    
    translationServiceSelect.value = settings.translationService;
    openaiApiKeyInput.value = settings.openaiApiKey;
    geminiApiKeyInput.value = settings.geminiApiKey;
    grokApiKeyInput.value = settings.grokApiKey;
    
    toggleApiKeyInputs();
  } catch (error) {
    console.error('加载设置失败:', error);
    showStatus('加载设置失败', true);
  }
}

// 保存设置
async function saveSettings() {
  try {
    const settings = {
      translationService: translationServiceSelect.value,
      openaiApiKey: openaiApiKeyInput.value.trim(),
      geminiApiKey: geminiApiKeyInput.value.trim(),
      grokApiKey: grokApiKeyInput.value.trim()
    };
    
    // 验证必要的API密钥
    if (settings.translationService === 'openai' && !settings.openaiApiKey) {
      showStatus('请输入OpenAI API密钥', true);
      return;
    }
    
    if (settings.translationService === 'gemini' && !settings.geminiApiKey) {
      showStatus('请输入Gemini API密钥', true);
      return;
    }
    
    if (settings.translationService === 'grok' && !settings.grokApiKey) {
      showStatus('请输入Grok API密钥', true);
      return;
    }
    
    await chrome.storage.sync.set(settings);
    showStatus('设置保存成功！');
    
    // 延迟关闭弹窗
    setTimeout(() => {
      window.close();
    }, 1500);
    
  } catch (error) {
    console.error('保存设置失败:', error);
    showStatus('保存设置失败', true);
  }
}

// 事件监听
translationServiceSelect.addEventListener('change', toggleApiKeyInputs);
saveBtn.addEventListener('click', saveSettings);

// 回车键保存
document.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    saveSettings();
  }
});

// 页面加载时加载设置
document.addEventListener('DOMContentLoaded', loadSettings);

console.log('划词翻译设置页面已加载');