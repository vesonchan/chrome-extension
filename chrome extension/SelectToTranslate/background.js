// 获取设置
async function getSettings() {
  const result = await chrome.storage.sync.get({
    translationService: 'mymemory',
    openaiApiKey: '',
    geminiApiKey: '',
    grokApiKey: ''
  });
  return result;
}

// MyMemory 免费翻译服务
async function translateWithMyMemory(text) {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|zh`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.responseStatus === 200) {
      return data.responseData.translatedText;
    }
    throw new Error('Translation failed');
  } catch (error) {
    console.error('MyMemory translation error:', error);
    throw error;
  }
}

// Google Translate 免费接口
async function translateWithGoogle(text) {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data && data[0] && data[0][0]) {
      return data[0][0][0];
    }
    throw new Error('Translation failed');
  } catch (error) {
    console.error('Google translation error:', error);
    return await translateWithMyMemory(text);
  }
}

// OpenAI 翻译
async function translateWithOpenAI(text, apiKey) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: `请将以下英文翻译成中文，只需要返回翻译结果：${text}`
        }],
        max_tokens: 200,
        temperature: 0.1
      })
    });
    
    const data = await response.json();
    if (data.choices && data.choices[0]) {
      return data.choices[0].message.content.trim();
    }
    throw new Error('Translation failed');
  } catch (error) {
    console.error('OpenAI translation error:', error);
    throw error;
  }
}

// Gemini 翻译
async function translateWithGemini(text, apiKey) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `请将以下英文翻译成中文，只需要返回翻译结果：${text}`
          }]
        }]
      })
    });
    
    const data = await response.json();
    if (data.candidates && data.candidates[0]) {
      return data.candidates[0].content.parts[0].text.trim();
    }
    throw new Error('Translation failed');
  } catch (error) {
    console.error('Gemini translation error:', error);
    throw error;
  }
}

// Grok 翻译
async function translateWithGrok(text, apiKey) {
  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        messages: [{
          role: 'user',
          content: `请将以下英文翻译成中文，只需要返回翻译结果：${text}`
        }],
        model: 'grok-beta',
        stream: false,
        temperature: 0.1
      })
    });
    
    const data = await response.json();
    if (data.choices && data.choices[0]) {
      return data.choices[0].message.content.trim();
    }
    throw new Error('Translation failed');
  } catch (error) {
    console.error('Grok translation error:', error);
    throw error;
  }
}

// 主翻译函数
async function translateText(text) {
  const settings = await getSettings();
  
  try {
    switch (settings.translationService) {
      case 'mymemory':
        return await translateWithMyMemory(text);
      case 'google':
        return await translateWithGoogle(text);
      case 'openai':
        if (!settings.openaiApiKey) {
          throw new Error('需要设置OpenAI API密钥');
        }
        return await translateWithOpenAI(text, settings.openaiApiKey);
      case 'gemini':
        if (!settings.geminiApiKey) {
          throw new Error('需要设置Gemini API密钥');
        }
        return await translateWithGemini(text, settings.geminiApiKey);
      case 'grok':
        if (!settings.grokApiKey) {
          throw new Error('需要设置Grok API密钥');
        }
        return await translateWithGrok(text, settings.grokApiKey);
      default:
        return await translateWithMyMemory(text);
    }
  } catch (error) {
    console.error('Translation error:', error);
    if (settings.translationService !== 'mymemory') {
      try {
        return await translateWithMyMemory(text);
      } catch (fallbackError) {
        throw new Error('所有翻译服务都失败了');
      }
    }
    throw error;
  }
}

// 消息监听
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'translate') {
    translateText(message.text)
      .then(translation => {
        sendResponse({ translation });
      })
      .catch(error => {
        sendResponse({ error: error.message });
      });
    return true;
  }
});

console.log('划词翻译后台服务已启动'); 