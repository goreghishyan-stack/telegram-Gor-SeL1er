
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { BotType, Message } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateAIResponse = async (
  botType: BotType, 
  userMessage: string, 
  history: Message[]
): Promise<{ text?: string; imageUrl?: string; grounding?: any[] }> => {
  const modelName = botType === BotType.ASSISTANT ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  
  if (botType === BotType.ARTIST) {
    const imageModel = 'gemini-2.5-flash-image';
    const response = await ai.models.generateContent({
      model: imageModel,
      contents: { parts: [{ text: userMessage }] },
    });
    
    let imageUrl = '';
    let text = '';
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      } else if (part.text) {
        text = part.text;
      }
    }
    return { text: text || 'Готово! Вот твое изображение 🎨✨', imageUrl };
  }

  if (botType === BotType.SEARCH) {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userMessage,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    return { 
      text: response.text + "\n\nНашел это в сети для тебя! 🌐🔎✨", 
      grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks 
    };
  }

  const response = await ai.models.generateContent({
    model: modelName,
    contents: userMessage,
    config: {
        systemInstruction: botType === BotType.ASSISTANT 
            ? "Ты — продвинутый ИИ помощник в Telegram. Ты ОБЯЗАН использовать много эмодзи в каждом сообщении. Твой стиль общения дружелюбный, современный и полезный. ✨🚀🤖😎🌈" 
            : "Ты быстрый голосовой помощник. Отвечай кратко и всегда используй эмодзи. 🎤⚡️✨"
    }
  });

  return { text: response.text };
};

export const generateTTS = async (text: string): Promise<string> => {
    const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
};
