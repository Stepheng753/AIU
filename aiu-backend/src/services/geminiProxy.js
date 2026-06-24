const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { dbGet, dbAll } = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

function setupGeminiProxy(server) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    // Authenticate WebSocket connection via query string
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    const category = url.searchParams.get('category') || 'career';
    const isResume = url.searchParams.get('isResume') === 'true';
    const lastQuestion = url.searchParams.get('lastQuestion') || '';

    if (!token) {
      ws.close(1008, 'Auth token missing');
      return;
    }

    let userId;
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.id;
    } catch (err) {
      ws.close(1008, 'Invalid token');
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not configured');
      ws.close(1011, 'Server configuration error');
      return;
    }

    const GEMINI_WS_URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${process.env.GEMINI_API_KEY}`;

    const geminiWs = new WebSocket(GEMINI_WS_URL);

    geminiWs.on('open', async () => {
      ws.send(JSON.stringify({ type: 'proxy_status', status: 'connected' }));

      // Load configuration dynamically from YAML
      let config = {};
      try {
        const configPath = path.join(__dirname, '../../model_config.yaml');
        const fileContents = fs.readFileSync(configPath, 'utf8');
        config = yaml.load(fileContents);
      } catch (err) {
        console.error('Error loading model_config.yaml, using defaults:', err);
      }

      const model = config.model || 'models/gemini-3.1-flash-live-preview';

      // Resolve category-specific settings
      let categoryConfig = {};
      if (config.categories && config.categories[category]) {
        categoryConfig = config.categories[category];
      } else {
        console.warn(`Category "${category}" not found in config, using first available category.`);
        const firstCategoryKey = config.categories ? Object.keys(config.categories)[0] : null;
        if (firstCategoryKey) {
          categoryConfig = config.categories[firstCategoryKey];
        }
      }

      // Clone global generation configuration
      const generationConfig = JSON.parse(JSON.stringify(config.generationConfig || { responseModalities: ['AUDIO'] }));

      // Apply track-specific voice model configuration if available
      const activeVoice = categoryConfig.voiceName || 
        (generationConfig.speechConfig?.voiceConfig?.prebuiltVoiceConfig?.voiceName) || 
        "Aoede";

      if (!generationConfig.speechConfig) generationConfig.speechConfig = {};
      if (!generationConfig.speechConfig.voiceConfig) generationConfig.speechConfig.voiceConfig = {};
      if (!generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig) {
        generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig = {};
      }
      generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName = activeVoice;

      let systemInstructionText = '';
      if (categoryConfig.systemInstruction && categoryConfig.systemInstruction.parts && categoryConfig.systemInstruction.parts[0]) {
        systemInstructionText = categoryConfig.systemInstruction.parts[0].text;
      } else {
        systemInstructionText = 'You are a warm, conversational AI interviewer.';
      }

      // Fetch user details & QA pairs
      let userName = 'User';
      let qaPairs = [];
      try {
        const userRow = await dbGet('SELECT name FROM users WHERE id = ?', [userId]);
        userName = userRow ? userRow.name : 'User';
        qaPairs = await dbAll('SELECT question, answer, category FROM qa_pairs WHERE user_id = ?', [userId]);
      } catch (dbErr) {
        console.error('Error querying database during WebSocket initialization:', dbErr);
      }

      const sessionPrompts = config.sessionPrompts || {};
      const getPrompt = (type, key, defaultValue) => {
        return (sessionPrompts[type] && sessionPrompts[type][key]) !== undefined
          ? sessionPrompts[type][key]
          : defaultValue;
      };

      const formatCategory = category.replace('_', ' ');

      let triggerMsg;
      if (isResume) {
        const defaultSysInst = "Your instructions for Resuming:\n1. Do NOT start a new conversation, welcome the user, or introduce yourself. You are resuming an active conversation that was briefly paused.\n2. Say a brief transition (like \"Let's continue...\" or \"Picking up where we left off...\") and repeat your last question to get the user's response: \"{lastQuestion}\". Do not ask a new question yet; wait for the user to answer this question.";
        const defaultTrigger = 'I am ready to resume. Please state that we are continuing, and repeat your last question to get my response: "{lastQuestion}".';

        const sysInstTemplate = getPrompt('resume', 'systemInstruction', defaultSysInst);
        const triggerTemplate = getPrompt('resume', 'triggerMessage', defaultTrigger);

        const sysInst = sysInstTemplate.replace(/{lastQuestion}/g, lastQuestion);
        const triggerText = triggerTemplate.replace(/{lastQuestion}/g, lastQuestion);

        systemInstructionText += `\n\n${sysInst}`;

        triggerMsg = {
          clientContent: {
            turns: [
              {
                role: 'user',
                parts: [{ text: triggerText }]
              }
            ],
            turnComplete: true
          }
        };
      } else if (qaPairs && qaPairs.length > 0) {
        const defaultHeader = "\n\nHere is what you already know about the user {userName}:\n";
        const defaultSysInst = "Your instructions:\n1. Greet {userName} warmly.\n2. Acknowledge and briefly summarize some of the key things you already know about them in relation to the current interview category ({category}).\n3. Ask a mixture of follow-up questions referencing this existing knowledge to go deeper, and new open-ended questions in this category to go wider.";
        const defaultTrigger = "Please start the interview now. Welcome me by name ({userName}), mention what you already know about me from our past chats, and ask the first question.";

        const headerTemplate = getPrompt('returningUser', 'knowledgeHeader', defaultHeader);
        const sysInstTemplate = getPrompt('returningUser', 'systemInstruction', defaultSysInst);
        const triggerTemplate = getPrompt('returningUser', 'triggerMessage', defaultTrigger);

        // Split into current category and other categories
        const currentCategoryPairs = qaPairs.filter(pair => {
          const cat = pair.category || 'career';
          return cat === category;
        });

        const otherCategoryPairs = qaPairs.filter(pair => {
          const cat = pair.category || 'career';
          return cat !== category;
        });

        let knowledgeText = '';
        if (currentCategoryPairs.length > 0) {
          knowledgeText += headerTemplate.replace(/{userName}/g, userName);
          currentCategoryPairs.forEach((pair) => {
            knowledgeText += `- Question: "${pair.question}"\n  Answer: "${pair.answer}"\n`;
          });
        }

        if (otherCategoryPairs.length > 0) {
          knowledgeText += `\n\nWe also have general knowledge from other interview categories:\n`;
          const groupedOther = {};
          otherCategoryPairs.forEach(pair => {
            const catKey = pair.category || 'career';
            if (!groupedOther[catKey]) groupedOther[catKey] = [];
            groupedOther[catKey].push(`- Q: "${pair.question}" | A: "${pair.answer}"`);
          });
          for (const [cat, lines] of Object.entries(groupedOther)) {
            knowledgeText += `Category [${cat.replace('_', ' ')}]:\n${lines.join('\n')}\n`;
          }
        }

        const sysInst = sysInstTemplate
          .replace(/{userName}/g, userName)
          .replace(/{category}/g, formatCategory);

        const triggerText = triggerTemplate.replace(/{userName}/g, userName);

        systemInstructionText += `${knowledgeText}\n${sysInst}`;

        triggerMsg = {
          clientContent: {
            turns: [
              {
                role: 'user',
                parts: [{ text: triggerText }]
              }
            ],
            turnComplete: true
          }
        };
      } else {
        const defaultSysInst = "Your instructions:\n1. Greet the user warmly. Welcome them to AIU and introduce the application. Explain that AIU is a platform designed to conduct high-fidelity voice interviews to preserve their stories, wisdom, and life experiences, which will ultimately be used to fine-tune a personalized AI replica that authentically imitates them.\n2. Tell them you would love to get to know them and ask for their name.";
        const defaultTrigger = "Please start the interview now. Welcome me, introduce AIU, and ask for my name.";

        const sysInst = getPrompt('newUser', 'systemInstruction', defaultSysInst);
        const triggerText = getPrompt('newUser', 'triggerMessage', defaultTrigger);

        systemInstructionText += `\n\n${sysInst}`;

        triggerMsg = {
          clientContent: {
            turns: [
              {
                role: 'user',
                parts: [{ text: triggerText }]
              }
            ],
            turnComplete: true
          }
        };
      }

      const systemInstruction = {
        parts: [{ text: systemInstructionText }]
      };

      const setupMsg = {
        setup: {
          model,
          generationConfig,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction
        }
      };
      geminiWs.send(JSON.stringify(setupMsg));

      geminiWs.send(JSON.stringify(triggerMsg));
    });

    geminiWs.on('message', (data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data.toString());
      }
    });

    geminiWs.on('close', (code, reason) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(code, reason);
      }
    });

    geminiWs.on('error', (err) => {
      console.error('Gemini WS error:', err);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'proxy_error', error: 'Gemini connection error' }));
      }
    });

    ws.on('message', (data) => {
      if (geminiWs.readyState === WebSocket.OPEN) {
        geminiWs.send(data.toString());
      }
    });

    ws.on('close', () => {
      if (geminiWs.readyState === WebSocket.OPEN) {
        geminiWs.close();
      }
    });
  });

  return wss;
}

module.exports = {
  setupGeminiProxy
};
